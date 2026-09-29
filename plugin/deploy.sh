#!/bin/bash
# Install or refresh the HardwareOne OpenClaw plugin.
#
# RUN THIS ON THE OPENCLAW HOST as the user that runs the gateway. It uses
# OpenClaw's managed local-plugin installer, so the plugin is tracked outside
# the global npm package and survives OpenClaw core upgrades.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$HOME/.openclaw/openclaw.json"

echo "plugin source: $SCRIPT_DIR"
echo "config       : $CONFIG"
echo

if ! command -v openclaw >/dev/null 2>&1; then
  echo "Error: openclaw is not in PATH. Run this as the user that runs the gateway." >&2
  exit 1
fi

echo "== 1. install/update managed local plugin =="
echo "   OpenClaw asks you to approve the plugin's capabilities: its four hardwareone_* tools."
echo "   The plugin registers no prompt hooks (step 2 switches prompt injection off), so answer y."
openclaw plugins install "$SCRIPT_DIR" --force

echo "== 2. wire openclaw.json =="
if [[ -f "$CONFIG" ]] && command -v jq >/dev/null 2>&1; then
  cp "$CONFIG" "$CONFIG.bak.$(date +%Y%m%d-%H%M%S)"
  TMP="$(mktemp)"
  # The plugin only provides tools, so deny prompt-mutating hooks (least privilege).
  # Merge rather than replace, so other settings on the entry survive a redeploy.
  jq '
    .plugins.allow = ((.plugins.allow // []) + ["hardwareone"] | unique) |
    .plugins.entries.hardwareone = ((.plugins.entries.hardwareone // {}) * {"enabled": true, "hooks": {"allowPromptInjection": false}}) |
    .tools.alsoAllow = (((.tools.alsoAllow // []) + ["hardwareone_ping","hardwareone_cli","hardwareone_devices","hardwareone_camera"] | unique) - ["hardwareone_get"]) |
    .tools.sandbox.tools.alsoAllow = (((.tools.sandbox.tools.alsoAllow // []) + ["hardwareone_ping","hardwareone_cli","hardwareone_devices","hardwareone_camera"] | unique) - ["hardwareone_get"])
  ' "$CONFIG" > "$TMP" && mv "$TMP" "$CONFIG"
  echo "   ensured plugins.allow, plugins.entries.hardwareone (enabled, prompt injection off) + tool allowlists (config backed up)"
else
  echo "   SKIPPED — $CONFIG missing or jq unavailable; wire manually per README.md"
fi

echo "== 3. enable + restart gateway =="
openclaw plugins enable hardwareone
openclaw gateway restart

echo
echo "== done. verify: =="
echo "   openclaw plugins inspect hardwareone --runtime --json"
echo "   # expect: hardwareone_ping, hardwareone_cli, hardwareone_devices, hardwareone_camera"
echo "   then, in a fresh agent session: \"List every tool whose name starts with hardwareone.\""
