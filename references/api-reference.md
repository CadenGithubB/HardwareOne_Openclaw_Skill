# HardwareOne — Operating Reference

This is the curated operating guide for the current HardwareOne command model. It
explains how to choose and interpret commands; it intentionally does not duplicate
the exhaustive generated catalogs:

- [`cli-commands.generated.md`](cli-commands.generated.md) — every registered command,
  its usage, feature gate, and privilege level.
- [`settings.generated.md`](settings.generated.md) — every persisted setting and the
  command or dispatcher form that edits it.

Both generated files identify the exact firmware source revision they came from.

## Command discovery and dispatch

The CLI registry is the canonical control surface shared by serial, web CLI, MQTT,
BLE, the UART host link, OLED/G2 actions, automations, and remote command execution.
The OpenClaw agent uses that same surface through `hardwareone_cli`.

Command lookup has two rules that matter:

1. **Matching is case-insensitive.** Use the spelling shown in the catalog, but
   `mqttHost` and `mqtthost` resolve to the same registry entry.
2. **Matching uses the longest registered prefix.** HardwareOne supports both
   one-word commands (`batterystatus`, `thermalread`) and dispatcher forms
   (`automation list`, `power mode`, `sensorlog interval`, `stt record`,
   `matrix text`). A registered name can itself contain spaces (`cm5 status`,
   `cm5 power reboot`); such a row wins over its shorter prefix. Do not
   mechanically convert one style into the other.

Use this discovery order:

1. Search the generated catalog by capability or noun.
2. Run `help` to list modules, then `help <module>` for that module's commands.
3. If a call returns `Usage:`, follow that exact syntax.
4. Use `help all` when a disconnected sensor's module is hidden from ordinary help.

A help-module name is not automatically a command. For example, `battery` is a
module and `batterystatus` is its live-reading command. Conversely, `automation` is
a real dispatcher command and `automation list` is valid.

The generated catalog counts both **unique command names** and **registry entries**.
If firmware registers a name twice, lookup uses the first matching slot; the second
does not create a new capability.

A command line may be at most 2047 bytes (`CMD_INPUT_MAX`). The device rejects a
longer line whole; it never runs a truncated prefix. Any whitespace is a separator.

## Roles and authorization

The device has four account ranks. The account stored in the host-side device
registry determines what OpenClaw can run on a direct device; a mesh relay uses the
target peer credentials stored host-side for that peer.

| Role | CLI access |
| ---- | ---------- |
| `guest` | A real, named view-only account. Through `/api/cli` every request is refused with HTTP 403 and a `guest_forbidden` JSON body before any command runs, `whoami` included; only the device's own consoles let a guest run `login`, `logout` and `whoami`. |
| `user` | Ordinary, non-privileged commands. |
| `admin` | Admin-marked settings and device-control commands. |
| `superadmin` | Admin access plus identity, crypto, destructive, and authentication-posture commands. |

The catalog marks privileged entries as *(admin)* or *(super admin)*. Super-admin is
not another spelling for admin: an ordinary admin is intentionally refused. Current
super-admin operations include `factoryreset`, certificate generation, SD formatting,
mesh identity/passphrase changes, BLE secret/auth changes, serial/display/UART auth
posture, every mutating signed-OTA command, companion flashing (`c6update`), and the
destructive `cm5 power` verbs.

Never work around a privilege error by retrying or by looking for credentials in the
skill sandbox. Credentials are host-only. Report which privilege the device requires.

## Sessions and epochs

Every transport carries a boot-local **session epoch**: serial, the UART host link,
Bluetooth, web, the on-device screen, and the glasses each count their own. A
command is bound to the epoch of the session that admitted it. If that session has
died by the time the command executes, or a `*requireauth` policy or the glasses'
voice authority flipped underneath it, the command is refused with an error ending
`before command execution.` (for example `Error: transport session changed before
command execution.`).

The gateway rarely sees this text. A web session that has died answers HTTP 401
instead, and the wrapper logs in again and retries on its own. The `*requireauth`
and voice-authority checks apply only to the device's own consoles and the glasses,
never to a web request. When the text does come back through the gateway the
command ran on another transport, such as a relay or an automation, whose session
died or whose authentication posture changed. Run the same command once more.
A second identical refusal is worth reporting; a loop of retries is not.

`whoami` reports the account name, an `(admin)` marker when the account has admin
rank, and the transport of the submitting interface.
`login` and `logout` act on the submitting console. From the web transport the
gateway uses they are refused with `Error: use this interface's native login flow.`
(or `... native logout flow.`) and the web session is untouched, so the agent has no
reason to run them.

## Confirmation and machine transports

A confirm prompt belongs to the session that opened it and is answered as an
addressed reply with the caller's rank re-checked. Machine transports cannot open or
answer prompts at all: UART, MQTT, automations, the glasses, Bluetooth, and
`/api/cli` without the interactive flag. The OpenClaw wrapper never sets that flag,
so through the gateway:

- A command that insists on an interactive confirmation is refused, not prompted.
  `factoryreset`, `filedelete` and `userdelete` answer `Error: cannot request confirm
  (another interactive mode is active)` and a `ringquery raw` SET answers `Error:
  another interactive mode is active; raw SET not queued`. That refusal is final for
  this transport: no other mode is really active, nothing is waiting, and retrying
  does not change it. Report that it needs a serial console or web-UI session. A
  follow-up `yes` is just an unknown command.
- A command whose usage carries an inline confirm token works as written:
  `otastage confirm`, `otaupdate confirm`, `otaack <seq> confirm`, `otacancel
  confirm`, `cm5 power reboot confirm`, `cm5 power recover confirm`. The token is
  part of the command line. (`otapin clear confirm` carries one too, but `otapin` is
  serial-console only and the gateway's origin is refused before the token matters.)

Help renders for machine transports without holding a help slot, so `help` output is
plain text and never leaves the session in a help state that later commands must
exit.

## Compile, enable, autostart, and live state

HardwareOne now separates four different questions:

| Layer | Question | Typical evidence/control |
| ----- | -------- | ------------------------ |
| Compile gate | Is the subsystem in this firmware build? | `features`: `[N/C]` means not compiled. |
| Enabled setting | Is the subsystem allowed to run? | `<thing>enabled` or a feature control. |
| Autostart setting | Should it start at normal boot? | `<thing>autostart`. |
| Live state | Is it running or connected now? | `open*` / `close*`, or the subsystem's `status`. |

`[ON]` means compiled and enabled; `[OFF]` means compiled but disabled; `[N/C]`
means the code is not in that build. An enabled subsystem can still be stopped right
now, and an autostart setting does not itself start or stop it.

Examples in the current registry include `wifienabled` + `wifiautostart`,
`cameraenabled` + camera autostart, `bleenabled`, `espnowautostart`,
`sensorlogenabled`, and sensor-specific enable controls such as `thermalenabled`.
Use the settings catalog rather than assuming every subsystem exposes both axes under
the same spelling.

Deployment profiles leave whole subsystems out of a build. A Headless Node has no
display or local input; the Pocket Assistant on the XIAO ESP32-S3 keeps Bluetooth,
the G2/R1 stack and the Pi link but drops MQTT, I2C, OLED and local input; the
P4X-EYE handheld adds the C6 radio companion. Compile guards changed in current
firmware too: the LLM module is gated by `ENABLE_LLM_BACKEND`, NeoPixel and LED
commands by `ENABLE_NEOPIXEL`, and SD commands by `ENABLE_SD_CARD`. Always run
`features` and read the operator description before assuming a module exists.

`ramflush` is a special one-boot recovery path: it snapshots what is running, reboots,
and restores that live set without changing normal autostart settings. `ramflush
status` reports what the last recovery boot restored.

## Settings and persistence

Setting-backed commands show type, range, default, enum options, secret, and read-only
metadata in the generated catalogs.

- Run a setting command with no value when its usage supports reading the current
  value; run it with the cataloged value to change it.
- Ordinary setting commands persist their change immediately.
- For several changes with one flash write, run `beginwrite`, make the changes, then
  run `savesettings` to flush the deferred batch. Both are admin commands.
- The batch is **owner-scoped**. For a cookie-authenticated web request the owner is
  the web session's epoch, so a `beginwrite` issued through the gateway stays open
  across the separate HTTP requests that later tool calls make on the same session.
  It is coalescing, not a transaction: each value takes effect in RAM at once, only
  the flash write is deferred. The device flushes an idle batch by itself after about
  two minutes, and a session renewal in the middle (re-login after the session
  expired) starts a new owner, leaving the old batch to that idle flush. Keep the
  batch short, run `savesettings` promptly, and read a setting back to confirm.
- A `cmdKey` may be a dispatcher form such as `power mode` or `sensorlog interval`.
- Secret values are not echoed. Read-only settings are device-managed and should not
  be treated as writable merely because they appear in the settings catalog.

## Reading results correctly

### Lists are not measurements

Discovery commands such as `sensors`, `devices`, `features`, `i2cscan`, and peer lists
describe what exists or is configured. They are not substitutes for a live read.

- Battery voltage and charge: `batterystatus`
- ESP32 internal temperature: `temperature`
- Typical I2C sensor: `open<sensor>` → `<sensor>read` → optionally
  `close<sensor>`

Do not interpret a successful list command as the requested measurement.

### Sensor JSON

Where a module exposes JSON, prefer it for structured work. Current I2C sensor
serializers generally include an envelope with `valid`, `connected`, and `ts`, then
sensor-specific fields. Treat `valid:false`, `connected:false`, missing payloads, or an
error field as state—not as a real zero reading. Exact shapes remain module-specific;
use the command's help and returned keys.

### Delivery is not completion

`OK`, `queued`, a request ID, a transaction handle, or exit code 0 can mean only that
asynchronous work was accepted. Read the retriever named by the command's help:

| Operation | Where the result appears |
| --------- | ------------------------ |
| `espnowremote`, `espnowbrowse`, `espnowfetch`, room/tag remote calls | `espnowmessages json ...` |
| `espnowrequestmeta` | `espnowdevices` cache |
| `espnowmeshtopo` | `espnowtoporesults` |
| secure key exchange | `espnowsessions` / `espnowencstatus` |
| bonded manifest requests | `bondshowremotemanifest` |
| LLM generation (on-device or on the Pi) | `llmresult json 0` (use the generation cursor shown by help when supplied) |
| `ringscan`, `ringconnect` (answer `queued`) | `ringstatus` |
| ring writes such as `ringquery` (answer with a transaction handle) | the transaction outcome: acked, verified, refused, timeout, or disconnected, via `ringstatus` / `healthstatus` |
| `g2recover` ("repair queued") and `openg2` | `g2status` |
| `otastage`, `otaupdate`, `otarecovery`, `otacancel` (answer with a transaction/result sequence) | `otastatus json`; acknowledge with `otaack <seq> confirm` |
| `c6update`, `c6restart`, `c6hold` | `c6status json` and `companion_*` events |
| `cm5 power ...`, `cm5 fan ...` requests | `cm5 power show` / `cm5 fan show` (queued, acknowledged, then reported) |
| `stt start` / `stt record` | `stt status <id>` then `stt result <id>`, same session |
| `transcription start` | `transcription status [id]` |

Fire-and-forget sends do not produce a later response. Do not poll an unrelated buffer
just because another ESP-NOW command uses it.

## Current subsystem workflows

### Events, automations, and notifications

`events` shows the recent in-memory event ring that drives event automations.
`events kinds` lists valid kinds; add `json` where documented for machine-readable
output. `eventlog <0|1>` controls the durable structured event-history log.

Two event families were added since v0.99.7. **Firmware & OTA** carries the signed
update lifecycle (credential changed, upload started and finished, staged, staging
rejected, trial started, accepted, rolled back, recovery entered, transaction result).
**Radio companion** carries the ESP32-C6 lifecycle on the P4X-EYE
(`companion_online`, `companion_offline`, `companion_restarted`,
`companion_mismatch`, `companion_low_memory`, `companion_updated`,
`companion_reboot`). Both route through notifications and event automations like
every other family; `events kinds` is the authoritative list.

The automation dispatcher supports forms such as:

```text
automation list
automation add name=lowbatt type=event on=battery_low commands="ledcolor red" enabled=1
automation run id=<id>
```

`automation run` takes the numeric id shown by `automation list`, not a name.

Single-word aliases such as `automationadd` remain in the registry, but prefer the
syntax printed by current device help. Automation command parts over the input limit
are rejected rather than truncated, and mutating OTA commands are forbidden from
automations.

Notifications are a presentation layer over the event stream; suppressing a pop-up
does not suppress the event or its automations. Device-wide controls are admin-only
(`notifydevicebanners`, `notifydevicetoasts`, `notifydeviceg2`,
`notifydevicequeue`, `notifydevicekind`, `notifydeviceapp` for the Android app
sink). Per-user controls include `notifylevel`, `notifyusermute`, and
`notifyusershow`. `notifstats` reports pipeline loss and suppression counters.

### Health logging and at-rest protection

The `health` module (requires `ENABLE_R1_HEALTH`) holds R1 vitals and the local
health logger:

- `healthstatus [json|poll|history|force-history|refresh-controls]` — live R1
  vitals, desired versus observed ring controls, local logging state, and typed
  history status. `json` is what the app and web page consume; `poll` requests an
  exact 2.2.9 daily refresh; `force-history` is the admin freshness bypass.
- `healthlogging <on|off|toggle|status|interval [sec]>` — HardwareOne's own local
  CSV capture of ring vitals. It is independent of the ring's health-collection
  privacy setting.
- `healthlogmerge` — byte-concatenate logs in the stated order; it does not sort rows
  or reconcile headers/formats.
- `gpstrackmerge` — stitch GPS tracks in caller-supplied order.
- `capturecrypt [status|off|health|all|export ...]` — choose at-rest sealing or export
  an authorized plaintext copy.

Changing `capturecrypt` mode applies at the next session/day rollover; a single file
is not mixed-mode. Raw downloads and ESP-NOW file transfers preserve sealed bytes,
while authorized viewers can decrypt. Treat exported plaintext as sensitive. On ring
firmware 2.2.9 logging is passive: it records refreshes rather than sending timed
queries, and an operation the ring cannot serve settles immediately as unsupported.

### Even G2 glasses and R1 ring

`g2glasses` reads or changes glasses-device settings such as brightness, auto
brightness, wear detection, display position, silent mode, and unit formats; writes
are refused unless the connected temple reports a validated firmware version.
`g2health` opens the R1 health lens app. `g2nativenotify` creates a native lens card
and is admin-only. Use `help even_g2` and `help even_r1` for the full, fast-changing
surface. `g2probe` and `g2imgprobe` exist only in builds made with
`ENABLE_G2_TESTSUITE=1`; elsewhere they answer `Unknown command`.

Connection commands such as `openg2`, `ringscan`, `ringconnect`, and `g2recover`
initiate work and answer `queued`. Confirm the result from `g2status` / `ringstatus`
rather than assuming the first reply means the link is ready. `debugringdump`
toggles the redacted raw frame dump.

### LLM: on-device or on the Pi

The `llm` module requires `ENABLE_LLM_BACKEND` plus at least one answer source:
`ENABLE_LLM_SOURCE_ONBOARD` (a small transformer in PSRAM, ESP32-S3 only) and/or
`ENABLE_LLM_SOURCE_CM5` (answers from the Raspberry Pi co-processor over the UART
link). Which sources a device has depends on its build: the developer default has
both, the Pocket Assistant profile has only the Pi source, the Headless profile has
no LLM. Use `llmmodels` / `features` to see what is present. Every surface talks to
whichever source holds the current model.

- Models are addressed as `<source>:<name>`, for example `onboard:model.bin` or
  `cm5:Qwen3-1.7B-Q4_0.gguf`; a bare filename still resolves. `llmmodels [json]`
  lists them across flash, SD and the Pi; `llmload <id>` loads one; `llmstatus`
  shows the active source and model; `llmunload` releases it.
- `llmgenerate <prompt>` blocks and prints the whole reply; `llmgenerate json ...`
  starts an asynchronous generation. On a Pi-only build use the `json` form.
- `llmmenu` — inspect guided groups/templates/entities; `llmask ...` — compose a
  guided question on-device; `llmresult json <offset>` — retrieve streamed output;
  `llmstop` aborts.
- `llmdomaingate`, `llmconfthreshold`, `llmcontentboost`, `llmnorepeatngram` —
  behavior controls; `llmprofile` — on-board forward-pass timing (disable unrelated
  LLM debug flags for useful measurements).

The `Do:` command mode is honoured only by an on-board model whose header declares
it; the Pi source refuses it rather than guessing. Model loading and generation may
take minutes, and a remote answer is abandoned by a stall watchdog rather than left
hanging. A timeout is not evidence that the model was never started; inspect
`llmstatus` / `llmresult` before launching duplicate work. A stale Pi presence lease
declines remote LLM calls (see the co-processor section).

### Signed OTA

The `ota` module is always registered. On a build without the opt-in OTA partition
layout (`HW1_OTA_LAYOUT`) its commands are stubs that explain why OTA is
unavailable; on an OTA build they drive the immutable recovery updater in the
factory slot. Every mutating command is super-admin. The ones reachable from the
gateway (`otastage`, `otaupdate`, `otarecovery`, `otacancel`, `otaack`) take an inline
`confirm`; `otawrite` (Bluetooth staging) and the set form of `otapin` do not, and
neither is usable from here.

1. `otastatus [json]` — journal, partition identity, staged pair, and last result.
2. The operator uploads `/system/ota/candidate.part` and `manifest.part` (over the
   web UI, or `otawrite` over encrypted Bluetooth).
3. `otastage confirm [allow-downgrade]` — validate the signature and version and
   journal the pair. An older signed release is refused without `allow-downgrade`.
4. `otaupdate confirm [force-power]` — revalidate and reboot into recovery apply.
5. The new image serves a probation and rolls back on its own if it cannot prove
   itself. `otaack <result-sequence> confirm` acknowledges exactly the durable result
   that `otastatus` shows.
6. `otacancel confirm` backs out a staged request; `otarecovery confirm
   [allow-downgrade]` boots to recovery for a direct upload.

`otapin` (the recovery credential) and `otaresetjournal` are serial-console only and
cannot be run through the gateway. Mutating OTA commands are forbidden from
automations. Updates are also events (the Firmware & OTA family).

### Radio companion (ESP32-C6, P4X-EYE)

On the ESP32-P4X-EYE the Wi-Fi, Bluetooth and ESP-NOW radio is a separate ESP32-C6
driven over SDIO. The `c6` module (`HW1_RADIO_COMPANION`) compiles to nothing on
boards with an on-chip radio.

- `c6status [json]` — companion firmware against the qualified version, image and
  running slot, confirmation state, ESP-NOW bridge, heartbeat, memory, and recovery
  counters.
- `c6restart` — reset the companion in place; radio features stop and come back.
- `c6hold on|off` — hold the C6 in reset (radio fully off) or release it and restore
  what ran. `c6autohold` does this by itself after radio idleness.
- `c6update "<file>"` — flash a companion image from the P4's storage over SDIO
  (super-admin, slow; the file is checked for the bridge marker first). The new
  image is confirmed only once the bridge answers from it; `c6confirm` accepts it by
  hand so it cannot roll back.
- `c6autorecover`, `c6heartbeat`, `c6console` — tune the watchdog and the console
  mirror.

Radio features never start while the companion is offline, and a companion that stops
answering is recovered without rebooting the P4. The P4 reboots only after repeated
failed soft recoveries. Watch the Radio companion event family.

### Raspberry Pi co-processor (CM5)

A Raspberry Pi wired over a dedicated UART (`uartlink`) acts as a co-processor: it
answers LLM prompts, transcribes dictation, reports its own fan and temperature, and
can correct a dark-boot clock. The ESP32 stays the device. The `cm5` module is always
registered; `cm5 power` and `cm5 fan` exist only in builds with the host power/fan
features (`ENABLE_RASPBERRY_PI_HOST_POWER` / `ENABLE_RASPBERRY_PI_HOST_FAN`).

- `cm5 status` — the presence lease (`starting` / `ready` / `busy` / `degraded`,
  freshness, epoch binding). `cm5 capabilities` — protocol constants.
  `cm5 linkhealth [json]` — the Pi daemon's own UART fault tally.
- `cm5 power [show|status|profile <eco|balanced|performance|auto>]` (admin) and
  `cm5 power reboot|halt|suspend confirm`, `cm5 power sleep_for <1..1440> confirm`,
  `cm5 power recover confirm` (super-admin). `cm5 fan [show|status|quiet|auto|max]`
  (admin). Every request is a queued request/ACK/report exchange reconciled against
  the Pi's boot id; a lost ACK is completed, never re-executed, and an ambiguous
  outcome fails closed until `cm5 power recover confirm`.
- The heartbeat, ACK and report callbacks are UART control-plane traffic from the
  daemon; they are not for the agent.
- `dictate` is not a CLI command. It lives on the authenticated UART control plane
  and arming fails with `host not present`, `host stale` or `host not ready` when the
  daemon is absent, its lease expired, or it has not announced readiness. A stale
  lease also declines voice sessions and remote LLM calls.

### Local STT and transcription

Two modules cover speech-to-text without a phone:

- `stt` (`ENABLE_LOCAL_STT`) — buffered local dictation on the device. Stop speech
  recognition (`closesr`) and the microphone sensor (`closemic`) first, then
  `stt record [1..20 seconds]` for a bounded capture or `stt start` for a continuous
  one. Poll `stt status [id]`, finish early with `stt stop <id>`, discard with
  `stt cancel <id>`, and read `stt result <id>`. Results are owned by the
  authenticated session that started them and must be read from it. `sttperf`
  reports timings only, never text. Accuracy and latency are experimental.
- `transcription` (`ENABLE_DICTATION`) — the session controls shared by the display
  and web interfaces: `transcription start|status [id]|stop <id>|cancel <id>`.
  `transcripts list internal|sd <offset>` and `transcripts read "<path>" <offset>`
  browse the caller's saved transcripts.

These produce text for review, not voice command execution; voice commands remain the
ESP-SR pipeline (`opensr` / `closesr`).

### LED matrix

The `matrix` module (`ENABLE_LED_MATRIX`) drives HT16K33 monochrome matrices in
16x8 or single 8x8 layouts through one dispatcher: `matrix status`, `matrix clear`,
`matrix fill`, `matrix on|off`, `matrix pixel <x> <y> on|off`, `matrix text <text>`,
`matrix brightness <0-15>`, `matrix rotation <0-3>`, `matrix blink <0-3>`,
`matrix size 8x8|16x8`, `matrix panel <0|1>`, `matrix test`. Brightness and rotation
persist. `matrixbus <0|1>` and `matrixaddress <0x70..0x77>` persist but take effect
only after a reboot. Static text clips at the display edge.

### ESP-NOW discovery, pairing, and relay

For a consent-based same-mesh pairing:

1. A super-admin sets the same mesh passphrase on both devices with
   `espnowsetpassphrase <mesh> <passphrase>`.
2. Open `espnowpairmode` on both devices.
3. Inspect `espnowdiscovered`.
4. Run `espnowpairrequest <peer>` on the requester.
5. Run `espnowaccept [peer]` on the target (or `espnowreject`).
6. Confirm the encrypted channel with `espnowsessions` / `espnowencstatus`.

`espnowpairsecure <mac> <name> [mesh]` is also registered for explicit local pairing
plus asynchronous key exchange. Plain `espnowpair` adds a local unencrypted registry
entry and does not perform a remote handshake.

**Relay requires a secure session.** Since v0.99.9 a device accepts ESP-NOW command,
response and stream frames only when they are session-encrypted and come from a
paired peer; plaintext frames from an unpaired or older peer are dropped, not
executed. When a peer is configured as `via:"mesh"`, the OpenClaw plugin performs
`espnowremote` and result polling automatically, so the peer must be securely paired
with the relaying master. Usually the master refuses the relay outright and its own
text comes back (`Target device '<name>' not found or not paired ...`, `ESP-NOW
encryption required ...`); only a peer that is paired but has no active session
gets a frame it drops, which surfaces as "delivered, but no reply". The direct
relay device needs admin credentials (`espnowremote` is admin-only), and the
target peer's stored credentials must have the privilege required by the relayed
command. For manual remote calls, remember that username/password are accounts on
the **target** device.

**Multi-hop routing.** The mesh relays traffic, so a peer out of radio range is
reached through a neighbour and routes are learned automatically (allow about a
minute after boot). `espnowmeshroutes` shows who this node can reach and via whom
(`(direct)` means in radio range). `espnowmeshttl [1-10]` is the hop budget stamped
on relay-eligible frames (default 3; `1` opts the node out of multi-hop).
`espnowmeshrelay <0|1>` controls whether this node carries other nodes' traffic.
`espnowmeshmetrics` shows forwarding counters. There is no adaptive TTL mode any
more. Pairing, heartbeats, route advertisements and file
transfers are single-hop by design; a relayed message is capped at about 130
characters per piece.

### Bonded peers

Bonding is an exclusive master/worker relationship layered over a secure session; it
is not the same as ordinary mesh membership.

1. `bondconnect <peer>` initiates the bond.
2. `bondstatus` is the source of truth for role, online state, and sync flags.
3. `bondresync` requests fresh capability/manifest/settings state.
4. `bondshowremotemanifest` shows the peer's cached manifest.

`bondshowcap` and `bondshowmanifest` describe the local device. Bonding does not make
remote commands locally runnable; command execution still uses the ESP-NOW remote path.

### Power

`power` prints the current mode, CPU clock, display brightness and auto-mode state;
`power json` adds the live CPU frequency, the supported CPU clock steps, the
power-mode preset table, display and idle-power state, and the sleep gate
(`sleepAllowed`, with `cooldownRemainingMs` and `otaProbation` as the reasons). `power mode
<perf|balanced|saver|ultra|locked|0-4>` selects a preset using each chip's own clock
steps; `power auto` and `power threshold` control the low-battery downshift.
`powersave` and `powercooldown` are separate idle controls. `power`, `powersave` and
`powercooldown` are admin commands, as are `cpufreq`, `lightsleep` and `deepsleep`;
on the P4X-EYE `lightsleep` pauses the companion watchdog and `deepsleep` holds the
C6 in reset.

### WiFi radio ownership

The radio has a single owner. `closewifi`, `wifidisconnect`, `radiopower off` and
`openespnow` fail with an explicit busy error instead of fighting a scan or connection
that is already running: `Error: WiFi radio busy (scan or connection in progress);
retry closewifi` (or `... retry wifidisconnect`), `Error: WiFi scan/connection is
busy; radio remains on. Retry radiopower off.` and `Error: Cannot start ESP-NOW: WiFi
radio busy ...`. The wording differs per command, so match on `busy`, not on a shared
prefix. Wait a few seconds and retry the same command once. `closewifi` also stops
the HTTP server, so a command that succeeds may not return a response at all; confirm
with `hardwareone_ping` afterwards.

### Camera

For OpenClaw visual questions, use `hardwareone_camera`, not CLI file paths. The tool
captures the exact direct-device frame, describes it with the configured image model,
and returns the image block. `camerares` can reduce capture size if the tool reports its
image cap. Mesh-only peers cannot serve a camera image over HTTP/S.

## Error handling

Device errors arrive as the device's own text with no transport prefix. The gateway
returns the body verbatim whenever the device executed the request and rejected the
command (HTTP 400 or 403 at the wrapper); only transport failures carry an
`[exit N]` prefix. The gateway's own pre-checks (input length, printable ASCII, the
mesh frame limit, an unknown device name) and its wait limit answer as plain
`Error: ...` text with no prefix either; in those cases nothing reached the device.

| Response | Correct action |
| -------- | -------------- |
| `Unknown command` | Search the generated catalog; then run `help <module>`. Do not guess a web path. |
| `Usage: ...` | Follow the printed syntax exactly, including dispatcher subcommands. |
| `Not initialized` / `Not started` | Start the matching subsystem or sensor, then retry once. |
| `Guest accounts are view-only` / `guest_forbidden` | The configured device account is a guest. The web server refuses every `/api/cli` request from it (HTTP 403, a JSON body) before any command runs, so no command works through the gateway, `whoami` included. Ask the operator for a sufficiently privileged account. |
| `Admin access required` | Stop and report that the host-side account lacks admin privilege. |
| `Super-admin access required` | Stop and report the stronger requirement; ordinary admin is insufficient. |
| `... before command execution.` | Session epoch mismatch on another transport (a relay or an automation): the admitting session died or the auth posture changed. Retry the same command once. |
| `... busy ...` from `closewifi`, `wifidisconnect`, `radiopower off` or `openespnow` (the exact text differs per command; see WiFi radio ownership) | A scan or connection owns the radio. Wait, then retry the same command once. |
| `host not present` / `host stale` / `host not ready` | The Pi daemon is absent, its presence lease expired, or it has not announced readiness. Report it; `cm5 status` shows the lease. |
| `queued`, a request ID, or a transaction handle | Delivery, not completion. Read the retriever in the table above before reporting success. |
| `Error: cannot request confirm (another interactive mode is active)` / `Error: another interactive mode is active; raw SET not queued` | The command needs an interactive confirmation the gateway cannot open or answer. No other mode is really active; the refusal is final here. Do not send `yes` and do not retry. Report that the operation needs a serial or web-UI session. |
| "at most 2047 characters" / `must be printable text` / "limited to the master's 217-byte relay payload" | A gateway-side check, not device text: the command is over `CMD_INPUT_MAX`, contains a control or non-ASCII character, or (mesh device) does not fit the master's 217-byte relay payload with the peer's credentials. Fix it and retry. |
| `Error: hardwareone timeout after <N>ms` | The gateway stopped waiting (30 s, or about 5.5 min for the slow commands below, unless the operator raised the device's timeouts); the device may still be working. Check the operation's status before running it again. |
| Authentication failure / login failure (`[exit 1]`) | Do not retry repeatedly; failed logins can trigger lockout. Ask the operator to correct host-side credentials. |
| Exit 0 / `OK` but no requested data | Determine whether the command is async or was only a setter/list operation. Never invent output. |
| Timeout on a documented slow operation (the long cap applies to the first words `llmgenerate`, `llmload`, `llmask`, `opencamera`, `certgen`, `c6update`, `otastage`, `otaupdate`, `stt`) | Inspect its status/result before starting it again. |
