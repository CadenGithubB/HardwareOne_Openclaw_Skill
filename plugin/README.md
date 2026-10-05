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
| `hardwareone-tool.test.js` | Unit tests (`node --test`) that drive the tools against a fake `hw1.sh`. |
| `deploy.sh` | Installs/restores the plugin and restarts the gateway. |

## Deploy / restore

Run `./deploy.sh` on the OpenClaw host. It installs the plugin through OpenClaw's
managed local-plugin workflow, wires the tool allowlists in
`~/.openclaw/openclaw.json`, and restarts the gateway.

The managed install is separate from the global OpenClaw npm package, so core upgrades
no longer wipe it. Re-run `deploy.sh` whenever the HardwareOne plugin changes.

## Device transport policy

- Explicit `https://` and `http://` URLs are pinned to that scheme.
- A bare host uses HTTPS. It may try HTTP after an HTTPS connection refusal only when
  the selected device explicitly sets `allowHttp: true` (or `HW1_ALLOW_HTTP=1` for the
  legacy single-device configuration). `defaults.allowHttp` is ignored so adding a
  future device cannot silently inherit plaintext permission.
- A certificate failure, timeout, redirect, or unrecognized ping response never causes
  an HTTP downgrade.
- `cacert` / `HW1_CACERT` is the preferred self-signed TLS trust path. The device
  certificate must chain to that PEM and validate the URL hostname/IP. `allowSelfSigned: true` /
  `HW1_ALLOW_SELF_SIGNED=1` disables verification and is for a trusted, isolated LAN.
  Neither TLS option permits HTTP.
- A `"via": "mesh"` device has no HTTP of its own. The gateway relays its commands by
  running `espnowremote` on the direct master and polling the async reply. Since firmware
  v0.99.9 a device executes only session-encrypted ESP-NOW command frames from paired
  peers, so the relay works only when the mesh device is securely paired with that master
  (consent pairing or `espnowpairsecure`); otherwise the master's own rejection text is
  returned. `user:pass:cmd` must fit the master's 217-byte `espnowremote` payload (over
  one frame's 202 plaintext bytes it goes out as an encrypted multi-fragment message), so
  the plugin refuses a longer mesh command up front, naming the limit and the command's
  own length only.

## Wrapper exit codes

`hw1.sh` reports the outcome of a call in its exit code; the plugin maps each one:

| Exit | Meaning | What the tool returns |
|------|---------|-----------------------|
| `0` | OK; stdout is the device response. | The body verbatim. |
| `1` | Transport or configuration error: a malformed `HW1_URL` (never a failover), login failure, a curl error after login, an unexpected HTTP status on a command. | `[exit 1] ` + body (stderr if stdout is empty). A CLI command is never re-run on the backup on this code: the master was already verified and may be executing it. Only the read-only ping fails over on the wrapper's transport-error wording. |
| `3` | The device executed the request and **rejected the command** (HTTP 400/403: unknown command, bad usage, insufficient role). stdout is the device's own diagnostic. | The body verbatim, **no** `[exit N]` prefix, so `Unknown command`, `Usage: ...` and `Error: Admin access required` reach the agent exactly as the device wrote them. `details.rejected` is `true`. |
| `7` | Device unreachable: the pre-login probe got no connection, or what answered was not a HardwareOne ping (redirect, non-200, foreign body). Nothing was sent. | Failover to the `backup` device when the implicit default (the master) was targeted; otherwise `[exit 7] ` + the wrapper's message. |

Exit `3` is never read as "unreachable": the mesh relay returns the master's rejection text
as a dispatch failure (not an offline verdict), and a `probe: true` device listing reports
such a device as `online`.

## Security boundary

- **Input:** `hardwareone_cli` accepts at most 2047 characters (the firmware's `CMD_INPUT_MAX`; the device rejects longer input whole rather than truncating it), accepts printable ASCII only (control characters and non-ASCII are refused), caps a mesh-relayed command at the master's 217-byte relay payload, and restricts device names to a safe charset.
- **Process:** `spawn` with an argv array — never a shell, no `sh -c`. Command arguments can't be shell-interpreted on the host.
- **Runtime:** per-call timeout of the device's `timeout` / `HW1_TIMEOUT` (default 30 s; the same cap the wrapper gives curl for the probe, a login and every ordinary request), raised for the wrapper's slow-command list (`llmgenerate`, `llmload`, `llmask`, `opencamera`, `certgen`, `c6update`, `otastage`, `otaupdate`, `stt`; matched on the first word, case-insensitively) to the device's `timeoutLong` / `HW1_TIMEOUT_LONG` (default 300 s) plus that per-request cap as grace for the probe and a re-login. A call that outlives its timeout is killed and answered `Error: hardwareone timeout after <N>ms`, with no `[exit N]` prefix; `details.timeoutMs` reports the cap a completed call ran under. stdout is capped at 64 KB, stderr at 4 KB.
- **Credentials:** live only in the host-side environment/registry outside the skill directory; they never enter the sandbox.

## Tests

```sh
cd plugin && node --test hardwareone-tool.test.js
```

The tests point `HW1_SCRIPT` at a throwaway fake wrapper, so they need no device and no
network. Also run `node --check hardwareone-tool.js` after editing the tool file.

## Gotchas

- **Plugin SDK** — `index.js` imports the public `openclaw/plugin-sdk/plugin-entry` entry point; no per-release hash rewrite is needed.
- **Tool allowlist** — the tool names must appear in both `tools.alsoAllow` and `tools.sandbox.tools.alsoAllow` for the sandboxed agent to call them.
- **Confirmation prompts** — `/api/cli` is a machine transport for the wrapper (it never posts `interactive=1`), so a command that would open a yes/no prompt cannot be answered through the gateway. Use the inline `confirm` word the firmware offers (e.g. `otaupdate confirm`).
