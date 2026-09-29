#!/bin/bash
# HardwareOne deploy-bundle installer.
# RUN ON THE OPENCLAW HOST, as the `openclaw` user, from inside
# this folder. Safe to re-run.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/.openclaw/workspace/skills/hardwareone"
STAGE=""

# Support both distributions:
#   deploy bundle: deploy/{install.sh,skill/,plugin/}
#   repository:    {SKILL.md,references/,scripts/,plugin/,deploy/install.sh}
if [[ -f "$HERE/skill/SKILL.md" && -f "$HERE/plugin/deploy.sh" ]]; then
  SKILL_SOURCE="$HERE/skill"
  PLUGIN_SOURCE="$HERE/plugin"
elif [[ -f "$HERE/../SKILL.md" && -f "$HERE/../plugin/deploy.sh" ]]; then
  REPO_ROOT="$(cd "$HERE/.." && pwd)"
  STAGE="$(mktemp -d)"
  trap '[[ -n "$STAGE" && -d "$STAGE" ]] && rm -rf "$STAGE"' EXIT
  cp "$REPO_ROOT/SKILL.md" "$STAGE/"
  cp -R "$REPO_ROOT/references" "$REPO_ROOT/scripts" "$STAGE/"
  SKILL_SOURCE="$STAGE"
  PLUGIN_SOURCE="$REPO_ROOT/plugin"
else
  echo "Error: could not find the HardwareOne skill and plugin files." >&2
  echo "       Run deploy/install.sh from a repository checkout, or use a complete deploy bundle." >&2
  exit 1
fi

if [[ ! -f "$HOME/.openclaw/openclaw.json" ]]; then
  echo "Error: ~/.openclaw/openclaw.json not found." >&2
  echo "       Run this on the OpenClaw host (as the openclaw user), not the laptop." >&2
  exit 1
fi

echo "== 1. skill -> workspace (clean: --delete prunes removed files; .env is protected) =="
mkdir -p "$WORKSPACE"
rsync -a --delete --exclude='.env' "$SKILL_SOURCE/" "$WORKSPACE/"
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
REGISTRY="$HOME/.openclaw/hardwareone.devices.json"
if [[ -f "$REGISTRY" ]]; then
  echo "   device registry: $REGISTRY"
elif [[ -f "$HOST_ENV" ]]; then
  echo "   credentials: $HOST_ENV"
else
  echo "   NOTE: no devices configured — create $REGISTRY (see hardwareone.devices.json.template)"
  echo "         or, for a single device, $HOST_ENV (see README step 2)"
fi

echo "== 2. sync sandbox mirror(s) so the agent sees the update =="
shopt -s nullglob
found=0
for d in "$HOME"/.openclaw/sandboxes/*/skills/hardwareone; do
  rsync -a --delete --exclude='.env' "$SKILL_SOURCE/" "$d/"
  rm -f "$d/.env"
  echo "   updated $d"
  found=1
done
[[ "$found" = 1 ]] || echo "   (no existing sandbox mirror found; the gateway may create it on restart)"

echo "== 3. managed plugin install + wiring + restart =="
bash "$PLUGIN_SOURCE/deploy.sh"

echo
echo "== done. verify: =="
echo "   openclaw plugins list | grep -A1 hardwareone                              # expect: loaded"
echo "   find ~/.openclaw/sandboxes/*/skills/hardwareone -name .env || echo clean    # expect: clean"
echo "   then a fresh agent session: \"List every tool whose name starts with hardwareone.\"  # expect: ping, cli, devices, camera (NO hardwareone_get)"
