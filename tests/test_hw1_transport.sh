#!/usr/bin/env bash

set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$TEST_DIR/.." && pwd)"
WRAPPER="$REPO_ROOT/scripts/hw1.sh"
FAKE_BIN="$TEST_DIR/fixtures/bin"
TEST_TMP="$(mktemp -d "${TMPDIR:-/tmp}/hw1-transport-tests.XXXXXX")"
trap 'rm -rf "$TEST_TMP"' EXIT

PASS_COUNT=0
FAIL_COUNT=0
CASE_STATUS=0
CASE_OUTPUT=""
CASE_STDOUT=""
CASE_STDERR=""
CASE_LOG=""
CASE_DIR=""

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    printf 'ok - %s\n' "$1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf 'not ok - %s\n' "$1" >&2
    if [[ -n "$CASE_OUTPUT" ]]; then
        printf '  output: %s\n' "$CASE_OUTPUT" >&2
    fi
}

run_wrapper() {
    local name="$1" url="$2" https_mode="$3" http_mode="$4" allow_http="$5"
    local cached_base="${6:-}"
    local request="${7:---ping}"
    local cli_status="${8:-}" cli_body="${9:-}"
    local case_dir="$TEST_TMP/$name"
    CASE_DIR="$case_dir"
    mkdir -p "$case_dir/cookies" "$case_dir/home"
    if [[ -n "$cached_base" ]]; then
        printf '%s' "$cached_base" > "$case_dir/cookies/base_url"
    fi
    CASE_LOG="$case_dir/curl.log"
    : > "$CASE_LOG"
    CASE_STDOUT="$case_dir/stdout"
    CASE_STDERR="$case_dir/stderr"

    set +e
    env \
        PATH="$FAKE_BIN:/usr/bin:/bin" \
        HOME="$case_dir/home" \
        FAKE_CURL_LOG="$CASE_LOG" \
        FAKE_HTTPS_MODE="$https_mode" \
        FAKE_HTTP_MODE="$http_mode" \
        HTTP_PROXY="http://proxy.invalid:8080" \
        HTTPS_PROXY="http://proxy.invalid:8080" \
        ALL_PROXY="socks5://proxy.invalid:1080" \
        NO_PROXY="" \
        http_proxy="http://proxy.invalid:8080" \
        https_proxy="http://proxy.invalid:8080" \
        all_proxy="socks5://proxy.invalid:1080" \
        no_proxy="" \
        CURL_HOME="$case_dir/curl-home" \
        CURL_CA_BUNDLE="$case_dir/ambient-ca.pem" \
        SSL_CERT_FILE="$case_dir/ambient-cert.pem" \
        SSL_CERT_DIR="$case_dir/ambient-certs" \
        SSLKEYLOGFILE="$case_dir/ambient-keylog" \
        HW1_URL="$url" \
        HW1_USER="test-user" \
        HW1_PASS="test-pass" \
        HW1_ALLOW_HTTP="$allow_http" \
        HW1_COOKIE_DIR="$case_dir/cookies" \
        FAKE_CLI_STATUS="$cli_status" \
        FAKE_CLI_BODY="$cli_body" \
        "$WRAPPER" "$request" > "$CASE_STDOUT" 2> "$CASE_STDERR"
    CASE_STATUS=$?
    set -e
    CASE_OUTPUT="$(cat "$CASE_STDOUT" "$CASE_STDERR")"
}

urls() {
    sed -n $'s/^URL\t//p' "$CASE_LOG"
}

assert_success() {
    local name="$1"
    if [[ "$CASE_STATUS" -eq 0 ]]; then pass "$name"; else fail "$name"; fi
}

assert_failure() {
    local name="$1"
    if [[ "$CASE_STATUS" -ne 0 ]]; then pass "$name"; else fail "$name"; fi
}

assert_urls_equal() {
    local name="$1" expected="$2" actual
    actual="$(urls)"
    if [[ "$actual" == "$expected" ]]; then
        pass "$name"
    else
        CASE_OUTPUT="expected URLs:\n$expected\nactual URLs:\n$actual"
        fail "$name"
    fi
}

assert_log_contains() {
    local name="$1" needle="$2"
    if grep -Fq -- "$needle" "$CASE_LOG"; then pass "$name"; else fail "$name"; fi
}

assert_log_not_contains() {
    local name="$1" needle="$2"
    if grep -Fq -- "$needle" "$CASE_LOG"; then fail "$name"; else pass "$name"; fi
}

assert_no_ping_temp() {
    local name="$1" found
    found="$(find "$CASE_DIR/cookies" -name 'ping.*' -print -quit)"
    if [[ -z "$found" ]]; then pass "$name"; else CASE_OUTPUT="$found"; fail "$name"; fi
}

assert_status() {
    local name="$1" expected="$2"
    if [[ "$CASE_STATUS" -eq "$expected" ]]; then
        pass "$name"
    else
        CASE_OUTPUT="expected exit $expected, got $CASE_STATUS: $CASE_OUTPUT"
        fail "$name"
    fi
}

# stdout must be exactly the device body plus the wrapper's single trailing newline.
assert_stdout_is_body() {
    local name="$1" body="$2"
    if printf '%s\n' "$body" | cmp -s - "$CASE_STDOUT"; then
        pass "$name"
    else
        CASE_OUTPUT="stdout was: $(cat "$CASE_STDOUT")"
        fail "$name"
    fi
}

assert_stderr_lines_at_most() {
    local name="$1" limit="$2" lines
    lines="$(wc -l < "$CASE_STDERR")"
    lines="${lines//[[:space:]]/}"
    if [[ "$lines" -le "$limit" ]]; then
        pass "$name"
    else
        CASE_OUTPUT="stderr had $lines lines: $(cat "$CASE_STDERR")"
        fail "$name"
    fi
}

# The --max-time value curl was given on the /api/cli call.
cli_max_time() {
    grep -F $'/api/cli' "$CASE_LOG" | grep -F $'CALL\t' | sed -n $'s/.*\t--max-time\t\([0-9]*\)\t.*/\\1/p' | head -n 1
}

assert_cli_max_time() {
    local name="$1" expected="$2" actual
    actual="$(cli_max_time)"
    if [[ "$actual" == "$expected" ]]; then
        pass "$name"
    else
        CASE_OUTPUT="expected --max-time $expected on /api/cli, got '$actual'"
        fail "$name"
    fi
}

run_wrapper explicit_https https://device.test valid valid 1
assert_success "explicit HTTPS succeeds"
assert_urls_equal "explicit HTTPS never probes HTTP" $'https://device.test/api/ping\nhttps://device.test/api/ping'

run_wrapper explicit_https_stale_cache https://device.test valid valid 1 http://device.test
assert_success "explicit HTTPS ignores a stale HTTP scheme cache"
assert_urls_equal "stale HTTP cache cannot override explicit HTTPS" $'https://device.test/api/ping\nhttps://device.test/api/ping'

run_wrapper explicit_https_refused https://device.test refused valid 1
assert_failure "explicit HTTPS connection refusal fails"
assert_urls_equal "explicit HTTPS never falls back" 'https://device.test/api/ping'

run_wrapper explicit_http http://device.test valid valid 0
assert_success "explicit HTTP is a deliberate pinned route"
assert_urls_equal "explicit HTTP never probes HTTPS" $'http://device.test/api/ping\nhttp://device.test/api/ping'

run_wrapper bare_https device.test valid valid 0
assert_success "bare host uses HTTPS"
assert_urls_equal "bare host without opt-in never probes HTTP" $'https://device.test/api/ping\nhttps://device.test/api/ping'

run_wrapper bare_refused_no_opt_in device.test refused valid 0
assert_failure "bare HTTPS refusal fails without HTTP opt-in"
assert_urls_equal "HTTP remains disabled without opt-in" 'https://device.test/api/ping'

run_wrapper bare_refused_with_opt_in device.test refused valid 1
assert_success "bare host can use HTTP after HTTPS connection refusal when opted in"
assert_urls_equal "HTTP fallback occurs only after refused HTTPS" $'https://device.test/api/ping\nhttp://device.test/api/ping\nhttp://device.test/api/ping'

run_wrapper bare_refused_invalid_http device.test refused generic_json 1
assert_failure "HTTP fallback must also identify as HardwareOne"
assert_urls_equal "an invalid HTTP fallback is not used for credentials" $'https://device.test/api/ping\nhttp://device.test/api/ping'

for blocked_mode in dns_error handshake_error certificate_error timeout reset redirect not_found wrong_content_type generic_json invalid_json wrong_fingerprint valid_extra_data restore_identity oversized; do
    run_wrapper "blocked_$blocked_mode" device.test "$blocked_mode" valid 1
    assert_failure "bare host rejects HTTPS $blocked_mode without downgrade"
    assert_urls_equal "HTTPS $blocked_mode never reaches HTTP" 'https://device.test/api/ping'
    if [[ "$blocked_mode" == "oversized" ]]; then
        assert_log_contains "an oversized probe is capped during transfer" $'BODY_BYTES\t4096'
        assert_no_ping_temp "an interrupted oversized probe leaves no temporary body"
    fi
done

run_wrapper ping_without_https_field device.test valid_no_https valid 0
assert_success "firmware ping without the optional https field is accepted"
assert_urls_equal "an accepted HTTPS endpoint remains pinned" $'https://device.test/api/ping\nhttps://device.test/api/ping'

run_wrapper invalid_endpoint_before_login device.test generic_json valid 1 '' status
assert_failure "an unrecognized endpoint blocks a CLI command"
assert_urls_equal "an unrecognized endpoint is rejected before login or command dispatch" 'https://device.test/api/ping'

run_wrapper valid_endpoint_before_login https://device.test valid valid 0 '' status
assert_success "a recognizable endpoint permits normal login and CLI flow"
assert_urls_equal "endpoint probe precedes login and command dispatch" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

run_wrapper curl_isolation https://device.test valid valid 0
assert_success "isolated curl invocation succeeds"
first_call="$(sed -n '1p' "$CASE_LOG")"
if [[ "$first_call" == $'CALL\t-q\t'* ]]; then
    pass "curl -q is the first argument"
else
    CASE_OUTPUT="$first_call"
    fail "curl -q is the first argument"
fi
assert_log_contains "curl bypasses ambient proxies" $'\t--noproxy\t*'
assert_log_contains "curl restricts primary protocols" $'\t--proto\t=http,https'
assert_log_contains "curl restricts redirect protocols" $'\t--proto-redir\t=http,https'
assert_log_contains "curl disables redirects" $'\t--max-redirs\t0'
assert_log_contains "endpoint probe caps response size" $'\t--max-filesize\t4096'
assert_log_contains "ambient TLS trust variables are cleared" $'ENV\tunset\tunset\tunset\tunset'
assert_log_not_contains "curl never enables location following" $'\t--location\t'
assert_log_not_contains "curl never uses short location following" $'\t-L\t'

run_wrapper unsupported_scheme ftp://device.test valid valid 1
assert_status "unsupported URL scheme is a configuration error (exit 1, never failover)" 1
assert_urls_equal "unsupported scheme is rejected before curl" ''

run_wrapper empty_host 'https://' valid valid 1
assert_status "a URL without a host is a configuration error (exit 1)" 1
assert_urls_equal "an empty host is rejected before curl" ''

for invalid_url in \
    'https://device.test/' \
    'https://device.test/api' \
    'https://device.test?mode=admin' \
    'https://device.test#fragment' \
    'https://user@device.test' \
    '2001:db8::1' \
    'device.test:0' \
    'device.test:65536'; do
    run_wrapper "invalid_origin_${PASS_COUNT}" "$invalid_url" valid valid 1
    assert_status "non-origin URL is a configuration error (exit 1): $invalid_url" 1
    assert_urls_equal "invalid authority is rejected before curl: $invalid_url" ''
done

# --- unreachable versus misconfigured: only a failed or unverified probe exits 7 ---
run_wrapper unreachable_refused https://device.test refused valid 0
assert_status "a refused connection exits 7 (unreachable, failover allowed)" 7

run_wrapper unreachable_not_found https://device.test not_found valid 0
assert_status "a non-200 probe exits 7 (no verified endpoint)" 7

run_wrapper unreachable_generic_json https://device.test generic_json valid 0
assert_status "a non-HardwareOne probe body exits 7 (no verified endpoint)" 7

run_wrapper unreachable_redirect https://device.test redirect valid 0
assert_status "a redirecting probe exits 7 (no verified endpoint)" 7

run_wrapper bracketed_ipv6 '[2001:db8::1]:8443' valid valid 0
assert_success "bracketed IPv6 authority is accepted"
assert_urls_equal "bracketed IPv6 remains an HTTPS origin" $'https://[2001:db8::1]:8443/api/ping\nhttps://[2001:db8::1]:8443/api/ping'

run_wrapper link_local_ipv6 '[fe80::1234%25eth0]:8443' valid valid 0
assert_success "RFC-encoded link-local IPv6 zone authority is accepted"
assert_urls_equal "link-local IPv6 remains an HTTPS origin" $'https://[fe80::1234%25eth0]:8443/api/ping\nhttps://[fe80::1234%25eth0]:8443/api/ping'

# --- /api/cli result semantics (firmware v0.99.8+: 400/403 carry the device's own text) ---
CLI_OK_BODY='Uptime: 12s'
run_wrapper cli_ok https://device.test valid valid 0 '' status 200 "$CLI_OK_BODY"
assert_status "a 200 command result exits 0" 0
assert_stdout_is_body "a 200 command result prints the body" "$CLI_OK_BODY"
assert_urls_equal "a 200 command result is not retried" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

CLI_400_BODY=$'Usage: otaupdate confirm [force-power]\nOnly a staged image can be applied.'
run_wrapper cli_rejected_400 https://device.test valid valid 0 '' 'otaupdate now' 400 "$CLI_400_BODY"
assert_status "a 400 command rejection exits 3" 3
assert_stdout_is_body "a 400 command rejection prints the device text verbatim" "$CLI_400_BODY"
assert_stderr_lines_at_most "a 400 command rejection adds at most one stderr line" 1
assert_urls_equal "a 400 command rejection is not retried" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

CLI_UNKNOWN_BODY='Unknown command: camerastart'
run_wrapper cli_unknown_400 https://device.test valid valid 0 '' camerastart 400 "$CLI_UNKNOWN_BODY"
assert_status "an unknown command exits 3" 3
assert_stdout_is_body "an unknown command prints the device text verbatim" "$CLI_UNKNOWN_BODY"
assert_cli_max_time "camerastart is not a slow command and gets the default timeout" 30

CLI_403_BODY="Error: Admin access required for command 'reboot'. Contact an administrator."
run_wrapper cli_rejected_403 https://device.test valid valid 0 '' reboot 403 "$CLI_403_BODY"
assert_status "a 403 command rejection exits 3" 3
assert_stdout_is_body "a 403 command rejection prints the device text verbatim" "$CLI_403_BODY"
assert_stderr_lines_at_most "a 403 command rejection adds at most one stderr line" 1
assert_urls_equal "a 403 command rejection is not retried" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

run_wrapper cli_relogin_401 https://device.test valid valid 0 '' status 401,200 "$CLI_OK_BODY"
assert_status "a 401 command result re-logins and retries once" 0
assert_stdout_is_body "the retried command result is printed" "$CLI_OK_BODY"
assert_urls_equal "a 401 triggers exactly one re-login before the retry" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

CLI_401_BODY='Error: web session changed.'
run_wrapper cli_persistent_401 https://device.test valid valid 0 '' status 401 "$CLI_401_BODY"
assert_status "a persistent 401 is a transport error" 1
assert_stdout_is_body "a persistent 401 prints the device's own text" "$CLI_401_BODY"
assert_urls_equal "a persistent 401 re-logins exactly once and never a third time" $'https://device.test/api/ping\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli\nhttps://device.test/login\nhttps://device.test/api/system\nhttps://device.test/api/cli'

CLI_429_BODY='{"error":"rate limited"}'
run_wrapper cli_429_no_interval https://device.test valid valid 0 '' status 429 "$CLI_429_BODY"
assert_status "a 429 without a retry interval exits 1" 1
assert_stdout_is_body "a 429 without a retry interval still prints the body" "$CLI_429_BODY"

CLI_500_BODY='Internal error'
run_wrapper cli_other_500 https://device.test valid valid 0 '' status 500 "$CLI_500_BODY"
assert_status "an unexpected HTTP status exits 1" 1
assert_stdout_is_body "an unexpected HTTP status still prints the body" "$CLI_500_BODY"

# --- slow-command timeouts: first token selects HW1_TIMEOUT_LONG ---
run_wrapper cli_slow_c6update https://device.test valid valid 0 '' 'c6update /sd/fw.bin' 200 'C6 update started'
assert_status "c6update succeeds" 0
assert_cli_max_time "c6update is sent with the long timeout" 300

run_wrapper cli_default_status https://device.test valid valid 0 '' status 200 "$CLI_OK_BODY"
assert_cli_max_time "status is sent with the default timeout" 30

for slow_cmd in 'llmask 0 1' 'llmgenerate hello' 'llmload' 'opencamera' 'certgen' 'otastage confirm' 'otaupdate confirm' 'stt record 5' 'stt start'; do
    run_wrapper "cli_slow_${PASS_COUNT}" https://device.test valid valid 0 '' "$slow_cmd" 200 'ok'
    assert_cli_max_time "slow command gets the long timeout: $slow_cmd" 300
done

for fast_cmd in 'camerastart' 'sttx' 'llmresult json 0' 'otapin status'; do
    run_wrapper "cli_fast_${PASS_COUNT}" https://device.test valid valid 0 '' "$fast_cmd" 200 'ok'
    assert_cli_max_time "ordinary command keeps the default timeout: $fast_cmd" 30
done

# the firmware matches case-insensitively and trims leading whitespace; so does the list
for slow_cmd in 'OtaUpdate confirm' 'STT record 5' '  stt start' $'\tc6update /sd/fw.bin' 'LLMLOAD cm5:model.gguf'; do
    run_wrapper "cli_slow_spelling_${PASS_COUNT}" https://device.test valid valid 0 '' "$slow_cmd" 200 'ok'
    assert_cli_max_time "slow command spelled differently still gets the long timeout: $slow_cmd" 300
done

for fast_cmd in '  status' 'STTX' 'Otapin status'; do
    run_wrapper "cli_fast_spelling_${PASS_COUNT}" https://device.test valid valid 0 '' "$fast_cmd" 200 'ok'
    assert_cli_max_time "ordinary command spelled differently keeps the default timeout: $fast_cmd" 30
done

printf '\n%d passed, %d failed\n' "$PASS_COUNT" "$FAIL_COUNT"
[[ "$FAIL_COUNT" -eq 0 ]]
