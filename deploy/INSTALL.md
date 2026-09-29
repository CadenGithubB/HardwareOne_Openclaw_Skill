# HardwareOne — deploy bundle

Run `deploy/install.sh` from a repository checkout, or drag a complete deploy bundle
onto the OpenClaw host and run `./install.sh` inside it as the `openclaw` user.
The installer detects either layout automatically.

It updates two things in two places:

| Part | Where it goes | Notes |
|------|---------------|-------|
| `skill/`  | `~/.openclaw/workspace/skills/hardwareone/` | persistent; survives OpenClaw updates |
| `plugin/` | OpenClaw's managed extensions directory (via `plugin/deploy.sh`) | tracked separately from the global OpenClaw package |

Your existing `.env` (device URL + credentials) is **never touched** — there is no
`.env` in this bundle, and the installer excludes it from the sync, so the `--delete`
clean-up won't remove it either.

## Easiest: one command

From the repository root:

    ./deploy/install.sh

Or, from inside a complete deploy bundle:

    ./install.sh

It copies the skill into the workspace (and any sandbox mirror) without touching
your `.env`, then runs `plugin/deploy.sh` to install/update and wire the managed plugin
and restart the gateway.

## Or by hand

    # 1. skill -> workspace (authoritative: --delete prunes removed files; keeps your .env)
    rsync -a --delete --exclude='.env' skill/ ~/.openclaw/workspace/skills/hardwareone/

    # 2. sync the read-only sandbox mirror(s) so the agent sees the update
    for d in ~/.openclaw/sandboxes/*/skills/hardwareone; do
      rsync -a --delete --exclude='.env' skill/ "$d"/; done

    # 3. managed plugin install + wiring + restart
    bash plugin/deploy.sh

## Verify

    openclaw plugins list | grep -A1 hardwareone                      # expect: loaded
    tail -n 30 ~/.openclaw/logs/gateway.err.log | grep hardwareone    # expect: registered tool ...
    # then, in a fresh agent session:
    #   "List every tool whose name starts with hardwareone."

## Heads-up

Recent OpenClaw versions ask you to approve a local plugin's capabilities during
install. For HardwareOne that is its four `hardwareone_*` tools; answer `y`. It reports
"Prompt injection: allowed" by default; the plugin registers no prompt hooks, and the
deploy script switches that permission off in `openclaw.json`.

The plugin targets OpenClaw 2026.7.1 or newer and imports the public plugin SDK.
If runtime inspection does not show all HardwareOne tools, check the gateway log
and `openclaw plugins inspect hardwareone --runtime --json`.

## Current bundle highlights

- **Camera understanding:** `hardwareone_camera` now sends the captured frame through
  OpenClaw's configured image-understanding runtime while the file is still available on
  the gateway. Its result contains both a textual description the agent can reliably read
  and the original image block the Control UI can display. The agent no longer needs to
  call `image`, guess a sandbox path, or use `exec` after taking a photo.
- **CLI-only:** the `hardwareone_get` HTTP-API tool is removed — the agent now does
  everything through `hardwareone_cli`. Installing this drop unregisters the old tool
  (clean plugin install + the `openclaw.json` allowlist is pruned).
- ESP-NOW **bonding** guidance and secure-pairing notes in `SKILL.md`.
- Firmware-synced command/settings catalogs now distinguish unique command names from
  registry entries, mark **super-admin** commands, understand dispatcher settings such
  as `power mode`, and record dirty-source provenance when needed.
- Agent guidance covers HardwareOne's current enable/autostart/live-state model,
  consent-based ESP-NOW pairing, events/notifications, R1 health capture, G2 device
  settings, and guided LLM commands.
- The installer is now **authoritative**: `--delete` on the skill sync plus a clean plugin
  install drop anything an older version left behind (your host-side `.env` is preserved).
