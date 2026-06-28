#!/bin/bash
# HardwareOne deploy-bundle installer.
# RUN ON THE OPENCLAW HOST (the Mac Studio), as the `openclaw` user, from inside
# this folder. Safe to re-run.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/.openclaw/workspace/skills/hardwareone"

if [[ ! -f "$HOME/.openclaw/openclaw.json" ]]; then
  echo "Error: ~/.openclaw/openclaw.json not found." >&2
  echo "       Run this on the OpenClaw host (as the openclaw user), not the laptop." >&2
  exit 1
fi

echo "== 1. skill -> workspace (clean: --delete prunes removed files; .env is protected) =="
mkdir -p "$WORKSPACE"
rsync -a --delete --exclude='.env' "$HERE/skill/" "$WORKSPACE/"
echo "   updated $WORKSPACE"

echo "== 1b. keep credentials OUT of the skill dir (host-only) =="
HOST_ENV="$HOME/.openclaw/hardwareone.env"
if [[ -f "$WORKSPACE/.env" && ! -f "$HOST_ENV" ]]; then
  mv "$WORKSPACE/.env" "$HOST_ENV" && chmod 600 "$HOST_ENV"
  echo "   migrated credentials -> $HOST_ENV"
fi
# A .env inside the skill dir gets mirrored into the agent sandbox — never leave one.
rm -f "$WORKSPACE/.env"
rm -f "$HOME"/.openclaw/sandboxes/*/skills/hardwareone/.env
[[ -f "$HOST_ENV" ]] && echo "   credentials: $HOST_ENV" \
  || echo "   NOTE: no credentials found — create $HOST_ENV (see README step 2)"

echo "== 2. sync sandbox mirror(s) so the agent sees the update =="
shopt -s nullglob
found=0
for d in "$HOME"/.openclaw/sandboxes/*/skills/hardwareone; do
  rsync -a --delete --exclude='.env' "$HERE/skill/" "$d/"
  rm -f "$d/.env"
  echo "   updated $d"
  found=1
done
[[ "$found" = 1 ]] || echo "   (no existing sandbox mirror found; the gateway may create it on restart)"

echo "== 3. plugin -> dist/extensions + wiring + restart =="
bash "$HERE/plugin/deploy.sh"

echo
echo "== done. verify: =="
echo "   openclaw plugins list | grep -A1 hardwareone                              # expect: loaded"
echo "   find ~/.openclaw/sandboxes/*/skills/hardwareone -name .env || echo clean    # expect: clean"
echo "   then a fresh agent session: \"List every tool whose name starts with hardwareone.\"  # expect: ping, cli, devices (NO hardwareone_get)"
