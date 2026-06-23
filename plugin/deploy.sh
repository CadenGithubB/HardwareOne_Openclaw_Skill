#!/bin/bash
# Deploy / restore the HardwareOne OpenClaw plugin.
#
# RUN THIS ON THE OPENCLAW HOST (the Mac Studio), as the `openclaw` user — NOT on
# the laptop. It is safe to re-run, and is the thing to run after every
# `npm update -g openclaw`, which wipes the plugin out of dist/extensions/.
#
# Steps:
#   1. Copy the vendored plugin files (this directory) into the live
#      dist/extensions/hardwareone/.
#   2. Re-point index.js's `plugin-entry-<HASH>.js` import to the hash of the
#      CURRENTLY installed OpenClaw build (the hash changes every release).
#   3. Wire ~/.openclaw/openclaw.json (backs the config up first).
#   4. Flush the jiti cache and restart the gateway.
#   5. Print how to verify.
#
# Caveat: the plugin was authored against OpenClaw 2026.4.15. If OpenClaw's
# plugin API changed in a later release, the file copy + hash re-point may not be
# enough — check dist/docs/plugins/building-extensions.md and the gateway log.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_FILES="index.js hardwareone-tool.js openclaw.plugin.json package.json README.md"

NPM_ROOT="$(npm root -g)"
OC_DIST="$NPM_ROOT/openclaw/dist"
DEST="$OC_DIST/extensions/hardwareone"
CONFIG="$HOME/.openclaw/openclaw.json"

echo "npm root : $NPM_ROOT"
echo "dist     : $OC_DIST"
echo "dest     : $DEST"
echo

if [[ ! -d "$OC_DIST" ]]; then
  echo "Error: OpenClaw dist not found at $OC_DIST. Is openclaw installed globally for this user?" >&2
  exit 1
fi

echo "== 1. copy vendored plugin -> dist/extensions/hardwareone =="
mkdir -p "$DEST"
for f in $PLUGIN_FILES; do
  cp "$SCRIPT_DIR/$f" "$DEST/$f"
done

echo "== 2. re-point plugin-entry hash =="
ENTRY="$(ls "$OC_DIST"/plugin-entry-*.js 2>/dev/null | xargs -n1 basename | head -1 || true)"
if [[ -z "$ENTRY" ]]; then
  echo "Error: no plugin-entry-*.js in $OC_DIST — OpenClaw layout may have changed; inspect manually." >&2
  exit 1
fi
sed -i.bak "s|plugin-entry-[A-Za-z0-9_-]*\.js|$ENTRY|" "$DEST/index.js"
rm -f "$DEST/index.js.bak"
echo "   index.js -> ../../$ENTRY"

echo "== 3. wire openclaw.json =="
if [[ -f "$CONFIG" ]] && command -v jq >/dev/null 2>&1; then
  cp "$CONFIG" "$CONFIG.bak.$(date +%Y%m%d-%H%M%S)"
  TMP="$(mktemp)"
  jq '
    .plugins.allow = ((.plugins.allow // []) + ["hardwareone"] | unique) |
    .plugins.entries.hardwareone = {"enabled": true} |
    .tools.alsoAllow = ((.tools.alsoAllow // []) + ["hardwareone_ping","hardwareone_cli","hardwareone_get"] | unique) |
    .tools.sandbox.tools.alsoAllow = ((.tools.sandbox.tools.alsoAllow // []) + ["hardwareone_ping","hardwareone_cli","hardwareone_get"] | unique)
  ' "$CONFIG" > "$TMP" && mv "$TMP" "$CONFIG"
  echo "   ensured plugins.allow + plugins.entries.hardwareone + tool allowlists (config backed up)"
else
  echo "   SKIPPED — $CONFIG missing or jq unavailable; wire manually per README.md"
fi

echo "== 4. flush jiti cache + restart gateway =="
JITI_DIR="${TMPDIR:-/tmp}"; JITI_DIR="${JITI_DIR%/}/jiti"
rm -f "$JITI_DIR"/hardwareone-*.cjs 2>/dev/null || true
touch "$DEST"/*.js
if launchctl kickstart -k "gui/$(id -u)/ai.openclaw.gateway" 2>/dev/null; then
  echo "   gateway restarted"
else
  echo "   could not kickstart gateway automatically — restart it manually"
fi

echo
echo "== done. verify: =="
echo "   openclaw plugins list 2>/dev/null | grep -A1 hardwareone        # expect: loaded"
echo "   tail -n 30 ~/.openclaw/logs/gateway.err.log | grep hardwareone   # expect: registered tool ..."
echo "   then, in a fresh agent session: \"List every tool whose name starts with hardwareone.\""
