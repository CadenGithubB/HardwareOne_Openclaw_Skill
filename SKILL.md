---
name: hardwareone
description: Interface with the HardwareOne ESP32 device via three dedicated gateway tools. The tools are the only supported way to reach the device from this sandbox.
triggers:
  - hardwareone
  - hardware one
  - hw1
  - esp32
  - sensor data
  - device status
  - espnow
  - mesh network
---

# HardwareOne

An ESP32-based IoT device with hundreds of CLI commands across 40+ modules (I2C sensors, camera, microphone, ESP-NOW mesh, MQTT, automations, speech recognition, on-device LLM, and more). You reach it through three dedicated tools that the OpenClaw gateway runs on your behalf. You do **not** have direct network access — the tools are the *only* supported path to the device.

## Available tools

| Tool | Parameters | What it does |
| ---- | ---------- | ------------ |
| `hardwareone_ping` | _(none)_ | Health-check the device. Returns hostname, MAC, firmware version. |
| `hardwareone_cli`  | `{ "command": "<cmd>" }` | Run a device CLI command — e.g. `{"command": "thermalread"}`. |
| `hardwareone_get`  | `{ "path": "/api/..." }` | HTTP GET an API endpoint. Path must start with `/api/`. |

**Do not** attempt `curl`, `wget`, `python`, `node`, `/dev/tcp`, or to execute `hw1.sh` yourself — you have no network and all of those fail. Do not read or edit `scripts/`; those files run host-side and are not used by you.

**Argument limits:** arguments may use any normal printable text — including `=`, `;`, `@`, `{ }`, `"` (needed for automations, passwords, and JSON). Only control characters (newline/tab) are rejected; output is capped at ~64 KB per call.

## Workflow

### 1. Find the right command — search the catalog; never web-search

`references/cli-commands.generated.md` is the **complete, authoritative** list of every command (with its admin flag, argument syntax, feature gate, and — for config commands — value type/range/default). Settings and their commands are in `references/settings.generated.md`.

When you need a command — or one didn't do what you expected — work in this order:

1. **Search the catalog by keyword.** Map the task to a word and look it up: peer metadata → search `meta` (you'll find `espnowrequestmeta`); a sensor → its name; a setting → its area. The command you need is almost always already there.
2. **Ask the device.** Run `help` or `help <module>` (e.g. `help espnow`) via `hardwareone_cli` to list that module's commands, and read the `Usage:` line the device prints when a command is called with wrong arguments.
3. Then pass the exact command name to `hardwareone_cli`.

**Never web-search** for HardwareOne commands, errors, or behavior — this is a private device with no public documentation, so a web search returns nothing useful and only wastes turns. The catalog and the device's own `help`/`Usage:` output are the only sources of truth. If a command isn't in the catalog, it does not exist — don't invent or guess one.

### Argument conventions

- Most commands take positional args — `<command> <arg> [arg]` — and the catalog's usage line shows the exact form.
- Some commands take **key=value** pairs, automations especially: `automationadd name=morning type=atTime time=07:00 command=status`. Chain multiple commands in one value with `;` (`commands=cmd1;cmd2`).
- To change a **setting**, run its command with the new value, then persist: `ledbrightness 80`, then `savesettings`. The settings catalog lists each setting's command, type, range, and options.

### 2. Check features first on an unfamiliar device
Run `hardwareone_cli` with `command: "features"`. Each feature is marked:

- `[ON]` — active, its commands work
- `[OFF]` — compiled but disabled; toggleable with admin rights
- `[N/C]` — **not compiled**; its commands do not exist. Don't attempt them.

### 3. Always-available commands (no feature flag required)

`status`, `uptime`, `time`, `temperature`, `voltage`, `memsample`, `memreport`, `taskstats`, `fsusage`, `help`, `features`, `ledcolor`, `ledeffect`.

### 4. Sensor pattern

Most sensors use Enable → Read → Disable (only when `[ON]` or `[OFF]`):

1. `open<sensor>` — e.g. `openthermal`
2. `<sensor>read` — e.g. `thermalread`
3. `close<sensor>` — e.g. `closethermal`

### 5. Multi-device / ESP-NOW mesh

- Check topology with `hardwareone_cli`, command `bondstatus`.
- Remote sensor readings: `hardwareone_get`, path `/api/sensors/remote`.
- **Peer commands are asynchronous.** `espnowremote`, `espnowfetch`, and `espnowbrowse` return `OK` when the request is *delivered* — never the result inline. Read the actual output from the message buffer: `espnowmessages json [<peer-mac>]`. Don't hunt for it in the HTTP API or in files.
- **Moving files between devices:**
  - `espnowsendfile <peer> "<path>"` — push a local file TO a peer.
  - `espnowfetch <peer> <user> <pass> "<path>"` — pull a peer's file to local storage (auto-renamed on a name clash, e.g. `battery.csv.1`).
  - To make a peer send *its own* file to you, run sendfile **on the peer** via remote exec: `espnowremote <peer> <user> <pass> espnowsendfile <your-name-or-mac> "/battery.csv"` (get your own name/MAC from `espnowstatus`).

### Common recipes

- **Read a sensor:** `openthermal` → `thermalread` → `closethermal`.
- **Change & save a setting:** `ledbrightness 80`, then `savesettings`.
- **Daily automation:** `automationadd name=morning type=atTime time=07:00 command=status` (time is device-local; set `tzoffsetminutes` first if needed).
- **Get structured data:** `hardwareone_get` with `/api/sensors` returns JSON instead of CLI text.

## Error recovery

| Response | Action |
| -------- | ------ |
| `"Unknown command"` | Do NOT guess and do NOT web-search. Search `references/cli-commands.generated.md` by keyword, or run `help <module>` on the device. |
| `"Error: Not initialized"` / `"Not started"` | Call the matching `open<sensor>` first. |
| `"Usage: ..."` / `"Detailed usage: ..."` | The device is showing you the correct syntax — read it and retry with the right arguments. |
| Exit code 0 but no output | Report to the user; do not fabricate content. |
| `"must be printable text"` | Your argument contained a control character (newline/tab) — remove it and retry. |
| 401 / 403 | Auth or permissions issue; report to the user. |

## Reference files you can read

- `references/cli-commands.generated.md` — **exhaustive** command catalog (firmware-generated). The authoritative list; read before guessing.
- `references/settings.generated.md` — every configurable setting, grouped by area, with the command that reads/writes it.
- `references/api-reference.md` — curated guide: HTTP API endpoints, the feature `[ON]/[OFF]/[N/C]` model, error handling, and common commands in more depth.

## What you cannot read or use from this sandbox

- `scripts/hw1.sh` — host-side wrapper; not reachable or usable from the sandbox.
- `.env` — credentials are handled entirely on the gateway side.
