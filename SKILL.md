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

An ESP32-based IoT device with nearly 900 unique CLI commands across 44 modules (I2C sensors, camera, microphone, ESP-NOW mesh, MQTT, automations, notifications, health capture, G2/R1 wearables, speech recognition, on-device LLM, and more). You reach it through dedicated tools that the OpenClaw gateway runs on your behalf. You do **not** have direct network access — the tools are the *only* supported path to the device. There may be **one or more** devices (see *Multiple devices* below).

## Available tools

| Tool | Parameters | What it does |
| ---- | ---------- | ------------ |
| `hardwareone_ping` | `{ "device"?: "<name>" }` | Health-check a device (the default device, or the named one). Returns hostname, MAC, firmware version. |
| `hardwareone_cli`  | `{ "command": "<cmd>", "device"?: "<name>" }` | Run a device CLI command — e.g. `{"command": "thermalread"}`. This is how you do everything. |
| `hardwareone_devices` | `{ "probe"?: true }` | List configured devices (names + roles). `probe` also reports which are online. |
| `hardwareone_camera` | `{ "device"?: "<name>", "ensureOn"?: true, "describe"?: true }` | **Take a photo** with a `direct` device's camera, describe that exact frame with OpenClaw's configured image model, and also return the image for display. Direct HTTP/S devices only — not mesh peers. |

**Do not** attempt `curl`, `wget`, `python`, `node`, `/dev/tcp`, or to execute `hw1.sh` yourself — you have no network and all of those fail. Do not read or edit `scripts/`; those files run host-side and are not used by you.

**Argument limits:** arguments may use any normal printable text — including `=`, `;`, `@`, `{ }`, `"` (needed for automations, passwords, and JSON). Only control characters (newline/tab) are rejected; output is capped at ~64 KB per call.

**The CLI is the device's entire interface.** Every capability — status, sensors, configuration, files, mesh, bonding — is a CLI command you run with `hardwareone_cli`. There is **no HTTP API for you to call** and no `/api/...` paths to fetch: the command registry is the single, complete, self-describing surface that backs every transport, and any web API is a narrower, staler subset of it. If you don't know the command, **find it** — search the catalog or run `help` — never reach for a web endpoint.

## Multiple devices

There may be one or more HardwareOne devices. Use `hardwareone_devices` to see them (names, roles, and any operator `description`); **more than one means multi-device mode.**

- **Targeting.** A command with no `device` goes to the **default** device. When `hardwareone_devices` shows more than one `direct` device, they are **co-equal control targets** — name the one you mean with `device: "<name>"`, and for an ambiguous request ("restart it", "read the temperature") ask which device or act on each, rather than assuming the default. (If no `default` is configured, the gateway picks a deterministic one for un-targeted commands — the first `master` by name, or the first direct device if none is a master — and, when more than one candidate exists, flags the pick in the `notes` field. Treat the `default` that `hardwareone_devices` reports as authoritative, not as "the primary".) You never see or need IPs or credentials — only names.
- **Roles.** `master` = a direct HTTP entry point and the default for un-targeted commands — you can configure **several co-equal `master`s**, each fully controllable by name (`worker` does **not** mean less-capable); `backup` = a direct device that takes over automatically if the default master is unreachable; mesh peers are reached *through* the master. These roles are configuration hints — a device's *live* mesh role is `espnowmeshrole` / `espnowmeshstatus`; if they disagree, note the drift.
- **Capabilities differ per device.** Run `features` on each device you use — don't assume one device's catalog applies to another (different sensors, different firmware). `hardwareone_devices` may also carry an operator-written **`description`** of a device's hardware/software setup (which build, which sensors are attached, quirks) — read it before choosing a device or command. It complements `features`; it doesn't replace running `features` on an unfamiliar device.
- **What each device *is* lives in your memory, not here.** At session start, find your topology note with `note_search hardwareone` (locations, roles, sensors, which peers are mesh-only); read it, and update it — durable facts only, no IPs or live status — when devices change.
- **Mesh devices** show up in `hardwareone_devices` with `access: "mesh"`. Address them **by name, exactly like a direct device** — `hardwareone_cli` with `device: "<name>"` — and the gateway relays the command through the master for you (it injects the peer's credentials host-side, runs `espnowremote`, and waits for the reply). The relay is **async**, so it may take a few seconds and reports cleanly if the peer is offline. You do **not** run `espnowremote` yourself for ordinary commands. The `espnow*` commands stay available for genuinely mesh-specific tasks — topology (`espnowmeshtopo`), peer metadata (`espnowrequestmeta`), file transfer (`espnowfetch`/`espnowsendfile`).

## Seeing the camera (direct devices only)

`hardwareone_camera` captures a photo, runs OpenClaw's configured image model against that exact frame, and returns both the textual visual description and the image block. Use it whenever the user asks what a device sees (read a sign, check a door, count people, inspect a scene). Pass `device` to choose one (omit for the default). It **only works on `direct` HTTP/S devices**, not `access:mesh` peers. It starts the camera automatically if needed (`ensureOn`, default true). Leave `describe` at its default `true` when answering a visual question; set it false only when the user wants the raw capture without analysis.

Answer from the tool's **automatic visual description**. Do not call the separate `image` tool, invent or search for a camera file path, or retry through `cameracapture`, SD-card files, `fileview`, base64, `exec`, or another CLI command. The Control UI can render an image content block even when the active model transport cannot consume that same tool-result image; the built-in description avoids depending on that unreliable handoff. If automatic description fails, report that exact failure without guessing what the scene contains.

## Workflow

### 1. Find the right command — search the catalog; never web-search

**A command that LISTS is not a command that READS.** `sensors`, `sensorinfo`, `devices`, `discover`, `features`, `i2cscan` — and any "list/show/detect" command — only tell you what hardware *exists*; they can **never** return a live value, whatever flags, filters, or addresses you add. To READ a value, run that thing's **read** command:
- battery charge / voltage → **`batterystatus`** (one word; **not** `sensors`, and **not** `voltage` — `voltage` is a power-draw estimate, not the battery)
- ESP32 chip temperature → **`temperature`**
- any I2C sensor (thermal, IMU, ToF, GPS, …) → **`open<sensor>` then `<sensor>read`** (e.g. `openthermal` → `thermalread`)

If a command gave you a list when you wanted a value, running it again with different arguments will never help — you ran the wrong *kind* of command. Find the read command.

`references/cli-commands.generated.md` is the **complete, authoritative** list of every command (with its admin/super-admin flag, argument syntax, feature gate, and — for config commands — value type/range/default). Settings and their commands are in `references/settings.generated.md`.

When you need a command — or one didn't do what you expected — work in this order:

1. **Search the catalog by keyword.** Map the task to a word and look it up: peer metadata → search `meta` (you'll find `espnowrequestmeta`); a sensor → its name; a setting → its area. The command you need is almost always already there.
2. **Ask the device.** Run `help` or `help <module>` (e.g. `help espnow`) via `hardwareone_cli` to list that module's commands, and read the `Usage:` line the device prints when a command is called with wrong arguments. Top-level `help` lists **modules** (categories like `battery`, `system`, `power`), not necessarily runnable commands. Lookup is **case-insensitive and longest-prefix**: some capabilities are single words (`batterystatus`, not `battery status`), while registered dispatchers intentionally take subcommands (`automation list`, `power mode`, `sensorlog interval`). Use the exact catalog/help form; never mechanically convert between styles. `help all` includes disconnected sensor modules.
3. Then pass the exact command name to `hardwareone_cli`.

**Never web-search** for HardwareOne commands, errors, or behavior — this is a private device with no public documentation, so a web search returns nothing useful and only wastes turns. The catalog and the device's own `help`/`Usage:` output are the only sources of truth. If a command isn't in the catalog, it does not exist — don't invent or guess one.

**When something fails, do NOT guess again — go to `help`.** If a command errors, returns the wrong thing, or you're unsure what to run next, do **not** fire off another command or `/api/...` path at random. Stop, run `help <module>` on the device (or re-search the catalog), find the *right* command, then retry. Two failed or off-target attempts in a row means you're guessing — switch to `help`; a third guess just wastes turns. **Never** fall back to fetching an `/api/...` path — there is no API surface for you; the answer is always another CLI command.

**A clean exit / `OK` is NOT the same as getting your answer.** Re-running the **same base command** with different flags, filters, or arguments — `sensors`, then `sensors <filter>`, then `sensors <flag>` — is guessing *even when every call succeeds*. If a command keeps returning a list (or anything other than the value you asked for), that's a dead end, not progress: after the **second** call to the same base command, STOP and find the *right* command (re-search the catalog or run `help <module>`).

### Argument conventions

- Most commands take positional args — `<command> <arg> [arg]` — and the catalog's usage line shows the exact form.
- Some commands take **key=value** pairs, automations especially: `automationadd name=morning type=atTime time=07:00 command=status`. Chain multiple commands in one value with `;` (`commands=cmd1;cmd2`).
- To change a **setting**, run its cataloged command with the new value. Ordinary setting commands persist immediately. For a multi-setting batch with one flash write, run `beginwrite`, make all changes, then `savesettings`. A setting command can be a dispatcher form such as `power mode`. The settings catalog lists type, range, options, secret/read-only state, and command.

### 2. Check features and state on an unfamiliar device
With an admin-capable configured account, run `hardwareone_cli` with `command: "features"`. Each feature is marked:

- `[ON]` — active, its commands work
- `[OFF]` — compiled but disabled; toggleable with admin rights
- `[N/C]` — **not compiled**; its commands do not exist. Don't attempt them.

Do not confuse this with runtime state. Current firmware separates the compile gate, a persisted `<thing>enabled` admission setting, a persisted `<thing>autostart` boot setting, and whether the subsystem is running now. An enabled subsystem can be stopped; autostart does not start it immediately. Use its `status` plus the settings catalog. `ramflush` restores the current live set for one reboot without changing normal autostart.

### 3. Core commands (subject to the configured account's role)

Common core commands include `status`, `uptime`, `time`, `temperature`, `voltage`, `memsample`, `memreport`, `taskstats`, `fsusage`, and `help`. `features` is admin-gated in current firmware. A `guest` account may run only `login` / `logout`; `user`, `admin`, and `superadmin` progressively unlock the catalog entries marked for those roles.

### 4. Sensor pattern

Most sensors use Enable → Read → Disable (only when `[ON]` or `[OFF]`):

1. `open<sensor>` — e.g. `openthermal`
2. `<sensor>read` — e.g. `thermalread`
3. `close<sensor>` — e.g. `closethermal`

### 5. ESP-NOW mesh — talking to peers

To just **run a command on a mesh device, target it by name** (see *Mesh devices* above) — the gateway relays it for you. The commands here are the underlying ESP-NOW mechanics, for mesh-specific operations: health, topology, identity/metadata, file transfer, and room/tag broadcasts.

- **Mesh health & peers:** `espnowmeshstatus` (heartbeats/ACKs), `espnowlist` (paired peers), `espnowdevices` (all mesh devices, master). Full topology is `espnowmeshtopo` (async — see below).
- **Encrypted peers.** The consent workflow is: a super-admin sets the same `espnowsetpassphrase <mesh> <phrase>` on both devices; open `espnowpairmode` on both; inspect `espnowdiscovered`; run `espnowpairrequest <peer>`; then `espnowaccept [peer]` (or `espnowreject`) on the target. Confirm with `espnowencstatus` / `espnowsessions`. `espnowpairsecure <mac> <name> [mesh]` remains the explicit local-pair + asynchronous key-exchange form. Plain `espnowpair` is unencrypted and performs no remote handshake. **Bonding (below) requires a secure session.**
- Remote (bonded-worker) sensor readings land on the master — read them with `espnowsensorstatus`.
- **Many peer commands are asynchronous** — they return `OK` on *delivery*; the real result arrives later, and **the retriever depends on the command** (each command's catalog/`help` line now names it — read that, don't assume):
  - `espnowremote` / `espnowfetch` / `espnowbrowse` / `espnowroomcmd` / `espnowtagcmd` → the message buffer: `espnowmessages json [<peer-mac>]`.
  - `espnowrequestmeta <peer>` → updates the **device cache**; read the peer's name/room/zone/tags with **`espnowdevices`** (NOT `espnowmessages` — that's the mistake to avoid). `espnowlist` is just names/MACs, not metadata.
  - `espnowmeshtopo` → `espnowtoporesults`; bonding `*request*` commands → `bondshowremotemanifest` (see §6).
- **Some sends are fire-and-forget** (`espnowsend`, `espnowbroadcast`, `espnowsessionsend`, `espnowtimesync`, `imagesend`): delivery only — **no reply comes back, so don't wait for one.**
- In every case the result lands in a **specific retriever command** — check the command's catalog/`help` note for which one; don't assume.
- **Moving files between devices:**
  - `espnowsendfile <peer> "<path>"` — push a local file TO a peer.
  - `espnowfetch <peer> <user> <pass> "<path>"` — pull a peer's file to local storage (auto-renamed on a name clash, e.g. `battery.csv.1`).
  - To make a peer send *its own* file to you, run sendfile **on the peer** via remote exec: `espnowremote <peer> <user> <pass> espnowsendfile <your-name-or-mac> "/battery.csv"` (get your own name/MAC from `espnowstatus`).

### 6. Bonding — a paired master/worker device

**Bonding is a 1:1 pairing, not the mesh.** Two devices pair exclusively — a **master** (display/gamepad) and a **worker** (compute/network); the role is auto-assigned by MAC when you run `bondconnect`, so you don't pick it. The master continuously syncs the worker's capability, manifest, settings, and schema, and can stream the worker's sensors. It needs a **secure session** first (see *Encrypted peers* above) and the firmware built with bonded mode — if bond commands report they're unavailable, that device wasn't built for it and you can't change that.

**Bonding does not make the worker's commands locally runnable.** "Shared registries" only means the master *caches* the worker's manifest to list what it offers. To actually run a command on the worker, use **`espnowremote <peer> <user> <pass> <cmd>`** (the mesh path) — there is no bond "exec" for you.

Workflow:
1. **Pair:** `bondconnect <peer>` — async; it completes when the peer's heartbeat arrives. Watch **`bondstatus`** (role, peer online/offline, and the sync flags for cap/manifest/settings). If sync stalls or looks stale, force it with `bondresync`.
2. **Read the peer's manifest with the REMOTE viewer.** `bondshowremotemanifest` shows the bonded peer's apps + commands. Do **not** use `bondshowcap` / `bondshowmanifest` — those report **your own** device (the footgun to avoid).
3. **Stream the worker's sensors:** on the worker, `bondstream <sensor> on`; read them on the master with `espnowsensorstatus`.

When unsure about a bond, read **`bondstatus`** — it's the single source of truth.

### Common recipes

- **Read a sensor:** `openthermal` → `thermalread` → `closethermal`.
- **Change a setting:** `ledbrightness 80` persists immediately. For a batch: `beginwrite` → several setting commands → `savesettings`.
- **Daily automation:** `automationadd name=morning type=atTime time=07:00 command=status` (time is device-local; set `tzoffsetminutes` first if needed).
- **Battery / power:** `batterystatus` (one word — voltage + charge %); `power` for power mode. (`battery` is the help *module*; the command is `batterystatus`, **not** `battery status`. Needs the battery feature `[ON]`.)
- **Event automation:** `automation add name=lowbatt type=event on=battery_low commands="ledcolor red" enabled=1`; list valid kinds with `events kinds`.
- **R1 health:** `healthstatus json`; use `healthtrack status` before changing capture. `capturecrypt status` reports at-rest sealing.
- **G2 settings:** `g2glasses show` (admin is required to change glasses settings); `g2health` opens the health lens app.
- **Guided LLM:** inspect `llmmenu`, run `llmask ...`, then retrieve asynchronous output with `llmresult json 0` as its help directs.

## Error recovery

| Response | Action |
| -------- | ------ |
| `"Unknown command"` | Do NOT guess and do NOT web-search. Search `references/cli-commands.generated.md` by keyword, or run `help <module>` on the device. |
| `"Error: Not initialized"` / `"Not started"` | Call the matching `open<sensor>` first. |
| `"Usage: ..."` / `"Detailed usage: ..."` | The device is showing you the correct syntax — read it and retry with the right arguments. |
| `"Guest accounts are view-only"` | The configured host-side account is a guest. Stop and ask the operator to use a sufficiently privileged account. |
| `"Admin access required"` | Stop and report that the configured account lacks admin privilege. |
| `"Super-admin access required"` | Stop and report the stronger requirement; ordinary admin is intentionally insufficient. |
| Exit code 0 but no output | Report to the user; do not fabricate content. |
| `"must be printable text"` | Your argument contained a control character (newline/tab) — remove it and retry. |
| 401 / 403 / "authentication failed" | Credentials are **host-side and invisible to you** — you can't see or change them. Do NOT read `.env`, search the filesystem, or retry (repeated logins **lock the device**). Stop and report the auth failure to the user. |

## Reference files you can read

- `references/cli-commands.generated.md` — **exhaustive** command catalog (firmware-generated), including admin/super-admin metadata and exact source revision. The authoritative list; read before guessing.
- `references/settings.generated.md` — every configurable setting, grouped by area, with the command that reads/writes it.
- `references/api-reference.md` — curated guide to dispatch semantics, roles, enable/autostart/live state, async results, and current events/health/G2/R1/LLM workflows.

## What you cannot read or use from this sandbox

- `scripts/hw1.sh` — host-side wrapper; not reachable or usable from the sandbox.
- Credentials and the device registry (`.env`, `hardwareone.devices.json`) — **entirely host-side; you can never see or change them.** So a `401` / "authentication failed" means the *host-side* credentials are wrong: it is **not** something you can fix by reading files, searching the filesystem, or retrying. Report it and stop — repeated logins lock the device.
