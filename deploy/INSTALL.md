# HardwareOne — deploy bundle

Drag this whole folder onto the OpenClaw host (the Mac Studio), then run
`./install.sh` from inside it as the `openclaw` user. That's it.

It updates two things in two places:

| Part | Where it goes | Notes |
|------|---------------|-------|
| `skill/`  | `~/.openclaw/workspace/skills/hardwareone/` | persistent; survives OpenClaw updates |
| `plugin/` | OpenClaw's `dist/extensions/hardwareone/` (via `plugin/deploy.sh`) | wiped on every `npm update openclaw` — re-run after each upgrade |

Your existing `.env` (device URL + credentials) is **never touched** — there is no
`.env` in this bundle, and the installer excludes it from the sync, so the `--delete`
clean-up won't remove it either.

## Easiest: one command

On the host, from inside this folder:

    ./install.sh

It copies the skill into the workspace (and any sandbox mirror) without touching
your `.env`, then runs `plugin/deploy.sh` to restore + wire the plugin, fix the
per-release `plugin-entry-<hash>` import, flush the jiti cache, and restart the gateway.

## Or by hand

    # 1. skill -> workspace (authoritative: --delete prunes removed files; keeps your .env)
    rsync -a --delete --exclude='.env' skill/ ~/.openclaw/workspace/skills/hardwareone/

    # 2. sync the read-only sandbox mirror(s) so the agent sees the update
    for d in ~/.openclaw/sandboxes/*/skills/hardwareone; do
      rsync -a --delete --exclude='.env' skill/ "$d"/; done

    # 3. plugin -> dist/extensions + wiring + restart
    bash plugin/deploy.sh

## Verify

    openclaw plugins list | grep -A1 hardwareone                      # expect: loaded
    tail -n 30 ~/.openclaw/logs/gateway.err.log | grep hardwareone    # expect: registered tool ...
    # then, in a fresh agent session:
    #   "List every tool whose name starts with hardwareone."

## Heads-up

The plugin was built against OpenClaw 2026.4.15; the host is on 2026.6.9.
`deploy.sh` handles the two known upgrade-breakers (the file wipe and the hash
re-point), but if `plugins list` doesn't show `loaded`, the likely cause is a
plugin-API change between those releases — check the gateway log above and
`dist/docs/plugins/building-extensions.md`, and send me what you find.

## What's new in this drop

- **CLI-only:** the `hardwareone_get` HTTP-API tool is removed — the agent now does
  everything through `hardwareone_cli`. Installing this drop unregisters the old tool
  (clean plugin install + the `openclaw.json` allowlist is pruned).
- ESP-NOW **bonding** guidance and secure-pairing notes in `SKILL.md`.
- The installer is now **authoritative**: `--delete` on the skill sync plus a clean plugin
  install drop anything an older version left behind (your host-side `.env` is preserved).
