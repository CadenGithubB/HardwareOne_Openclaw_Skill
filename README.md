# HardwareOne — OpenClaw integration

**Version 1.7.0**

Lets an [OpenClaw](https://github.com/openclaw/openclaw) agent monitor and control a
[HardwareOne](https://github.com/CadenGithubB/hardwareone-idf) ESP32 device.

The OpenClaw agent runs in a sandbox with **no network**, so it can't reach the device
directly. Instead this ships in two cooperating halves:

```
Agent (sandbox, no network) ──tool call──▶ Gateway plugin (host) ──spawn──▶ hw1.sh ──HTTP(S)──▶ ESP32
```

- **Plugin** (`plugin/`) — registers four tools on the OpenClaw gateway:
  `hardwareone_ping`, `hardwareone_cli`, `hardwareone_devices`, `hardwareone_camera`. The CLI is the device's
  complete interface — there is no HTTP-API tool.
- **Skill** (`SKILL.md`, `references/`) — tells the agent how to use those tools and
  which commands exist.
- **Wrapper** (`scripts/hw1.sh`) — what the plugin shells out to on the host; handles
  auth, timeouts, and TLS, and talks to the device over HTTP(S).

The command and settings references are **generated from the firmware** by
`tools/sync_command_reference.py`, so they stay accurate as the firmware evolves.

## What it looks like

A user can ask, “Create a daily device-status automation for 7 AM.” The agent then:

1. Reads the firmware-synced catalog and the target device's live feature state.
2. Runs the exact current `automation add ...` form through `hardwareone_cli`.
3. Confirms the stored schedule with `automation list` instead of assuming that an
   accepted command completed correctly.

The same pattern applies to sensor readings, settings, mesh peers, health capture, and
wearable controls: discover the registered command, execute it through the gateway, and
verify the subsystem-specific result.

## Layout

| Path | What |
|------|------|
| `SKILL.md` | The agent-facing skill (tool usage, workflow, error recovery). |
| `references/api-reference.md` | Curated operating guide: dispatch, roles, state layers, async results, and current subsystem workflows. |
| `references/cli-commands.generated.md` | Exhaustive command catalog (generated from firmware). |
| `references/settings.generated.md` | Every configurable setting (generated from firmware). |
| `scripts/hw1.sh` | Host-side HTTP wrapper the plugin calls. |
| `tools/sync_command_reference.py` | Regenerates the catalogs from firmware (`--audit`, `--check`). |
| `plugin/` | The gateway plugin (the four tools) + `deploy.sh`. |
| `deploy/` | Repository/bundle installer and host deployment instructions. |
| `docs/openclaw-patches/` | Carefully gated OpenClaw core workarounds, kept separate from the HardwareOne integration. |
| `.env.template` | Device URL + credentials template (host-side; never enters the sandbox). |
| `hardwareone.devices.json.template` | Multi-device registry template (host-side; may contain credentials after copying, so the live file is ignored). |

## Deploy (on the OpenClaw host)

1. **Skill** — copy the skill into your OpenClaw **skills directory** (and into the
   read-only sandbox mirror, if your setup uses one). The path below is the default —
   `~` expands to whoever runs OpenClaw, so it isn't tied to one machine; change it if
   your install keeps skills elsewhere:
   ```bash
   rsync -a --exclude='.env' SKILL.md references scripts ~/.openclaw/workspace/skills/hardwareone/
   ```
2. **Credentials** — create a **host-only** credentials file *outside* the skill directory and
   fill in **all three** values. Keep it outside the skill dir (`~/.openclaw/hardwareone.env`) —
   OpenClaw mirrors the skill directory into the agent sandbox, so credentials kept inside it
   would be readable by the agent:
   ```bash
   cp .env.template ~/.openclaw/hardwareone.env && chmod 600 ~/.openclaw/hardwareone.env
   ```
   Edit it so each line has your device's value:
   ```
   HW1_URL=192.0.2.50            # documentation IP; replace with the device's address
   HW1_USER=admin                # device login username
   HW1_PASS=your-password        # device login password
   ```
   All three are required — without them the wrapper exits with a "must be set" error.
   (`hw1.sh` also honors `$HW1_ENV` or a legacy skill-local `.env`, but the host-only path is preferred.)
3. **Plugin** — deploy, wire, and restart the gateway in one step:
   ```bash
   bash plugin/deploy.sh
   ```
   It installs the plugin through OpenClaw's managed local-plugin workflow, ensures the
   tool allowlists in `openclaw.json`, and restarts the gateway. The plugin lives outside
   the global npm package, so OpenClaw core upgrades no longer wipe it out. Re-run the
   deploy script whenever this plugin itself changes.
4. **Verify**:
   ```bash
   openclaw plugins list | grep hardwareone     # the plugin should be enabled
   ```
   Then, in a fresh agent session: *"ping the hardwareone."*

## Keeping the reference in sync with firmware

```bash
python3 tools/sync_command_reference.py            # regenerate the catalogs
python3 tools/sync_command_reference.py --audit    # report metadata gaps
python3 tools/sync_command_reference.py --check    # CI: exit 1 if the catalogs are stale
python3 ../hardwareone-idf/tools/command_registry.py audit  # firmware registry drift
```

Point it at your firmware checkout with `--firmware <path>` or `$HW1_FIRMWARE`
(default `../hardwareone-idf`). The generated header records the clean firmware
revision, or a content-hashed `+dirty` source snapshot when scanned source files are
uncommitted. See [tools/README.md](tools/README.md).

## Configuration (`.env`)

| Var | Meaning |
|-----|---------|
| `HW1_URL` | Device address. A bare IP/host (`192.0.2.42` in examples) auto-detects http vs https; a full URL pins the scheme. |
| `HW1_USER` / `HW1_PASS` | Device credentials. |
| `HW1_INSECURE=1` or `HW1_CACERT=<path>` | Accept / pin a self-signed HTTPS cert (optional). |
| `HW1_TIMEOUT`, `HW1_CONNECT_TIMEOUT`, `HW1_TIMEOUT_LONG` | curl timeouts in seconds (optional). |

Credentials live only on the host and are never mounted into the sandbox.

## Security model

- The agent's sandbox has **no network** (`NetworkMode: none`); the gateway tools
  are the only path to the device — the same pattern OpenClaw uses for web search.
- Tool inputs are length-capped and validated — control characters rejected, device names restricted to a safe charset.
- The plugin `spawn`s the wrapper with an argv array — **never a shell** — so command
  arguments can't be shell-interpreted on the host.
- Device credentials stay host-side; nothing privileged crosses the sandbox boundary.

## Credits

- Firmware: [HardwareOne](https://github.com/CadenGithubB/hardwareone-idf) ESP32 platform.
- Runs as an [OpenClaw](https://github.com/openclaw/openclaw) skill + gateway plugin.

## License

MIT — see [LICENSE](LICENSE).
