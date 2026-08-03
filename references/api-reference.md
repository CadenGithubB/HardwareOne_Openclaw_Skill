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
BLE, OLED/G2 actions, automations, and remote command execution. The OpenClaw agent
uses that same surface through `hardwareone_cli`.

Command lookup has two rules that matter:

1. **Matching is case-insensitive.** Use the spelling shown in the catalog, but
   `mqttHost` and `mqtthost` resolve to the same registry entry.
2. **Matching uses the longest registered prefix.** HardwareOne supports both
   one-word commands (`batterystatus`, `thermalread`) and dispatcher forms
   (`automation list`, `power mode`, `sensorlog interval`). Do not mechanically
   convert one style into the other.

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

## Roles and authorization

The device has four account ranks. The account stored in the host-side device
registry determines what OpenClaw can run on a direct device; a mesh relay uses the
target peer credentials stored host-side for that peer.

| Role | CLI access |
| ---- | ---------- |
| `guest` | Authenticated, but command access is limited to `login` and `logout`. |
| `user` | Ordinary, non-privileged commands. |
| `admin` | Admin-marked settings and device-control commands. |
| `superadmin` | Admin access plus identity, crypto, destructive, and authentication-posture commands. |

The catalog marks privileged entries as *(admin)* or *(super admin)*. Super-admin is
not another spelling for admin: an ordinary admin is intentionally refused. Current
super-admin operations include `factoryreset`, certificate generation, SD formatting,
mesh identity/passphrase changes, BLE secret/auth changes, and serial/display auth
posture.

Never work around a privilege error by retrying or by looking for credentials in the
skill sandbox. Credentials are host-only. Report which privilege the device requires.

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
  run `savesettings` to flush the deferred batch.
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

`OK`, a request ID, or exit code 0 can mean only that asynchronous work was accepted.
Read the retriever named by the command's help:

| Operation | Where the result appears |
| --------- | ------------------------ |
| `espnowremote`, `espnowbrowse`, `espnowfetch`, room/tag remote calls | `espnowmessages json ...` |
| `espnowrequestmeta` | `espnowdevices` cache |
| `espnowmeshtopo` | `espnowtoporesults` |
| secure key exchange | `espnowsessions` / `espnowencstatus` |
| bonded manifest requests | `bondshowremotemanifest` |
| guided/on-device LLM generation | `llmresult json 0` (use the generation cursor shown by help when supplied) |
| G2 or R1 connection kickoff | the corresponding `g2status` / ring status command |

Fire-and-forget sends do not produce a later response. Do not poll an unrelated buffer
just because another ESP-NOW command uses it.

## Current subsystem workflows

### Events, automations, and notifications

`events` shows the recent in-memory event ring that drives event automations.
`events kinds` lists valid kinds; add `json` where documented for machine-readable
output. `eventlog <0|1>` controls the durable structured event-history log.

The automation dispatcher supports forms such as:

```text
automation list
automation add name=lowbatt type=event on=battery_low commands="ledcolor red" enabled=1
automation run <name>
```

Single-word aliases such as `automationadd` remain in the registry, but prefer the
syntax printed by current device help.

Notifications are a presentation layer over the event stream; suppressing a pop-up
does not suppress the event or its automations. Device-wide controls are admin-only
(`notifydevicebanners`, `notifydevicetoasts`, `notifydeviceg2`,
`notifydevicequeue`, `notifydevicekind`). Per-user controls include `notifylevel`,
`notifyusermute`, and `notifyusershow`. `notifstats` reports pipeline loss and
suppression counters.

### Health capture and at-rest protection

The current sensor-log module includes R1 health tracking:

- `healthstatus [json|poll]` — live R1 vitals and tracking state.
- `healthtrack <on|off|toggle|status|interval [sec]>` — manage health capture.
- `healthlogmerge` — byte-concatenate logs in the stated order; it does not sort rows
  or reconcile headers/formats.
- `gpstrackmerge` — stitch GPS tracks in caller-supplied order.
- `capturecrypt [status|off|health|all|export ...]` — choose at-rest sealing or export
  an authorized plaintext copy.

Changing `capturecrypt` mode applies at the next session/day rollover; a single file
is not mixed-mode. Raw downloads and ESP-NOW file transfers preserve sealed bytes,
while authorized viewers can decrypt. Treat exported plaintext as sensitive.

### Even G2 glasses and R1 ring

`g2glasses` reads or changes glasses-device settings such as brightness, auto
brightness, wear detection, display position, silent mode, and unit formats.
`g2health` opens the R1 health lens app. `g2nativenotify` creates a native lens card
and is admin-only. Use `help even_g2` and `help even_r1` for the full, fast-changing
surface.

Connection commands such as `openg2` and `ringconnect` initiate work. Confirm the
result from status rather than assuming the first `OK` means the link is ready.

### On-device LLM

The LLM module now includes guided, indexed prompting and domain controls:

- `llmmenu` — inspect guided groups/templates/entities.
- `llmask ...` — compose a guided question on-device.
- `llmresult ...` — retrieve streamed generation output.
- `llmdomaingate`, `llmconfthreshold`, `llmcontentboost`,
  `llmnorepeatngram` — model behavior controls.
- `llmprofile` — diagnostic forward-pass timing; disable unrelated LLM debug flags
  for useful measurements.

Model loading/generation may take minutes. A timeout is not evidence that the model
was never started; inspect LLM status/result before launching duplicate work.

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

When a peer is configured as `via:"mesh"`, the OpenClaw plugin performs
`espnowremote` and result polling automatically. The direct relay device needs admin
credentials, and the target peer's stored credentials must have the privilege required
by the relayed command. For manual remote calls, remember that username/password are
accounts on the **target** device.

### Bonded peers

Bonding is an exclusive master/worker relationship layered over a secure session; it
is not the same as ordinary mesh membership.

1. `bondconnect <peer>` initiates the bond.
2. `bondstatus` is the source of truth for role, online state, and sync flags.
3. `bondresync` requests fresh capability/manifest/settings state.
4. `bondshowremotemanifest` shows the peer's cached manifest.

`bondshowcap` and `bondshowmanifest` describe the local device. Bonding does not make
remote commands locally runnable; command execution still uses the ESP-NOW remote path.

### Camera

For OpenClaw visual questions, use `hardwareone_camera`, not CLI file paths. The tool
captures the exact direct-device frame, describes it with the configured image model,
and returns the image block. `camerares` can reduce capture size if the tool reports its
image cap. Mesh-only peers cannot serve a camera image over HTTP/S.

## Error handling

| Response | Correct action |
| -------- | -------------- |
| `Unknown command` | Search the generated catalog; then run `help <module>`. Do not guess a web path. |
| `Usage: ...` | Follow the printed syntax exactly, including dispatcher subcommands. |
| `Not initialized` / `Not started` | Start the matching subsystem or sensor, then retry once. |
| `Guest accounts are view-only` | The configured device account is a guest; command access is intentionally unavailable. |
| `Admin access required` | Stop and report that the host-side account lacks admin privilege. |
| `Super-admin access required` | Stop and report the stronger requirement; ordinary admin is insufficient. |
| Authentication failure / HTTP 401 | Do not retry repeatedly; failed logins can trigger lockout. Ask the operator to correct host-side credentials. |
| HTTP 403 | Read the returned body for admin vs super-admin detail; do not search the sandbox for credentials. |
| Exit 0 / `OK` but no requested data | Determine whether the command is async or was only a setter/list operation. Never invent output. |
| Timeout on a documented slow operation | Inspect its status/result before starting it again. |
