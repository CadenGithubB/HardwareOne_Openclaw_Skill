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
    local case_dir="$TEST_TMP/$name"
    CASE_DIR="$case_dir"
    mkdir -p "$case_dir/cookies" "$case_dir/home"
    if [[ -n "$cached_base" ]]; then
        printf '%s' "$cached_base" > "$case_dir/cookies/base_url"
    fi
    CASE_LOG="$case_dir/curl.log"
    : > "$CASE_LOG"

    set +e
    CASE_OUTPUT=$(env \
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
        HW1_PASS="${CASE_PASS:-test-pass}" \
        HW1_ALLOW_HTTP="$allow_http" \
        HW1_COOKIE_DIR="$case_dir/cookies" \
        "$WRAPPER" "$request" 2>&1)
    CASE_STATUS=$?
    set -e
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

assert_args_not_contain() {
    local name="$1" needle="$2"
    if grep '^CALL' "$CASE_LOG" | grep -Fq -- "$needle"; then fail "$name"; else pass "$name"; fi
}

assert_no_ping_temp() {
    local name="$1" found
    found="$(find "$CASE_DIR/cookies" -name 'ping.*' -print -quit)"
    if [[ -z "$found" ]]; then pass "$name"; else CASE_OUTPUT="$found"; fail "$name"; fi
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

CASE_PASS='p&ss+w%41rd x'
run_wrapper login_encoding https://device.test valid valid 0 '' status
unset CASE_PASS
assert_success "a password with form metacharacters logs in"
assert_log_contains "the username is URL-encoded" $'\t--data-urlencode\tusername=test-user'
assert_log_contains "the password is URL-encoded from stdin" $'\t--data-urlencode\tpassword@-'
assert_log_contains "stdin carries the exact password" $'STDIN\tpassword\tp&ss+w%41rd x'
assert_args_not_contain "the password never appears in curl arguments" 'p&ss+w%41rd x'

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
assert_failure "unsupported URL scheme is rejected"
assert_urls_equal "unsupported scheme is rejected before curl" ''

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
    assert_failure "non-origin URL is rejected: $invalid_url"
    assert_urls_equal "invalid authority is rejected before curl: $invalid_url" ''
done

run_wrapper bracketed_ipv6 '[2001:db8::1]:8443' valid valid 0
assert_success "bracketed IPv6 authority is accepted"
assert_urls_equal "bracketed IPv6 remains an HTTPS origin" $'https://[2001:db8::1]:8443/api/ping\nhttps://[2001:db8::1]:8443/api/ping'

run_wrapper link_local_ipv6 '[fe80::1234%25eth0]:8443' valid valid 0
assert_success "RFC-encoded link-local IPv6 zone authority is accepted"
assert_urls_equal "link-local IPv6 remains an HTTPS origin" $'https://[fe80::1234%25eth0]:8443/api/ping\nhttps://[fe80::1234%25eth0]:8443/api/ping'

printf '\n%d passed, %d failed\n' "$PASS_COUNT" "$FAIL_COUNT"
[[ "$FAIL_COUNT" -eq 0 ]]
