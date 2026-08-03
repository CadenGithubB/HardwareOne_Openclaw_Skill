# HardwareOne OpenClaw plugin

Registers four gateway tools — `hardwareone_ping`, `hardwareone_cli`, `hardwareone_devices`,
`hardwareone_camera` —
that the sandboxed agent calls. The CLI is the device's complete interface; there is no
HTTP-API tool (the agent does everything through `hardwareone_cli`). Each shells out (via `spawn`, never a shell) to the
host-side `hw1.sh` wrapper, which talks to the ESP32. The sandbox itself gains no network.

Camera captures are passed to OpenClaw's configured image-understanding runtime inside the
gateway. The tool returns the resulting textual description plus the original image content
block, so the agent can answer even when its model transport does not forward tool-result images.

## Files

| File | Purpose |
|------|---------|
| `openclaw.plugin.json` | Plugin manifest — must include `contracts.tools` or it's filtered out at discovery. |
| `index.js` | Entry: imports `definePluginEntry` from the OpenClaw core and registers the tools. |
| `hardwareone-tool.js` | The tool definitions + subprocess plumbing + input validation. |
| `deploy.sh` | Installs/restores the plugin and restarts the gateway. |

## Deploy / restore

Run `./deploy.sh` on the OpenClaw host. It installs the plugin through OpenClaw's
managed local-plugin workflow, wires the tool allowlists in
`~/.openclaw/openclaw.json`, and restarts the gateway.

The managed install is separate from the global OpenClaw npm package, so core upgrades
no longer wipe it. Re-run `deploy.sh` whenever the HardwareOne plugin changes.

## Security boundary

- **Input:** each tool validates length (≤ 512 chars), rejects control characters, and restricts device names to a safe charset.
- **Process:** `spawn` with an argv array — never a shell, no `sh -c`. Command arguments can't be shell-interpreted on the host.
- **Runtime:** per-call timeout; stdout capped at 64 KB, stderr at 4 KB.
- **Credentials:** live only in the host-side environment/registry outside the skill directory; they never enter the sandbox.

## Gotchas

- **Plugin SDK** — `index.js` imports the public `openclaw/plugin-sdk/plugin-entry` entry point; no per-release hash rewrite is needed.
- **Tool allowlist** — the tool names must appear in both `tools.alsoAllow` and `tools.sandbox.tools.alsoAllow` for the sandboxed agent to call them.
