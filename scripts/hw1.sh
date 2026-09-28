#!/bin/bash
# HardwareOne CLI Wrapper
# Handles authentication, session caching, timeouts, TLS, and command execution.
# Requires: curl
#
# Credentials are read from the first that exists: $HW1_ENV, ~/.openclaw/hardwareone.env,
# or a legacy skill-local .env. Keep them OUTSIDE the skill dir — OpenClaw mirrors the skill
# directory into the agent sandbox, so a .env inside it would expose HW1_USER/HW1_PASS.
# Required:
#   HW1_URL    device address — a full URL (http://… / https://…) pins the scheme.
#              A bare IP/host uses HTTPS. Set HW1_ALLOW_HTTP=1 to permit a bare host
#              to fall back to HTTP, and only when no HTTPS service accepts the connection.
#   HW1_USER   device username
#   HW1_PASS   device password
#
# Optional:
#   HW1_CONNECT_TIMEOUT   TCP connect timeout, seconds (default 5) — fail fast if offline
#   HW1_TIMEOUT           per-request cap, seconds (default 30; covers ~12s password hashing)
#   HW1_CMD_TIMEOUT       cap for the CLI command's own request, whole seconds (default
#                         HW1_TIMEOUT). The gateway sets it per command from its speed table
#                         (plugin/command-speeds.js); set it yourself to run a slow command
#                         by hand. The device itself stops waiting after 60 s.
#   HW1_ALLOW_SELF_SIGNED=1  accept the device's self-signed TLS cert (curl -k) — trusted LAN only
#                            (legacy alias: HW1_INSECURE=1)
#   HW1_CACERT=/path.pem     verify TLS against this CA/cert (preferred over HW1_ALLOW_SELF_SIGNED)
#   HW1_ALLOW_HTTP=1         for a bare host only, allow HTTP after HTTPS connection-refused
#   HW1_AUTH_PROBE        auth-gated path used to verify login (default /api/system)
#   HW1_COOKIE_DIR        session cache dir (default /tmp/hw1); the gateway sets
#                         this per device so multiple devices don't share a session

set -euo pipefail

PING_BODY_FILE=""
cleanup_ping_body() {
    [[ -z "$PING_BODY_FILE" ]] || rm -f "$PING_BODY_FILE"
}
trap cleanup_ping_body EXIT
trap 'exit 130' HUP INT TERM

# Load credentials (see header). Prefer a host-only file outside the skill directory, so
# credentials are never swept into OpenClaw's sandbox mirror of the skill dir.
if [[ -z "${HW1_URL:-}" || -z "${HW1_USER:-}" || -z "${HW1_PASS:-}" ]]; then
    for _envf in "${HW1_ENV:-}" "$HOME/.openclaw/hardwareone.env" "$(dirname "$0")/../.env"; do
        if [[ -n "$_envf" && -f "$_envf" ]]; then set -a; source "$_envf"; set +a; break; fi
    done
fi

URL="${HW1_URL:-}"
USER="${HW1_USER:-}"
PASS="${HW1_PASS:-}"
COOKIE_DIR="${HW1_COOKIE_DIR:-/tmp/hw1}"
COOKIE_FILE="$COOKIE_DIR/session.cookie"

CONNECT_TIMEOUT="${HW1_CONNECT_TIMEOUT:-5}"
REQ_TIMEOUT="${HW1_TIMEOUT:-30}"
CMD_TIMEOUT="${HW1_CMD_TIMEOUT:-$REQ_TIMEOUT}"
_positive_int_re='^[1-9][0-9]*$'
# curl treats --max-time 0 as "no limit", so anything but a positive integer falls back.
[[ "$CMD_TIMEOUT" =~ $_positive_int_re ]] || CMD_TIMEOUT="$REQ_TIMEOUT"
AUTH_PROBE="${HW1_AUTH_PROBE:-/api/system}"

# --- Preflight ---
if [[ -z "$URL" || -z "$USER" || -z "$PASS" ]]; then
    echo "Error: HW1_URL, HW1_USER, and HW1_PASS must be set (env or .env)." >&2
    exit 1
fi

if [[ -z "${1:-}" ]]; then
    echo "Usage: hw1.sh \"<cli command>\"" >&2
    echo "       hw1.sh --ping" >&2
    echo "       hw1.sh --get <path>   (e.g. --get /api/sensors)" >&2
    exit 1
fi

if [[ ! -d "$COOKIE_DIR" ]]; then
    mkdir -p -m 700 "$COOKIE_DIR"
fi

# --- Shared curl options (transport isolation + timeouts + TLS), applied to EVERY request ---
# `-q` must be curl's first argument to prevent ~/.curlrc from changing security policy.
# HardwareOne is reached directly by default: ambient proxy variables must not receive
# device requests or credentials, and redirects must never select another endpoint.
CURL_BASE=(
    --noproxy '*'
    --proto '=http,https'
    --proto-redir '=http,https'
    --max-redirs 0
    -sS
    --connect-timeout "$CONNECT_TIMEOUT"
)
if [[ -n "${HW1_CACERT:-}" ]]; then
    CURL_BASE+=( --cacert "${HW1_CACERT}" )
elif [[ "${HW1_ALLOW_SELF_SIGNED:-${HW1_INSECURE:-0}}" == "1" ]]; then
    CURL_BASE+=( --insecure )
fi

# Run curl with the shared base opts plus a per-call max time.
# Usage: hw_curl <max_time_seconds> <curl args...>
hw_curl() {
    local mt="$1"; shift
    (
        # Trust must come from the selected device policy or the system store, not
        # unrelated gateway service environment inherited by this subprocess.
        unset CURL_CA_BUNDLE SSL_CERT_FILE SSL_CERT_DIR SSLKEYLOGFILE
        curl -q "${CURL_BASE[@]}" --max-time "$mt" "$@"
    )
}

# Map a curl transport-error exit code to a clear, actionable message.
report_curl_failure() {
    case "$1" in
        6)  echo "Error: could not resolve host in '$URL'. Check HW1_URL." >&2 ;;
        7)  echo "Error: connection refused at '$URL'. Is the device on and its HTTP server started?" >&2 ;;
        28) echo "Error: timed out reaching '$URL'. Device unreachable or slow (raise HW1_TIMEOUT if the command is expected to be slow)." >&2 ;;
        35|51|58|59|60|77|83)
            echo "Error: TLS/certificate problem with '$URL'. For a self-signed cert set HW1_ALLOW_SELF_SIGNED=1 (trusted LAN only) or HW1_CACERT=/path/to/cert.pem." >&2 ;;
        *)  echo "Error: could not reach '$URL' (curl exit $1)." >&2 ;;
    esac
}

# Exit status 7 means the command was NOT sent: the device could not be reached or
# verified, or the login failed in transit, before any command request went out. The
# gateway fails over to a backup only on this status — after dispatch the command may
# be running on (or already applied by) the device, and re-running it elsewhere would
# duplicate it.
EXIT_NOT_SENT=7

# curl exit codes that mean the request never left this host: name resolution,
# connection refused, and TLS/certificate failures before the handshake completed.
# A timeout (28) is deliberately absent — it can fire after the request was sent.
curl_failed_before_send() {
    case "$1" in
        5|6|7|35|51|53|54|58|59|60|77|83|90|91) return 0 ;;
        *) return 1 ;;
    esac
}

# A failure AFTER the command request was sent: the device may have run it.
report_dispatch_failure() {
    case "$1" in
        28) echo "Error: no response within ${2}s after the command was sent. It may still be running on the device, or it may have finished; check its state before running it again." >&2 ;;
        *)  echo "Error: the connection failed after the command was sent (curl exit $1). It may or may not have run on the device; check its state before running it again." >&2 ;;
    esac
}

# A public ping is the only response allowed to identify a HardwareOne endpoint shape
# before login. It is not cryptographic device identity; that requires verified TLS or
# an operator-pinned certificate/identity. Firmware v0.99.7+ emits this exact compact
# field order, while redirects, captive portals, generic APIs, and restore mode do not.
is_hardwareone_ping() {
    local body_file="$1" content_type="$2" body_size newline_count

    case "$content_type" in
        application/json|application/json\;*) ;;
        *) return 1 ;;
    esac

    body_size=$(wc -c < "$body_file")
    body_size="${body_size//[[:space:]]/}"
    [[ "$body_size" -gt 0 && "$body_size" -le 4096 ]] || return 1

    # The firmware emits one compact JSON record with no trailing newline. Prevent
    # grep from accepting a valid-looking line embedded in an otherwise invalid body.
    newline_count=$(wc -l < "$body_file")
    newline_count="${newline_count//[[:space:]]/}"
    [[ "$newline_count" -eq 0 ]] || return 1

    LC_ALL=C grep -Eq '^\{"ok":true,"hostname":"[A-Za-z0-9._-]+","mac":"([[:xdigit:]]{2}:){5}[[:xdigit:]]{2}","fingerprint":"[0-9a-f]{64}","firmwareVersion":"[A-Za-z0-9._+-]+","acceptingRestore":(true|false),"pendingConfirm":(true|false)(,"https":(true|false))?\}$' "$body_file"
}

# Accept an origin authority only: hostname/IPv4/bracketed IPv6 plus optional port.
# Paths, queries, fragments, userinfo, control characters, and ambiguous bare IPv6
# are rejected so endpoint concatenation cannot change the intended origin.
is_valid_authority() {
    local authority="$1" port="" authority_re
    authority_re='^(\[[0-9A-Fa-f:.]+(%25[A-Za-z0-9._~-]+)?\]|[A-Za-z0-9._-]+)(:([0-9]{1,5}))?$'
    [[ "$authority" =~ $authority_re ]] || return 1
    port="${BASH_REMATCH[4]:-}"
    if [[ -n "$port" ]]; then
        [[ "$port" != 0 && "$port" != 00 && "$port" != 000 && "$port" != 0000 && "$port" != 00000 ]] || return 1
        (( 10#$port <= 65535 )) || return 1
    fi
}

# --- Resolve the device base URL without an implicit security downgrade ---
# An explicit URL pins its scheme. A bare host uses HTTPS; HW1_ALLOW_HTTP=1 permits
# trying HTTP only after HTTPS was connection-refused (curl 7). A TLS/certificate
# failure, timeout, redirect, non-200 response, or identity mismatch never downgrades.
resolve_base() {
    local raw="$URL" host cfg bare=0 allow_http=0
    case "$raw" in
        https://*) cfg=https; host="${raw#https://}" ;;
        http://*)  cfg=http; host="${raw#http://}" ;;
        *://*)
            echo "Error: HW1_URL supports only http:// or https:// URLs." >&2
            return 1 ;;
        *) cfg=""; host="$raw"; bare=1 ;;
    esac
    if [[ -z "$host" ]]; then
        echo "Error: HW1_URL has no host." >&2
        return 1
    fi
    if ! is_valid_authority "$host"; then
        echo "Error: HW1_URL must be an origin only: hostname/IP with optional port, and optional http:// or https:// scheme." >&2
        return 1
    fi
    [[ "${HW1_ALLOW_HTTP:-0}" == "1" ]] && allow_http=1

    if [[ -n "$cfg" ]]; then
        local order=( "$cfg://$host" )
    else
        local order=( "https://$host" )
        [[ "$allow_http" -eq 1 ]] && order+=( "http://$host" )
    fi

    local cand body_file meta code content_type rc last_rc=7 endpoint_error=""
    for cand in "${order[@]}"; do
        body_file=$(mktemp "$COOKIE_DIR/ping.XXXXXX")
        PING_BODY_FILE="$body_file"
        rc=0
        meta=$(hw_curl "$REQ_TIMEOUT" --max-filesize 4096 -o "$body_file" \
            -w $'%{http_code}\n%{content_type}' "$cand/api/ping") || rc=$?
        code="${meta%%$'\n'*}"
        if [[ "$meta" == *$'\n'* ]]; then
            content_type="${meta#*$'\n'}"
        else
            content_type=""
        fi

        if [[ "$rc" -ne 0 ]]; then
            rm -f "$body_file"
            PING_BODY_FILE=""
            last_rc="$rc"
            if [[ "$bare" -eq 1 && "$allow_http" -eq 1 && "$cand" == https://* && "$rc" -eq 7 ]]; then
                continue
            fi
            break
        fi
        last_rc=0
        if [[ "$code" != "200" ]]; then
            endpoint_error="Error: '$cand/api/ping' returned HTTP ${code:-unknown}; refusing to send credentials."
            rm -f "$body_file"
            PING_BODY_FILE=""
            break
        fi
        if ! is_hardwareone_ping "$body_file" "$content_type"; then
            endpoint_error="Error: '$cand/api/ping' did not return a recognizable HardwareOne ping response; refusing to send credentials."
            rm -f "$body_file"
            PING_BODY_FILE=""
            break
        fi
        rm -f "$body_file"
        PING_BODY_FILE=""
        URL="$cand"
        return 0
    done

    if [[ -n "$endpoint_error" ]]; then
        echo "$endpoint_error" >&2
    else
        if [[ "$bare" -eq 1 && "$allow_http" -eq 0 ]]; then
            echo "Error: could not verify a HardwareOne HTTPS device at '$host' (plain HTTP is disabled; use an explicit http:// URL or set HW1_ALLOW_HTTP=1 only on a trusted LAN)." >&2
        else
            echo "Error: could not verify a HardwareOne device at '$host'." >&2
        fi
        report_curl_failure "$last_rc"
    fi
    return 1
}

# --- Auth: log in, then PROVE the session works via an auth-gated endpoint ---
# Verification uses a RAW request (never re-enters do_login) so there is no
# re-login loop. /api/system returns 200 when authed, 401 when not.
# Returns 0 on success, 1 when the device rejected the login, and 2 when a request
# failed in transit (so callers can tell "unreachable" from "wrong credentials").
do_login() {
    local rc=0
    # No -b here: start from a clean jar so a stale cookie can't mask a bad login.
    # Both fields are URL-encoded because the device url-decodes them: sent raw, a
    # password's '&' split the form, '+' became a space, and '%XX' became a byte.
    # The password is piped on stdin so it never appears in the host's process list.
    printf '%s' "$PASS" | hw_curl "$REQ_TIMEOUT" -o /dev/null \
        -c "$COOKIE_FILE" \
        --data-urlencode "username=$USER" \
        --data-urlencode "password@-" \
        "$URL/login" || rc=$?
    chmod 600 "$COOKIE_FILE" 2>/dev/null || true
    if [[ "$rc" -ne 0 ]]; then
        report_curl_failure "$rc"
        return 2
    fi

    local code="000" vrc=0
    code=$(hw_curl "$REQ_TIMEOUT" -o /dev/null -w '%{http_code}' \
        -b "$COOKIE_FILE" "$URL$AUTH_PROBE") || vrc=$?
    if [[ "$vrc" -ne 0 ]]; then
        report_curl_failure "$vrc"
        return 2
    fi
    if [[ "$code" == "200" ]]; then
        return 0
    fi
    echo "Error: authentication failed (device returned HTTP $code from $AUTH_PROBE)." >&2
    echo "       Check HW1_USER/HW1_PASS — repeated failures trigger a temporary lockout." >&2
    return 1
}

# --- HTTP GET ---
do_get() {
    local path="$1"
    local body_file code rc body
    body_file=$(mktemp)
    code="000"; rc=0
    code=$(hw_curl "$REQ_TIMEOUT" -o "$body_file" -w '%{http_code}' \
        -b "$COOKIE_FILE" -c "$COOKIE_FILE" "$URL$path") || rc=$?
    if [[ "$rc" -ne 0 ]]; then
        rm -f "$body_file"; report_curl_failure "$rc"; return 1
    fi
    body=$(cat "$body_file"); rm -f "$body_file"

    case "$code" in
        200) printf '%s\n' "$body"; return 0 ;;
        401)
            echo "Session expired, re-authenticating..." >&2
            if do_login; then
                local r2=0
                body=$(hw_curl "$REQ_TIMEOUT" -b "$COOKIE_FILE" "$URL$path") || r2=$?
                if [[ "$r2" -ne 0 ]]; then report_curl_failure "$r2"; return 1; fi
                printf '%s\n' "$body"; return 0
            fi
            return 1 ;;
        403) echo "Error: insufficient permissions (403). Admin access required." >&2; printf '%s\n' "$body"; return 1 ;;
        *)   echo "Error: HTTP $code" >&2; printf '%s\n' "$body"; return 1 ;;
    esac
}

# --- Binary GET as base64 (images and other binary artifacts) ---
# Prints base64 (single line, unwrapped) to stdout and "HTTP <code> <content-type>" to
# stderr. NEVER printf's the body — that corrupts binary (NUL strip + trailing newline).
# Re-authenticates once on 401. Exit 0 only on HTTP 200.
do_get_b64() {
    local path="$1"
    local body_file out code ctype rc
    body_file=$(mktemp)
    out=""; rc=0
    out=$(hw_curl "$REQ_TIMEOUT" -o "$body_file" -w '%{http_code} %{content_type}' \
        -b "$COOKIE_FILE" -c "$COOKIE_FILE" "$URL$path") || rc=$?
    if [[ "$rc" -ne 0 ]]; then rm -f "$body_file"; report_curl_failure "$rc"; return 1; fi
    code="${out%% *}"; ctype="${out#* }"
    if [[ "$code" == "401" ]]; then
        echo "Session expired, re-authenticating..." >&2
        if do_login; then
            out=""; rc=0
            out=$(hw_curl "$REQ_TIMEOUT" -o "$body_file" -w '%{http_code} %{content_type}' \
                -b "$COOKIE_FILE" "$URL$path") || rc=$?
            if [[ "$rc" -ne 0 ]]; then rm -f "$body_file"; report_curl_failure "$rc"; return 1; fi
            code="${out%% *}"; ctype="${out#* }"
        else
            rm -f "$body_file"; return 1
        fi
    fi
    if [[ "$code" == "200" ]]; then
        echo "HTTP 200 ${ctype:-application/octet-stream}" >&2
        base64 < "$body_file" | tr -d '\n'
        rm -f "$body_file"; return 0
    fi
    echo "HTTP $code ${ctype}" >&2
    rm -f "$body_file"; return 1
}

# --- CLI command execution ---
do_cli() {
    local cmd="$1"
    local mt="$CMD_TIMEOUT"

    local attempt=0 max_attempts=2
    while [[ $attempt -lt $max_attempts ]]; do
        local body_file code rc body
        body_file=$(mktemp)
        code="000"; rc=0
        code=$(hw_curl "$mt" -o "$body_file" -w '%{http_code}' \
            -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
            --data-urlencode "cmd=$cmd" -d "capture=1" \
            "$URL/api/cli") || rc=$?
        if [[ "$rc" -ne 0 ]]; then
            rm -f "$body_file"
            # An earlier attempt in this loop (401/429) was rejected, not executed, so
            # a failure before this request left the host still means "not sent".
            if curl_failed_before_send "$rc"; then
                report_curl_failure "$rc"; return "$EXIT_NOT_SENT"
            fi
            report_dispatch_failure "$rc" "$mt"; return 1
        fi
        body=$(cat "$body_file"); rm -f "$body_file"

        case "$code" in
            200) printf '%s\n' "$body"; return 0 ;;
            401)
                echo "Session expired, re-authenticating..." >&2
                if do_login; then attempt=$((attempt + 1)); continue; else return 1; fi ;;
            429)
                local wait_ms wait_sec
                wait_ms=$(printf '%s' "$body" | sed -n 's/.*"retry_after_ms"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p')
                if [[ -n "$wait_ms" && "$wait_ms" -gt 0 ]]; then
                    wait_sec=$(( (wait_ms + 999) / 1000 ))
                    echo "Rate limited, waiting ${wait_sec}s..." >&2
                    sleep "$wait_sec"; attempt=$((attempt + 1)); continue
                fi
                echo "Error: rate limited (429) but no retry interval provided." >&2
                printf '%s\n' "$body"; return 1 ;;
            403) echo "Error: insufficient permissions (403)." >&2; printf '%s\n' "$body"; return 1 ;;
            400) echo "Error: bad request (400)." >&2; printf '%s\n' "$body"; return 1 ;;
            *)   echo "Error: HTTP $code" >&2; printf '%s\n' "$body"; return 1 ;;
        esac
    done
    echo "Error: max retry attempts reached." >&2
    return 1
}

# Log in unless a session cookie already exists. Nothing has been dispatched yet, so a
# transport failure here still means the command was not sent.
ensure_session() {
    [[ -f "$COOKIE_FILE" ]] && return 0
    local rc=0
    do_login || rc=$?
    case "$rc" in
        0) return 0 ;;
        2) exit "$EXIT_NOT_SENT" ;;
        *) exit 1 ;;
    esac
}

# --- Main ---
resolve_base || exit "$EXIT_NOT_SENT"

case "${1:-}" in
    --ping)
        do_get "/api/ping"; exit $? ;;
    --get)
        if [[ -z "${2:-}" ]]; then
            echo "Error: --get requires a path (e.g. --get /api/sensors)" >&2; exit 1
        fi
        ensure_session
        do_get "$2"; exit $? ;;
    --get-b64)
        if [[ -z "${2:-}" ]]; then
            echo "Error: --get-b64 requires a path (e.g. --get-b64 /api/sensors/camera/frame)" >&2; exit 1
        fi
        ensure_session
        do_get_b64 "$2"; exit $? ;;
esac

ensure_session
do_cli "$1"
