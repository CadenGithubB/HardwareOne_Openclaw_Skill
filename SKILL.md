---
name: hardwareone
description: Interface with one or more HardwareOne ESP32 devices via dedicated gateway tools. The tools are the only supported way to reach the devices from this sandbox.
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

An ESP32-based IoT device with hundreds of CLI commands across 40+ modules (I2C sensors, camera, microphone, ESP-NOW mesh, MQTT, automations, speech recognition, on-device LLM, and more). You reach it through dedicated tools that the OpenClaw gateway runs on your behalf. You do **not** have direct network access — the tools are the *only* supported path to the device. There may be **one or more** devices (see *Multiple devices* below).

## Available tools

| Tool | Parameters | What it does |
| ---- | ---------- | ------------ |
| `hardwareone_ping` | `{ "device"?: "<name>" }` | Health-check a device (the default master, or the named one). Returns hostname, MAC, firmware version. |
| `hardwareone_cli`  | `{ "command": "<cmd>", "device"?: "<name>" }` | Run a device CLI command — e.g. `{"command": "thermalread"}`. |
| `hardwareone_get`  | `{ "path": "/api/...", "device"?: "<name>" }` | HTTP GET an API endpoint. Path must start with `/api/`. |
| `hardwareone_devices` | `{ "probe"?: true }` | List configured devices (names + roles). `probe` also reports which are online. |

**Do not** attempt `curl`, `wget`, `python`, `node`, `/dev/tcp`, or to execute `hw1.sh` yourself — you have no network and all of those fail. Do not read or edit `scripts/`; those files run host-side and are not used by you.

**Argument limits:** arguments may use any normal printable text — including `=`, `;`, `@`, `{ }`, `"` (needed for automations, passwords, and JSON). Only control characters (newline/tab) are rejected; output is capped at ~64 KB per call.

## Multiple devices

There may be one or more HardwareOne devices. Use `hardwareone_devices` to see them (names + roles); **more than one means multi-device mode.**

- **Targeting.** Commands with no `device` hit the **master** (the default). Target a specific one by passing `device: "<name>"` to `hardwareone_cli` / `hardwareone_get` / `hardwareone_ping`. You never see or need IPs or credentials — only names.
- **Roles.** `master` = the default and the mesh relay; `backup` = takes over automatically if the master is unreachable; the rest are `worker`s. The role from `hardwareone_devices` is the configured hint — the device's *live* mesh role is `espnowmeshrole` / `espnowmeshstatus`; if they disagree, note the drift.
- **Capabilities differ per device.** Run `features` on each device you use — don't assume one device's catalog applies to another (different sensors, different firmware).
- **What each device *is* lives in your memory, not here.** At session start, find your topology note with `note_search hardwareone` (locations, roles, sensors, which peers are mesh-only); read it, and update it — durable facts only, no IPs or live status — when devices change.
- **Mesh-only devices** show up in `hardwareone_devices` with `access: "mesh"` — no direct connection. Reach them through the **master** over the **ESP-NOW system**: run the command on the master via `hardwareone_cli`, results are async via `espnowmessages`. **Pick the right `espnow*` command for the task** — `espnowrequestmeta` for a peer's metadata, `espnowremote` to run a CLI command on it, `espnowfetch`/`espnowsendfile` for files. **Don't assume it's always `espnowremote`** — if unsure, run `help espnow` on the master or search the catalog for `espnow`.

## Workflow

### 1. Find the right command — search the catalog; never web-search

`references/cli-commands.generated.md` is the **complete, authoritative** list of every command (with its admin flag, argument syntax, feature gate, and — for config commands — value type/range/default). Settings and their commands are in `references/settings.generated.md`.

When you need a command — or one didn't do what you expected — work in this order:

1. **Search the catalog by keyword.** Map the task to a word and look it up: peer metadata → search `meta` (you'll find `espnowrequestmeta`); a sensor → its name; a setting → its area. The command you need is almost always already there.
2. **Ask the device.** Run `help` or `help <module>` (e.g. `help espnow`) via `hardwareone_cli` to list that module's commands, and read the `Usage:` line the device prints when a command is called with wrong arguments.
3. Then pass the exact command name to `hardwareone_cli`.

**Never web-search** for HardwareOne commands, errors, or behavior — this is a private device with no public documentation, so a web search returns nothing useful and only wastes turns. The catalog and the device's own `help`/`Usage:` output are the only sources of truth. If a command isn't in the catalog, it does not exist — don't invent or guess one.

**When something fails, do NOT guess again — go to `help`.** If a command errors, returns the wrong thing, or you're unsure what to run next, do **not** fire off another command or `/api/...` path at random. Stop, run `help <module>` on the device (or re-search the catalog), find the *right* command, then retry. Two failed or off-target attempts in a row means you're guessing — switch to `help`; a third guess just wastes turns.

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

### 5. ESP-NOW mesh — talking to peers

- Check topology with `hardwareone_cli`, command `bondstatus`.
- Remote sensor readings: `hardwareone_get`, path `/api/sensors/remote`.
- **Many peer commands are asynchronous** — they return `OK` on *delivery*; the real result arrives later, and **the retriever depends on the command** (each command's catalog/`help` line now names it — read that, don't assume):
  - `espnowremote` / `espnowfetch` / `espnowbrowse` / `espnowroomcmd` / `espnowtagcmd` → the message buffer: `espnowmessages json [<peer-mac>]`.
  - `espnowrequestmeta <peer>` → updates the **device cache**; read the peer's name/room/zone/tags with **`espnowdevices`** (NOT `espnowmessages` — that's the mistake to avoid). `espnowlist` is just names/MACs, not metadata.
  - `espnowmeshtopo` → `espnowtoporesults`; bonding `*request*` commands → `bondshowremotemanifest` / the `/api/bond/*` endpoints.
- **Some sends are fire-and-forget** (`espnowsend`, `espnowbroadcast`, `espnowsessionsend`, `espnowtimesync`, `imagesend`): delivery only — **no reply comes back, so don't wait for one.**
- In every case the result is **not** at a guessed `/api/...` path — check the command's catalog note for where it actually lands.
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
| 401 / 403 / "authentication failed" | Credentials are **host-side and invisible to you** — you can't see or change them. Do NOT read `.env`, search the filesystem, or retry (repeated logins **lock the device**). Stop and report the auth failure to the user. |

## Reference files you can read

- `references/cli-commands.generated.md` — **exhaustive** command catalog (firmware-generated). The authoritative list; read before guessing.
- `references/settings.generated.md` — every configurable setting, grouped by area, with the command that reads/writes it.
- `references/api-reference.md` — curated guide: HTTP API endpoints, the feature `[ON]/[OFF]/[N/C]` model, error handling, and common commands in more depth.

## What you cannot read or use from this sandbox

- `scripts/hw1.sh` — host-side wrapper; not reachable or usable from the sandbox.
- Credentials and the device registry (`.env`, `hardwareone.devices.json`) — **entirely host-side; you can never see or change them.** So a `401` / "authentication failed" means the *host-side* credentials are wrong: it is **not** something you can fix by reading files, searching the filesystem, or retrying. Report it and stop — repeated logins lock the device.
