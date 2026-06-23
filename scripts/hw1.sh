#!/bin/bash
# HardwareOne CLI Wrapper
# Handles authentication, session caching, timeouts, TLS, and command execution.
# Requires: curl
#
# Required (env, or a .env next to the skill root):
#   HW1_URL    device address — any IP / hostname / URL, e.g. http://192.168.1.42   (https://… supported — see TLS below)
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

# Load credentials from .env if present
if [[ -f "$(dirname "$0")/../.env" ]]; then set -a; source "$(dirname "$0")/../.env"; set +a; fi

URL="${HW1_URL:-}"
USER="${HW1_USER:-}"
PASS="${HW1_PASS:-}"
COOKIE_DIR="/tmp/hw1"
COOKIE_FILE="$COOKIE_DIR/session.cookie"

CONNECT_TIMEOUT="${HW1_CONNECT_TIMEOUT:-5}"
REQ_TIMEOUT="${HW1_TIMEOUT:-30}"
LONG_TIMEOUT="${HW1_TIMEOUT_LONG:-300}"
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
