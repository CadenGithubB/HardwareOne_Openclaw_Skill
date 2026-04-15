#!/bin/bash
# HardwareOne CLI Wrapper
# Handles authentication, session caching, and command execution.
# Requires: curl
# Env vars: HW1_URL, HW1_USER, HW1_PASS

set -euo pipefail

# Load credentials from .env if present
[[ -f "$(dirname "$0")/../.env" ]] && set -a && source "$(dirname "$0")/../.env" && set +a

URL="${HW1_URL:-}"
USER="${HW1_USER:-}"
PASS="${HW1_PASS:-}"
COOKIE_DIR="/tmp/hw1"
COOKIE_FILE="$COOKIE_DIR/session.cookie"

# --- Preflight ---
if [[ -z "$URL" || -z "$USER" || -z "$PASS" ]]; then
    echo "Error: HW1_URL, HW1_USER, and HW1_PASS environment variables must be set." >&2
    exit 1
fi

if [[ -z "${1:-}" ]]; then
    echo "Usage: hw1.sh \"<cli command>\"" >&2
    echo "       hw1.sh --ping" >&2
    echo "       hw1.sh --get <path>   (e.g. --get /api/sensors)" >&2
    exit 1
fi

# Ensure cookie directory exists with restricted permissions
if [[ ! -d "$COOKIE_DIR" ]]; then
    mkdir -m 700 "$COOKIE_DIR"
fi

# --- Auth ---
do_login() {
    # POST form credentials, capture HTTP status code
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -c "$COOKIE_FILE" \
        -L \
        -d "username=$USER" \
        -d "password=$PASS" \
        "$URL/login")

    # Restrict cookie file permissions
    chmod 600 "$COOKIE_FILE" 2>/dev/null

    # 200 = landed on a page after redirect (success)
    # 302/303 = redirect issued (success, but we follow with -L)
    if [[ "$http_code" =~ ^(200|302|303)$ ]]; then
        # Verify a session cookie was actually set
        if [[ -f "$COOKIE_FILE" ]] && grep -q -i "session\|sid\|token" "$COOKIE_FILE" 2>/dev/null; then
            return 0
        fi
        # Cookie file exists but no session cookie — might still work
        # (some servers use different cookie names)
        if [[ -f "$COOKIE_FILE" ]] && [[ $(wc -l < "$COOKIE_FILE") -gt 4 ]]; then
            return 0
        fi
    fi

    echo "Error: Authentication failed (HTTP $http_code). Check HW1_USER and HW1_PASS." >&2
    return 1
}

# --- HTTP GET (convenience endpoints) ---
do_get() {
    local path="$1"
    local body_file
    body_file=$(mktemp)

    local http_code
    http_code=$(curl -s -o "$body_file" -w "%{http_code}" \
        -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
        "$URL$path")

    local body
    body=$(cat "$body_file")
    rm -f "$body_file"

    if [[ "$http_code" == "200" ]]; then
        echo "$body"
        return 0
    elif [[ "$http_code" == "401" ]]; then
        echo "Session expired, re-authenticating..." >&2
        if do_login; then
            # Retry once
            body=$(curl -s -b "$COOKIE_FILE" "$URL$path")
            echo "$body"
            return 0
        else
            echo "Error: Failed to re-authenticate." >&2
            return 1
        fi
    elif [[ "$http_code" == "403" ]]; then
        echo "Error: Insufficient permissions (403 Forbidden)." >&2
        echo "$body"
        return 1
    else
        echo "Error: HTTP $http_code" >&2
        echo "$body"
        return 1
    fi
}

# --- CLI command execution ---
do_cli() {
    local cmd="$1"
    local attempt=0
    local max_attempts=2

    while [[ $attempt -lt $max_attempts ]]; do
        local body_file
        body_file=$(mktemp)

        local http_code
        http_code=$(curl -s -o "$body_file" -w "%{http_code}" \
            -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
            --data-urlencode "cmd=$cmd" \
            -d "capture=1" \
            "$URL/api/cli")

        local body
        body=$(cat "$body_file")
        rm -f "$body_file"

        case "$http_code" in
            200)
                echo "$body"
                return 0
                ;;
            401)
                echo "Session expired, re-authenticating..." >&2
                if do_login; then
                    ((attempt++))
                    continue
                else
                    echo "Error: Failed to re-authenticate." >&2
                    return 1
                fi
                ;;
            429)
                # Parse retry_after_ms — macOS-compatible (no grep -P)
                local wait_ms
                wait_ms=$(echo "$body" | sed -n 's/.*"retry_after_ms"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p')
                if [[ -n "$wait_ms" && "$wait_ms" -gt 0 ]]; then
                    # Convert ms to seconds, minimum 1
                    local wait_sec=$(( (wait_ms + 999) / 1000 ))
                    echo "Rate limited, waiting ${wait_sec}s..." >&2
                    sleep "$wait_sec"
                    ((attempt++))
                    continue
                else
                    echo "Error: Rate limited (429) but no retry interval provided." >&2
                    echo "$body"
                    return 1
                fi
                ;;
            403)
                echo "Error: Insufficient permissions (403 Forbidden)." >&2
                echo "$body"
                return 1
                ;;
            400)
                echo "Error: Bad request (400)." >&2
                echo "$body"
                return 1
                ;;
            *)
                echo "Error: HTTP $http_code" >&2
                echo "$body"
                return 1
                ;;
        esac
    done

    echo "Error: Max retry attempts reached." >&2
    return 1
}

# --- Main ---

# Handle special flags
case "${1:-}" in
    --ping)
        do_get "/api/ping"
        exit $?
        ;;
    --get)
        if [[ -z "${2:-}" ]]; then
            echo "Error: --get requires a path (e.g. --get /api/sensors)" >&2
            exit 1
        fi
        # Ensure we have a session
        if [[ ! -f "$COOKIE_FILE" ]]; then
            do_login || exit 1
        fi
        do_get "$2"
        exit $?
        ;;
esac

# Default: CLI command execution
# Ensure we have a session
if [[ ! -f "$COOKIE_FILE" ]]; then
    do_login || exit 1
fi

do_cli "$1"
