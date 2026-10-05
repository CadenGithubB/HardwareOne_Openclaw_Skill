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

An ESP32-based IoT device with 963 unique CLI commands across 52 modules (I2C sensors, camera, microphone, ESP-NOW mesh, MQTT, automations, notifications, health logging, G2/R1 wearables, speech recognition, local speech-to-text and transcription, an LLM that may run on-device or on a Raspberry Pi co-processor, signed OTA updates, an ESP32-C6 radio companion, an LED matrix, and more). You reach it through dedicated tools that the OpenClaw gateway runs on your behalf. You do **not** have direct network access — the tools are the *only* supported path to the device. There may be **one or more** devices (see *Multiple devices* below).

## Available tools

| Tool | Parameters | What it does |
| ---- | ---------- | ------------ |
| `hardwareone_ping` | `{ "device"?: "<name>" }` | Health-check a device (the default device, or the named one). Returns hostname, MAC, firmware version. |
| `hardwareone_cli`  | `{ "command": "<cmd>", "device"?: "<name>" }` | Run a device CLI command — e.g. `{"command": "thermalread"}`. This is how you do everything. |
| `hardwareone_devices` | `{ "probe"?: true }` | List configured devices (names + roles). `probe` also reports which are online. |
| `hardwareone_camera` | `{ "device"?: "<name>", "ensureOn"?: true, "describe"?: true }` | **Take a photo** with a `direct` device's camera, describe that exact frame with OpenClaw's configured image model, and also return the image for display. Direct HTTP/S devices only — not mesh peers. |

**Do not** attempt `curl`, `wget`, `python`, `node`, `/dev/tcp`, or to execute `hw1.sh` yourself — you have no network and all of those fail. Do not read or edit `scripts/`; those files run host-side and are not used by you.

**Argument limits:** a command may be up to **2047 characters** (the firmware's `CMD_INPUT_MAX`); a longer one is rejected whole by the device, never truncated. Arguments must be **printable ASCII (0x20-0x7E)** — `=`, `;`, `@`, `{ }`, `"` are all fine (needed for automations, passwords, and JSON), but the gateway refuses control characters (newline/tab) *and* any non-ASCII character (accents, `°`, emoji) before the command reaches the device. A command relayed to a **mesh** device must also fit the master's 217-byte relay payload together with the peer's credentials — keep mesh commands under roughly 190 characters. Output is capped at ~64 KB per call.

**The CLI is the device's entire interface.** Every capability — status, sensors, configuration, files, mesh, bonding — is a CLI command you run with `hardwareone_cli`. There is **no HTTP API for you to call** and no `/api/...` paths to fetch: the command registry is the single, complete, self-describing surface that backs every transport, and any web API is a narrower, staler subset of it. If you don't know the command, **find it** — search the catalog or run `help` — never reach for a web endpoint.

## Multiple devices

There may be one or more HardwareOne devices. Use `hardwareone_devices` to see them (names, roles, and any operator `description`); **more than one means multi-device mode.**

- **Targeting.** A command with no `device` goes to the **default** device. When `hardwareone_devices` shows more than one `direct` device, they are **co-equal control targets** — name the one you mean with `device: "<name>"`, and for an ambiguous request ("restart it", "read the temperature") ask which device or act on each, rather than assuming the default. (If no `default` is configured, the gateway picks a deterministic one for un-targeted commands — the first `master` by name, or the first direct device if none is a master — and, when more than one candidate exists, flags the pick in the `notes` field. Treat the `default` that `hardwareone_devices` reports as authoritative, not as "the primary".) You never see or need IPs or credentials — only names.
- **Roles.** `master` = a direct HTTP entry point and the default for un-targeted commands — you can configure **several co-equal `master`s**, each fully controllable by name (`worker` does **not** mean less-capable); `backup` = a direct device that takes over automatically if the default master is unreachable; mesh peers are reached *through* the master. These roles are configuration hints — a device's *live* mesh role is `espnowmeshrole` / `espnowmeshstatus`; if they disagree, note the drift.
- **Capabilities differ per device.** Run `features` on each device you use — don't assume one device's catalog applies to another (different sensors, different firmware). The firmware ships **deployment profiles** that leave whole subsystems out: a *Headless Node* (no display or local input), a *Pocket Assistant* on the XIAO ESP32-S3 (G2 glasses, R1 ring and the Pi link, but **no MQTT, I2C, OLED or local input**), and the *P4X-EYE handheld* (ESP32-P4 with the C6 radio companion). `hardwareone_devices` may also carry an operator-written **`description`** of a device's hardware/software setup (which build or profile, which sensors are attached, quirks) — read it before choosing a device or command. It complements `features`; it doesn't replace running `features` on an unfamiliar device.
- **What each device *is* lives in your memory, not here.** At session start, find your topology note with `note_search hardwareone` (locations, roles, sensors, which peers are mesh-only); read it, and update it — durable facts only, no IPs or live status — when devices change.
- **Mesh devices** show up in `hardwareone_devices` with `access: "mesh"`. Address them **by name, exactly like a direct device** — `hardwareone_cli` with `device: "<name>"` — and the gateway relays the command through the master for you (it injects the peer's credentials host-side, runs `espnowremote`, and waits for the reply). The relay is **async**, so it may take a few seconds and reports cleanly if the peer is offline. **The peer must be securely paired with the relaying master** (consent pairing or `espnowpairsecure`): since firmware v0.99.9 a device executes only session-encrypted command frames from a paired peer and silently drops the rest. Usually the master refuses the relay outright and you get its own text (`Target device '<name>' not found or not paired ...`, `ESP-NOW encryption required ...`); only a peer that is paired but has no active session gets a frame it drops, which comes back as "delivered, but no reply". Check `espnowsessions` / `espnowencstatus` on the master before blaming the peer. You do **not** run `espnowremote` yourself for ordinary commands. The `espnow*` commands stay available for genuinely mesh-specific tasks — topology (`espnowmeshtopo`), routes (`espnowmeshroutes`), peer metadata (`espnowrequestmeta`), file transfer (`espnowfetch`/`espnowsendfile`).

## Seeing the camera (direct devices only)

`hardwareone_camera` captures a photo, runs OpenClaw's configured image model against that exact frame, and returns both the textual visual description and the image block. Use it whenever the user asks what a device sees (read a sign, check a door, count people, inspect a scene). Pass `device` to choose one (omit for the default). It **only works on `direct` HTTP/S devices**, not `access:mesh` peers. It starts the camera automatically if needed (`ensureOn`, default true). Leave `describe` at its default `true` when answering a visual question; set it false only when the user wants the raw capture without analysis.

Answer from the tool's **automatic visual description**. Do not call the separate `image` tool, invent or search for a camera file path, or retry through `cameracapture`, SD-card files, `fileview`, base64, `exec`, or another CLI command. The Control UI can render an image content block even when the active model transport cannot consume that same tool-result image; the built-in description avoids depending on that unreliable handoff. If automatic description fails, report that exact failure without guessing what the scene contains.

## Sessions and identity

Every transport (serial, UART, Bluetooth, web, the on-device screen, the glasses) carries a **session epoch**, and a command is refused if the session that admitted it died before the command ran or if the authentication posture changed underneath it. Such a refusal ends with the words **`before command execution.`** (for example `Error: transport session changed before command execution.`). It is not a device fault and not a permission problem. You will rarely see it through the gateway: a web session that died comes back to the wrapper as HTTP 401, and the wrapper logs in again and retries by itself. The `*requireauth` and voice-authority checks never apply to a web request, so if the text does reach you, the command ran on another transport (a mesh relay or an automation) whose session or auth posture changed under it. **Run the same command once more.** If it fails the same way twice, report it.

- `whoami` reports the account name, an `(admin)` marker when the account is an admin, and the transport you are on (`You are <user> (admin) on web`). Run it when a permission error surprises you, before assuming the catalog is wrong (it cannot help when the account is a guest: see the next point).
- `guest` is a real, named view-only role. Through the gateway a guest account can run nothing at all: the web server refuses every `/api/cli` request from a guest with HTTP 403 and the JSON body `{"success":false,"error":"guest_forbidden","message":"Guest accounts are view-only"}` before the command runs, so even `whoami` fails. (On the device's own consoles a guest may run only `login`, `logout` and `whoami`.) `user`, `admin` and `superadmin` progressively unlock the catalog entries marked for those roles.
- Credentials and sessions are **host-side**; you never log in yourself. `login` and `logout` are refused on the web transport (`Error: use this interface's native login flow.` / `... native logout flow.`) and leave the gateway's session untouched, so there is no reason to run them.

## Confirmation prompts

The gateway reaches the device through `/api/cli` as a **machine transport**. Interactive yes/no prompts can neither be opened nor answered through it: a command that insists on an interactive confirmation is refused, not prompted: `factoryreset`, `filedelete` and `userdelete` answer `Error: cannot request confirm (another interactive mode is active)` and a `ringquery raw` SET answers `Error: another interactive mode is active; raw SET not queued`. That refusal is final for this transport: no other mode is really active, nothing is waiting for you, and retrying does not change it. Do **not** try to answer it with a follow-up `yes` — that is just an unknown command. Report that the operation needs a human session (serial console or the web UI). `help` itself works from here: it renders as plain text and never opens an interactive help session.

Commands whose usage shows an **inline confirm word** work normally: `otaupdate confirm`, `otastage confirm`, `otaack <seq> confirm`, `otacancel confirm`, `cm5 power reboot confirm`, `cm5 power recover confirm`. Use the exact form the catalog prints; the confirm token is part of the command, not a second message. (`otapin clear confirm` also has one, but `otapin` is serial-console only and is refused from here whatever you append.)

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
2. **Ask the device.** Run `help` or `help <module>` (e.g. `help espnow`) via `hardwareone_cli` to list that module's commands, and read the `Usage:` line the device prints when a command is called with wrong arguments. Top-level `help` lists **modules** (categories like `battery`, `system`, `power`), not necessarily runnable commands. Lookup is **case-insensitive and longest-prefix**: some capabilities are single words (`batterystatus`, not `battery status`), while registered dispatchers intentionally take subcommands (`automation list`, `power mode`, `sensorlog interval`, `stt record`, `matrix text`). A registered name can itself contain spaces (`cm5 power reboot`). Use the exact catalog/help form; never mechanically convert between styles. `help all` includes disconnected sensor modules.
3. Then pass the exact command name to `hardwareone_cli`.

**Never web-search** for HardwareOne commands, errors, or behavior — this is a private device with no public documentation, so a web search returns nothing useful and only wastes turns. The catalog and the device's own `help`/`Usage:` output are the only sources of truth. If a command isn't in the catalog, it does not exist — don't invent or guess one.

**When something fails, do NOT guess again — go to `help`.** If a command errors, returns the wrong thing, or you're unsure what to run next, do **not** fire off another command or `/api/...` path at random. Stop, run `help <module>` on the device (or re-search the catalog), find the *right* command, then retry. Two failed or off-target attempts in a row means you're guessing — switch to `help`; a third guess just wastes turns. **Never** fall back to fetching an `/api/...` path — there is no API surface for you; the answer is always another CLI command.

**A clean exit / `OK` is NOT the same as getting your answer.** Re-running the **same base command** with different flags, filters, or arguments — `sensors`, then `sensors <filter>`, then `sensors <flag>` — is guessing *even when every call succeeds*. If a command keeps returning a list (or anything other than the value you asked for), that's a dead end, not progress: after the **second** call to the same base command, STOP and find the *right* command (re-search the catalog or run `help <module>`).

### Argument conventions

- Most commands take positional args — `<command> <arg> [arg]` — and the catalog's usage line shows the exact form.
- Some commands take **key=value** pairs, automations especially: `automationadd name=morning type=atTime time=07:00 command=status`. Chain multiple commands in one value with `;` (`commands=cmd1;cmd2`).
- To change a **setting**, run its cataloged command with the new value. Ordinary setting commands persist immediately. For a multi-setting batch with one flash write, run `beginwrite`, make all changes, then `savesettings`. The batch is scoped to the gateway's **web session**, so it does survive across separate tool calls, but it is not a transaction: the values take effect in RAM at once, the device flushes an idle batch on its own after about two minutes, and a session renewal in the middle (a re-login after an expired session) starts a new scope. Keep the batch short, run `savesettings` promptly, then **read the setting back** to confirm what was stored. A setting command can be a dispatcher form such as `power mode`. The settings catalog lists type, range, options, secret/read-only state, and command.

### 2. Check features and state on an unfamiliar device
With an admin-capable configured account, run `hardwareone_cli` with `command: "features"`. Each feature is marked:

- `[ON]` — active, its commands work
- `[OFF]` — compiled but disabled; toggleable with admin rights
- `[N/C]` — **not compiled**; its commands do not exist. Don't attempt them.

Do not confuse this with runtime state. Current firmware separates the compile gate, a persisted `<thing>enabled` admission setting, a persisted `<thing>autostart` boot setting, and whether the subsystem is running now. An enabled subsystem can be stopped; autostart does not start it immediately. Use its `status` plus the settings catalog. `ramflush` restores the current live set for one reboot without changing normal autostart.

### 3. Core commands (subject to the configured account's role)

Common core commands include `status`, `uptime`, `time`, `temperature`, `voltage`, `memsample`, `memreport`, `taskstats`, `fsusage`, `whoami`, and `help`. `features` is admin-gated in current firmware. A `guest` account cannot run any command through the gateway (the web server refuses it before dispatch); `user`, `admin`, and `superadmin` progressively unlock the catalog entries marked for those roles.

### 4. Sensor pattern

Most sensors use Enable → Read → Disable (only when `[ON]` or `[OFF]`):

1. `open<sensor>` — e.g. `openthermal`
2. `<sensor>read` — e.g. `thermalread`
3. `close<sensor>` — e.g. `closethermal`

### 5. ESP-NOW mesh — talking to peers

To just **run a command on a mesh device, target it by name** (see *Mesh devices* above) — the gateway relays it for you. The commands here are the underlying ESP-NOW mechanics, for mesh-specific operations: health, topology, identity/metadata, file transfer, and room/tag broadcasts.

- **Mesh health & peers:** `espnowmeshstatus` (heartbeats/ACKs), `espnowlist` (paired peers), `espnowdevices` (all mesh devices, master). Full topology is `espnowmeshtopo` (async — see below).
- **Multi-hop routing.** Nodes relay for each other, so a peer out of radio range is reached through a neighbour. `espnowmeshroutes` shows who this node can reach and via which neighbour (`(direct)` = in radio range; allow a minute after boot for routes to be learned). `espnowmeshttl [1-10]` is the **hop budget** (default 3; `1` opts the node out of multi-hop). `espnowmeshrelay 0|1` says whether this node carries other nodes' traffic. There is no adaptive TTL any more. Pairing and file transfers stay single-hop by design.
- **Encrypted peers.** The consent workflow is: a super-admin sets the same `espnowsetpassphrase <mesh> <phrase>` on both devices; open `espnowpairmode` on both; inspect `espnowdiscovered`; run `espnowpairrequest <peer>`; then `espnowaccept [peer]` (or `espnowreject`) on the target. Confirm with `espnowencstatus` / `espnowsessions`. `espnowpairsecure <mac> <name> [mesh]` remains the explicit local-pair + asynchronous key-exchange form. Plain `espnowpair` is unencrypted and performs no remote handshake. **Relayed commands and bonding (below) require a secure session** — the firmware drops plaintext command frames.
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
- **Change a setting:** `ledbrightness 80` persists immediately. For a batch: `beginwrite` → several setting commands → `savesettings` → read one back.
- **Daily automation:** `automationadd name=morning type=atTime time=07:00 command=status` (time is device-local; set `tzoffsetminutes` first if needed).
- **Battery / power:** `batterystatus` (one word — voltage + charge %); `power json` (admin, like every `power*` command) shows the power mode, the live CPU frequency, the chip's supported CPU clock steps, the five power-mode presets, and whether a sleep transition is allowed right now (`sleepAllowed`, with `cooldownRemainingMs` and `otaProbation` as the reasons); `power mode <perf|balanced|saver|ultra|locked>` changes the preset. (`battery` is the help *module*; the command is `batterystatus`, **not** `battery status`. Needs the battery feature `[ON]`.)
- **Event automation:** `automation add name=lowbatt type=event on=battery_low commands="ledcolor red" enabled=1`; list valid kinds with `events kinds` — the list now includes the **Firmware & OTA** family (`ota_*`) and the **Radio companion** family (`companion_*`).
- **R1 health:** `healthstatus json` (other forms: `healthstatus poll | history | force-history | refresh-controls`); use `healthlogging status` before changing local capture (`healthlogging on|off|toggle|interval <sec>`). `capturecrypt status` reports at-rest sealing.
- **G2 settings:** `g2glasses show` (the whole `g2glasses` command is admin, reads included); `g2health` opens the health lens app. `g2probe` / `g2imgprobe` exist only in `ENABLE_G2_TESTSUITE` builds; expect `Unknown command` elsewhere.
- **LLM (on-device or on the Pi):** models are named `<source>:<name>` — `llmmodels` lists them, `llmload cm5:<name>` loads a Pi model, `llmload onboard:model.bin` an on-chip one. Which sources exist depends on the build: the developer default compiles both, the Pocket Assistant profile has only the Pi source (`cm5:`), the Headless profile has no LLM at all — `llmmodels` lists what this device can actually load. Then `llmmenu` → `llmask ...` for a guided question or `llmgenerate json <prompt>` for a free one, and retrieve the asynchronous output with `llmresult json 0` as its help directs. `llmstatus` shows which source holds the model.
- **Signed OTA (super-admin):** `otastatus json` first. The operator uploads `candidate.part` + `manifest.part`; then `otastage confirm` validates and journals them, `otaupdate confirm` reboots into the recovery updater, and after the new image proves itself `otaack <seq> confirm` acknowledges the durable result shown by `otastatus`. Older signed releases need `otastage confirm allow-downgrade`. `otapin` is serial-console only — it cannot be set from here. Mutating OTA commands need the OTA partition layout; without it they answer with a stub explaining why.
- **Radio companion (P4X-EYE only):** `c6status json` shows the ESP32-C6's firmware, bridge, heartbeat, memory and recovery counters. `c6restart` resets it in place; `c6hold on|off` holds the radio fully off or brings it back; `c6update "<file>"` flashes a companion image over SDIO (super-admin, slow) and `c6confirm` accepts the running image so it cannot roll back. Watch `companion_*` events.
- **Pi co-processor:** `cm5 status` (presence lease), `cm5 capabilities`, `cm5 linkhealth json`. `cm5 power` and `cm5 fan` exist only in builds with the host power/fan features; `cm5 power profile <eco|balanced|performance|auto>` and `cm5 fan quiet|auto|max` are admin, and `cm5 power reboot|halt|suspend confirm` are super-admin with the inline `confirm`. Every request is queued and acknowledged; read the outcome back with `cm5 power show` / `cm5 fan show`. A stale lease (`host not present`, `host stale`, `host not ready`) means the Pi daemon is not logged in or not ready — report it, don't retry in a loop.
- **Local speech-to-text:** stop speech recognition and the microphone sensor first (`closesr`, `closemic`), then `stt record 5` (1..20 s) or `stt start`; poll `stt status <id>`, finish early with `stt stop <id>`, read `stt result <id>`. Results are **owned by the session that started them**, so read them from the same gateway session, promptly. `transcription start | status [id] | stop <id>` drives the shared transcription interface, and `transcripts list internal|sd 0` / `transcripts read "<path>" 0` browse saved transcripts. `dictate` is not a CLI command (it is the Pi's UART control plane).
- **LED matrix:** `matrix status | clear | fill | on | off | text HI | pixel 3 2 on | brightness 0-15 | rotation 0-3 | blink 0-3 | size 8x8|16x8 | panel 0|1 | test` (one `matrix` dispatcher; `size` and `panel` are the only way to set `matrixSquare` / `matrixPanel`). `matrixbus 0|1` and `matrixaddress 0x70..0x77` persist but **need a reboot**.
- **Ring link:** `ringscan` answers `queued` — watch `ringstatus`; `ringconnect` likewise; `g2recover` answers "repair queued" — watch `g2status`. Ring writes answer with a transaction handle and settle later as acked, verified, refused, timeout or disconnected.

## Error recovery

Device errors reach you as the **device's own text**, exactly as it wrote it, with no transport prefix: `Unknown command: foo`, `Usage: ...`, `Error: Admin access required`. A reply that starts with `[exit N]` is a **gateway transport** problem (unreachable device, host-side login failure), not a device answer. The gateway's **own checks** also answer as plain `Error: ...` text with no prefix, before anything reaches the device: `Error: command must be printable text ...`, `Error: command must be a non-empty string of at most 2047 characters ...`, `Error: mesh relay to '<name>' is limited to the master's 217-byte relay payload ...`, `Error: unknown device '<name>' ...`, and `Error: hardwareone timeout after <N>ms` (the gateway stopped waiting). Nothing ran on the device in those cases.

| Response | Action |
| -------- | ------ |
| `"Unknown command"` | Do NOT guess and do NOT web-search. Search `references/cli-commands.generated.md` by keyword, or run `help <module>` on the device. |
| `"Error: Not initialized"` / `"Not started"` | Call the matching `open<sensor>` first. |
| `"Usage: ..."` / `"Detailed usage: ..."` | The device is showing you the correct syntax — read it and retry with the right arguments. |
| `"Guest accounts are view-only"` / `guest_forbidden` | The configured host-side account is a guest. The web server refuses every `/api/cli` request from it (HTTP 403, a JSON body) before any command runs, so nothing works through the gateway, `whoami` included. Stop and ask the operator to use a sufficiently privileged account. |
| `"Admin access required"` | Stop and report that the configured account lacks admin privilege. |
| `"Super-admin access required"` | Stop and report the stronger requirement; ordinary admin is intentionally insufficient. |
| text ending `"before command execution."` | The command ran on another transport (a relay or an automation) and the session that admitted it died, or its auth posture changed, before it ran (session epoch). Run the **same command once more**; report it if it repeats. |
| `"... busy"` from `closewifi` / `wifidisconnect` / `radiopower off` / `openespnow` | The radio has one owner and a scan or connection is in progress. Wait a few seconds, then retry the same command once. |
| `"host not present"` / `"host stale"` / `"host not ready"` | The Pi co-processor's daemon is not logged in over the UART link, its presence lease expired, or it has not announced readiness. Nothing you run fixes it; report it. `cm5 status` shows the lease. |
| `"queued"`, a request ID, or a transaction handle | **Delivery is not completion.** `ringscan`/`ringconnect` → `ringstatus`; `g2recover` → `g2status`; OTA commands → `otastatus`; ring writes → their transaction outcome; `cm5 power`/`cm5 fan` → their `show` form. Read the named status before claiming success. |
| `"Error: cannot request confirm (another interactive mode is active)"` / `"Error: another interactive mode is active; raw SET not queued"` | The command needs an interactive yes/no, which the gateway cannot open or answer. No other mode is really active; the refusal is final here, so do not retry and do not send `yes`. Report that it needs a serial or web-UI session. |
| Exit code 0 but no output | Report to the user; do not fabricate content. |
| `"must be printable text"` / "at most 2047 characters" / "limited to the master's 217-byte relay payload" | A **gateway-side** check, not the device: the command contained a control or non-ASCII character, is over the 2047-character limit, or (for a mesh device) does not fit the master's 217-byte relay payload with the peer's credentials. Fix it and retry; the device never saw it. |
| `Error: hardwareone timeout after <N>ms` | The **gateway** stopped waiting (30 s for an ordinary command and about 5.5 min for `llmload`/`llmgenerate`/`llmask`/`opencamera`/`certgen`/`c6update`/`otastage`/`otaupdate`/`stt`, unless the operator raised the device's timeouts). The device may still be working on it: read the operation's status (`llmstatus`, `otastatus`, `c6status`, `stt status <id>`) before running it again. |
| "authentication failed" / login failure / `[exit 1]` | Credentials are **host-side and invisible to you** — you can't see or change them. Do NOT read `.env`, search the filesystem, or retry (repeated logins **lock the device**). Stop and report the auth failure to the user. |

## Reference files you can read

- `references/cli-commands.generated.md` — **exhaustive** command catalog (firmware-generated), including admin/super-admin metadata and exact source revision. The authoritative list; read before guessing.
- `references/settings.generated.md` — every configurable setting, grouped by area, with the command that reads/writes it.
- `references/api-reference.md` — curated guide to dispatch semantics, roles and sessions, confirmation prompts, enable/autostart/live state, async results, and the current events/health/G2/R1/LLM/OTA/companion/co-processor/STT/matrix workflows.

## What you cannot read or use from this sandbox

- `scripts/hw1.sh` — host-side wrapper; not reachable or usable from the sandbox.
- Credentials and the device registry (`.env`, `hardwareone.devices.json`) — **entirely host-side; you can never see or change them.** So a "authentication failed" / login failure means the *host-side* credentials are wrong: it is **not** something you can fix by reading files, searching the filesystem, or retrying. Report it and stop — repeated logins lock the device.
