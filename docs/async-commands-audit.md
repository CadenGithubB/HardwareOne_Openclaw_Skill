# ESP-NOW / bonding async-command audit

Status: **CONFIRMED** by the firmware agent (handler-level reading of `System_ESPNow.cpp`,
~14k lines, plus `System_ImageManager.cpp` / `System_User.cpp`). 29 commands' firmware
help/usage strings were annotated with their class + retriever; firmware build green.
**Pending: firmware commit → regenerate `references/cli-commands.generated.md`.** SKILL.md
section 5 is already updated to match.

**Async** = dispatches a request to a remote peer, returns `OK` on delivery, result arrives
later via a retriever. **Fire-and-forget** = delivery only, no reply. The retriever
*varies* by command — it is named in each command's help, so the catalog teaches it.

## A. ASYNC — result lands in a retriever
| command | retrieval channel |
| --- | --- |
| `espnowremote`, `espnowbrowse`, `espnowfetch`, `espnowroomcmd`, `espnowtagcmd` | `espnowmessages json` (match the reqId; per-device replies for room/tag). `espnowfetch` also writes the file to local FS. |
| `espnowrequestmeta` | **device cache → `espnowdevices` / `espnowdeviceinfo`** (NOT `espnowmessages`) |
| `espnowmeshtopo` | `espnowtoporesults` |
| `espnowkeyex`, `espnowsessionopen`, `espnowrekey` | `espnowsessions` (`espnowencstatus`) |
| `bondconnect` | `bondstatus` (+ `GET /api/bond/status`) |
| `bondrequestmanifest` | `bondshowremotemanifest` |
| `bondrequestcap` | `GET /api/bond/status` (no CLI viewer; `bondshowcap` = LOCAL cap — footgun) |
| `bondrequestsettings` | `GET /api/bond/settings` (no CLI viewer) |
| `bondrequestschema` | `GET /api/bond/settings/schema` (no CLI viewer) |
| `bondresync` | `bondshowremotemanifest` + the three `/api/bond/*` endpoints |
| `espnowrequestevents` | none locally — changes the PEER's state; verify with `espnowsubs` on the peer |

## B. FIRE-AND-FORGET — delivery only, no reply
`espnowsend`, `espnowbroadcast`, `espnowsessionsend`, `espnowtimesync` (peers see it via
their `espnowtimestatus`), `bondtestsensor` (frame appears on master's `espnowsensorstatus`),
`imagesend` (peer's `/espnow/received/` inbox), `usersync` (target device's userlist).

## C. SYNC but clarified (were suspected async)
- `espnowsendfile` — **synchronous blocking local send**; "success" = locally transmitted, not peer-accepted.
- `espnowpair` — synchronous local registry add (no remote handshake).
- `espnowpairsecure` — sync pair + async KEY_EX (channel usable shortly after; see `espnowsessions`).
- `espnowsensorstream`, `bondstream` — local on/off toggles; streamed data lands on the master's `espnowsensorstatus` / `GET /api/sensors/remote`.

## D. Corrections to the original brief
- `camerasendaftercapture` / `cameratargetdevice` — **SYNC local settings**, not dispatchers
  (and the auto-send isn't even wired — `cameraSendAfterCapture` is a dead flag).
- **No OTA commands exist.** **No async MQTT CLI** — `mqttPublish*` are local toggles;
  publishing happens in a background tick, not via a command.
- `espnowprobe` — confirmed synchronous (its help already said so); untouched.

## Downstream actions
1. SKILL.md §5 async guidance — **done** (retriever varies; `espnowmessages` for
   remote/file/roomcmd, `espnowdevices` for metadata, fire-and-forget class).
2. Firmware: commit the 29 help-string edits, then regenerate
   `references/cli-commands.generated.md` so every command carries its async/retriever note.
3. Future (out of scope now): `bondshowremote*` CLI viewers for remote cap/settings/schema.
