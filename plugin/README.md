# HardwareOne OpenClaw plugin

Registers three gateway tools — `hardwareone_ping`, `hardwareone_cli`, `hardwareone_devices` —
that the sandboxed agent calls. The CLI is the device's complete interface; there is no
HTTP-API tool (the agent does everything through `hardwareone_cli`). Each shells out (via `spawn`, never a shell) to the
host-side `hw1.sh` wrapper, which talks to the ESP32. The sandbox itself gains no network.

## Files

| File | Purpose |
|------|---------|
| `openclaw.plugin.json` | Plugin manifest — must include `contracts.tools` or it's filtered out at discovery. |
| `index.js` | Entry: imports `definePluginEntry` from the OpenClaw core and registers the tools. |
| `hardwareone-tool.js` | The three tool definitions + subprocess plumbing + input validation. |
| `deploy.sh` | Installs/restores the plugin and restarts the gateway. |

## Deploy / restore

Run `./deploy.sh` on the OpenClaw host. It copies the plugin into OpenClaw's
`dist/extensions/hardwareone/`, re-points the per-release `plugin-entry-<hash>` import,
wires the tool allowlists in `~/.openclaw/openclaw.json`, flushes the jiti cache
(`$TMPDIR/jiti/`), and restarts the gateway.

**`npm update openclaw` wipes the plugin** out of `dist/extensions/`, so re-run
`deploy.sh` after every upgrade.

## Security boundary

- **Input:** each tool validates length (≤ 512 chars), rejects control characters, and restricts device names to a safe charset.
- **Process:** `spawn` with an argv array — never a shell, no `sh -c`. Command arguments can't be shell-interpreted on the host.
- **Runtime:** per-call timeout; stdout capped at 64 KB, stderr at 4 KB.
- **Credentials:** live only in the skill's host-side `.env`; they never enter the sandbox.

## Gotchas

- **Per-release hash** — `index.js` statically imports `../../plugin-entry-<hash>.js`, and the hash changes every OpenClaw release. `deploy.sh` re-points it automatically; after a manual edit, do it yourself.
- **jiti cache** — OpenClaw caches compiled plugins under `$TMPDIR/jiti/`; source edits are ignored until that cache is cleared (deploy.sh handles it). Symptom of a stale cache: errors referencing code you already removed.
- **Tool allowlist** — the tool names must appear in both `tools.alsoAllow` and `tools.sandbox.tools.alsoAllow` for the sandboxed agent to call them.
