#!/bin/bash
# HardwareOne CLI Wrapper
# Handles authentication, session caching, timeouts, TLS, and command execution.
# Requires: curl
#
# Credentials are read from the first that exists: $HW1_ENV, ~/.openclaw/hardwareone.env,
# or a legacy skill-local .env. Keep them OUTSIDE the skill dir — OpenClaw mirrors the skill
# directory into the agent sandbox, so a .env inside it would expose HW1_USER/HW1_PASS.
# Required:
#   HW1_URL    device address — just the IP/host (e.g. 192.168.1.42) and the wrapper auto-picks
#              http or https, or a full URL (http://… / https://…) to pin the scheme.
#   HW1_USER   device username
#   HW1_PASS   device password
#
# Optional:
#   HW1_CONNECT_TIMEOUT   TCP connect timeout, seconds (default 5) — fail fast if offline
#   HW1_TIMEOUT           per-request cap, seconds (default 30; covers ~12s password hashing)
#   HW1_TIMEOUT_LONG      cap for slow commands: llmgenerate/llmload (default 300)
#   HW1_INSECURE=1        accept a self-signed TLS cert (curl -k) — trusted LAN only
#   HW1_CACERT=/path.pem  verify TLS against this CA/cert (preferred over HW1_INSECURE)
#   HW1_AUTH_PROBE        auth-gated path used to verify login (default /api/system)

set -euo pipefail

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
COOKIE_DIR="/tmp/hw1"
COOKIE_FILE="$COOKIE_DIR/session.cookie"

CONNECT_TIMEOUT="${HW1_CONNECT_TIMEOUT:-5}"
REQ_TIMEOUT="${HW1_TIMEOUT:-30}"
LONG_TIMEOUT="${HW1_TIMEOUT_LONG:-300}"
AUTH_PROBE="${HW1_AUTH_PROBE:-/api/system}"
BASE_CACHE="$COOKIE_DIR/base_url"

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
    mkdir -m 700 "$COOKIE_DIR"
fi

# --- Shared curl options (timeouts + TLS), applied to EVERY request ---
CURL_BASE=( -sS --connect-timeout "$CONNECT_TIMEOUT" )
if [[ -n "${HW1_CACERT:-}" ]]; then
    CURL_BASE+=( --cacert "${HW1_CACERT}" )
elif [[ "${HW1_INSECURE:-0}" == "1" ]]; then
    CURL_BASE+=( --insecure )
fi

# Run curl with the shared base opts plus a per-call max time.
# Usage: hw_curl <max_time_seconds> <curl args...>
hw_curl() {
    local mt="$1"; shift
    curl "${CURL_BASE[@]}" --max-time "$mt" "$@"
}

# Map a curl transport-error exit code to a clear, actionable message.
report_curl_failure() {
    case "$1" in
        6)  echo "Error: could not resolve host in '$URL'. Check HW1_URL." >&2 ;;
        7)  echo "Error: connection refused at '$URL'. Is the device on and its HTTP server started?" >&2 ;;
        28) echo "Error: timed out reaching '$URL'. Device unreachable or slow (raise HW1_TIMEOUT if the command is expected to be slow)." >&2 ;;
        35|51|58|59|60|77|83)
            echo "Error: TLS/certificate problem with '$URL'. For a self-signed cert set HW1_INSECURE=1 (trusted LAN only) or HW1_CACERT=/path/to/cert.pem." >&2 ;;
        *)  echo "Error: could not reach '$URL' (curl exit $1)." >&2 ;;
    esac
}

# --- Resolve the device base URL (auto http<->https on the same host) ---
# HW1_URL may be a bare IP/host or a full URL. Probe the public /api/ping on each
# candidate (cached -> configured scheme -> the other) and use the one that answers,
# caching it. Only one scheme is ever up at a time, so the first responder is correct.
resolve_base() {
    local raw="$URL" host cfg cached
    host="${raw#http://}"; host="${host#https://}"
    case "$raw" in
        https://*) cfg=https ;;
        http://*)  cfg=http ;;
        *)         cfg="" ;;
    esac
    [[ -f "$BASE_CACHE" ]] && cached="$(cat "$BASE_CACHE" 2>/dev/null)"

    local order=() seen=" "
    _add() { case "$seen" in *" $1 "*) ;; *) order+=("$1"); seen="$seen$1 " ;; esac; }
    [[ -n "$cached" && "${cached#http*://}" == "$host" ]] && _add "$cached"
    if [[ -n "$cfg" ]]; then
        _add "$cfg://$host"
        [[ "$cfg" == "http" ]] && _add "https://$host" || _add "http://$host"
    else
        _add "http://$host"; _add "https://$host"
    fi

    local cand code rc last_rc=7
    for cand in "${order[@]}"; do
        rc=0
        code=$(hw_curl "$REQ_TIMEOUT" -o /dev/null -w '%{http_code}' "$cand/api/ping") || rc=$?
        if [[ "$rc" -eq 0 && -n "$code" && "$code" != "000" ]]; then
            URL="$cand"
            { printf '%s' "$cand" > "$BASE_CACHE"; chmod 600 "$BASE_CACHE"; } 2>/dev/null || true
            return 0
        fi
        last_rc="$rc"
    done
    echo "Error: could not reach the device on http or https at '$host'." >&2
    report_curl_failure "$last_rc"
    return 1
}

# --- Auth: log in, then PROVE the session works via an auth-gated endpoint ---
# Verification uses a RAW request (never re-enters do_login) so there is no
# re-login loop. /api/system returns 200 when authed, 401 when not.
do_login() {
    local rc=0
    # No -b here: start from a clean jar so a stale cookie can't mask a bad login.
    hw_curl "$REQ_TIMEOUT" -o /dev/null \
        -c "$COOKIE_FILE" \
        -d "username=$USER" \
        -d "password=$PASS" \
        "$URL/login" || rc=$?
    chmod 600 "$COOKIE_FILE" 2>/dev/null || true
    if [[ "$rc" -ne 0 ]]; then
        report_curl_failure "$rc"
        return 1
    fi

    local code="000" vrc=0
    code=$(hw_curl "$REQ_TIMEOUT" -o /dev/null -w '%{http_code}' \
        -b "$COOKIE_FILE" "$URL$AUTH_PROBE") || vrc=$?
    if [[ "$vrc" -ne 0 ]]; then
        report_curl_failure "$vrc"
        return 1
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

# --- CLI command execution ---
do_cli() {
    local cmd="$1"
    local first="${cmd%% *}"
    local mt="$REQ_TIMEOUT"
    case "$first" in
        llmgenerate|llmload) mt="$LONG_TIMEOUT" ;;  # model ops can run for minutes
    esac

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
            rm -f "$body_file"; report_curl_failure "$rc"; return 1
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

# --- Main ---
resolve_base || exit 1

case "${1:-}" in
    --ping)
        do_get "/api/ping"; exit $? ;;
    --get)
        if [[ -z "${2:-}" ]]; then
            echo "Error: --get requires a path (e.g. --get /api/sensors)" >&2; exit 1
        fi
        [[ -f "$COOKIE_FILE" ]] || do_login || exit 1
        do_get "$2"; exit $? ;;
esac

[[ -f "$COOKIE_FILE" ]] || do_login || exit 1
do_cli "$1"
