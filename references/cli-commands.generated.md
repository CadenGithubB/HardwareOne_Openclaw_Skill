# HardwareOne — CLI Command Catalog

<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: tools/sync_command_reference.py
     Source of truth: firmware gCommandModules[] + SettingEntry tables. -->

> Firmware source `a172013` · 963 unique commands · 966 registry entries · 52 modules

Generated directly from the firmware command tables, so it always matches the build it came from. **Feature gating still applies:** a module whose compile guard is not defined is absent entirely — run `features` on the device for live `[ON]`/`[OFF]`/`[N/C]` state. Lookup is case-insensitive and uses longest-prefix matching, so both single-word commands and dispatcher forms such as `automation list` are valid. A registered name can itself contain spaces (`cm5 power reboot`); such rows are listed like any other command and win over their shorter prefixes. Privileged commands are marked *(admin)* or *(super admin)*. Commands backed by a stored setting show their value type / range / default / options; see [`settings.generated.md`](settings.generated.md) for the full configuration view. Module overviews are firmware-authored context; only the bullet rows beneath them are registered commands.

## Modules

| Module | Compiled when | Commands |
|--------|---------------|----------|
| `cli` | always | 4 |
| `system` | always | 26 |
| `wifi` | `ENABLE_WIFI` | 20 |
| `espnow` | `ENABLE_ESPNOW` | 119 |
| `c6` | `HW1_RADIO_COMPANION` | 9 |
| `mqtt` | `ENABLE_MQTT` | 27 |
| `bluetooth` | `ENABLE_BLUETOOTH` | 19 |
| `filesystem` | always | 10 |
| `sd` | `ENABLE_SD_CARD` | 5 |
| `oled` | always | 20 |
| `neopixel` | `ENABLE_NEOPIXEL` | 3 |
| `led` | `ENABLE_NEOPIXEL` | 6 |
| `matrix` | `ENABLE_LED_MATRIX` | 3 |
| `servo` | `ENABLE_SERVO` | 6 |
| `thermal` | `ENABLE_THERMAL_SENSOR` | 23 |
| `tof` | `ENABLE_TOF_SENSOR` | 10 |
| `imu` | `ENABLE_IMU_SENSOR` | 16 |
| `input` | `ENABLE_OLED_INPUT` | 5 |
| `gamepad` | `ENABLE_GAMEPAD_SENSOR` | 1 |
| `anoencoder` | `ENABLE_ANO_ENCODER` | 5 |
| `apds` | `ENABLE_APDS_SENSOR` | 9 |
| `gps` | `ENABLE_GPS_SENSOR` | 6 |
| `fmradio` | `ENABLE_FM_RADIO` | 10 |
| `rtc` | `ENABLE_RTC_SENSOR` | 7 |
| `presence` | `ENABLE_PRESENCE_SENSOR` | 6 |
| `camera` | `ENABLE_CAMERA_SENSOR` | 49 |
| `microphone` | `ENABLE_MICROPHONE` | 15 |
| `edgeimpulse` | `ENABLE_EDGE_IMPULSE` | 16 |
| `transcription` | `ENABLE_DICTATION` | 2 |
| `stt` | `ENABLE_LOCAL_STT` | 2 |
| `espsr` | `ENABLE_ESP_SR` | 45 |
| `i2c` | `ENABLE_I2C_SYSTEM` | 24 |
| `automation` | `ENABLE_AUTOMATION` | 8 |
| `battery` | `ENABLE_BATTERY_MONITOR` | 3 |
| `debug` | always | 182 |
| `settings` | always | 18 |
| `sensorlog` | always | 2 |
| `health` | `ENABLE_R1_HEALTH` | 3 |
| `users` | always | 23 |
| `features` | always | 2 |
| `image` | `ENABLE_CAMERA_SENSOR` | 4 |
| `map` | `ENABLE_MAPS` | 12 |
| `mapsettings` | `ENABLE_MAPS` | 3 |
| `power` | always | 3 |
| `liveaudio` | always | 1 |
| `cm5` | always | 15 |
| `ota` | always | 9 |
| `setpattern` | `ENABLE_OLED_DISPLAY` | 1 |
| `even_g2` | `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES` | 56 |
| `even_r1` | `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES` | 5 |
| `llm` | `ENABLE_LLM_BACKEND` | 30 |
| `settingsedit` | always | 58 |
| **Total registry entries** | | **966** |

## Commands by module

### `cli` — Help and CLI navigation

_Always compiled._

**Firmware module overview (context):** The cli module is the on-device help and CLI navigation layer, not a feature subsystem. help opens a paged help browser: bare help shows the main menu listing every registered module, help <module> drills into page 1 of that module (and prints its subsystem overview at the top), and help <module> p<N> opens an explicit later page. The special topics help sensors (aggregate view across all sensor modules), help all (show every command including hidden ones), and help tail (dump suppressed output) cover the rest. While the browser is open the CLI is in a help state, so p<N>, next and prev move within a module, back steps from a module page up to the main menu, and exit leaves help mode entirely and returns to the normal prompt, and clear wipes the CLI scrollback/history.

- `help` — Display help menu (module results use p<N> pages) · `help [<module> [p<N>]|sensors|all|tail] Example: help espnow p2 In help mode: p<N>, next, prev, back, exit`
- `back` — Return to main help menu
- `exit` — Exit help mode
- `clear` — Clear CLI history

### `system` — Core system commands

_Always compiled._

**Firmware module overview (context):** The system module holds core device commands that do not belong to any peripheral. Status and inspection: status (WiFi, filesystem, memory summary), uptime, time (uptime plus NTP wall-clock if synced), temperature and voltage (ESP32 internal die temp and supply rail), taskstats/perftop (FreeRTOS task and live loop/CPU profiling), fsusage, events (recent system events from the in-memory register that drives automation event triggers), and the memory tools memsample (snapshot, with memsample track on|off|reset|status for allocation tracking) and memreport. Control and power: reboot, ramflush, cpufreq [MHz] to read or set a supported CPU clock, lightsleep [seconds] for ESP32 light sleep, deepsleep for power-off (reset to wake), and wait <ms>/sleep <ms> to pause command-script execution. timeset sets the clock manually. broadcast <message> pushes a line of text to all connected output interfaces, and factoryreset deletes the user-accounts file so the first-boot setup wizard re-runs on next reboot while deliberately preserving WiFi credentials and other settings. Most mutating commands (timeset, cpufreq, reboot, ramflush, factoryreset, broadcast, lightsleep, deepsleep) require admin.

- `status` — Show system status (WiFi, FS, memory). (add 'json' for JSON output)
- `crashlog` — Show the last recorded crash (panic text, core/PC, boot phase, repeat count). (add 'json') · `crashlog [json]`
- `bootcount` — Show boot count (NVS), crash count, last reset reason. 'bootcount reset' zeroes it (admin). (add 'json') · `bootcount [reset|json]`
- `uptime` — Show device uptime. (add 'json' for JSON output)
- `time` — Show device time (uptime + NTP if synced). (add 'json' for JSON output)
- `timeset` *(admin)* — Set time manually: timeset YYYY-MM-DD HH:MM:SS or <unix_timestamp>. · `timeset <YYYY-MM-DD HH:MM:SS>|<unix_timestamp>`
- `memsample` — Memory snapshot with component requirements. Use 'memsample track [on|off|reset|status]' for allocation tracking. · `memsample [track <on|off|reset|status>]`
- `memreport` — Comprehensive memory report (Task Manager style). (add 'json' for JSON output)
- `fsusage` — Show filesystem usage. (add 'json' for JSON output)
- `testencryption` *(admin)* — Test WiFi password encryption (admin only).
- `testpassword` *(admin)* — Test user password hashing (admin only).
- `temperature` — Read ESP32 internal temperature. (add 'json' for JSON output)
- `voltage` — Estimate power draw from active subsystems (not a real voltage measurement; use batterystatus for measured volts). (add 'json' for JSON output)
- `cpufreq` *(admin)* — Get/set CPU frequency (admin). · `cpufreq [MHz] (run without arguments to list supported values)`
- `taskstats` — Detailed task statistics (state/prio/stack min-free). (add 'json' for JSON output)
- `perftop` — Live performance snapshot: loop laps/s, period, per-section timing, worst stalls + live task CPU%. (add 'json' for loop + per-task CPU% JSON)
- `events` — Show recent system events (the in-memory register that drives automation event triggers). · `events [kinds [json]] (bare): show the recent-event ring kinds: list every valid event-kind name (json = machine form)`
- `reboot` *(admin)* — Reboot the system.
- `ramflush` *(admin)* — Reboot to reclaim RAM, restoring the features running right now. · `ramflush [status] (bare): capture which features are running, reboot, and restore them status: show what the last boot restored (no reboot) Restores for that one boot only — a normal reboot returns to configured autostart. Never changes your autostart settings.`
- `factoryreset` *(super admin)* — Wipe user accounts and reboot to re-run setup wizard. · `factoryreset (no args, confirmation required) Deletes /system/users/users.json so the first-time setup wizard runs on next boot. WiFi credentials and other settings are preserved.`
- `broadcast` *(admin)* — Send a message to all connected output interfaces. · `broadcast <message>`
- `pendinglist` *(admin)* — List pending user requests.
- `wait` — Delay execution for N milliseconds: wait <ms>. · `wait <ms> (1..60000)`
- `sleep` — Alias for wait: sleep <ms>. · `sleep <ms> (1..60000)`
- `lightsleep` *(admin)* — Enter ESP32 light sleep: lightsleep [seconds] (default 20s). · `lightsleep [seconds] (1..3600, default 20)`
- `deepsleep` *(admin)* — Power off via deep sleep (no wake source — reset button to wake). · `deepsleep (admin; wakes only via physical reset)`

### `wifi` — Network management (connect, scan, add/remove networks)

_Requires `ENABLE_WIFI`._

**Firmware module overview (context):** The WiFi subsystem manages station-mode network connections plus the network services that ride on top of them: NTP time sync and the on-device HTTP/HTTPS server. Saved networks are stored as a prioritized list (wifilist, wifiadd, wifirm, wifipromote) and persist to flash; openwifi connects by best-priority (default) or by --index <N>, and a failed indexed attempt auto-rolls back to the previously connected network. Note two distinct disconnects: closewifi tears down the link AND stops the HTTP server and web output to free heap, while wifidisconnect (drop) leaves the radio and web server up so you can move to another network. closewifi powers the radio down only when ESP-NOW is not using it; 'radiopower off' is the unconditional airplane switch. wifiscan lists nearby APs, ntpsync/ntpstatus handle clock sync, and openhttp/closehttp/httpstatus run the web server (compiled in only when the HTTP server is enabled). certinfo and certgen (admin-only) manage the self-signed HTTPS certificate.

- `wifiread` — Read current WiFi connection info. (add 'json' for JSON output)
- `wifistatus` — Show current WiFi connection info. (add 'json' for JSON output)
- `wifilist` — List saved WiFi networks. (add 'json' for JSON output)
- `wifiadd` *(admin)* — Add WiFi network: <ssid> <pass> [priority] [hidden] · `wifiadd <ssid> <pass> [priority] [hidden0|1]`
- `wifirm` *(admin)* — Remove WiFi network: <ssid> · `wifirm <ssid>`
- `wifipromote` *(admin)* — Promote WiFi to top priority: <ssid> [newPriority] · `wifipromote <ssid> [newPriority]`
- `openwifi` *(admin)* — Connect to WiFi: [--best | --index <N>] (default: best) · `openwifi [--best | --index <1..N>]`
- `closewifi` *(admin)* — Disconnect from WiFi (also stops HTTP server + web output to free heap).
- `wifidisconnect` *(admin)* — Disconnect from the current network but keep the radio on (HTTP/web stay up).
- `radiopower` *(admin)* — Power the whole 2.4GHz radio on/off (airplane mode; also stops/restores ESP-NOW; runtime only, not persisted): [on|off|toggle] · `radiopower [on|off|toggle]`
- `wifiscan` — Scan for available WiFi networks. (add 'json' for JSON output)
- `wifigettxpower` *(admin)* — Report the current WiFi TX power in dBm (read-only; set it with 'wifitxpower'). · `wifigettxpower (no arguments)`
- `ntpsync` — Sync time with NTP server.
- `ntpstatus` — Show NTP configuration and sync state.
- `openhttp` *(admin)* — Start HTTP server.
- `closehttp` *(admin)* — Stop HTTP server.
- `httpread` — Read HTTP server status. (add 'json' for JSON output)
- `httpstatus` — Show HTTP server status. (add 'json' for JSON output)
- `certinfo` — Show HTTPS certificate details.
- `certgen` *(super admin)* — Generate self-signed HTTPS certificate: [rsa] (default: ECDSA P-256) · `certgen [rsa] Default: ECDSA P-256 (~1s). Use 'certgen rsa' for RSA-2048 (~30-60s).`

### `espnow` — ESP-NOW wireless communication (peer-to-peer, mesh)

_Requires `ENABLE_ESPNOW`._

**Firmware module overview (context):** ESP-NOW links HardwareOne devices directly over the WiFi radio with no router or access point, as named peers that can also form a multi-hop mesh. Pair with espnowpair, then message (espnowsend/espnowbroadcast), push a file (espnowsendfile), pull a file (espnowfetch), browse a peer's files (espnowbrowse), or run a command on a peer (espnowremote). espnowremote, espnowfetch, espnowbrowse, espnowroomcmd and espnowtagcmd are ASYNCHRONOUS: they return OK on delivery; the real result arrives later in the message buffer, read with 'espnowmessages json [mac]'. Mesh mode (espnowmode mesh) adds routing with a TTL and master/worker/backup roles; each device carries identity metadata (name, friendly name, room, zone, tags) queried with espnowdeviceinfo locally or espnowrequestmeta for a peer.

- `espnowread` — Read ESP-NOW status and configuration.
- `espnowstatus` — Show ESP-NOW status and configuration.
- `espnowstats` — Show ESP-NOW statistics (messages, errors, etc.).
- `espnowrouterstats` — Show message router statistics and metrics.
- `espnowbroadcaststats` — Show broadcast ACK tracking statistics.
- `espnowresetstats` *(admin)* — Reset ESP-NOW statistics counters.
- `espnowsaturation` — Show ESP-NOW link saturation: frames/sec, stream-queue depth, drops, ACK RTT (rolling 30s).
- `espnowsaturationreset` — Clear the saturation rolling window (use before a stress test).
- `espnowrelayblock` *(admin)* — DIAGNOSTIC: drop ALL inbound ESP-NOW frames from one MAC (bench stand-in for an out-of-range peer; relay HW testing). RAM-only - reboot clears it. · `espnowrelayblock <mac|clear|status> Drops frames at the RX drain before any parsing - heartbeats too, so the peer goes offline within ~30s, like real RF loss.`
- `espnowidentity` — Show long-term Ed25519 identity (MAC, pub key, createdAtSec, regenCount).
- `espnowregenidentity` *(super admin)* — Regenerate Ed25519 identity. Requires '--confirm-wipe-all-bonds'. · `espnowregenidentity --confirm-wipe-all-bonds`
- `espnowkeyex` *(admin)* — Initiate KEY_EX handshake with a peer (runs alongside legacy pairing). (async - handshake completes later; check espnowsessions) · `espnowkeyex <name_or_mac> [<mesh>] Returns OK when KEY_EX_HELLO is sent; the handshake completes asynchronously - inspect with 'espnowsessions' / 'espnowencstatus'.`
- `espnowprobe` *(admin)* — Reachability probe via KEY_EX. Synchronous, bounded timeout. Reports alive+mesh+firmware in one shot (no plaintext on the wire). · `espnowprobe <name_or_mac> [<timeoutMs (50-5000, default 500)>] [<mesh>]`
- `espnowsessionopen` *(admin)* — Initiate SESSION handshake (requires prior espnowkeyex). (async - session goes ACTIVE later; check espnowsessions) · `espnowsessionopen <name_or_mac> [<mesh>] Returns OK when SESSION_OPEN is sent; the session becomes ACTIVE when CONFIRM arrives - run 'espnowsessions'.`
- `espnowsessions` — Show in-RAM session state (peer, sessionId, dir, age, counters).
- `espnowsessionsend` *(admin)* — DIAGNOSTIC: send an AEAD-encrypted CHAT message over an active session (exercises the session-crypto path). NOT executed on the peer and returns no reply - to RUN a command use 'espnowremote'. · `espnowsessionsend <name_or_mac> <message> Delivers an encrypted CHAT message (lands in the peer's espnowmessages). It is NOT command execution and no reply comes back. To run a command on the peer: espnowremote <target> <target-user> <target-pass> <command>.`
- `espnowrekey` *(admin)* — Force immediate SESSION_REKEY for a peer (manual trigger). (async - completes later; check espnowsessions) · `espnowrekey <name_or_mac> Returns OK when REKEY is sent; new keys derive when the peer's REKEY arrives - verify with 'espnowsessions'.`
- `espnowsubs` — List peers + their event-subscription bitmaps (what they want from us).
- `espnowrequestevents` *(admin)* — Ask a peer to send US only events in <bitmask>. Updates state ON THE PEER. (async - changes peer state, no reply; verify with espnowsubs on the peer) · `espnowrequestevents <name_or_mac> <bitmask> Returns OK on delivery; this updates the PEER's subscription (no confirmation returns) - run 'espnowsubs' on that peer to verify.`
- `openespnow` *(admin)* — Initialize ESP-NOW communication.
- `closeespnow` *(admin)* — Deinitialize ESP-NOW and free resources.
- `espnowpair` *(admin)* — Pair ESP-NOW device: 'espnowpair <mac> <name> [mesh]'. (synchronous; local registry add, no remote handshake) · `espnowpair <mac> <name> [mesh]`
- `espnowunpair` *(admin)* — Unpair ESP-NOW device (also clears its crypto identity): 'espnowunpair <name_or_mac>'. · `espnowunpair <name_or_mac>`
- `espnowforget` *(admin)* — Forget a peer's crypto identity + close its session: 'espnowforget <name_or_mac>'. · `espnowforget <name_or_mac>`
- `espnowlist` — List all paired ESP-NOW devices.
- `espnowmessages` — Buffered message history as JSON: 'espnowmessages json [sinceSeq] [mac]' — async results of espnowremote/browse/fetch. · `espnowmessages [json] [<sinceSeq>] [<AA:BB:CC:DD:EE:FF>]`
- `espnowmeshstatus` — Show mesh peer health (heartbeats & ACKs).
- `espnowmeshmetrics` — Show multi-hop routing metrics (flood forwards, routed hops, drops, route churn).
- `espnowmeshroutes` — Show the mesh route table: who this node can reach and via which neighbour. · `espnowmeshroutes [clear] 'via (direct)' = in radio range. Anything else is reached over one or more relay hops. Multi-hop routes are learned from neighbours every 30s — allow a minute after boot.`
- `espnowmeshes` *(admin)* — Manage multi-mesh slots: 'espnowmeshes [list|add|remove|enable|setdefault|rename|setpassphrase] ...'. · `espnowmeshes list espnowmeshes add <label> (then set passphrase via 'espnowsetpassphrase <label> <pw>') espnowmeshes remove <label> (alias: disable) espnowmeshes enable <label> espnowmeshes setdefault <label> espnowmeshes setpassphrase <label> <passphrase> espnowmeshes rename <oldLabel> <newLabel>`
- `espnowmode` *(admin)* — Get/set ESP-NOW mode: 'espnowmode [direct|mesh]'. · `espnowmode [direct|mesh]` _(setting · bool · default off)_
- `espnowmeshttl` — Get/set the multi-hop budget: 'espnowmeshttl [1-10]'. · `espnowmeshttl [<1..10>] How many hops this node's relay-eligible frames may travel. 1 = single hop (no multi-hop). Applies to broadcast text/time sync and to routed unicast; heartbeats and pairing are always single-hop.` _(setting · int 1–10 · default 3)_
- `espnowchannel` *(admin)* — Get/set preferred ESP-NOW channel: 'espnowchannel [1-13|auto|resync]'. No arg shows a checker (actual vs expected). Set the SAME value on both devices to pair off-grid. · `espnowchannel [<1..13>|auto|resync] (no arg) = show preference, actual radio channel, expected, and an OK/MISMATCH check. auto (0) = follow WiFi, pin fallback when offline. 1-13 = force this channel when not joined to WiFi. resync = force the radio back onto the correct channel now (no setting change). Two devices only hear each other on the same channel — set both the same for field use.` _(setting · int 0–13 · default 0)_
- `espnowsetname` *(admin)* — Get/set device name: 'espnowsetname [name]'. · `espnowsetname [<name>] (<=19 bytes; letters, numbers, - and _ only)` _(setting · string · default (empty))_
- `espnowhbmode` — Get/set heartbeat mode: 'espnowhbmode [public|private]'. · `espnowhbmode [public|private]`
- `espnowmeshrole` *(admin)* — Get/set mesh role: 'espnowmeshrole [worker|master|backup]'. · `espnowmeshrole [worker|master|backup]` _(setting · enum · default 0 (Worker) · options 0=Worker, 1=Master, 2=Backup Master)_
- `espnowmeshmaster` *(admin)* — Get/set master MAC: 'espnowmeshmaster [MAC]'. · `espnowmeshmaster [<AA:BB:CC:DD:EE:FF>]` _(setting · string · default (empty))_
- `espnowmeshbackup` *(admin)* — Get/set backup MAC: 'espnowmeshbackup [MAC]'. · `espnowmeshbackup [<AA:BB:CC:DD:EE:FF>]` _(setting · string · default (empty))_
- `espnowbackupenable` *(admin)* — Enable/disable backup master feature: 'espnowbackupenable [on|off]'. · `espnowbackupenable [on|off]` _(setting · bool · default off)_
- `espnowmeshtopo` — Discover mesh topology (run on the master; role not enforced). (async - read results with espnowtoporesults)
- `espnowtoporesults` — Get topology results: 'espnowtoporesults [page] [request-id]'.
- `espnowtimesync` — Broadcast NTP time to mesh (intended for the master; role not enforced). (async broadcast; delivery only, no reply)
- `espnowtimestatus` — Show time synchronization status.
- `espnowroom` — Get/set device room: 'espnowroom [name]'. · `espnowroom [Kitchen|Bedroom|...] espnowroom clear` _(setting · string · default (empty))_
- `espnowzone` — Get/set device zone: 'espnowzone [name]'. · `espnowzone [Counter|Door|Ceiling|...] espnowzone clear` _(setting · string · default (empty))_
- `espnowtags` — Get/set device tags: 'espnowtags [tag1,tag2,...]'. · `espnowtags stationary,thermal espnowtags clear` _(setting · string · default (empty))_
- `espnowfriendlyname` — Get/set friendly display name: 'espnowfriendlyname [name]'. · `espnowfriendlyname [<name>] (<=47 chars) espnowfriendlyname clear` _(setting · string · default (empty))_
- `espnowstationary` — Get/set stationary flag: 'espnowstationary [0|1]'. · `espnowstationary [on|off|0|1]` _(setting · bool · default off)_
- `espnowdeviceinfo` — Show all local device metadata.
- `espnowdevices` — List all mesh devices with room/zone/tags/status: espnowdevices [json].
- `espnowrooms` — List rooms and their devices (aggregated from this node's cached peer metadata).
- `espnowfind` — Find devices by name, room, or tag: 'espnowfind <query>'. · `espnowfind <query>`
- `espnowroomcmd` *(admin)* — Run command on all devices in a room; user/pass must be valid on EACH target device. (async - replies via espnowmessages json) · `espnowroomcmd <room> <target-user> <target-pass> <command> Credentials are checked ON EACH target device, not this one. Returns OK on dispatch; each device's reply arrives later in 'espnowmessages json'.`
- `espnowtagcmd` *(admin)* — Run command on all devices with a tag; user/pass must be valid on EACH target device. (async - replies via espnowmessages json) · `espnowtagcmd <tag> <target-user> <target-pass> <command> Credentials are checked ON EACH target device, not this one. Returns OK on dispatch; each device's reply arrives later in 'espnowmessages json'.`
- `espnowsend` — Send message to one peer, relayed over multiple hops if it is out of radio range: 'espnowsend [json] <name_or_mac> <message>'. Requires ESP-NOW encryption enabled. (async send; delivery only, no reply) · `espnowsend [json] <name_or_mac> <message> Requires ESP-NOW encryption (set a mesh passphrase first); plaintext send was removed. Leading 'json' flag returns {schema,ok,msgId} for delivery-status polling. Returns OK on delivery; one-way message, no result comes back. Out-of-range peers are reached via relays when a route exists ('espnowmeshroutes'); a relayed message is split at ~130 chars per piece instead of ~200.`
- `espnowbroadcast` — Broadcast message: 'espnowbroadcast <message>'. (async send; delivery only, no reply) · `espnowbroadcast <message> (single frame, <= 218 bytes; longer text is NOT fragmented and fails silently) Returns whether the single broadcast frame was transmitted to all peers, NOT a per-device delivery count; no per-device reply.`
- `espnowsendfile` *(admin)* — Send file: 'espnowsendfile <name_or_mac> "<filepath>"'. (synchronous send; fails if the receiver rejects/cancels mid-transfer) · `espnowsendfile <name_or_mac> "<filepath>" Blocks until the file is sent. 'success' means every chunk was transmitted and the receiver did not cancel; final storage is confirmed by the receiver's CRC check, which is not reported back here.`
- `espnowbrowse` *(admin)* — Browse a peer's files; user/pass are an account ON THE TARGET: 'espnowbrowse <target> <target-user> <target-pass> ["path"]'. (async - result via espnowmessages json) · `espnowbrowse <target> <target-user> <target-pass> ["path"] Credentials are verified ON THE TARGET device, not this one. Returns OK on delivery; the remote listing arrives later - read with 'espnowmessages json' (match the reqId).`
- `espnowfetch` *(admin)* — Fetch a file from a peer; user/pass are an account ON THE TARGET: 'espnowfetch <target> <target-user> <target-pass> "<path>"'. (async - status via espnowmessages json; file saved on this device) · `espnowfetch <target> <target-user> <target-pass> "<path>" Credentials are verified ON THE TARGET device, not this one. Returns OK on delivery; status lands in 'espnowmessages json'; the fetched file is written to this device's filesystem.`
- `espnowremote` *(admin)* — Execute a command on a peer: 'espnowremote <target> <target-user> <target-pass> <cmd>'. user/pass are an account ON THE TARGET (verified there), not this device. (async - result via espnowmessages json) · `espnowremote <target> <target-user> <target-pass> <command> <target-user>/<target-pass> are credentials ON THE TARGET device, not this one. Async: returns a reqId on delivery; read the output later with 'espnowmessages json 0 <target-mac>' (match the reqId).`
- `openstream` *(admin)* — Start streaming all output to ESP-NOW caller (admin, remote only).
- `closestream` *(admin)* — Stop streaming output to ESP-NOW device (admin).
- `espnowworker` — Configure worker status reporting: 'espnowworker [show|on|off|interval <ms>|fields <list>]'. · `espnowworker [show|on|off|interval <ms>|fields <heap,rssi,thermal,imu>]`
- `espnowsensorstream` — Enable/disable sensor data streaming to master (worker only): 'espnowsensorstream <sensor> <on|off>'. (local toggle; streamed data lands on the master's espnowsensorstatus) · `espnowsensorstream <thermal|tof|imu|gps|input|fmradio|camera|microphone|rtc|presence|apds> <on|off> Local on/off toggle; the worker then streams to the master, viewable there via 'espnowsensorstatus' / GET /api/sensors/remote.`
- `espnowsensorstatus` — Show remote sensor cache (master) or worker streaming status (worker).
- `espnowsensorbroadcast` — Enable/disable all sensor ESP-NOW communication: 'espnowsensorbroadcast <on|off>'. · `espnowsensorbroadcast [on|off]`
- `espnowacceptsensorcontrol` *(admin)* — Worker: opt in to honor SENSOR_REQ from the configured master/backup: 'espnowacceptsensorcontrol <on|off>'. · `espnowacceptsensorcontrol <on|off>` _(setting · bool · default off)_
- `espnowmasterfingerprint` *(admin)* — Worker: set the authorized PRIMARY-master Ed25519 fingerprint (64-hex; empty=deny). · `espnowmasterfingerprint <64-hex-pubkey>` _(setting · string · default (empty))_
- `espnowbackupfingerprint` *(admin)* — Worker: set the authorized BACKUP-master Ed25519 fingerprint (64-hex; empty=deny). · `espnowbackupfingerprint <64-hex-pubkey>` _(setting · string · default (empty))_
- `espnowsensorreq` *(admin)* — TEST (Phase 1b): hand-send a SENSOR_REQ to a paired worker. · `espnowsensorreq <MAC|name> <mask> <mode 0=sub|1=unsub|2=oneshot> <intervalMs> <leaseMs>`
- `espnowusersync` *(super admin)* — Enable/disable user credential sync: 'espnowusersync [on|off]'. · `espnowusersync [on|off]` _(setting · bool · default off)_
- `espnowrequestmeta` — Request metadata from peer: 'espnowrequestmeta <name_or_mac>'. (async - updates cache; view with espnowdevices) · `espnowrequestmeta <name_or_mac> Returns OK on delivery; the peer's name/room/zone/tags arrive later and update the local peer cache shown by 'espnowdevices' / 'espnowrooms' / 'espnowfind'.`
- `bondconnect` *(admin)* — Connect to bonded peer device: 'bondconnect <mac_or_name>'. (async - bond establishes when peer is seen; watch bondstatus) · `bondconnect <mac_or_name> Returns immediately; the bond completes when the peer appears via heartbeat - watch 'bondstatus'.`
- `bonddisconnect` *(admin)* — Disconnect from bonded peer device.
- `bondstatus` — Show bond mode status and configuration.
- `bondrole` *(admin)* — Get/set bond mode role: 'bondrole [master|worker]' (no arg shows current role). · `bondrole [master|worker] (no arg shows current role)` _(setting · enum · default 0 (Worker (compute/network)) · options 0=Worker (compute/network), 1=Master (display/gamepad))_
- `bondshowcap` — Show local device capability summary.
- `bondrequestcap` *(admin)* — Request capability summary from bonded peer. (async - remote cap via GET /api/bond/status; note bondshowcap shows LOCAL cap)
- `bondshowmanifest` — Show local device manifest (UI apps + CLI commands).
- `bondrequestmanifest` *(admin)* — Request full manifest from bonded peer. (async - view with bondshowremotemanifest)
- `bondrequestsettings` *(admin)* — Request settings file from bonded peer. (async - cached; read via GET /api/bond/settings)
- `bondrequestschema` *(admin)* — Request settings schema from bonded peer. (async - cached; read via GET /api/bond/settings/schema)
- `bondresync` *(admin)* — Force re-sync of bond state (cap+manifest+settings+schema). Use when UI is stuck on 'Establishing Bond' or peer state looks stale. (async - results populate as they arrive) · `bondresync [--cap|--manifest|--settings|--schema|--all] Returns OK on dispatch; results arrive over time - view via 'bondshowremotemanifest' and GET /api/bond/status, /api/bond/settings, /api/bond/settings/schema.`
- `bondshowremotemanifest` — Show cached remote manifest(s): 'bondshowremotemanifest [fwHash]'. · `bondshowremotemanifest [<fwHash>]`
- `bondstream` *(admin)* — Toggle bond sensor streaming (works on both roles): 'bondstream <sensor> <on|off>'. WORKER streams its sensor to the bonded master; MASTER commands the bonded worker to start/stop. (local toggle; data lands on the master's espnowsensorstatus) · `bondstream <sensor> <on|off> bondstream (show status) On a WORKER: streams this device's sensor to the bonded master. On a MASTER: tells the bonded worker to start/stop that sensor. Streamed data is viewable on the master via 'espnowsensorstatus' / GET /api/sensors/remote.`
- `bondtestsensor` *(admin)* — Test v3 sensor data transmission (worker only - a master cannot send sensor data): 'bondtestsensor [sensor_type]'. (async - frame appears on the master via espnowsensorstatus) · `bondtestsensor [thermal|tof|imu|gps|input|fmradio|rtc|presence] (worker only) Returns OK on send; the test frame appears on the bonded master's remote-sensor cache ('espnowsensorstatus' / GET /api/sensors/remote).`
- `espnowsetpassphrase` *(super admin)* — Set encryption passphrase on a mesh: 'espnowsetpassphrase <mesh> <phrase>'. · `espnowsetpassphrase <mesh> <passphrase> espnowsetpassphrase <mesh> clear`
- `espnowencstatus` *(admin)* — Show ESP-NOW encryption status and key fingerprint.
- `espnowpairsecure` *(admin)* — Pair device with encryption: 'espnowpairsecure <mac> <name> [mesh]'. (local pair is synchronous; secure channel completes async - see espnowsessions) · `espnowpairsecure <mac_address> <device_name> [mesh] Requires a mesh passphrase first - run 'espnowsetpassphrase <mesh> <passphrase>'. The device is added synchronously; KEY_EX then runs asynchronously (~100ms) so the encrypted channel becomes usable shortly after - inspect with 'espnowsessions' / 'espnowencstatus'.`
- `espnowpairmode` *(admin)* — Open the discovery window: 'espnowpairmode [seconds|off|status]'. Open on BOTH same-mesh devices, then 'espnowdiscovered' to see + pair. No auto-pair. · `espnowpairmode [<seconds>|off|status] Default 120s, max 600. Requires a mesh passphrase set on both devices (same mesh). While open, the device broadcasts a discovery beacon and RECORDS other same-mesh devices it hears (see 'espnowdiscovered') — it no longer auto-pairs. Pair from the list with 'espnowpairsecure <mac> <name>'.`
- `espnowdiscovered` *(admin)* — List devices found during discovery: 'espnowdiscovered [clear]'. Pair one with 'espnowpairrequest <mac_or_name>'. · `espnowdiscovered [clear] Lists same-mesh devices heard while your discovery window ('espnowpairmode') is open.`
- `espnowpairrequest` *(admin)* — Request a pair with a discovered device: 'espnowpairrequest <mac_or_name>'. The other device must Accept. · `espnowpairrequest <mac_or_name> (name/MAC from 'espnowdiscovered') Sends a request; the target shows an Accept prompt (or run 'espnowaccept' there).`
- `espnowaccept` *(admin)* — Accept a pending incoming pair request: 'espnowaccept [<mac_or_name>]'. · `espnowaccept [<mac_or_name>] (no arg = the sole pending request)`
- `espnowreject` *(admin)* — Reject a pending incoming pair request: 'espnowreject [<mac_or_name>]'. · `espnowreject [<mac_or_name>]`
- `teststreams` — Test topology stream management functions.
- `testconcurrent` — Test concurrent topology streams (simulated).
- `testcleanup` — Test cleanup of stale topology streams.
- `testfilelock` — Test file transfer lock acquire/release.
- `espnowenabled` *(admin)* — Enable/disable ESP-NOW (0|1, takes effect after reboot). · `espnowenabled <0|1>` _(setting · bool · default off)_
- `espnowfirsttimesetup` *(admin)* — Set first time setup flag: <0|1> · `espnowfirsttimesetup <0|1>` _(setting · bool · default off)_
- `espnowheartbeatinterval` *(admin)* — Set master heartbeat interval: <1000-60000 ms> · `espnowheartbeatinterval <1000..60000>` _(setting · int 1000–60000 · default 10000)_
- `espnowfailovertimeout` *(admin)* — Set failover timeout: <5000-120000 ms> · `espnowfailovertimeout <5000..120000>` _(setting · int 5000–120000 · default 20000)_
- `espnowworkerstatusinterval` *(admin)* — Set worker status interval: <5000-120000 ms> · `espnowworkerstatusinterval <5000..120000>` _(setting · int 5000–120000 · default 30000)_
- `espnowtopodiscoveryinterval` *(admin)* — Set topology discovery interval: <0-300000 ms> · `espnowtopodiscoveryinterval <0..300000>` _(setting · int 0–300000 · default 0)_
- `espnowtopoautorefresh` *(admin)* — Set auto refresh topology: <0|1> · `espnowtopoautorefresh <0|1>` _(setting · bool · default off)_
- `espnowheartbeatbroadcast` *(admin)* — Set heartbeat broadcast: <0|1> · `espnowheartbeatbroadcast <0|1>` _(setting · bool · default on)_
- `espnowmeshrelay` *(admin)* — Carry other nodes' mesh traffic: <0|1> · `espnowmeshrelay <0|1> 1 (default) = act as a relay so out-of-range peers can reach each other through this node. 0 = stop forwarding for others. This node still uses multi-hop for its OWN traffic (set espnowmeshttl 1 for that), and stops advertising routes so nobody sends via it.` _(setting · bool · default on)_
- `espnowmeshpeermax` *(admin)* — Set max peer slots: <1-16> (reboot required) · `espnowmeshpeermax <1..16>` _(setting · int 1–16 · default 8)_
- `espnowsensorbroadcastinterval` *(admin)* — Set sensor broadcast interval: <100-10000 ms> · `espnowsensorbroadcastinterval <100..10000>` _(setting · int 100–10000 · default 1000)_
- `espnowbondmodeenabled` *(admin)* — Enable/disable bond mode: <0|1> · `espnowbondmodeenabled <0|1>` _(setting · bool · default off)_
- `espnowbondpeermac` *(admin)* — Set bond peer MAC address · `espnowbondpeermac <AA:BB:CC:DD:EE:FF>` _(setting · string · default (empty))_
- `bondstreamthermal` *(admin)* — Set auto-stream thermal: <0|1> · `bondstreamthermal <0|1>` _(setting · bool · default off)_
- `bondstreamtof` *(admin)* — Set auto-stream ToF: <0|1> · `bondstreamtof <0|1>` _(setting · bool · default off)_
- `bondstreamimu` *(admin)* — Set auto-stream IMU: <0|1> · `bondstreamimu <0|1>` _(setting · bool · default off)_
- `bondstreamgps` *(admin)* — Set auto-stream GPS: <0|1> · `bondstreamgps <0|1>` _(setting · bool · default off)_
- `bondstreaminput` *(admin)* — Set auto-stream input device: <0|1> · `bondstreaminput <0|1>` _(setting · bool · default off)_
- `bondstreamfmradio` *(admin)* — Set auto-stream FM radio: <0|1> · `bondstreamfmradio <0|1>` _(setting · bool · default off)_
- `bondstreamrtc` *(admin)* — Set auto-stream RTC: <0|1> · `bondstreamrtc <0|1>` _(setting · bool · default off)_
- `bondstreampresence` *(admin)* — Set auto-stream presence: <0|1> · `bondstreampresence <0|1>` _(setting · bool · default off)_

### `c6` — ESP32-C6 radio companion (ESP-Hosted)

_Requires `HW1_RADIO_COMPANION`._

**Firmware module overview (context):** On the ESP32-P4X-EYE the Wi-Fi, Bluetooth and ESP-NOW radio is a separate ESP32-C6 that the P4 drives over SDIO (ESP-Hosted). c6status reports its firmware, the ESP-NOW bridge, heartbeat, memory and recovery counters; c6restart resets it in place; c6hold turns the radio fully off by holding the C6 in reset and brings it back; c6update flashes a new companion image over SDIO with rollback protection and c6confirm accepts the running image; c6autorecover, c6autohold and c6heartbeat tune the background monitor. Radio features never start while the companion is offline, and a companion that stops answering is recovered without rebooting the P4.

- `c6status` — ESP32-C6 companion status: firmware, bridge, heartbeat, memory, recovery (add 'json').
- `c6restart` *(admin)* — Restart the C6 companion in place (radio features stop and come back).
- `c6hold` *(admin)* — Hold the C6 in reset (radio fully off) or release it: c6hold [on|off]. · `c6hold [on|off] on - stop Wi-Fi, Bluetooth and ESP-NOW and hold the companion in reset off - release it and restore what was running`
- `c6update` *(super admin)* — Flash companion firmware from a file over SDIO: c6update "<path>". · `c6update "/sd/firmware/network_adapter.bin" The file must be an ESP32-C6 image built by tools/p4/companion (it is checked for the ESP-NOW bridge marker before anything is sent).`
- `c6confirm` *(admin)* — Confirm the companion's running image so it cannot roll back.
- `c6console` *(admin)* — Mirror the C6's own console into the P4 log: c6console [on|off].
- `c6autorecover` *(admin)* — Auto-recover the companion after an outage: c6autorecover [on|off] (persists). _(setting · bool · default on)_
- `c6autohold` *(admin)* — Hold the companion in reset while no radio feature runs: c6autohold [on|off] (persists). _(setting · bool · default off)_
- `c6heartbeat` *(admin)* — Companion heartbeat interval in seconds, 0 disables the watchdog: c6heartbeat <0..60> (persists). _(setting · int 0–60 · default 5)_

### `mqtt` — MQTT broker connection for Home Assistant

_Requires `ENABLE_MQTT`._

**Firmware module overview (context):** The MQTT subsystem connects the device to a broker, primarily to publish its sensor and system telemetry to Home Assistant via HA discovery. It is almost entirely configuration: broker host/port (mqttHost, mqttPort), credentials (mqttUser, mqttPassword), TLS mode and CA path, base/discovery topics, publish interval, and a long list of per-source publish toggles (mqttPublishThermal, mqttPublishIMU, and so on). These are persisted settings and most config commands are admin-only; after changing them, reconnect with closemqtt/openmqtt to apply to a live session. openmqtt and closemqtt start and stop the client, mqttstatus shows connection state, and mqttautostart controls whether it connects at boot. For inbound data, enable mqttSubscribeExternal with mqttSubscribeTopics; values received from those topics are cached and read back with mqttExternalSensors.

- `mqttclientenabled` *(admin)* — Enable/disable MQTT [0|1] · `mqttclientenabled [0|1]` _(setting · bool · default off)_
- `openmqtt` *(admin)* — Start MQTT client
- `closemqtt` *(admin)* — Stop MQTT client
- `mqttstatus` — Show MQTT status (add 'json' for JSON output)
- `mqttautostart` *(admin)* — MQTT auto-start [0|1] · `mqttautostart [0|1]` _(setting · bool · default off)_
- `mqttHost` *(admin)* — MQTT broker host [hostname] · `mqttHost [hostname]` _(setting · string · default (empty))_
- `mqttPort` *(admin)* — MQTT broker port [port] · `mqttPort [port]` _(setting · int 1–65535 · default 1883)_
- `mqttTLSMode` *(admin)* — TLS mode [0|1|2] · `mqttTLSMode [0|1|2|none|tls|verify]` _(setting · enum · default 0 (None) · options 0=None, 1=TLS, 2=TLS+Verify)_
- `mqttCACertPath` *(admin)* — CA cert path [path|clear] · `mqttCACertPath [path|clear]` _(setting · string · default "/system/certs/mqtt_ca.crt")_
- `mqttSubscribeExternal` *(admin)* — External subscriptions [0|1] · `mqttSubscribeExternal [0|1]` _(setting · bool · default off)_
- `mqttSubscribeTopics` *(admin)* — Subscribe topics [topics] · `mqttSubscribeTopics [topic1,topic2,...]` _(setting · string · default (empty))_
- `mqttExternalSensors` — List external sensor data (add 'json' for JSON output)
- `mqttUser` *(admin)* — MQTT username [user|clear] · `mqttUser [username|clear]` _(setting · string · default (empty))_
- `mqttPassword` *(admin)* — MQTT password [pass|clear] · `mqttPassword [password|clear]` _(setting · string · default (hidden) · secret)_
- `mqttBaseTopic` *(admin)* — Base topic [topic|auto] · `mqttBaseTopic [topic|auto]` _(setting · string · default (empty))_
- `mqttDiscoveryPrefix` *(admin)* — HA discovery prefix [prefix] · `mqttDiscoveryPrefix [prefix]` _(setting · string · default "homeassistant")_
- `mqttPublishIntervalMs` *(admin)* — Publish interval [ms] · `mqttPublishIntervalMs [1000-300000]` _(setting · int 1000–300000 · default 10000)_
- `mqttPublishWiFi` *(admin)* — Publish WiFi [0|1] · `mqttPublishWiFi [0|1]` _(setting · bool · default off)_
- `mqttPublishSystem` *(admin)* — Publish system [0|1] · `mqttPublishSystem [0|1]` _(setting · bool · default off)_
- `mqttPublishThermal` *(admin)* — Publish thermal [0|1] · `mqttPublishThermal [0|1]` _(setting · bool · default off)_
- `mqttPublishToF` *(admin)* — Publish ToF [0|1] · `mqttPublishToF [0|1]` _(setting · bool · default off)_
- `mqttPublishIMU` *(admin)* — Publish IMU [0|1] · `mqttPublishIMU [0|1]` _(setting · bool · default off)_
- `mqttPublishPresence` *(admin)* — Publish presence [0|1] · `mqttPublishPresence [0|1]` _(setting · bool · default off)_
- `mqttPublishGPS` *(admin)* — Publish GPS [0|1] · `mqttPublishGPS [0|1]` _(setting · bool · default off)_
- `mqttPublishAPDS` *(admin)* — Publish APDS [0|1] · `mqttPublishAPDS [0|1]` _(setting · bool · default off)_
- `mqttPublishRTC` *(admin)* — Publish RTC [0|1] · `mqttPublishRTC [0|1]` _(setting · bool · default off)_
- `mqttPublishInput` *(admin)* — Publish input device data [0|1] · `mqttPublishInput [0|1]` _(setting · bool · default off)_

### `bluetooth` — Bluetooth LE control and status

_Requires `ENABLE_BLUETOOTH`._

**Firmware module overview (context):** The Bluetooth subsystem runs the device BLE stack in one of two mutually exclusive roles selected by blemode: server mode (the device advertises and a phone/app connects to it) or client mode (the device acts as a BLE central for Even G2 glasses; the even_g2 commands then apply). Switching modes tears down the other role automatically. In server mode, openble/closeble start and stop advertising, blesend pushes a one-off message and bleevent an event to the connected client, and blestream toggles periodic pushes as a bitmask of sensors/system/events (blestream on/off/sensors/system/events, plus interval) -- all of which require an active connection. An app-layer Secure Channel (X25519 + passphrase + ChaCha20-Poly1305, independent of BLE bonding) is configured with blesecret and required with blesecure; both are admin-only, as is blerequireauth. Boot reconnection to saved-MAC peers is per-peer via bleautoreconnect <name> [on|off] (see blepeers for names).

- `openble` *(admin)* — Start Bluetooth LE and begin advertising.
- `closeble` *(admin)* — Stop Bluetooth LE and deinitialize.
- `bleread` — Read Bluetooth connection status. (add 'json' for JSON output)
- `blestatus` — Show Bluetooth connection status. (add 'json' for JSON output)
- `bleinfo` — Show BLE configuration and settings. (add 'json' for JSON output)
- `blename` — Get/set BLE device name [name]. · `blename [name]` _(setting · string · default "HardwareOne")_
- `bletxpower` — Get/set BLE TX power [0-7]. · `bletxpower [0..7]` _(setting · int 0–7 · default 3)_
- `bledisconnect` *(admin)* — Disconnect current BLE client.
- `bleadv` *(admin)* — Start/stop/toggle BLE advertising [start|stop|toggle]. · `bleadv [start|stop|toggle]`
- `blesend` — Send message to BLE client: <message>. · `blesend <message>`
- `blestream` — Control streaming: <on|off|sensors|system|events|interval>. · `blestream [on|off|sensors|system|events|interval] | interval <sensor_ms> <system_ms>`
- `bleevent` — Send event to BLE client: <event>. · `bleevent <message>`
- `bleautostart` *(admin)* — Enable/disable BLE auto-start after boot [on|off]. · `bleautostart [on|off]` _(setting · bool · default off)_
- `blerequireauth` *(super admin)* — Enable/disable BLE authentication requirement [on|off]. · `blerequireauth [on|off]` _(setting · bool · default on)_
- `blemode` *(admin)* — Get/set BLE mode [server|client]. · `blemode [server|client]` _(setting · enum · default kBleModeDefaultForBuild · options 0=Server, 1=Client (G2))_
- `blesecret` *(super admin)* — Set/clear the BLE Secure Channel passphrase: blesecret <phrase|clear>. · `blesecret <passphrase|clear>` _(setting · string · default (hidden) · secret)_
- `blesecure` *(admin)* — Require app-layer BLE encryption [on|off]. · `blesecure [on|off]` _(setting · bool · default on)_
- `bleautoreconnect` *(admin)* — Per-peer auto-reconnect (boot + mid-session drop): bleautoreconnect <name> [on|off]. `blepeers` lists names. · `bleautoreconnect <peer-name> [on|off] on: reconnect at boot and reseek after unexpected drops (not after ringdisconnect/closeg2)`
- `blepeers` — List all registered BLE peers and their state.

### `filesystem` — File operations and storage management

_Always compiled._

**Firmware module overview (context):** Manages files and directories on the device internal LittleFS flash. Browse with files ["/path"] (add json for app/BLE, or files stats json for storage usage); create and remove with mkdir, rmdir, filecreate, and filedelete; view and rename with fileview and filerename. Critically, every path argument MUST be wrapped in double quotes, e.g. fileview "/system/notes" -- an unquoted or unmatched-quote path is rejected, and a leading slash is added automatically. For programmatic transfer, fileread and filewrite move data in chunks: fileread returns {success,size,offset,len,eof,enc,data} and you loop offset until eof, while filewrite is strictly sequential -- offset 0 truncates/creates the file, each later offset must equal the current file size, and passing final runs the post-save hooks. Access is permission-gated per path: system trees like /system are read-only (or browse-only) for admins, while user data is fully writable; logtier reports whether logs are writing to LittleFS or have spilled into SD overflow.

- `files` *(admin)* — List files ["path"] | files json ["path"] | files stats json ["path"] · `files ["path"] - List files in LittleFS (default '/') files json ["path"] - List as JSON (app/BLE): {success,dirPerms,files[]} files stats json ["path"] - Storage usage JSON for the path's tier Paths are always double-quoted, e.g. files "/logging_captures"`
- `mkdir` *(admin)* — Create directory: "<path>" · `mkdir "<path>"`
- `rmdir` *(admin)* — Remove directory: "<path>" · `rmdir "<path>"`
- `filecreate` *(admin)* — Create file: "<path>" · `filecreate "<path>"`
- `fileview` *(admin)* — View file (paged): "<path>" [page] · `fileview "<path>" [page] (pages are ~3.5KB, split at line boundaries)`
- `fileread` *(admin)* — Read file chunk as JSON: "<path>" [offset] [len] [b64|bin] · `fileread "<path>" [offset] [len] [b64|bin] - Chunked permission-guarded read (app/BLE). Returns {success,size,offset,len,eof,enc,data}; loop offset until eof. `bin` (established BLE Secure Channel only): sends the chunk as a raw binary frame and omits `data` (enc:"raw") — no base64 expansion, for fast bulk transfers like maps.`
- `filewrite` *(admin)* — Write file chunk: "<path>" <offset> <b64chunk> [final] · `filewrite "<path>" <offset> <b64chunk> [final] - Sequential chunked write (app/BLE). offset 0 truncates/creates; later offsets must equal current size; 'final' runs post-save hooks.`
- `filedelete` *(admin)* — Delete file: "<path>" [confirm] · `filedelete "<path>" [confirm]`
- `filerename` *(admin)* — Rename file: "<oldpath>" "<newname>" · `filerename "<oldpath>" "<newname>"`
- `logtier` — Show current log storage tier (LittleFS vs SD overflow). · `logtier - Report which tier logs are writing to and free space on each. [json]`

### `sd` — SD card mount, format, and info

_Requires `ENABLE_SD_CARD`._

**Firmware module overview (context):** Controls the optional microSD card, which mounts at /sd and serves as overflow/bulk storage (and is only compiled in on boards that wire a supported SPI or SDMMC slot). sdmount attempts to mount the card and sdunmount safely unmounts it; sdinfo shows the card type, size, and used/free space, and sddiag reports backend-specific diagnostics to troubleshoot a card that will not mount. sdformat erases the entire card and reformats it as FAT32 and therefore requires sdformat confirm to proceed. Once mounted, file commands address the card through its /sd/... path prefix.

- `sdmount` — Mount SD card · `sdmount - Attempt to mount SD card at /sd`
- `sdunmount` *(admin)* — Unmount SD card · `sdunmount - Safely unmount SD card`
- `sdformat` *(super admin)* — Format SD card as FAT32 · `sdformat confirm - Format SD card (WARNING: erases all data)`
- `sdinfo` — Show SD card information · `sdinfo - Display SD card type, size, and usage [json]`
- `sddiag` — SD card hardware diagnostics · `sddiag - Show SD transport diagnostics (SPI boards also run a bus test)`

### `oled` — Local display control and graphics

_Always compiled._

**Firmware module overview (context):** Drives the selected local display backend: its lifecycle, the live screen contents, and persistent appearance settings. oledstart/oledstop (aliases openoled/closeoled) power the display task on and off, and oledstatus (alias oledread) reports its state. oledmode <mode> switches the live screen among the built-in views (menu, status, sensordata, thermal, network, mesh, gps, espnow, memory, off, and more); oledtext <message> shows custom text and oledanim <name>|fps <n> picks the animation -- both require the display to be running (run oledstart first) and neither persists across reboot. Separately, the oled* config commands write settings to flash immediately: oledbootmode and oleddefaultmode set the screen shown at boot and as the idle default, while oledbrightness <0-255>, oledflip, oledbootduration, oledupdateinterval, oledthermalscale, oledthermalcolormode, and oledenabled tune appearance and timing. oledrequireauth <0|1> (admin-only) controls whether a user must log in at the display before interacting with it.

- `openoled` — Start OLED display.
- `closeoled` — Stop OLED display.
- `oledread` — Read OLED display status. (add 'json' for JSON output)
- `oledstart` — Start OLED display.
- `oledstop` — Stop OLED display.
- `oledmode` — Set display mode: <mode> · `oledmode <menu|status|sensordata|sensorlist|thermal|network|mesh|gps|text|logo|anim|imuactions|fmradio|files|automations|espnow|memory|off> Example: oledmode memory Example: oledmode off`
- `oledtext` — Set custom text: <message> · `oledtext <message>`
- `oledanim` — Select animation: <name> or fps <1-60> · `oledanim <name> oledanim fps <1-60>`
- `oledclear` — Clear OLED display.
- `oledstatus` — Show OLED status. (add 'json' for JSON output)
- `oledrequireauth` *(admin)* — OLED auth requirement: <0|1> · `oledrequireauth <0|1>` _(setting · bool · default on)_
- `oledenabled` — Enable/disable OLED: <0|1> · `oledenabled <0|1>` _(setting · bool · default off)_
- `oledbootmode` — OLED boot mode: <logo|status|sensors|thermal|network|mesh|off> · `oledbootmode <logo|status|sensors|thermal|network|mesh|off>` _(setting · enum · default "logo" · options logo, status, sensors, thermal, network, mesh, off)_
- `oleddefaultmode` — OLED default mode: <logo|status|sensors|thermal|network|mesh|off> · `oleddefaultmode <logo|status|sensors|thermal|network|mesh|off>` _(setting · enum · default "status" · options logo, status, sensors, thermal, network, mesh, off)_
- `oledbootduration` — Boot animation duration (ms): <500-10000> · `oledbootduration <500..10000>` _(setting · int 500–10000 · default 2000)_
- `oledupdateinterval` — Display update interval (ms): <10-1000> · `oledupdateinterval <10..1000>` _(setting · int 10–1000 · default 125)_
- `oledbrightness` — Display brightness: <0-255> · `oledbrightness <0..255>` _(setting · int 0–255 · default 255)_
- `oledflip` — Flip display 180°: [on|off|toggle] · `oledflip [on|off|toggle]` _(setting · bool · default off)_
- `oledthermalscale` — Thermal image scale: <0.1-10.0> · `oledthermalscale <0.1..10.0>` _(setting · float · default 2.5)_
- `oledthermalcolormode` — Thermal color mode: <3level|grayscale> · `oledthermalcolormode <3level|grayscale>` _(setting · enum · default "3level" · options 3level, grayscale)_

### `neopixel` — RGB LED strip and effects

_Requires `ENABLE_NEOPIXEL`._

**Firmware module overview (context):** Controls the addressable RGB status LED (WS2812/NeoPixel). ledcolor <name> lights it a solid color from a fixed palette (red, green, blue, yellow, magenta, cyan, white, orange, purple, pink), and ledclear turns it off. ledeffect <fade|blink|pulse|strobe> [color] [color2] [duration 100-60000ms] runs an animated effect (defaults: red/blue, 3000 ms; ledeffect off clears it). These commands change the LED immediately and are not saved -- the persistent power-on brightness and startup animation live in the led settings module, not here. Note the effect call runs synchronously for its full duration before returning.

- `ledcolor` — Set LED color: <color> · `ledcolor <red|green|blue|yellow|magenta|cyan|white|orange|purple|pink>`
- `ledclear` — Turn off LED.
- `ledeffect` — Run LED effect: <effect> · `ledeffect <fade|pulse|blink|rainbow|strobe|off> [color] [color2] [duration 100..60000]`

### `led` — LED brightness and startup effects

_Requires `ENABLE_NEOPIXEL`._

**Firmware module overview (context):** Configures the board onboard single LED -- its brightness and the one-shot effect played at startup. These are persistent settings written to flash, not live controls: ledbrightness <0-100> sets the global brightness, ledstartupenabled <0|1> toggles the boot effect, and ledstartupeffect <none|rainbow|pulse|fade|blink|strobe> with ledstartupcolor, ledstartupcolor2, and ledstartupduration <100-10000ms> define what plays on power-up. (The live, immediate RGB controls are the separate ledcolor/ledeffect commands in the neopixel module.)

- `ledbrightness` — Set LED brightness 0-100. · `ledbrightness <0..100>` _(setting · int 0–100 · default 100)_
- `ledstartupenabled` — Enable/disable LED startup effect [0|1]. · `ledstartupenabled <0|1>` _(setting · bool · default on)_
- `ledstartupeffect` — Set LED startup effect [none|rainbow|pulse|fade|blink|strobe]. · `ledstartupeffect <none|rainbow|pulse|fade|blink|strobe>` _(setting · enum · default "rainbow" · options none, rainbow, pulse, fade, blink, strobe)_
- `ledstartupcolor` — Set LED startup primary color (any of ~80 named colors or 'off'; unknown defaults to cyan). · `ledstartupcolor <color name|off> (any of ~80 named colors; unknown names default to cyan)` _(setting · string · default "cyan")_
- `ledstartupcolor2` — Set LED startup secondary color (any of ~80 named colors or 'off'; unknown defaults to magenta). · `ledstartupcolor2 <color name|off> (any of ~80 named colors; unknown names default to magenta)` _(setting · string · default "magenta")_
- `ledstartupduration` — Set LED startup effect duration in ms. · `ledstartupduration <100..10000>` _(setting · int 100–10000 · default 1000)_

### `matrix` — HT16K33 monochrome LED matrix

_Requires `ENABLE_LED_MATRIX`._

**Firmware module overview (context):** matrix test draws an orientation pattern. matrix text HI, matrix pixel 3 2 on, matrix clear/fill and matrix on/off control the display. matrix brightness <0-15> and matrix rotation <0-3> persist; matrix blink <0-3> selects off/2Hz/1Hz/0.5Hz. matrixbus <0|1> and matrixaddress <0x70-0x77> require reboot. matrix size 8x8 uses one square; matrix panel <0|1> selects the physical square. matrix size 16x8 restores both. Use an unused non-0x70 address when sharing a bus with a PCA9685. Static text clips at the display edge.

- `matrix` — HT16K33 LED matrix: status, clear, fill, on/off, pixel, text, brightness, rotation, blink, test
- `matrixbus` *(admin)* — Select matrix I2C bus (reboot required) · `matrixbus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `matrixaddress` *(admin)* — Select matrix address (reboot required) · `matrixaddress <0x70..0x77>` _(setting · enum · default 112 (0x70) · options 112=0x70, 113=0x71, 114=0x72, 115=0x73, 116=0x74, 117=0x75, 118=0x76, 119=0x77)_

### `servo` — PCA9685 servo motor control

_Requires `ENABLE_SERVO`._

**Firmware module overview (context):** The PCA9685 is a 16-channel I2C PWM driver used to control hobby servos (and generic PWM outputs) without tying up the ESP32 own timers. servo <channel> <angle> moves the servo on a channel to an angle, while pwm <channel> <value> [freq] writes a raw PWM duty (and optional frequency) for non-servo loads like LEDs or motor drivers. Because different servos expect different pulse ranges, servoprofile <ch> <minPulse> <maxPulse> <centerPulse> <name> stores a per-channel calibration that maps angles to the correct pulse widths (servolist shows the saved profiles), and servocalibrate <channel> opens an interactive mode to find those pulse limits by hand.

- `servo` — Control servo motor: servo <channel> <angle>. · `servo <channel> <angle>`
- `pwm` — Set PWM output: pwm <channel> <value> [freq]. · `pwm <channel> <value> [freq]`
- `servoprofile` — Configure servo profile: servoprofile <ch> <minPulse> <maxPulse> <centerPulse> <name>. · `servoprofile <ch> <minPulse> <maxPulse> <centerPulse> <name>`
- `servolist` — List configured servo profiles. (add 'json' for JSON output)
- `servocalibrate` — Enter calibration mode: servocalibrate <channel>. · `servocalibrate <channel>`
- `servobus` *(admin)* — Route PCA9685 servo to bus: <0|1> (reboot required) · `servoBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `thermal` — MLX90640 thermal camera (32x24)

_Requires `ENABLE_THERMAL_SENSOR`._

**Firmware module overview (context):** The MLX90640 is a 32x24 (768-pixel) infrared thermal camera. openthermal starts it, thermalread reports the current frame min/max/avg temperature in Celsius, and closethermal stops it; thermalautostart [on|off] persists launching it at boot, and it runs on the fixed secondary I2C bus (Wire1). The sensor runs in chess-pattern mode at 16-bit ADC resolution, with thermaltargetfps <1..8> selecting the device refresh rate. Display tuning is extensive: thermalpalettedefault picks the color map (grayscale, iron, rainbow, hot, or coolwarm), thermalrotation <0..3> rotates the image 0/90/180/270 degrees, and thermalupscalefactor plus the thermalinterpolation* commands smooth and enlarge the 32x24 grid for the web/OLED view. Frame readings are stabilized by temporal/EWMA smoothing, per-pixel outlier rejection, and an optional rolling min/max auto-scale that keeps the color scale from flickering; thermaldiag prints a hardware self-check.

- `openthermal` — Start MLX90640 thermal sensor.
- `closethermal` — Stop MLX90640 thermal sensor.
- `thermalread` — Read thermal frame; min/max/avg broadcast to output. (add 'json' for JSON output)
- `thermalpollingms` *(admin)* — Thermal UI polling: <50..5000> · `thermalpollingms <50..5000>` _(setting · int 50–5000 · default 250)_
- `thermalpalettedefault` *(admin)* — Thermal palette: <grayscale|iron|rainbow|hot|coolwarm> · `thermalpalettedefault <grayscale|iron|rainbow|hot|coolwarm>` _(setting · enum · default "grayscale" · options grayscale, iron, rainbow, hot, coolwarm)_
- `thermalewmafactor` *(admin)* — Thermal EWMA factor: <0.0..1.0> · `thermalewmafactor <0.0..1.0>` _(setting · float · default 0.2)_
- `thermaltransitionms` *(admin)* — Thermal transition time: <0..5000> · `thermaltransitionms <0..5000>` _(setting · int 0–5000 · default 80)_
- `thermalupscalefactor` *(admin)* — Thermal upscale factor: <1..4> · `thermalupscalefactor <1..4>` _(setting · int 1–4 · default 1)_
- `thermalrollingminmaxenabled` *(admin)* — Thermal rolling min/max: <0|1> · `thermalrollingminmaxenabled <0|1>` _(setting · bool · default on)_
- `thermalrollingminmaxalpha` *(admin)* — Thermal rolling alpha: <0.0..1.0> · `thermalrollingminmaxalpha <0.0..1.0>` _(setting · float · default 0.6)_
- `thermalrollingminmaxguardc` *(admin)* — Thermal rolling guard: <0.0..10.0> · `thermalrollingminmaxguardc <0.0..10.0>` _(setting · float · default 0.3)_
- `thermaltemporalalpha` *(admin)* — Thermal temporal alpha: <0.0..1.0> · `thermaltemporalalpha <0.0..1.0>` _(setting · float · default 0.5)_
- `thermalrotation` *(admin)* — Thermal rotation: <0|1|2|3> · `thermalrotation <0|1|2|3> (0=0°, 1=90°, 2=180°, 3=270°)` _(setting · enum · default 0 (0°) · options 0=0°, 1=90°, 2=180°, 3=270°)_
- `thermalinterpolationenabled` *(admin)* — Thermal interpolation: <0|1> · `thermalinterpolationenabled <0|1>` _(setting · bool · default on)_
- `thermalinterpolationsteps` *(admin)* — Thermal interp steps: <1..8> · `thermalinterpolationsteps <1..8>` _(setting · int 1–8 · default 5)_
- `thermalinterpolationbuffersize` *(admin)* — Thermal interp buffer: <1..10> · `thermalinterpolationbuffersize <1..10>` _(setting · int 1–10 · default 2)_
- `thermaltargetfps` *(admin)* — Thermal target FPS: <1..8> · `thermalTargetFps <1..8>` _(setting · int 1–8 · default 8)_
- `thermaldevicepollms` *(admin)* — Thermal device poll: <100..2000> · `thermalDevicePollMs <100..2000>` _(setting · int 100–2000 · default 100)_
- `thermali2cclockhz` *(admin)* — Thermal I2C clock: <100000..1000000> · `thermalI2cClockHz <100000..1000000>` _(setting · int 100000–1000000 · default 400000)_
- `thermalwebmaxfps` *(admin)* — Thermal web max FPS: <1..30> · `thermalWebMaxFps <1..30>` _(setting · int 1–30 · default 10)_
- `thermaldiag` — Run thermal sensor diagnostics.
- `thermalautostart` — Enable/disable thermal auto-start after boot [on|off] · `thermalautostart [on|off]` _(setting · bool · default off)_
- `thermalbus` *(admin)* — Route MLX90640 thermal to bus: <0|1> (reboot required) · `thermalBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `tof` — VL53L4CX time-of-flight distance sensor

_Requires `ENABLE_TOF_SENSOR`._

**Firmware module overview (context):** The VL53L4CX is a laser time-of-flight ranging sensor that measures distance to nearby objects. opentof starts it, tofread reports the closest valid distance in centimeters (or full object data as JSON), and closetof stops it; tofautostart [on|off] persists launching it at boot, and it runs on the fixed secondary I2C bus (Wire1). It is configured for LONG distance mode with a 200 ms timing budget, and is multi-target: each measurement can return up to four objects, which are signal-rate-gated and exponentially smoothed before the nearest valid one is reported. Most tunables are client-side visualization knobs rather than sensor settings: tofpollingms, toftransitionms, and tofmaxdistancemm shape the UI, tofstabilitythreshold sets how steady a reading must be, and tofdevicepollms controls how often the firmware reads the hardware.

- `opentof` — Start VL53L4CX ToF sensor.
- `closetof` — Stop VL53L4CX ToF sensor.
- `tofread` — Read ToF distance sensor. (add 'json' for JSON output)
- `tofpollingms` *(admin)* — ToF UI polling: <50..5000> · `tofpollingms <50..5000>` _(setting · int 50–5000 · default 220)_
- `tofstabilitythreshold` *(admin)* — ToF stability threshold: <0..50> · `tofstabilitythreshold <0..50>` _(setting · int 0–50 · default 3)_
- `toftransitionms` *(admin)* — ToF transition time: <0..5000> · `toftransitionms <0..5000>` _(setting · int 0–5000 · default 200)_
- `tofmaxdistancemm` *(admin)* — ToF max distance: <100..10000> · `tofmaxdistancemm <100..10000>` _(setting · int 100–10000 · default 3400)_
- `tofdevicepollms` *(admin)* — ToF device poll: <100..2000> · `tofDevicePollMs <100..2000>` _(setting · int 100–2000 · default 220)_
- `tofautostart` — Enable/disable ToF auto-start after boot [on|off] · `tofautostart [on|off]` _(setting · bool · default off)_
- `tofbus` *(admin)* — Route VL53L4CX ToF to bus: <0|1> (reboot required) · `tofBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `imu` — BNO055 9-DOF orientation sensor

_Requires `ENABLE_IMU_SENSOR`._

**Firmware module overview (context):** The BNO055 is a 9-DOF inertial measurement unit providing fused absolute orientation. openimu starts it, imuread reports yaw/pitch/roll (degrees) plus acceleration, gyroscope, and chip temperature, and closeimu stops it; imuautostart [on|off] persists launching it at boot, and it runs on the fixed secondary I2C bus (Wire1) using the board external crystal. Beyond raw orientation, imuactions runs gesture/event detection derived from the motion data: shake, tilt (with direction), tap/knock, rotation (with axis), freefall, a step counter with cadence, and screen-style orientation. Because the chip can be mounted in any pose, imuorientationmode <0..8> applies a fixed remap (flip pitch/roll/yaw, 90-degree rotations, upside-down fixes), imuorientationcorrection <0|1> toggles that correction, and imupitchoffset/imurolloffset/imuyawoffset trim each axis in degrees.

- `openimu` — Start BNO055 IMU sensor.
- `closeimu` — Stop BNO055 IMU sensor.
- `imuread` — Read IMU sensor data. (add 'json' for JSON output)
- `imuactions` — Show IMU action detection state.
- `imupollingms` *(admin)* — IMU UI polling interval: <50..2000> · `imupollingms <50..2000>` _(setting · int 50–2000 · default 200)_
- `imuewmafactor` *(admin)* — IMU EWMA smoothing: <0.0..1.0> · `imuewmafactor <0.0..1.0>` _(setting · float · default 0.1)_
- `imutransitionms` *(admin)* — IMU transition time: <0..1000> · `imutransitionms <0..1000>` _(setting · int 0–1000 · default 100)_
- `imuwebmaxfps` *(admin)* — IMU web max FPS: <1..30> · `imuwebmaxfps <1..30>` _(setting · int 1–30 · default 15)_
- `imudevicepollms` *(admin)* — IMU device poll interval: <50..1000> · `imuDevicePollMs <50..1000>` _(setting · int 50–1000 · default 200)_
- `imuorientationmode` *(admin)* — IMU orientation mode: <0..8> · `imuorientationmode <0..8>` _(setting · enum · default 8 (Upside Down) · options 0=Normal, 1=Flip Pitch, 2=Flip Roll, 3=Flip Yaw, 4=Flip Pitch+Roll, 5=Roll 180 Fix, 6=Rotate 90 CCW, 7=Alt Extreme Pitch, 8=Upside Down)_
- `imuorientationcorrection` *(admin)* — IMU orientation correction: <0|1> · `imuorientationcorrection <0|1>` _(setting · bool · default on)_
- `imupitchoffset` *(admin)* — IMU pitch offset in degrees (recommended -180..180) · `imupitchoffset <degrees> (recommended -180..180)` _(setting · float · default 0.0)_
- `imurolloffset` *(admin)* — IMU roll offset in degrees (recommended -180..180) · `imurolloffset <degrees> (recommended -180..180)` _(setting · float · default 0.0)_
- `imuyawoffset` *(admin)* — IMU yaw offset in degrees (recommended -180..180) · `imuyawoffset <degrees> (recommended -180..180)` _(setting · float · default 0.0)_
- `imuautostart` — Enable/disable IMU auto-start after boot [on|off] · `imuautostart [on|off]` _(setting · bool · default off)_
- `imubus` *(admin)* — Route BNO055 IMU to bus: <0|1> (reboot required) · `imuBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `input` — Input device (gamepad or rotary encoder)

_Requires `ENABLE_OLED_INPUT`._

**Firmware module overview (context):** Device-agnostic abstraction for the OLED input controller, which is either the Seesaw gamepad, ANO encoder or GPIO rotary encoder -- chosen at compile time via INPUT_DEVICE_TYPE and mutually exclusive, so exactly one driver is present per firmware. These commands operate on whichever driver was built in: openinput starts it, closeinput stops it, inputautostart [on|off] persists boot auto-start, and inputdevicepollms <10-1000> sets the polling interval in milliseconds (default 90 for I2C devices; GPIO input uses a fixed 5 ms button sample). Driver-specific debugging and tuning live in the gamepad and anoencoder modules; this module holds only the shared settings (poll interval and auto-start).

- `openinput` — Start the configured input device.
- `closeinput` — Stop the input device.
- `inputautostart` — Enable/disable input device auto-start [on|off] · `inputautostart [on|off]` _(setting · bool · default off)_
- `inputdevicepollms` *(admin)* — Set input device poll interval ms [10-1000] · `inputdevicepollms <10-1000>` _(setting · int 10–1000 · default 90)_
- `gpioencoderread` — Read GPIO wheel position, switch and pending input as JSON.

### `gamepad` — Seesaw gamepad — raw debug commands

_Requires `ENABLE_GAMEPAD_SENSOR`._

**Firmware module overview (context):** Adafruit Seesaw I2C gamepad (analog joystick plus buttons), exposed here as a low-level debug interface for the raw device. The driver-agnostic open/close/autostart/poll commands live under the input module; the only gamepad-specific command is gamepadread, which polls the Seesaw once and dumps raw state -- joystick X/Y and the button bitmask -- attempting an on-demand connect with backoff if the device is not yet initialized. A background task polls the gamepad at roughly 50 ms and caches the latest reading for the OLED UI and sensor JSON. This module is mutually exclusive at build time with anoencoder; only one input device is compiled in per firmware (see input).

- `gamepadread` — Read Seesaw gamepad state (x/y/buttons). (add 'json' for JSON output)

### `anoencoder` — ANO rotary encoder — debug + driver-specific config

_Requires `ENABLE_ANO_ENCODER`._

**Firmware module overview (context):** Adafruit ANO directional navigation rotary encoder on Seesaw I2C: a click wheel with a center IN press and UP/DOWN/LEFT/RIGHT buttons, used as the OLED navigation input. This module provides debug and remap commands; the actual open/close/autostart/poll lifecycle lives under the input module. anoencoderread dumps raw state -- encoder position, the currently selected rotary axis, and the button bitmask. Remap commands persist to settings: anoencoderi2caddr <1-127> changes the device address (reboot required), anoencoderinvert [on|off] reverses rotation direction, and anoencoderswapud / anoencoderswaplr [on|off|toggle] swap the UP/DOWN and LEFT/RIGHT button pairs. A polling task accumulates encoder detents so fast spins do not drop clicks. Mutually exclusive at build time with the Seesaw gamepad.

- `anoencoderread` — Read ANO encoder state. (add 'json' for JSON output)
- `anoencoderi2caddr` *(admin)* — Set ANO I2C address [1-127] · `anoencoderi2caddr <1-127>` _(setting · int 1–127 · default I2C_ADDR_ANO_ENCODER)_
- `anoencoderinvert` — Invert rotation direction [on|off] · `anoencoderinvert [on|off]` _(setting · bool · default off)_
- `anoencoderswapud` — Swap UP/DOWN buttons [on|off|toggle] · `anoencoderswapud [on|off|toggle]` _(setting · bool · default on)_
- `anoencoderswaplr` — Swap LEFT/RIGHT buttons [on|off|toggle] · `anoencoderswaplr [on|off|toggle]` _(setting · bool · default on)_

### `apds` — APDS9960 color, proximity, gesture sensor

_Requires `ENABLE_APDS_SENSOR`._

**Firmware module overview (context):** The APDS9960 is a combined RGB color, proximity, and gesture sensor. openapds starts it (color sensing enabled by default), apdsread shows which modes are active plus the latest RGBC and proximity values, and closeapds stops it; apdsautostart [on|off] persists launching it at boot, and it runs on the fixed secondary I2C bus (Wire1). Its three functions are toggled independently at runtime with apdsmode <color|proximity|gesture> [on|off] -- note that enabling gesture also turns proximity on, since the gesture engine needs it. Dedicated reads apdscolor, apdsproximity, and apdsgesture print a single sample on demand (gesture returns UP/DOWN/LEFT/RIGHT), and apdsdevicepollms sets how often the background task samples the hardware.

- `openapds` — Start APDS9960 sensor.
- `closeapds` — Stop APDS9960 sensor.
- `apdsread` — Read APDS9960 sensor status and data. (add 'json' for JSON output)
- `apdsmode` — Control APDS modes: apdsmode <color|proximity|gesture> [on|off]. · `apdsmode <color|proximity|gesture> [<on|off>]`
- `apdscolor` — Read APDS9960 color values.
- `apdsproximity` — Read APDS9960 proximity value.
- `apdsgesture` — Read APDS9960 gesture.
- `apdsautostart` — Enable/disable APDS auto-start after boot [on|off] · `apdsautostart [on|off]` _(setting · bool · default off)_
- `apdsbus` *(admin)* — Route APDS9960 gesture to bus: <0|1> (reboot required) · `apdsBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `gps` — PA1010D GPS module

_Requires `ENABLE_GPS_SENSOR`._

**Firmware module overview (context):** PA1010D I2C GPS receiver. Lifecycle: opengps starts the parser task, gpsread prints the current fix, and closegps stops it; gpsautostart [on|off] persists boot auto-start, and the module appears in help only when the chip is detected. gpsread reports fix yes/no, fix quality, satellite count, and (only when a fix is held) latitude/longitude in degrees, altitude in meters, speed in knots, heading angle, plus GPS UTC time and date; with no fix it shows just quality and satellites. The distinctive gpslog [interval_ms] command is a one-shot setup that turns on gpsAutoStart, configures sensorlog to format=track with sensors=gps, then immediately starts both the GPS sensor and the logger to record a track (default 1000 ms, minimum 100 ms) that persists across reboots.

- `opengps` — Start PA1010D GPS module.
- `closegps` — Stop PA1010D GPS module.
- `gpsread` — Read GPS location and time data. (add 'json' for JSON output)
- `gpsautostart` — Enable/disable GPS auto-start after boot [on|off] · `gpsautostart [on|off]` _(setting · bool · default off)_
- `gpslog` — Set up and start GPS track logging now (persists across boots). Usage: gpslog [interval_ms] · `gpslog [interval_ms] Sets gpsAutoStart, sensorlog format=track, sensors=gps, and autostart, then starts both the GPS sensor and sensor logging immediately. interval_ms: log interval in ms (default 1000, min 100) Example: gpslog (1-second logging) gpslog 500 (500ms logging)`
- `gpsbus` *(admin)* — Route PA1010D GPS to bus: <0|1> (reboot required) · `gpsBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `fmradio` — RDA5807 FM radio receiver

_Requires `ENABLE_FM_RADIO`._

**Firmware module overview (context):** RDA5807M I2C FM radio receiver. Lifecycle: openfmradio starts it, fmradioread reports status, and closefmradio stops it; fmradioautostart [on|off] persists boot auto-start and the module shows in help only when detected. fmradiotune <freq> accepts either MHz (e.g. 103.9) or 10 kHz integer units (e.g. 10390) -- values under 200 are read as MHz, otherwise as raw units -- and rejects anything outside 76.0-108.0 MHz; tuning clears any decoded RDS station name and text. fmradioseek [up|down] STARTS a hunt for the next station (no band wrap) and returns immediately -- the radio task finalizes the result within a few seconds; watch 'fmradioread' (JSON field "seeking") or the OLED FM screen. fmradiovolume <0-15> sets output level, and fmradiomute / fmradiounmute toggle audio. The OLED FM screen drives all of this from the gamepad: L/R tune, Up/Down seek, A mute, Y volume, X power.

- `openfmradio` — Start FM Radio sensor.
- `closefmradio` — Stop FM Radio sensor.
- `fmradioread` — Read FM Radio status. (add 'json' for JSON output)
- `fmradiotune` — Tune to frequency: <freq> · `fmradiotune <frequency> (e.g., 103.9 or 10390)`
- `fmradioseek` — Start seeking the next station [up|down] (async; 'fmradioread' shows the result) · `fmradioseek [up|down]`
- `fmradiovolume` — Set volume: <0-15> · `fmradiovolume <0-15>`
- `fmradiomute` — Mute audio
- `fmradiounmute` — Unmute audio
- `fmradioautostart` — Enable/disable FM Radio auto-start after boot [on|off] · `fmradioautostart [on|off]` _(setting · bool · default off)_
- `fmradiobus` *(admin)* — Route RDA5807 FM radio to bus: <0|1> (reboot required) · `fmRadioBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `rtc` — DS3231 precision RTC

_Requires `ENABLE_RTC_SENSOR`._

**Firmware module overview (context):** DS3231 precision I2C real-time clock with battery backup and an on-chip temperature sensor. Lifecycle: openrtc starts the RTC task, rtcread [status|temp] reads the clock (or die temperature), and closertc stops it; rtcautostart [on|off] persists boot auto-start and the module appears in help only when detected. rtcset accepts either "YYYY-MM-DD HH:MM:SS" or a bare Unix timestamp and writes it to the chip, computing day-of-week automatically. rtcsync [to|from] moves time between the RTC and the system clock: to (the default) copies RTC -> system, from copies system -> RTC (use this after an NTP sync to persist accurate time into the battery-backed chip). Setting the time via rtcset or rtcsync from also marks the RTC as calibrated so later boots trust it as a time source.

- `openrtc` — Start DS3231 RTC sensor.
- `closertc` — Stop DS3231 RTC sensor.
- `rtcread` — Read RTC status [status|temp] · `rtcread [status|temp] [json]`
- `rtcset` *(admin)* — Set RTC time: <datetime|timestamp> · `rtcset YYYY-MM-DD HH:MM:SS or rtcset <unix_timestamp>`
- `rtcsync` *(admin)* — Sync time: [to|from] · `rtcsync [to|from] (to=RTC->system, from=system->RTC)`
- `rtcautostart` — Enable/disable RTC auto-start after boot [on|off] · `rtcautostart [on|off]` _(setting · bool · default on)_
- `rtcbus` *(admin)* — Route DS3231 RTC to bus: <0|1> (reboot required) · `rtcBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `presence` — STHS34PF80 IR presence/motion sensor

_Requires `ENABLE_PRESENCE_SENSOR`._

**Firmware module overview (context):** The STHS34PF80 is an infrared presence and motion sensor that detects warm bodies without contact. openpresence starts it, presenceread reports ambient temperature plus presence, motion, and temperature-shock values (each with a DETECTED flag), and closepresence stops it; presenceautostart [on|off] persists launching it at boot. The sensor is initialized at an 8 Hz output data rate with block-data-update enabled, and its on-chip presence/motion/ambient-shock detection engines provide the detection flags directly; presencestatus prints connection and data-validity diagnostics, and presencedevicepollms controls the hardware read interval.

- `openpresence` — Start STHS34PF80 IR presence/motion sensor.
- `closepresence` — Stop STHS34PF80 sensor.
- `presenceread` — Read STHS34PF80 presence/motion/temperature data. (add 'json' for JSON output)
- `presencestatus` — Show STHS34PF80 sensor status. (add 'json' for JSON output)
- `presenceautostart` — Enable/disable presence auto-start after boot [on|off] · `presenceautostart [on|off]` _(setting · bool · default off)_
- `presencebus` *(admin)* — Route STHS34PF80 presence to bus: <0|1> (reboot required) · `presenceBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_

### `camera` — ESP32-S3 DVP camera sensor

_Requires `ENABLE_CAMERA_SENSOR`._

**Firmware module overview (context):** Driver and CLI for the attached DVP camera sensor (OV2640/OV3660 class). The sensor must be powered up first with opencamera before any capture or tuning command works (closecamera stops it); cameraread and cameradump report status and all current sensor register values. Three distinct capture paths exist: cameracapture grabs one JPEG frame into RAM and reports its size only, camerasave captures and writes a frame to storage (LittleFS, SD, or both, per camerastoragelocation, into cameracapturefolder), and cameratiny produces a 160x120 frame small enough for a single ESP-NOW packet; camerarecord start|stop records MJPEG-AVI video and requires an SD card. Resolution and image controls (camerares/cameraframesize, cameraquality, camerafps) and a large set of sensor-tuning commands (brightness/contrast/saturation, white balance, exposure/AEC, gain/AGC, special effects, mirror/flip/rotate, plus raw camerareg register writes) adjust the live image. Automation settings (cameraautostart, cameraautocapture/cameraautocaptureinterval, camerasendaftercapture/cameratargetdevice) drive timed capture and optional ESP-NOW delivery to a named peer.

- `cameraread` — Read camera status
- `opencamera` — Start camera sensor.
- `closecamera` — Stop camera sensor.
- `cameracapture` — Capture a single frame
- `camerasave` — Save current frame to storage
- `camerares` — Set camera resolution: <res> · `camerares <96x96|qqvga|qcif|hqvga|240x240|qvga|cif|vga|svga|xga|sxga|uxga|hd>`
- `cameraframesize` *(admin)* — Set resolution by index: <0-12> · `cameraframesize <0..12> (0-5: QVGA..UXGA, 6-10: small, 11: HD, 12: CIF; availability depends on backend)` _(setting · enum · default 10 (240x240) · options 0=320x240 (QVGA), 1=640x480 (VGA), 2=800x600 (SVGA), 3=1024x768 (XGA), 4=1280x1024 (SXGA), 5=1600x1200 (UXGA), 6=96x96, 7=160x120 (QQVGA), 8=176x144 (QCIF), 9=240x176 (HQVGA), 10=240x240, 11=1280x720 (HD), 12=400x296 (CIF))_
- `cameraquality` — Set JPEG quality: <0-63> · `cameraquality <0..63> (lower = better quality, larger file)` _(setting · int 0–63 · default 12)_
- `camerafps` *(admin)* — Camera FPS: <1-20> · `camerafps <1..20>` _(setting · int 1–20 · default 5)_
- `cameratiny` — Capture tiny frame for ESP-NOW
- `camerabrightness` — Set brightness: <-2..2> · `camerabrightness <-2..2>` _(setting · int -2–2 · default 2)_
- `cameracontrast` — Set contrast: <-2..2> · `cameracontrast <-2..2>` _(setting · int -2–2 · default 2)_
- `camerasaturation` — Set saturation: <-2..2> · `camerasaturation <-2..2>` _(setting · int -2–2 · default 2)_
- `camerawb` *(admin)* — White balance mode: <0-4> · `camerawb <0..4> (0=Auto,1=Sunny,2=Cloudy,3=Office,4=Home)` _(setting · enum · default 0 (Auto) · options 0=Auto, 1=Sunny, 2=Cloudy, 3=Office, 4=Home)_
- `camerasharpness` *(admin)* — Set sharpness: <-2..2> · `camerasharpness <-2..2> (OV3660 only)` _(setting · int -2–2 · default 0)_
- `cameradenoise` *(admin)* — Set denoise level: <0-8> · `cameradenoise <0..8>` _(setting · int 0–8 · default 0)_
- `cameraeffect` *(admin)* — Special effect: <0-6> · `cameraeffect <0..6> (0=None,1=Negative,2=Grayscale,3=Red,4=Green,5=Blue,6=Sepia)` _(setting · enum · default 0 (None) · options 0=None, 1=Negative, 2=Grayscale, 3=Red Tint, 4=Green Tint, 5=Blue Tint, 6=Sepia)_
- `cameraexposure` *(admin)* — Set AE level: <-2..2> · `cameraexposure <-2..2> (negative=darker)` _(setting · int -2–2 · default 0)_
- `cameraaec` *(admin)* — Auto exposure: <on|off> · `cameraaec <on|off|1|0|true|auto>`
- `cameraaecvalue` *(admin)* — Exposure value: <0-1200> · `cameraaecvalue <0..1200>`
- `cameraagc` *(admin)* — Auto gain: <on|off> · `cameraagc <on|off|1|0|true|auto>`
- `cameraagcgain` *(admin)* — Gain value: <0-30> · `cameraagcgain <0..30>`
- `cameragainceiling` *(admin)* — Gainceiling: <0-6> (2X..128X) · `cameragainceiling <0..6> (2X..128X)`
- `camerawhitebal` *(admin)* — AWB master: <on|off> · `camerawhitebal <on|off>`
- `cameraawbgain` *(admin)* — AWB gain: <on|off> · `cameraawbgain <on|off>`
- `cameraaec2` *(admin)* — Night mode (slower fps, brighter in low light): <on|off> · `cameraaec2 <on|off>`
- `cameradcw` *(admin)* — Downsize crop window: <on|off> · `cameradcw <on|off>`
- `camerabpc` *(admin)* — Black pixel correction: <on|off> · `camerabpc <on|off>`
- `camerawpc` *(admin)* — White pixel correction: <on|off> · `camerawpc <on|off>`
- `cameragamma` *(admin)* — Raw gamma: <on|off> · `cameragamma <on|off>`
- `cameralenc` *(admin)* — Lens shading correction: <on|off> · `cameralenc <on|off>`
- `cameracolorbar` *(admin)* — Color bar test pattern: <on|off> · `cameracolorbar <on|off>`
- `camerareg` *(admin)* — Direct register write: <addr_hex> <mask_hex> <value_hex> · `camerareg <addr_hex> <mask_hex> <value_hex> (example: camerareg 0x3824 0x1f 0x04)`
- `cameradump` — Print all current sensor values
- `camerafx` — Set bri/con/sat together: <bri> <con> <sat> (-2..+2 each) · `camerafx <bri> <con> <sat> (-2..+2 each)`
- `camerahmirror` — Horizontal mirror: <on|off> · `camerahmirror <on|off|1|0|true>` _(setting · bool · default off)_
- `cameravflip` — Vertical flip: <on|off> · `cameravflip <on|off|1|0|true>` _(setting · bool · default off)_
- `camerarotate` — Rotate 180°: <on|off> · `camerarotate <on|off|1|0|true|180>`
- `cameraautostart` *(admin)* — Auto-start: <on|off> · `cameraautostart <on|off|1|0|true|false>` _(setting · bool · default off)_
- `camerastoragelocation` *(admin)* — Storage location: <0-2> · `camerastoragelocation <0..2> (0=LittleFS,1=SD,2=Both)` _(setting · enum · default 1 (SD Card) · options 0=LittleFS (Internal), 1=SD Card, 2=Both)_
- `cameracapturefolder` *(admin)* — Photo folder: <path> · `cameracapturefolder <path>` _(setting · string · default "/photos")_
- `cameramaxstoredimages` *(admin)* — Max stored: <0-1200> · `cameramaxstoredimages <0..1200> (0=unlimited)` _(setting · int 0–1000 · default 100)_
- `cameraautocapture` *(admin)* — Auto-capture: <on|off> · `cameraautocapture <on|off|1|0|true>` _(setting · bool · default off)_
- `cameraautocaptureinterval` *(admin)* — Auto-capture: <sec> · `cameraautocaptureinterval <10..3600>` _(setting · int 10–3600 · default 60)_
- `camerasendaftercapture` *(admin)* — Send after capture: <on|off> · `camerasendaftercapture <on|off|1|0|true>` _(setting · bool · default off)_
- `cameratargetdevice` *(admin)* — Target device: <name> · `cameratargetdevice <name>` _(setting · string · default (empty))_
- `camerarecord` — Start/stop MJPEG-AVI recording (SD only): <start|stop> · `camerarecord <start|stop|1|0>`
- `cameravideolist` — List AVI recordings on SD (add 'json' for JSON output)
- `cameravideodelete` *(admin)* — Delete recording: "<filename>" · `cameravideodelete "<filename>"`

### `microphone` — Microphone (PDM or G2 glasses)

_Requires `ENABLE_MICROPHONE`._

**Firmware module overview (context):** Driver and CLI for the microphone — the on-board PDM mic and/or the G2 glasses mic, selected with micsource. The mic must be started with openmic before reads or recording (closemic stops it); commands that need the running mic return a use-openmic-first error otherwise. miclevel returns the current audio level (percent; add json for structured output) and micviz shows a live level meter until a key is pressed. micrecord start [vad <ms>] [trim]|stop records audio to a WAV file; owner-correlated capture uses micrecord startid|statusid|stopid with a strict 16-hex ID and optional discard. miclist lists saved recordings, while micdelete and micdeleteid remove manual or exact owner-scoped results. Audio format is configured with micsamplerate (8000-48000), micgain (0-100), and micbitdepth (16 or 32), each usable as a getter with no argument; micautostart on|off persists whether the mic powers up automatically at boot.

- `micread` — Read microphone sensor status. · `micread [json]`
- `openmic` — Start microphone sensor.
- `closemic` — Stop microphone sensor.
- `miclevel` — Get current audio level. · `miclevel [json]`
- `micviz` — Real-time audio level visualizer. · `micviz (press any key to stop)`
- `micrecord` — Start/stop recording to WAV file (bare = show recording status). · `micrecord [start [vad <200..10000>] [trim] | stop | 1 | 0] micrecord startid <16hex> [vad <200..10000>] [trim] micrecord statusid <16hex> micrecord stopid <16hex> [discard]`
- `miclist` — List saved recordings. · `miclist [json]`
- `micdelete` *(admin)* — Delete recording(s). · `micdelete "<filename>" | micdelete all`
- `micdeleteid` *(admin)* — Delete one owner-correlated recording. · `micdeleteid <16hex> "<filename>"`
- `voicefetch` — Stream a recording to the UART host as binary frames (CM5 bulk pull). · `voicefetch "<path>" - path must be under /recordings or /sd/recordings. Sends META+AUDIO frames on the UART link, then replies with byte/frame totals and crc16.`
- `micsamplerate` — Get/set sample rate. · `micsamplerate [8000-48000]` _(setting · int 8000–48000 · default 16000)_
- `micgain` — Get/set microphone gain. · `micgain [0-100]` _(setting · int 0–100 · default 70)_
- `micbitdepth` — Get/set bit depth. · `micbitdepth [16|32]` _(setting · enum · default 16 (16-bit) · options 16=16-bit, 32=32-bit)_
- `micsource` — Get/set mic source: onboard PDM or G2 glasses. · `micsource [auto|pdm|g2]` _(setting · enum · default "auto" · options auto|Auto, pdm|Onboard PDM, g2|G2 glasses)_
- `micautostart` — Enable/disable microphone auto-start after boot [on|off] · `micautostart [on|off]` _(setting · bool · default off)_

### `edgeimpulse` — Edge Impulse ML inference

_Requires `ENABLE_EDGE_IMPULSE`._

**Firmware module overview (context):** On-device machine-learning image inference using TensorFlow Lite Micro models exported from Edge Impulse. Two things must be in place before inference: a model must be loaded with eimodelload "<file>" (models live in the models directory on LittleFS; eimodellist/eimodelinfo/eimodelunload manage them) and inference must be enabled with eienable 1 (which also initializes the inference buffers). eidetect runs a single detection on a live camera frame and so additionally requires the camera to be opened (see opencamera), returning detected objects with confidence and bounding boxes as JSON; eifile "<path>" runs the same inference against a stored JPEG instead of the camera. eicontinuous 1 runs detection repeatedly in the background, eiconfidence <0.0-1.0> sets the minimum confidence to report, and eistatus shows current state. The eitrack family (eitrackenable, eitrackstatus, eitrackclear) adds cross-frame state tracking of detected objects on top of raw detections.

- `ei` — Edge Impulse ML inference commands. · `ei <subcommand>`
- `eienable` — Enable/disable Edge Impulse inference. · `eienable <0|1>` _(setting · bool · default off)_
- `eidetect` — Run single object detection inference. · `eidetect`
- `eifile` — Run inference on stored JPEG image. · `eifile "<path>"`
- `eicontinuous` — Start/stop continuous inference mode. · `eicontinuous <0|1>` _(setting · bool · default off)_
- `eiconfidence` — Set minimum detection confidence. · `eiconfidence <0.0-1.0>` _(setting · float · default 0.6)_
- `eistatus` — Show Edge Impulse status. · `eistatus`
- `eimodel` — Model management commands. · `eimodel <subcommand>`
- `eimodellist` — List available .tflite models. · `eimodellist`
- `eimodelload` — Load a TFLite model from LittleFS. · `eimodelload "<filename>"`
- `eimodelinfo` — Show loaded model information. · `eimodelinfo`
- `eimodelunload` — Unload the current model. · `eimodelunload`
- `eitrack` — State tracking commands. · `eitrack <subcommand>`
- `eitrackstatus` — Show currently tracked objects. · `eitrackstatus`
- `eitrackenable` — Enable/disable state tracking. · `eitrackenable <0|1>`
- `eitrackclear` — Clear all tracked objects. · `eitrackclear`

### `transcription` — Transcription interfaces

_Requires `ENABLE_DICTATION`._

**Firmware module overview (context):** Session controls and private transcript pages shared by display and web interfaces.

- `transcription` — Transcription interface controls · `transcription start|status [id]|stop <id>|cancel <id>|next <id>|ack <id> <sequence> <offset> <length>`
- `transcripts` — Browse your saved transcripts · `transcripts list internal|sd <offset> | transcripts read "<path>" <offset>`

### `stt` — Local speech-to-text

_Requires `ENABLE_LOCAL_STT`._

**Firmware module overview (context):** Buffered local dictation through the shared audio HAL. Stop SR and the microphone sensor first, then use stt record [seconds]. Poll stt status [id], finish early with stt stop <id>, discard with stt cancel <id>, and read stt result <id> from the same authenticated session. Audio and results stay local; no host link is required. This backend produces text for review, not voice command execution.

- `sttperf` — STT pacing/profiling per segment (timings and CPU only, never text). · `sttperf [show|clear|log on|off|stages [all|clear]]`
- `stt` — Local continuous or bounded speech-to-text with private session-owned results. · `stt start | record [1..20 seconds] | status [id] | stop|cancel|result|next|draft <id> | ack <id> <sequence>`

### `espsr` — ESP-SR speech recognition

_Requires `ENABLE_ESP_SR`._

**Firmware module overview (context):** Offline voice control built on Espressif ESP-SR: a WakeNet wake-word stage gates a MultiNet command-phrase recognizer, so the device waits for the wake word and then listens for a known command phrase. Note that srenable/sr enable only reports the compile-time build flag and cannot toggle the feature at runtime; the real lifecycle commands are opensr/srstart to start the recognition pipeline and closesr/srstop to stop it. Starting the pipeline also arms voice command execution as the current authenticated user (and stopping it disarms); arming can be managed directly with voicearm/voicedisarm/voicestatus, and recognized phrases only execute commands while armed. The command vocabulary is managed with the srcmds family (list/add/del/clear plus save/reload to an SD file and srcmdssync to import phrases from the CLI registry). Recognition is tuned through srconfidence, srtimeout, the srtuning* audio controls (gain, AGC, VAD, filters), and srdebug* telemetry; the mic feed follows the device-wide source (set with `micsource auto|pdm|g2` — onboard PDM or the G2 glasses left-temple mic), and the srsnip* commands capture audio snippets (by default on the wake word) for debugging.

- `sr` — ESP-SR speech recognition commands. · `sr <enable|start|stop|status|stack|cmds|debug|confidence|timeout|tuning|accept|dyngain|raw|autotune|snip>`
- `srenable` *(admin)* — ESP-SR enable is a compile-time flag (cannot be toggled at runtime). · `srenable (informational; ESP-SR is set at compile time, any 0|1 argument is ignored)`
- `opensr` — Start ESP-SR pipeline and arm voice as the current user. · `opensr`
- `closesr` — Stop ESP-SR pipeline. · `closesr`
- `srstatus` — Show ESP-SR status. · `srstatus`
- `srstack` — Show sr_task stack high-water mark (run after voice stress test). · `srstack`
- `srstart` — Start ESP-SR pipeline and arm voice as the current user. · `srstart`
- `srstop` — Stop ESP-SR pipeline. · `srstop`
- `voicearm` — Arm voice command execution as the current authenticated user. · `voicearm`
- `voicedisarm` — Disarm voice command execution. · `voicedisarm`
- `voicestatus` — Show voice arming status. · `voicestatus`
- `srcmds` *(admin)* — Manage MultiNet command phrases. · `srcmds <list|add|del|clear|save|reload|sync>`
- `srcmdslist` *(admin)* — List current MultiNet commands. · `srcmdslist`
- `srcmdsadd` *(admin)* — Add or update a MultiNet command. · `srcmdsadd <id> <phrase>`
- `srcmdsdel` *(admin)* — Delete a MultiNet command (by phrase or id). · `srcmdsdel <phrase|id>`
- `srcmdsclear` *(admin)* — Clear all MultiNet commands. · `srcmdsclear confirm`
- `srcmdsreload` *(admin)* — Reload commands from SD file. · `srcmdsreload`
- `srcmdssave` *(admin)* — Save current commands to SD file. · `srcmdssave`
- `srcmdssync` *(admin)* — Sync voice commands from CLI registry. · `srcmdssync`
- `srdebug` — SR debug/telemetry commands. · `srdebug <level|telem|stats|reset>`
- `srdebuglevel` — Set debug verbosity (0-4). · `srdebuglevel [0-4]`
- `srdebugtelem` — Set periodic telemetry interval (ms, 0=off). · `srdebugtelem [ms]`
- `srdebugstats` — Print current SR statistics. · `srdebugstats`
- `srdebugreset` — Reset SR debug counters. · `srdebugreset`
- `srconfidence` — Get/set command confidence threshold. · `srconfidence [<0.0-1.0> | category <0.0-1.0> | target <0.0-1.0>]`
- `sraccept` — Configure target acceptance policy (gap acceptance). · `sraccept [on|off|floor <0.0-1.0>|gap <0.0-1.0>|speech <0|1>]`
- `srdyngain` — Configure dynamic gain normalization (MultiNet input only). · `srdyngain [on|off|min <0.1-10>|max <0.1-10>|target <1000-30000>|alpha <0.0-1.0>|reset]`
- `srraw` — Toggle raw output mode (shows all MultiNet hypotheses). · `srraw [on|off]`
- `srautotune` — Auto-cycle through gain configurations to find best settings. · `srautotune [start|stop|status]`
- `srtimeout` — Get/set command listening timeout. · `srtimeout [1000-30000]` _(setting · int 1000–30000 · default 6000)_
- `srtuning` — Show/set audio tuning parameters. · `srtuning [<gain|agc|vad|swgain|filters> <value>] (bare = show status)`
- `srtuningswgain` — Set software gain (1.0-50.0) by updating shared micgain. · `srtuningswgain <1.0-50.0>`
- `srtuninggain` — Set AFE linear gain (0.1-10.0). · `srtuninggain <0.1-10.0>`
- `srtuningagc` — Set AGC mode (0=off, 1-3=levels). · `srtuningagc <0-3>`
- `srtuningvad` — Set VAD sensitivity (0-4). · `srtuningvad <0-4>`
- `srtuningfilters` — Toggle audio filters (high-pass + pre-emphasis). · `srtuningfilters <on|off>`
- `srsnip` — Voice snippet capture commands. · `srsnip <on|off|start|stop|status|config>`
- `srsnipon` — Enable auto-capture on wake word. · `srsnipon`
- `srsnipoff` — Disable auto-capture. · `srsnipoff`
- `srsnipstart` — Start manual snippet capture now. · `srsnipstart`
- `srsnipstop` — Stop manual snippet capture and save. · `srsnipstop`
- `srsnipstatus` — Show snippet capture status. · `srsnipstatus`
- `srsnipconfig` — Configure snippet capture params. · `srsnipconfig [pre_ms|max_ms|dest] [value]`
- `voicecancel` — Cancel current voice command sequence.
- `voicehelp` — Show available voice options for current state.

### `i2c` — I2C bus diagnostics and scanning

_Requires `ENABLE_I2C_SYSTEM`._

**Firmware module overview (context):** The i2c module configures and diagnoses up to two I2C buses and the sensor device registry. There are two buses with a deliberate naming convention: bus 0 is I2C1 (Arduino Wire1, the primary STEMMA QT / sensor bus) and bus 1 is I2C2 (Wire, the optional secondary bus); each has its own enable flag and SDA/SCL pin settings, and bus/pin changes require a reboot. Each sensor can be routed to either bus with a per-device command. Each sensor's routing verb now lives in that sensor's own module (run 'help gps' for gpsBus, 'help rtc' for rtcBus, and so on); oledBus, inputBus and fuelGaugeBus stay here. The persisted setting names are unchanged. all taking 0 or 1 and needing a reboot. Discovery and diagnostics: i2cscan dumps raw addresses found on each active bus; detect reports configured-vs-present hardware and detect apply (admin) auto-enables newly detected cheap devices; i2cmetrics/i2cstats/i2chealth show bus performance, error counters, and per-device health. Bus recovery: i2cpause/i2cresume stop and restart sensor polling, i2creset does a pause-recover-resume cycle, and i2crecover <address> clears a single device degraded state. The device registry is exposed via sensors [filter|json], sensorinfo <name>, devices, discover, and devicefile; sensorautostart [sensor] [on|off] controls which sensors start polling automatically at boot.

- `i2cbusenabled` *(admin)* — Enable/disable I2C1 bus: <0|1> (reboot required) · `i2cBusEnabled <0|1>` _(setting · bool · default on)_
- `i2csdapin` *(admin)* — Set I2C1 SDA pin: <0..N> (max GPIO for this board) · `i2cSdaPin <0..N> (max GPIO for this board)` _(setting · int 0–HW_GPIO_MAX · default I2C_SDA_PIN_DEFAULT)_
- `i2csclpin` *(admin)* — Set I2C1 SCL pin: <0..N> (max GPIO for this board) · `i2cSclPin <0..N> (max GPIO for this board)` _(setting · int 0–HW_GPIO_MAX · default I2C_SCL_PIN_DEFAULT)_
- `i2c2busenabled` *(admin)* — Enable/disable I2C2 bus: <0|1> (reboot required) · `i2c2BusEnabled <0|1>` _(setting · bool · default off)_
- `i2c2sdapin` *(admin)* — Set I2C2 SDA pin: <-1..N> (-1=unavailable) · `i2c2SdaPin <-1..N> (-1=unavailable)` _(setting · int -1–HW_GPIO_MAX · default I2C2_SDA_PIN_DEFAULT)_
- `i2c2sclpin` *(admin)* — Set I2C2 SCL pin: <-1..N> (-1=unavailable) · `i2c2SclPin <-1..N> (-1=unavailable)` _(setting · int -1–HW_GPIO_MAX · default I2C2_SCL_PIN_DEFAULT)_
- `oledbus` *(admin)* — Route OLED to bus: <0|1> (reboot required) · `oledBus <0|1>` _(setting · enum · default OLED_BUS_DEFAULT · options 0=I2C1, 1=I2C2)_
- `inputbus` *(admin)* — Route input device to bus: <0|1> (reboot required) · `inputBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `fuelgaugebus` *(admin)* — Route MAX17048 fuel gauge to bus: <0|1> (reboot required) · `fuelGaugeBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `i2creset` *(admin)* — Reset I2C bus: pause polling, recover bus, resume.
- `i2cpause` *(admin)* — Pause all I2C sensor polling.
- `i2cresume` *(admin)* — Resume I2C sensor polling.
- `i2crecover` *(admin)* — Clear degraded state for device: <address> · `i2crecover <address> (hex 0x01-0x7F or decimal 1-127)`
- `i2cmetrics` — Show I2C bus performance metrics. (add 'json' for JSON output)
- `i2cscan` — Scan I2C bus for devices.
- `detect` — Detect hardware: scan I2C buses, diff vs. configured features. · `detect [apply] detect - read-only report (present/enabled/missing) detect apply - auto-enable cheap detected devices (admin; reboot for some)`
- `i2cstats` — I2C bus statistics and errors.
- `i2chealth` — Show per-device I2C health status. (add 'json' for JSON output)
- `sensors` — List I2C sensors [filter] · `sensors [filter] - filter by name, description, or manufacturer sensors json [brief] - live state (+readings; 'brief' = state only, no data) Example: sensors temperature, sensors json brief`
- `sensorinfo` — Sensor details: <name> · `sensorinfo <sensor_name> Example: sensorinfo BNO055`
- `devices` — Show discovered I2C device registry. (add 'json' for JSON output)
- `discover` — Re-scan and register I2C devices.
- `devicefile` — Show device registry JSON file.
- `sensorautostart` *(admin)* — Sensor auto-start: [sensor] [on|off] · `sensorautostart [sensor] [on|off] sensorautostart all [on|off] Sensors: thermal, tof, imu, gps, fmradio, apds, input`

### `automation` — Scheduled tasks and conditional commands

_Requires `ENABLE_AUTOMATION`._

**Firmware module overview (context):** The automation module runs saved jobs (stored in automations.json) that execute one or more CLI commands on a schedule, condition, or system event. Every automation has one of four trigger types: atTime (fires daily at time=HH:MM, optionally limited to days=Mon,Tue,...), afterDelay (fires once after delayms milliseconds), interval (fires repeatedly every intervalms milliseconds), or event (fires when a system event occurs: on=<kind> with an optional match=<text> filter against the event's subject/detail — run 'events' to see recent kinds like peer_online, text_rx, battery_low, login_fail); jobs can also carry runatboot=1 to fire at startup. The primary entry point is automation <subcommand> (list, add, enable, disable, delete, run, trigger, sanitize, recompute) with single-word aliases automationlist, automationadd, automationrun, and automationtrigger. Note the important distinction: automationrun id=<id> executes a job commands immediately, whereas automationtrigger id=<id> only arms an afterDelay/manual timer so it fires after its delay; and automation system enable|disable|status is the global master switch that gates whether the scheduler runs at all, independent of each job own enabled flag. Jobs may also include an optional condition expression, and conditional commands use an IF <expr> THEN <command> [ELSE <command>] form (e.g. IF temp>75 THEN ledcolor red). Conditions can check sensors (temp, distance, light, motion), time (time, hour, day, ntp), system state (battery, heap, psram, fsfree, uptime, chiptemp), connectivity (wifi, rssi, peers, ble), ESP-NOW/bond (espnow, bond_mode, bond_paired, bond_online, bond_synced, bond_role, bond_rssi, bond_peer_heap, bond_peer_uptime, pairmode, pairmode_secs, peersknown, stalestpeerage), location (gps, speed, sats, wp_dist:<name>), the on-device model (llm), and ESP-NOW metadata (room, zone, tags); numeric variables use the > < = >= <= != operators and string/enum variables use = != CONTAINS. A true condition fires every time its trigger is due. Supporting commands: validate-conditions checks conditional syntax without running it, autolog records automation activity to a file, and print <message> broadcasts text to all outputs.

- `automation` *(admin)* — Automation system: automation <subcommand> [args]. · `automation <system enable|disable|status | list | add | enable | disable | delete | run | trigger | sanitize | recompute>`
- `automationlist` — List all automations.
- `automationadd` *(admin)* — Add automation (same as 'automation add').
- `automationrun` *(admin)* — Run automation by ID: automationrun id=<id>.
- `automationtrigger` *(admin)* — Arm afterDelay automation timer: automationtrigger id=<id>.
- `autolog` — Automation logging: autolog start <file> | stop | status. · `autolog start <filename> | autolog stop | autolog status`
- `validate-conditions` *(admin)* — Validate conditional automation syntax: validate-conditions IF temp>75 THEN ledcolor red.
- `print` — Broadcast a message to all outputs: print <message>.

### `battery` — Battery voltage and charge monitoring

_Requires `ENABLE_BATTERY_MONITOR`._

**Firmware module overview (context):** The battery module reports cell state and keeps a time-series log; it is only present when battery monitoring is compiled in. The backend is a MAX17048 fuel gauge over I2C or a calibrated ADC voltage divider selected by the board. ADC charge percentage is approximate; the charger can drive the measured BAT node even without a cell. USB, charging and cell presence are reported only when known. Missing readings are null in JSON, not zero/full estimates. batterystatus prints voltage, charge percentage, charging/USB state, and a coarse status label, or returns the same data as JSON. batterylog manages a CSV discharge/charge log written to the device for later graphing: with no args it shows status, and subcommands are on/off (enable/disable), interval <5..3600> seconds (sampling period), tail (show the most recent rows), and clear (erase the log); significant events such as sleep/wake are always recorded regardless of the interval. batterycalibrate (admin) reinitializes ADC calibration or re-probes the fuel gauge.

- `batterystatus` — Show battery voltage, charge level, and status
- `batterycalibrate` *(admin)* — Reinitialize ADC calibration or re-probe the fuel gauge
- `batterylog` — Battery time-series CSV log (on/off/interval/tail/clear) · `batterylog [on|off|interval <s>|tail|clear]`

### `debug` — System debugging and diagnostics

_Always compiled._

**Firmware module overview (context):** The debug subsystem controls diagnostic logging verbosity across every part of the firmware. Its core is a large set of per-subsystem debug-flag toggles (for example debugwifi, debughttprequests, debugespnowcore, debugcamera, debugimuvalues) that each follow a <0|1> [temp|runtime] model: with no mode the new state is persisted to flash, while temp or runtime flips only the live runtime flag and is NOT saved (it reverts on reboot). Many subsystems have a parent flag plus finer sub-flags (lifecycle/polling/values, or core/router/mesh/topo for ESP-NOW); the parent acts as a master switch and any sub-flag also lights its parent. Separate from the on/off flags, loglevel sets a severity threshold (error|warn|info|debug, persisted) and debugverbose is a global override. Related commands manage where output goes: outserial gates the UART lane (persisted), outg2/outble open runtime CLI streams to G2 glasses / BLE clients (session-only, reset on reboot), log starts/stops system-wide logging to a file, loglink routes ESP-IDF framework logs through the unified output queue, and debugstack/debugbuffer expose low-level trace and queue diagnostics.

- `debughttp` *(admin)* — Debug HTTP requests. · `debughttp <0|1> [temp|runtime]`
- `debughttps` *(admin)* — Debug HTTPS/TLS handshake + connection errors (ESP-IDF logs). · `debughttps <0|1> [temp|runtime]`
- `debugsse` *(admin)* — Debug Server-Sent Events. · `debugsse <0|1> [temp|runtime]`
- `debugcli` *(admin)* — Debug CLI processing. · `debugcli <0|1> [temp|runtime]`
- `debugauth` *(admin)* — Debug authentication (parent flag). · `debugauth <0|1> [temp|runtime]`
- `debugespnow` *(admin)* — Debug ESP-NOW core messages (alias of debugespnowcore). · `debugespnow <0|1> [temp|runtime]`
- `debugbluetooth` *(admin)* — Debug Bluetooth (parent flag). · `debugbluetooth <0|1> [temp|runtime]`
- `debugbluetoothcore` *(admin)* — Debug Bluetooth core lifecycle. · `debugbluetoothcore <0|1> [temp|runtime]`
- `debugbluetoothgatt` *(admin)* — Debug Bluetooth GATT operations. · `debugbluetoothgatt <0|1> [temp|runtime]`
- `debugbluetoothdata` *(admin)* — Debug Bluetooth command/data path. · `debugbluetoothdata <0|1> [temp|runtime]`
- `debuguart` *(admin)* — Debug UART host link (parent flag). · `debuguart <0|1> [temp|runtime]`
- `debuguartlifecycle` *(admin)* — Debug UART link/session lifecycle. · `debuguartlifecycle <0|1> [temp|runtime]`
- `debuguartcontrol` *(admin)* — Debug UART CM5/liveaudio control intrinsics. · `debuguartcontrol <0|1> [temp|runtime]`
- `debugcamera` *(admin)* — Debug camera (parent flag). · `debugcamera <0|1> [temp|runtime]`
- `debugcameralifecycle` *(admin)* — Debug camera init/stop/PWDN-RESET/GPIO state. · `debugcameralifecycle <0|1> [temp|runtime]`
- `debugcameracapture` *(admin)* — Debug captureFrame, JPEG validation, fb buffer, recovery. · `debugcameracapture <0|1> [temp|runtime]`
- `debugcamerasettings` *(admin)* — Debug runtime camera resolution/quality changes. · `debugcamerasettings <0|1> [temp|runtime]`
- `debugcameravideo` *(admin)* — Debug video recording start/finalize, frame writing. · `debugcameravideo <0|1> [temp|runtime]`
- `debugdisplay` *(admin)* — Debug OLED init/probe/boot-animation/mode-transitions. · `debugdisplay <0|1> [temp|runtime]`
- `debugnotifications` *(admin)* — Debug notification pipeline: ring lag/skips, stale/cooldown drops, SSE saturation. · `debugnotifications <0|1> [temp|runtime]`
- `notifstats` *(admin)* — Notification pipeline counters: loss, suppression, ring lag, SSE drops. · `notifstats [reset] (bare): print pipeline counters reset: zero them`
- `debugmicrophone` *(admin)* — Debug microphone operations. · `debugmicrophone <0|1> [temp|runtime]`
- `debuggps` *(admin)* — Debug GPS sensor (PA1010D). · `debuggps <0|1> [temp|runtime]`
- `debugrtc` *(admin)* — Debug RTC sensor (DS3231). · `debugrtc <0|1> [temp|runtime]`
- `debugimu` *(admin)* — Debug IMU sensor (BNO055). · `debugimu <0|1> [temp|runtime]`
- `debugthermal` *(admin)* — Debug thermal sensor (MLX90640). · `debugthermal <0|1> [temp|runtime]`
- `debugtof` *(admin)* — Debug ToF sensor (VL53L4CX). · `debugtof <0|1> [temp|runtime]`
- `debuginput` *(admin)* — Debug input abstraction layer (HAL_Input + OLED dispatch). · `debuginput <0|1> [temp|runtime]`
- `debuganoencoder` *(admin)* — Debug ANO rotary encoder driver internals. · `debuganoencoder <0|1> [temp|runtime]`
- `debugapds` *(admin)* — Debug APDS sensor (APDS9960). · `debugapds <0|1> [temp|runtime]`
- `debugpresence` *(admin)* — Debug presence sensor (STHS34PF80). · `debugpresence <0|1> [temp|runtime]`
- `debugthermallifecycle` *(admin)* — Debug thermal init/connect/recovery. · `debugthermallifecycle <0|1> [temp|runtime]`
- `debugthermalpolling` *(admin)* — Debug thermal poll cadence/FPS/capture. · `debugthermalpolling <0|1> [temp|runtime]`
- `debugthermalvalues` *(admin)* — Debug thermal value updates/interpolation. · `debugthermalvalues <0|1> [temp|runtime]`
- `debugtoflifecycle` *(admin)* — Debug ToF init/connect/recovery. · `debugtoflifecycle <0|1> [temp|runtime]`
- `debugtofpolling` *(admin)* — Debug ToF poll cadence/capture. · `debugtofpolling <0|1> [temp|runtime]`
- `debugtofvalues` *(admin)* — Debug ToF range/object detection values. · `debugtofvalues <0|1> [temp|runtime]`
- `debuginputlifecycle` *(admin)* — Debug input abstraction layer lifecycle. · `debuginputlifecycle <0|1> [temp|runtime]`
- `debuginputpolling` *(admin)* — Debug input abstraction layer poll/dispatch. · `debuginputpolling <0|1> [temp|runtime]`
- `debuginputvalues` *(admin)* — Debug input abstraction layer event values. · `debuginputvalues <0|1> [temp|runtime]`
- `debuganoencoderlifecycle` *(admin)* — Debug ANO encoder init/connect/recovery. · `debuganoencoderlifecycle <0|1> [temp|runtime]`
- `debuganoencoderpolling` *(admin)* — Debug ANO encoder poll/encoder reads. · `debuganoencoderpolling <0|1> [temp|runtime]`
- `debuganoencodervalues` *(admin)* — Debug ANO encoder rotation/button events. · `debuganoencodervalues <0|1> [temp|runtime]`
- `debugimulifecycle` *(admin)* — Debug IMU init/connect/recovery. · `debugimulifecycle <0|1> [temp|runtime]`
- `debugimupolling` *(admin)* — Debug IMU poll cadence. · `debugimupolling <0|1> [temp|runtime]`
- `debugimuvalues` *(admin)* — Debug IMU orientation/acceleration values. · `debugimuvalues <0|1> [temp|runtime]`
- `debugapdslifecycle` *(admin)* — Debug APDS init/connect/recovery. · `debugapdslifecycle <0|1> [temp|runtime]`
- `debugapdspolling` *(admin)* — Debug APDS poll cadence. · `debugapdspolling <0|1> [temp|runtime]`
- `debugapdsvalues` *(admin)* — Debug APDS color/proximity/gesture values. · `debugapdsvalues <0|1> [temp|runtime]`
- `debuggpslifecycle` *(admin)* — Debug GPS init/connect/recovery. · `debuggpslifecycle <0|1> [temp|runtime]`
- `debuggpspolling` *(admin)* — Debug GPS poll cadence. · `debuggpspolling <0|1> [temp|runtime]`
- `debuggpsvalues` *(admin)* — Debug GPS NMEA/fix/coordinate values. · `debuggpsvalues <0|1> [temp|runtime]`
- `debugrtclifecycle` *(admin)* — Debug RTC init/connect/recovery. · `debugrtclifecycle <0|1> [temp|runtime]`
- `debugrtcpolling` *(admin)* — Debug RTC poll cadence. · `debugrtcpolling <0|1> [temp|runtime]`
- `debugrtcvalues` *(admin)* — Debug RTC time-read values. · `debugrtcvalues <0|1> [temp|runtime]`
- `debugfmradiolifecycle` *(admin)* — Debug FM radio init/tune/recovery. · `debugfmradiolifecycle <0|1> [temp|runtime]`
- `debugfmradiopolling` *(admin)* — Debug FM radio poll cadence. · `debugfmradiopolling <0|1> [temp|runtime]`
- `debugfmradiovalues` *(admin)* — Debug FM radio RDS/RSSI/state values. · `debugfmradiovalues <0|1> [temp|runtime]`
- `debugmiclifecycle` *(admin)* — Debug microphone init/start/stop. · `debugmiclifecycle <0|1> [temp|runtime]`
- `debugmicpolling` *(admin)* — Debug microphone capture cadence. · `debugmicpolling <0|1> [temp|runtime]`
- `debugmicvalues` *(admin)* — Debug microphone level/sample values. · `debugmicvalues <0|1> [temp|runtime]`
- `debugpresencelifecycle` *(admin)* — Debug presence sensor init/connect/recovery. · `debugpresencelifecycle <0|1> [temp|runtime]`
- `debugpresencepolling` *(admin)* — Debug presence sensor poll cadence. · `debugpresencepolling <0|1> [temp|runtime]`
- `debugpresencevalues` *(admin)* — Debug presence detection values. · `debugpresencevalues <0|1> [temp|runtime]`
- `debugmaps` *(admin)* — Debug maps (parent flag). · `debugmaps <0|1> [temp|runtime]`
- `debugmapsloading` *(admin)* — Debug map file loading and tile directory. · `debugmapsloading <0|1> [temp|runtime]`
- `debugmapsrendering` *(admin)* — Debug map render pipeline and feature drawing. · `debugmapsrendering <0|1> [temp|runtime]`
- `debugmapsperf` *(admin)* — Debug map performance timing (render ms, tile I/O, cache, FPS). · `debugmapsperf <0|1> [temp|runtime]`
- `debugllm` *(admin)* — Debug on-device LLM (parent flag). · `debugllm <0|1> [temp|runtime]`
- `debugllmload` *(admin)* — Debug LLM checkpoint load and validation. · `debugllmload <0|1> [temp|runtime]`
- `debugllmtokenizer` *(admin)* — Debug LLM tokenizer / BPE. · `debugllmtokenizer <0|1> [temp|runtime]`
- `debugllmforward` *(admin)* — Debug LLM transformer forward (verbose). · `debugllmforward <0|1> [temp|runtime]`
- `debugllmgenerate` *(admin)* — Debug LLM generation loop and sampling. · `debugllmgenerate <0|1> [temp|runtime]`
- `debugllmmemory` *(admin)* — Debug LLM PSRAM budget and context cap. · `debugllmmemory <0|1> [temp|runtime]`
- `debugi2c` *(admin)* — Debug I2C bus (parent flag). · `debugi2c <0|1> [temp|runtime]`
- `debugi2cbus` *(admin)* — Debug I2C bus lifecycle, polling pause/resume, status bumps. · `debugi2cbus <0|1> [temp|runtime]`
- `debugi2cdiscovery` *(admin)* — Debug I2C device probing, registry, scan results. · `debugi2cdiscovery <0|1> [temp|runtime]`
- `debugi2cautostart` *(admin)* — Debug I2C sensor auto-start orchestration + init results. · `debugi2cautostart <0|1> [temp|runtime]`
- `debugwifi` *(admin)* — Debug WiFi operations. · `debugwifi <0|1> [temp|runtime]`
- `debugstorage` *(admin)* — Debug storage operations. · `debugstorage <0|1> [temp|runtime]`
- `debugperformance` *(admin)* — Debug performance metrics. · `debugperformance <0|1> [temp|runtime]`
- `debugdatetime` *(admin)* — Debug NTP/date-time (parent flag). · `debugdatetime <0|1> [temp|runtime]`
- `debugdatetimesync` *(admin)* — Debug NTP sync loop (DNS, wait, result). · `debugdatetimesync <0|1> [temp|runtime]`
- `debugdatetimesetup` *(admin)* — Debug NTP setup / configTime calls. · `debugdatetimesetup <0|1> [temp|runtime]`
- `debugdatetimeanchor` *(admin)* — Debug NTP boot anchor write/read. · `debugdatetimeanchor <0|1> [temp|runtime]`
- `debugdatetimeresolve` *(admin)* — Debug NTP timestamp resolution for users. · `debugdatetimeresolve <0|1> [temp|runtime]`
- `debugverbose` *(admin)* — Global debug verbosity override (forces all debug + loglevel=DEBUG). · `debugverbose <0|1>`
- `debugbuffer` *(admin)* — Show debug ring buffer status.
- `debugflags` *(admin)* — Show the live debug mask (4 hex words) and the flags it has set. · `debugflags`
- `debugcommandflow` *(admin)* — Debug command flow. · `debugcommandflow <0|1> [temp|runtime]`
- `debugusers` *(admin)* — Debug user management. · `debugusers <0|1> [temp|runtime]`
- `debugsystem` *(admin)* — Debug system/boot operations. · `debugsystem <0|1> [temp|runtime]`
- `debugespnowstream` *(admin)* — Debug ESP-NOW streaming output. · `debugespnowstream <0|1> [temp|runtime]`
- `debugespnowcore` *(admin)* — Debug ESP-NOW core operations. · `debugespnowcore <0|1> [temp|runtime]`
- `debugespnowrouter` *(admin)* — Debug ESP-NOW router operations. · `debugespnowrouter <0|1> [temp|runtime]`
- `debugespnowmesh` *(admin)* — Debug ESP-NOW mesh operations. · `debugespnowmesh <0|1> [temp|runtime]`
- `debugespnowtopo` *(admin)* — Debug ESP-NOW topology discovery. · `debugespnowtopo <0|1> [temp|runtime]`
- `debugespnowmetadata` *(admin)* — Debug ESP-NOW metadata exchange (REQ/RESP/PUSH). · `debugespnowmetadata <0|1> [temp|runtime]`
- `debugautoscheduler` *(admin)* — Debug automations scheduler. · `debugautoscheduler <0|1> [temp|runtime]`
- `debugautoexec` *(admin)* — Debug automations execution. · `debugautoexec <0|1> [temp|runtime]`
- `debugautocondition` *(admin)* — Debug automations conditions. · `debugautocondition <0|1> [temp|runtime]`
- `debugautotiming` *(admin)* — Debug automations timing. · `debugautotiming <0|1> [temp|runtime]`
- `debugmemory` *(admin)* — Debug memory (parent flag). · `debugmemory <0|1> [temp|runtime]`
- `loglink` *(admin)* — Route ESP-IDF logs through the unified output queue (stops UART interleave). · `loglink [<0|1|on|off>] (bare = show status)`
- `debugmemoryheap` *(admin)* — Debug per-task heap (free/min/largest), DRAM low watermark. · `debugmemoryheap <0|1> [temp|runtime]`
- `debugmemorystack` *(admin)* — Debug per-task stack watermarks + peak reports. · `debugmemorystack <0|1> [temp|runtime]`
- `debugmemorybuffers` *(admin)* — Debug response/cookie buffer sizing diagnostics. · `debugmemorybuffers <0|1> [temp|runtime]`
- `debugmqtt` *(admin)* — Debug MQTT (parent flag). · `debugmqtt <0|1> [temp|runtime]`
- `debugmqttconnection` *(admin)* — Debug MQTT connect/disconnect/TLS/init. · `debugmqttconnection <0|1> [temp|runtime]`
- `debugmqttpubsub` *(admin)* — Debug MQTT publish/subscribe + received messages. · `debugmqttpubsub <0|1> [temp|runtime]`
- `debugmqttdiscovery` *(admin)* — Debug MQTT Home Assistant auto-discovery. · `debugmqttdiscovery <0|1> [temp|runtime]`
- `debugmqttcommands` *(admin)* — Debug MQTT inbound commands + auth. · `debugmqttcommands <0|1> [temp|runtime]`
- `debugauthsessions` *(admin)* — Debug auth sessions. · `debugauthsessions <0|1> [temp|runtime]`
- `debugauthcookies` *(admin)* — Debug auth cookies. · `debugauthcookies <0|1> [temp|runtime]`
- `debugauthlogin` *(admin)* — Debug auth login. · `debugauthlogin <0|1> [temp|runtime]`
- `debugauthbootid` *(admin)* — Debug auth boot ID. · `debugauthbootid <0|1> [temp|runtime]`
- `debughttphandlers` *(admin)* — Debug HTTP handlers. · `debughttphandlers <0|1> [temp|runtime]`
- `debughttprequests` *(admin)* — Debug HTTP requests. · `debughttprequests <0|1> [temp|runtime]`
- `debughttpresponses` *(admin)* — Debug HTTP responses. · `debughttpresponses <0|1> [temp|runtime]`
- `debughttpstreaming` *(admin)* — Debug HTTP streaming. · `debughttpstreaming <0|1> [temp|runtime]`
- `debugwificonnection` *(admin)* — Debug WiFi connection. · `debugwificonnection <0|1> [temp|runtime]`
- `debugwificonfig` *(admin)* — Debug WiFi config. · `debugwificonfig <0|1> [temp|runtime]`
- `debugwifiscanning` *(admin)* — Debug WiFi scanning. · `debugwifiscanning <0|1> [temp|runtime]`
- `debugwifidriver` *(admin)* — Debug WiFi driver. · `debugwifidriver <0|1> [temp|runtime]`
- `debugstoragefiles` *(admin)* — Debug storage files. · `debugstoragefiles <0|1> [temp|runtime]`
- `debugstoragejson` *(admin)* — Debug storage JSON. · `debugstoragejson <0|1> [temp|runtime]`
- `debugstoragesettings` *(admin)* — Debug storage settings. · `debugstoragesettings <0|1> [temp|runtime]`
- `debugstoragemigration` *(admin)* — Debug storage migration. · `debugstoragemigration <0|1> [temp|runtime]`
- `debugstoragepermissions` *(admin)* — Debug storage [PERM] DENY audit. · `debugstoragepermissions <0|1> [temp|runtime]`
- `debugstack` *(admin)* — Low-level stack/heap trace to Serial: <on|off>. · `debugstack <0|1|on|off>`
- `debugsystemboot` *(admin)* — Debug system boot. · `debugsystemboot <0|1> [temp|runtime]`
- `debugsystemconfig` *(admin)* — Debug system config. · `debugsystemconfig <0|1> [temp|runtime]`
- `debugsystemtasks` *(admin)* — Debug system tasks. · `debugsystemtasks <0|1> [temp|runtime]`
- `debugsystemhardware` *(admin)* — Debug system hardware. · `debugsystemhardware <0|1> [temp|runtime]`
- `debugusersmgmt` *(admin)* — Debug users management. · `debugusersmgmt <0|1> [temp|runtime]`
- `debugusersregister` *(admin)* — Debug users registration. · `debugusersregister <0|1> [temp|runtime]`
- `debugusersquery` *(admin)* — Debug users query. · `debugusersquery <0|1> [temp|runtime]`
- `debugcliexecution` *(admin)* — Debug CLI execution. · `debugcliexecution <0|1> [temp|runtime]`
- `debugcliqueue` *(admin)* — Debug CLI queue. · `debugcliqueue <0|1> [temp|runtime]`
- `debugclivalidation` *(admin)* — Debug CLI validation. · `debugclivalidation <0|1> [temp|runtime]`
- `debugperfstack` *(admin)* — Debug performance stack. · `debugperfstack <0|1> [temp|runtime]`
- `debugperfheap` *(admin)* — Debug performance heap. · `debugperfheap <0|1> [temp|runtime]`
- `debugperftiming` *(admin)* — Debug performance timing. · `debugperftiming <0|1> [temp|runtime]`
- `debugsseconnection` *(admin)* — Debug SSE connection. · `debugsseconnection <0|1> [temp|runtime]`
- `debugsseevents` *(admin)* — Debug SSE events. · `debugsseevents <0|1> [temp|runtime]`
- `debugssebroadcast` *(admin)* — Debug SSE broadcast. · `debugssebroadcast <0|1> [temp|runtime]`
- `debugcmdflowrouting` *(admin)* — Debug command flow routing. · `debugcmdflowrouting <0|1> [temp|runtime]`
- `debugcmdflowqueue` *(admin)* — Debug command flow queue. · `debugcmdflowqueue <0|1> [temp|runtime]`
- `debugcmdflowcontext` *(admin)* — Debug command flow context. · `debugcmdflowcontext <0|1> [temp|runtime]`
- `debugcommandsystem` *(admin)* — Debug modular command registry operations. · `debugcommandsystem <0|1> [temp|runtime]`
- `debugautomations` *(admin)* — Debug automations scheduler and actions. · `debugautomations <0|1> [temp|runtime]`
- `debuglogger` *(admin)* — Debug sensor logger internals. · `debuglogger <0|1> [temp|runtime]`
- `commandmodulesummary` *(admin)* — Show command module summary.
- `settingsmodulesummary` *(admin)* — Show settings module summary.
- `outg2` — Enable/disable G2 glasses output. · `outg2 <0|1> - streams CLI output to G2 glasses`
- `debugg2` *(admin)* — Debug G2 smart glasses BLE operations. · `debugg2 <0|1> [temp|runtime]`
- `debugg2lifecycle` *(admin)* — Debug G2 BLE lifecycle (scan/connect/MTU). · `debugg2lifecycle <0|1> [temp|runtime]`
- `debugg2protocol` *(admin)* — Debug G2 envelope TX/RX, CRC, fragmentation. · `debugg2protocol <0|1> [temp|runtime]`
- `debugg2events` *(admin)* — Debug G2 DevEvents/SysEvents/gestures. · `debugg2events <0|1> [temp|runtime]`
- `debugg2pages` *(admin)* — Debug G2 page-swap worker / hijack / lens state. · `debugg2pages <0|1> [temp|runtime]`
- `debugg2heartbeat` *(admin)* — Debug G2 heartbeat TX + acks (loud). · `debugg2heartbeat <0|1> [temp|runtime]`
- `debugg2dump` *(admin)* — Debug G2 ring-buffer dumps on errors. · `debugg2dump <0|1> [temp|runtime]`
- `debugring` *(admin)* — Debug R1 health ring (parent flag). · `debugring <0|1> [temp|runtime]`
- `debugringlifecycle` *(admin)* — Debug R1 scan/connect/GATT/disconnect. · `debugringlifecycle <0|1> [temp|runtime]`
- `debugringsetup` *(admin)* — Debug R1 setup ritual + clock custody. · `debugringsetup <0|1> [temp|runtime]`
- `debugringprotocol` *(admin)* — Debug R1 per-frame decode/reassembly (loud). · `debugringprotocol <0|1> [temp|runtime]`
- `debugringtxn` *(admin)* — Debug R1 transactions + packetAck (loud). · `debugringtxn <0|1> [temp|runtime]`
- `debugringhealth` *(admin)* — Debug R1 telemetry cache + history sweep. · `debugringhealth <0|1> [temp|runtime]`
- `debugringbridge` *(admin)* — Debug R1→G2 spoof bridge push. · `debugringbridge <0|1> [temp|runtime]`
- `debugringdump` *(admin)* — Debug R1 raw hex frame/payload dumps (loud). · `debugringdump <0|1> [temp|runtime]`
- `outble` — Enable/disable BLE broadcast output. · `outble <0|1> - streams broadcast output to authenticated BLE clients`
- `debugsr` *(admin)* — Debug ESP-SR speech recognition (parent flag). · `debugsr <0|1> [temp|runtime]`
- `debugsrwake` *(admin)* — Debug SR wake word detection events. · `debugsrwake <0|1> [temp|runtime]`
- `debugsrcommand` *(admin)* — Debug SR MultiNet command recognition. · `debugsrcommand <0|1> [temp|runtime]`
- `debugsrafe` *(admin)* — Debug SR AFE chain (VAD/noise/gain). · `debugsrafe <0|1> [temp|runtime]`
- `debugsrlifecycle` *(admin)* — Debug SR init/start/stop verbose. · `debugsrlifecycle <0|1> [temp|runtime]`
- `debugsrtuning` *(admin)* — Debug SR auto-tune sweeps + threshold. · `debugsrtuning <0|1> [temp|runtime]`
- `debugfmradio` *(admin)* — Debug FM Radio operations. · `debugfmradio <0|1> [temp|runtime]`
- `memorysampleintervalsec` *(admin)* — Set memory sampling interval in seconds (0=disabled). · `memorysampleintervalsec <0-300>` _(setting · int 0–300 · default 30)_
- `loglevel` *(admin)* — Set log level (error|warn|info|debug). · `loglevel <error|warn|info|debug>` _(setting · enum · default 3 (debug) · options 0=error, 1=warn, 2=info, 3=debug)_
- `log` *(admin)* — System-wide logging to file. · `log <start|stop|status|autostart> start ["filepath"] [flags=0x...] [tags=0|1]: Begin system logging filepath: Log file path, quoted (auto-generated if omitted) flags: Debug flag mask, up to 64 hex digits (bit map in System_Debug.h) tags: Prefix lines with category tags (0|1, default 1) stop / status: Stop logging / show logging status autostart [on|off]: Toggle logging auto-start on boot (bare = toggle)`
- `webconsole` *(admin)* — Enable/disable browser-side debug console output in the web UI. · `webconsole <0|1>` _(setting · bool · default off)_

### `settings` — Device configuration and preferences

_Always compiled._

**Firmware module overview (context):** The settings subsystem holds the device persisted configuration and the commands that change it. Each setting command (for example outserial, serialrequireauth, displayrequireauth, tzoffsetminutes, ntpserver, wifitxpower, webclihistorysize) sets one value and normally requests an immediate settings-file write. Because flash writes are costly, beginwrite and savesettings can coalesce changes made by the same request or transport session: the final save writes each changed settings file at most once. This is write coalescing, not a RAM transaction; unrelated sources continue to persist immediately, and their full snapshot can include live values changed while a batch is open. Idle batches expire after two minutes. savesettings remains an explicit flush-now command when no batch is open. Most commands here are admin-gated. Some changes only take effect after a reboot (for example espnowenabled and httpsEnabled are marked reboot required). The controls command emits a machine-readable JSON descriptor of a module's settable controls for UI use. Note that most subsystem settings (wifi, i2c, sensors, power, oled, bluetooth, espnow) are owned and registered by their own modules; this module hosts the cross-cutting CLI/output/auth/time settings plus the batch-write machinery.

- `controls` — Per-module control descriptor (JSON): controls json [module] · `controls json <module> (e.g. 'controls json imu'); 'controls json' lists modules`
- `wifitxpower` *(admin)* — Set WiFi TX power: <dBm> · `wifitxpower <dBm>`
- `wifiautoreconnect` *(admin)* — Keep hunting for the AP after an unexpected drop: <0|1> · `wifiautoreconnect <0|1> Separate from wifiautostart: this is about recovering a dropped link, not connecting at boot.` _(setting · bool · default on)_
- `ntpserver` *(admin)* — Set NTP server: <hostname> · `ntpserver <host>` _(setting · string · default "pool.ntp.org")_
- `tzoffsetminutes` *(admin)* — Set timezone offset: <-720..840> · `tzoffsetminutes <-720..840>` _(setting · enum · default 0 (UTC+0 (London/GMT · Dublin)) · options -720=UTC-12 (Baker Island), -660=UTC-11 (Samoa), -600=UTC-10 (Hawaii/HST), -540=UTC-9 (Alaska/AKST), -480=UTC-8 (Pacific/PST), -420=UTC-7 (Mountain/MST · Pacific/PDT), -360=UTC-6 (Central/CST · Mountain/MDT), -300=UTC-5 (Eastern/EST · Central/CDT), -240=UTC-4 (Atlantic/AST · Eastern/EDT), -180=UTC-3 (Argentina · Atlantic/ADT), -120=UTC-2 (Mid-Atlantic), -60=UTC-1 (Azores), 0=UTC+0 (London/GMT · Dublin), 60=UTC+1 (Berlin/Paris/CET · London/BST), 120=UTC+2 (Cairo/Athens/EET · Paris/CEST), 180=UTC+3 (Moscow/Baghdad), 240=UTC+4 (Dubai/Baku), 300=UTC+5 (Karachi/Tashkent), 330=UTC+5:30 (Mumbai/Delhi/IST), 360=UTC+6 (Dhaka/Almaty), 420=UTC+7 (Bangkok/Jakarta), 480=UTC+8 (Beijing/Singapore), 540=UTC+9 (Tokyo/Seoul/JST), 570=UTC+9:30 (Adelaide/ACST), 600=UTC+10 (Sydney/AEST), 660=UTC+11 (Solomon Islands), 720=UTC+12 (Fiji/Auckland/NZST))_
- `espnowenabled` *(admin)* — Enable/disable ESP-NOW: <0|1> (reboot required) · `espnowenabled <0|1>`
- `httpAutoStart` *(admin)* — Auto-start HTTP server at boot: <0|1> · `httpAutoStart <0|1>` _(setting · bool · default on)_
- `httpsEnabled` *(admin)* — Enable/disable HTTPS: <0|1> (reboot required) · `httpsEnabled <0|1>` _(setting · bool · default off)_
- `webclihistorysize` *(admin)* — Set web CLI history size: <1..100> · `webclihistorysize <1..100>` _(setting · int 1–100 · default 10)_
- `oledclihistorysize` *(admin)* — Set OLED CLI history size: <10..100> · `oledclihistorysize <10..100>` _(setting · int 10–100 · default 50)_
- `outserial` *(admin)* — Set serial output: <0|1> [persist|temp] · `outserial <0|1> [persist|temp]` _(setting · bool · default on)_
- `serialrequireauth` *(super admin)* — Require auth for serial: <0|1> · `serialrequireauth <0|1>` _(setting · bool · default on)_
- `displayrequireauth` *(super admin)* — Require auth for display: <0|1> · `displayrequireauth <0|1>` _(setting · bool · default on)_
- `uartlink` *(admin)* — UART host link: status | on | off · `uartlink [status|on|off]` _(setting · bool · default off)_
- `uartlinkbaud` *(admin)* — Set UART link baud (0=board default) · `uartlinkbaud <0|9600-max>` _(setting · int 0–UART_LINK_BAUD_MAX · default 0)_
- `uartrequireauth` *(super admin)* — Require auth for UART link: <0|1> · `uartrequireauth <0|1>` _(setting · bool · default on)_
- `beginwrite` *(admin)* — Start owner-scoped settings write coalescing until savesettings (not a RAM transaction).
- `savesettings` *(admin)* — Flush this source's changed settings files and end its coalescing scope.

### `sensorlog` — Sensor data logging to files

_Always compiled._

**Firmware module overview (context):** Periodically samples the onboard sensors and appends readings to a file, driven by the single multiplexed sensorlog <subcommand> command. sensorlog start <filepath> [interval_ms] begins logging (default 5000 ms; the filepath must start with / and parent directories are created automatically) and sensorlog stop ends it; only one log can run at a time, so start refuses if logging is already active. sensorlog status reports the active file, interval, format, rotation settings, selected sensors, and last-write age. Configure behavior with format <text|csv|track> (track is a compact GPS-only format with signal-loss dedup), maxsize and rotations for log rotation, and sensors <thermal|tof|imu|gamepad|apds|gps|presence|r1|all|none> to choose which sensors are recorded. sensorlog interval <ms> sets the poll period (100-3600000, default 5000). NOTE: format track additionally REPLACES the sensor mask with GPS-only and persists it, so a prior selection is lost — and rotations 0 deletes the active file at the size cap rather than pruning older generations. sensorlog autostart [on|off] makes logging resume on the next boot using the last-used parameters; the format/maxsize/rotations/sensors/autostart choices are persisted.

- `sensorlog` — Sensor data logging: start, stop, status, format, maxsize, rotations, sensors · `sensorlog <start|stop|status|format|maxsize|rotations|sensors|interval|autostart> [args...] start <filepath> [interval_ms]: Begin logging (default 5000ms) stop: Stop logging status: Show current logging status format <text|csv|track>: Set log format (default: text) track = GPS-only compact format with signal loss dedup; NOTE: also OVERWRITES the sensor mask to GPS-only and persists it maxsize <bytes>: Set max file size before rotation (default: 256000) rotations <count>: Old generations to keep (1-9). 0 = DELETE the active file at the size cap, losing the current day (default: 3) sensors <thermal|tof|imu|gamepad|apds|gps|presence|r1|all|none>: Select sensors to log interval <ms>: Set poll interval 100-3600000 (default 5000) autostart [on|off]: Auto-start logging on boot (bare = toggle)`
- `capturecrypt` *(admin)* — Capture at-rest encryption: status, mode (off/health/all), plaintext export · `capturecrypt [status|off|health|all|export "<in>" "<out>"] Sealed sessions write '#HW1ENC' on line 1 + per-row ciphertext; filenames don't change. health: seal sessions that include the R1 ring (default). all: every capture session. Mode changes apply at the next session or day rollover — a single file is never mixed-mode. Viewers (fileview, web view, G2/OLED) decrypt for authorized users; raw downloads, fileread and ESP-NOW transfers ship sealed bytes. export: write a decrypted copy (inside /logging_captures) for sharing.` _(setting · enum · default 1 (Health) · options 0=Off, 1=Health, 2=All)_

### `health` — R1 ring health vitals and local health logging

_Requires `ENABLE_R1_HEALTH`._

**Firmware module overview (context):** Live vitals from a paired R1 ring (HR, HRV, SpO2, temperature, battery) plus the on-device health logger. healthstatus reads live values, ring control state, logging state and typed-history status; healthstatus json is what the app and web page consume. healthlogging drives the local CSV logger independently of the ring's own health-collection privacy setting, and healthlogmerge stitches captures together. The ring rides the G2 BLE transport, so this whole family requires Bluetooth + G2; connect via ringconnect.

- `healthlogging` — Start/stop local R1 health logging (independent of ring collection) · `healthlogging <on|off|toggle|status|interval [sec]> on: enable LOG_R1, force format=CSV, start under /logging_captures/sensors/, persist for boot (one dated per-day file when the clock is set, boot-<N>/ until sync then roll) off: remove LOG_R1; stop logging if no other sensors remain interval <sec>: legacy POINT mining interval (default 900 = 15 min) On 2.2.9, logging is passive/on-demand and records Poll Now refreshes; it sends no timed POINT query R1-only sessions write only on an admitted mine/refresh — no 5s empty heartbeats This does not change the ring's health-collection privacy setting.` _(setting · bool · default off)_
- `healthstatus` — R1 live vitals, ring controls, local logging, and typed history status · `healthstatus [json|poll|history|force-history|refresh-controls] bare/json: live values, desired/observed controls, local logging, history/store poll: exact-2.2.9 DAILY HR/HRV/SpO2/sleep/activity + deviceStatus refresh history: normal typed history refresh; force-history: admin freshness bypass refresh-controls: read low-power state; health collection has no proven GET and stays Unknown BLE App / Web use healthstatus json; connect via ringconnect / Bluetooth page`
- `healthlogmerge` *(admin)* — Byte-concatenate sensor logs in the given order: "<out>" "<in1>" "<in2>" ... · `healthlogmerge "<output>" "<in1>" "<in2>" [...] OUTPUT FIRST — arg 0 is TRUNCATED. Inputs follow, in the order you want them. Bare output name → /logging_captures/sensors/; INPUTS need a full path. Extensionless output gets .csv appended even for TEXT inputs. Concatenation is byte-exact: CSV inputs keep their header lines mid-file, rows are NOT time-ordered, and mixing formats/sensor masks yields an unparseable result. Max 8 inputs (arg limit).`

### `users` — User authentication and management

_Always compiled._

**Firmware module overview (context):** The users subsystem provides admin-gated account management, authentication, sessions, and bans. Accounts have two roles, admin and standard; the first account is the owner-admin, and userpromote/userdemote change roles while useradd creates an account directly (optionally forcing a password change on first login). New accounts can also come through an approval flow: userrequest files a pending request that an admin clears with userapprove or rejects with userdeny (pendinglist shows the queue). login and logout authenticate per transport (serial, display, bluetooth, g2), userlist enumerates accounts, and the password commands cover both self-service (userchangepassword) and admin reset (userresetpassword). Sessions are tracked per transport: sessionlist shows active sessions and sessionrevoke force-logs-out a session by SID or by username. Two independent ban mechanisms exist: ban/unban/banlist block an IP address, while banuser/unbanuser suspend a user account so it cannot log in until unbanned; the primary admin account cannot be banned. usersync pushes a user credentials to another device over ESP-NOW, authenticated by an admin account on the receiving device.

- `login` — Login this interface, or target another session after signing in: <user> <pass> [serial|uart|display] · `login <username> <password> [serial|uart|display] Bare login always targets the submitting interface. An explicit target requires a live named non-Guest Serial/UART/display session.`
- `logout` — Logout this interface, or target another session after signing in: [serial|uart|display] · `logout [serial|uart|display] Bare logout always targets the submitting interface. An explicit target requires a live named non-Guest Serial/UART/display session.`
- `whoami` — Show the identity of the submitting interface. · `whoami`
- `serialrequireauth` *(super admin)* — Enable/disable serial auth requirement [on|off]. · `serialrequireauth [on|off]`
- `userapprove` *(admin)* — Approve pending request: <username> · `userapprove <username>`
- `userdeny` *(admin)* — Deny pending request: <username> · `userdeny <username>`
- `userpromote` *(admin)* — Promote a user: <username> [user|admin|superadmin] · `userpromote <username> [user|admin|superadmin] (default admin; granting superadmin requires a super-admin caller)`
- `userdemote` *(admin)* — Lower a user's role: <username> [admin|user|guest] · `userdemote <username> [admin|user|guest] (default user; demoting a super-admin requires a super-admin caller)`
- `userdelete` *(admin)* — Delete user: <username> · `userdelete <username>`
- `userchangepassword` — Change own password: <currentPass> <newPass> <confirmPass> · `userchangepassword <currentPassword> <newPassword> <confirmPassword>`
- `userresetpassword` *(admin)* — Reset user password: <username> <newPassword> [0|1] · `userresetpassword <username> <newPassword> [0|1] Optional: 1 = require password change on next login`
- `useradd` *(admin)* — Create user: <username> <password> [0|1] [role] · `useradd <username> <password> [0|1] [guest|user|admin|superadmin] 0|1: 1 = require a new password on next login (default 0) role: defaults to user; you cannot grant a role above your own The two optional tokens may appear in either order`
- `userlist` *(admin)* — List all users. (add 'json' for JSON output)
- `userrequest` — Request account: <user> <pass> [confirm] · `userrequest <username> <password> [confirmPassword]`
- `usersync` *(admin)* — Sync a user to another device over ESP-NOW. (async; result only on the target device - check its userlist) · `usersync <username> <userPass> <device> <targetAdminUser> <targetAdminPass> <yourAdminPass> Returns OK on delivery; the user is created on the TARGET device (no confirmation returns here) - verify on that device's userlist. targetAdminUser/targetAdminPass = an admin account on the RECEIVING device (validated there). yourAdminPass = your admin password on THIS device; userPass = the synced user's password.`
- `pendinglist` *(admin)* — List pending user requests. (add 'json' for JSON output)
- `sessionlist` *(admin)* — List active sessions. (add 'json' for JSON output)
- `sessionrevoke` *(admin)* — Revoke session: <sid|user> [reason] · `sessionrevoke sid <sid> [reason] sessionrevoke user <username> [reason]`
- `ban` *(admin)* — Permanently ban an IP: <ip> [reason] · `ban <ip> [reason] Blocks all access from the IP until manually unbanned.`
- `unban` *(admin)* — Remove an IP ban: <ip> · `unban <ip>`
- `banlist` *(admin)* — List all banned IPs. (add 'json' for JSON output)
- `banuser` *(admin)* — Permanently ban a user account: <username> [reason] · `banuser <username> [reason] Prevents the account from logging in until manually unbanned.`
- `unbanuser` *(admin)* — Remove a user account ban: <username> · `unbanuser <username>`

### `features` — System feature management

_Always compiled._

**Firmware module overview (context):** The features subsystem enables or disables compiled-in capabilities at runtime and reports their memory cost. features with no argument lists every feature grouped by category (Network, Display, Sensors, System) with an approximate heap estimate and a status of ON, OFF, or N/C (not compiled in this build); features <id> shows one feature details and features <id> <on|off> toggles it, persisting the change immediately. Only features that are compiled and marked runtime-toggleable can be changed; a few are compile-time only, and some (wifi, oled, i2c, https) are flagged reboot required so the toggle persists but the capability does not actually start or stop until the next restart. featuresetup launches an interactive, admin-only wizard that walks through the same toggles and works from any CLI transport.

- `features` *(admin)* — Show/toggle system features with heap estimates. · `features - List all features features <id> - Show feature details features <id> <on|off> - Enable/disable feature features json - JSON capability list`
- `featuresetup` *(admin)* — Run the interactive feature configuration wizard. · `featuresetup - Launch the feature config wizard (any CLI transport; navigate with n/b/numbers, 'cancel' to abort)`

### `image` — Image capture and management

_Requires `ENABLE_CAMERA_SENSOR`._

**Firmware module overview (context):** Captures stills from the camera and manages the saved photo library. capture grabs a frame and saves it as a JPG (target storage chosen by argument: littlefs/lfs, sd, or both; default follows the cameraStorageLocation setting), and requires a camera sensor that is both compiled in and enabled -- on boards with no camera the capture simply fails. images lists saved photos with sizes and storage stats (add sd to list the card, json for app/BLE output); imagedelete "<path>" removes one (path must be quoted). imagesend transmits a photo to another device over ESP-NOW: imagesend <device> "<path>" resolves the device by name or MAC and sends the named file (path required).

- `capture` — Capture and save image: capture [littlefs|sd|both] · `capture [littlefs|lfs|sd|both]`
- `images` — List saved images: images [littlefs|sd] · `images [sd] [json]`
- `imagedelete` *(admin)* — Delete image: imagedelete "<path>" · `imagedelete "<path>"`
- `imagesend` *(admin)* — Send image via ESP-NOW: imagesend <device> "<path>" (synchronous send; fails if the receiver rejects/cancels) · `imagesend <device> "<path>" Blocks until the image is sent; it is written to the peer's /espnow/received/ inbox. An error result means the send aborted or the receiver cancelled.`

### `map` — Map navigation and waypoints

_Requires `ENABLE_MAPS`._

**Firmware module overview (context):** On-device offline map subsystem backed by region map files stored under /maps/ (custom HWMap tile format). A map must be loaded before any lookup works: mapload "<path>" loads a file into PSRAM, maplist shows what is available, map prints the current map region/feature-count/bounds (add json for structured output), and mapunload frees the PSRAM and tile cache. search <name> finds named features in the loaded map, while whereami reports the nearest road and area for the current GPS position and therefore needs both a loaded map and a live GPS fix. Waypoints are persistent user markers managed through waypoint (list/add/del/goto/clear/clearall/rename/notes) and can have files attached via waypointfile/waypointfiles; gpstrack loads, inspects, or clears a recorded GPS breadcrumb track (and rejects tracks that fall outside the loaded map bounds), and maporganize sorts loose files in /maps into subdirectories.

- `map` — Show current map info (add 'json' for JSON output)
- `mapload` — Load map file: "<path>" · `mapload "<path>"`
- `mapunload` — Unload current map (free PSRAM on device)
- `maplist` — List available maps (add 'json' for JSON output)
- `whereami` — Show current location context (add 'json' for JSON output)
- `search` — Search map features: <name> · `search <name>`
- `waypoint` — Manage waypoints: <list|add|del|goto|clear|clearall|rename|notes> · `waypoint [list|add <lat> <lon> [name]|del <index>|goto <index>|clear|clearall|rename <index> <name>|notes <index> <notes>]`
- `gpstrack` — Manage GPS tracks: <status|load|clear> · `gpstrack [status|load <filepath>|clear]`
- `gpstrackmerge` *(admin)* — Stitch GPS logs in order: "<out>" "<in1>" "<in2>" ... · `gpstrackmerge "<output>" "<in1>" "<in2>" [...] (output first, then inputs in stitch order; max 9 inputs)`
- `waypointfile` — Link file to waypoint: "<file>" <wpName> · `waypointfile "<file>" <wpName> | waypointfile "<file>" <lat> <lon> [wpName]`
- `waypointfiles` — Waypoint files: <name> [del <idx>] · `waypointfiles <wpName> [del <index>]`
- `maporganize` — Organize map files in /maps into subdirectories

### `mapsettings` — Maps app settings (zoom, layers, cache)

_Requires `ENABLE_MAPS`._

**Firmware module overview (context):** Persisted rendering defaults for the maps app, stored under apps.maps and applied to the live map at boot. mapzoom <0.5..20.0> sets the initial zoom, maplayers <0..1023> sets a bitmask controlling which feature layers are drawn, and mapcachekb <256..4096> sizes the tile LRU cache pool. The zoom and layers setters also mirror immediately into the running renderer so changes take effect without a reboot, but the cache size only re-applies on the next map load (or reboot). All three are admin-only and, run from the CLI, write to flash immediately so they survive a reboot.

- `mapzoom` *(admin)* — Set default map zoom: <0.5..20.0> · `mapzoom <0.5..20.0>` _(setting · float · default 1.0)_
- `maplayers` *(admin)* — Set visible layer bitmask: <0..1023> · `maplayers <bitmask 0..1023>` _(setting · int 0–0x3FF · default 0x3FF)_
- `mapcachekb` *(admin)* — Set tile cache size in KB (effective on next map load) · `mapcachekb <256..4096>` _(setting · int 256–4096 · default 1280)_

### `power` — Power management

_Always compiled._

**Firmware module overview (context):** The power subsystem manages CPU frequency and battery-oriented power saving. The main command is power: power alone prints the current mode, CPU clock, display brightness, and auto-mode state; power mode <perf|balanced|saver|ultra|locked|0-4> selects one of five target-specific presets: Performance, Balanced, PowerSaver, UltraSaver, or Locked. Run power or power json to see their active and idle MHz. Modes set the CPU clock and display brightness; the chosen mode is persisted. Locked keeps the maximum active clock when the OLED blanks. UltraSaver uses its lower idle-only clock when powersave blanks the display; input or a command restores the target's interactive floor. power auto <on|off> enables an automatic low-battery downshift gated by power threshold <0-100>. Two related idle controls are separate commands: powersave <0..1440> sets an idle timeout (minutes; 0 disables) after which the OLED blanks and the CPU may downclock (mode-dependent) while the radio stays up so the device remains reachable, and powercooldown <0..60000> sets an anti-flap cooldown (milliseconds) that prevents rapid back-to-back sleep transitions. All of these values persist.

- `power` *(admin)* — Power management [mode] [auto] [threshold] · `power - show current power status power json - status as one JSON blob (same schema as /api/power/status) power mode <perf|balanced|saver|ultra|locked|0-4> power auto <on|off> power threshold <0-100>`
- `powercooldown` *(admin)* — Sleep transition cooldown (ms; 0 disables) · `powercooldown <0..60000>` _(setting · int 0–60000 · default 5000)_
- `powersave` *(admin)* — Idle power-save: OLED off + optional downclock (0 disables) · `powersave <0..1440>` _(setting · int 0–1440 · default 10)_

### `liveaudio` — Opt-in live PCM transport and recorder shadow

_Always compiled._

**Firmware module overview (context):** Exercises the live-pcm-v1 UART framing and bounded receiver path. A real authenticated UART host first acquires a renewable 3-second controller lease with liveaudio ready. liveaudio synth schedules deterministic 16 kHz signed-16-bit mono PCM; an explicit, exact-ID liveaudio shadow arm can instead tee an owned 16 kHz PDM or G2 recording through a fixed 16 KiB PSRAM queue. Shadow transport is disabled by default, never delays or replaces the WAV writer, and a transport fault aborts only the live copy while the finalized WAV remains authoritative. This diagnostic transport does not enable production streaming STT, LLM, or lens delivery.

- `liveaudio` — Opt-in live PCM transport, lease, and shadow diagnostics · `liveaudio <capabilities|status|ready 1 <controller_hex16>|conversate 1 <controller_hex16> on|off|shadow 1 <controller_hex16> on <exchange_hex16|native>|shadow 1 <controller_hex16> off|release 1 <controller_hex16>|synth 1 <controller_hex16> <exchange_hex16> <duration_ms>|abort 1 <controller_hex16> <exchange_hex16>>`

### `cm5` — CM5 service presence and host power/fan control

_Always compiled._

**Firmware module overview (context):** Everything that talks to the CM5 Linux host over the authenticated UART link. cm5 status exposes the current named-UART epoch binding, freshness, state, command bridge, monitor transitions, and task stack watermark; cm5 capabilities reports the heartbeat protocol constants. The five-second heartbeat itself is authenticated UART control-plane traffic, not a user command, so it remains responsive even while the shared command executor is occupied. cm5 power and cm5 fan drive the host through two independent finite request/ACK/report state machines that share one ID space: cm5 power status requests fresh CM5 state, cm5 power profile <eco|balanced|performance|auto> requests a power profile, and cm5 fan <quiet|max> pins a fan mode while cm5 fan auto returns control to the Linux temperature curve. Bare cm5 power / cm5 fan (or their show form) display local delivery state and the last CM5 report. Initiation requires an admin; reboot, halt, suspend, and sleep_for <1..1440 minutes> additionally require superadmin plus a literal same-command confirm token, and recover confirm clears only an inspected fail-closed transition. ACK/report callbacks are accepted from a real authenticated UART session only, which lets the CM5 service account stay user-tier. One request per protocol may be pending at a time and delivery retries are finite; destructive execution additionally requires confirmed accepted and committed ACK phases, while a normalized Linux boot ID distinguishes a daemon restart from a completed host boot. A max fan request may supersede one pending non-max request.

- `cm5 status` — Inspect the setup-agnostic CM5 service-presence lease. · `cm5 status`
- `cm5 capabilities` — Show the CM5 presence protocol capabilities. · `cm5 capabilities`
- `cm5 linkhealth` — Show the CM5 host's UART link fault tally. · `cm5 linkhealth [json]`
- `cm5 power ack` — Accept a CM5 delivery/application ACK (UART session only). · `cm5 power ack 1 <16-hex-id> <accepted|committed|applied|failed>`
- `cm5 power report` — Accept finite CM5 power state/profile readback (UART session only). · `cm5 power report 1 <16-hex-id|0> <state> <profile> <32-hex-linux-boot-id>`
- `cm5 power reboot` *(super admin)* — Request a confirmed CM5 reboot. · `cm5 power reboot confirm`
- `cm5 power halt` *(super admin)* — Request a confirmed CM5 halt. · `cm5 power halt confirm`
- `cm5 power suspend` *(super admin)* — Request confirmed CM5 system suspend (host may reject it). · `cm5 power suspend confirm`
- `cm5 power sleep_for` *(super admin)* — Request confirmed CM5 timed sleep in bounded minutes. · `cm5 power sleep_for <1..1440 minutes> confirm`
- `cm5 power recover` *(super admin)* — Clear a fail-closed uncertain CM5 transition after inspection. · `cm5 power recover confirm`
- `cm5 power` *(admin)* — Inspect or request CM5 host power/profile state. · `cm5 power [show|status|profile <eco|balanced|performance|auto>]`
- `cm5 fan ack` — Accept a CM5 fan ACK (authenticated UART session only). · `cm5 fan ack 1 <16-hex-id> <accepted|applied|failed>`
- `cm5 fan report` — Accept bounded CM5 fan readback (authenticated UART session only). · `cm5 fan report 1 <id> <requested-mode> <effective-mode> <temp-mc|-1> <target-pwm> <pwm> <rpm|-1> <health>`
- `cm5 fan` *(admin)* — Inspect or request CM5 fan mode/readback. · `cm5 fan [show|status|quiet|auto|max]`
- `cm5` — Inspect CM5 service presence, link health, and host power/fan control. · `cm5 <status|capabilities|linkhealth> (heartbeat is UART control-plane only)`

### `ota` — Signed firmware recovery and update

_Always compiled._

**Firmware module overview (context):** Native ESP-IDF signed OTA support. otastatus reports the journal, partition identity, staged pair, and last result. A superadmin sets a persistent recovery credential with otapin - on the physical serial console only, because it decides whether recovery can be reached at all - then uploads /system/ota/candidate.part and manifest.part, validates and journals them with otastage confirm, then uses otaupdate confirm to reboot into the immutable factory recovery updater. otarecovery confirm enters the same authenticated recovery image for a direct upload when the main filesystem cannot stage an image; its explicit allow-downgrade option is required for older signed releases. otacancel replaces a staged request safely, and otaack <result-sequence> confirm acknowledges exactly the durable result that was reviewed. Mutating OTA commands are forbidden from automations and require the opt-in 16 MB OTA partition layout.

- `otastatus` — Show signed recovery OTA state. (add 'json') · `otastatus [json]`
- `otapin` *(super admin)* — Set the persistent recovery WPA2/HTTP credential (serial console only). · `otapin <12..63 printable characters> | otapin clear confirm`
- `otawrite` *(super admin)* — Stage exact OTA members over encrypted Bluetooth. · `otawrite begin <candidate|manifest> <size> <sha256> | status | finish | abort`
- `otastage` *(super admin)* — Validate and journal uploaded candidate.part + manifest.part. · `otastage confirm [allow-downgrade]`
- `otaupdate` *(super admin)* — Revalidate staged firmware and reboot into recovery apply. · `otaupdate confirm [force-power]`
- `otarecovery` *(super admin)* — Reboot into authenticated recovery for direct upload. · `otarecovery confirm [allow-downgrade]`
- `otacancel` *(super admin)* — Cancel a staged request before recovery boot is armed. · `otacancel confirm`
- `otaack` *(super admin)* — Acknowledge the durable OTA result after reviewing it. · `otaack <result-sequence> confirm`
- `otaresetjournal` *(super admin)* — Serial-only repair of the two OTA transaction keys. · `otaresetjournal confirm`

### `setpattern` — OLED gamepad password entry

_Requires `ENABLE_OLED_DISPLAY`._

**Firmware module overview (context):** Provides the single admin-only command setgamepadpassword, which opens the gamepad-pattern password setup flow on the OLED screen. A pattern is a sequence of joystick directions that is hashed and stored as the logged-in user password, usable for on-device login. You must already be logged in at the OLED display first (the command errors otherwise); the guided on-screen flow then re-authenticates you, prompts you to enter the new pattern and confirm it, and saves it to your account. This command only launches the OLED mode -- the actual entry and confirmation happen on the device screen.

- `setgamepadpassword` *(admin)* — Set gamepad joystick password (requires an active OLED-display login).

### `even_g2` — Even G2 smart glasses control

_Requires `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES`._

**Firmware module overview (context):** This subsystem drives Even Reality G2 smart glasses while Bluetooth is in client mode (blemode client); the two temples are addressed as left/right/auto. openg2 starts scan-and-connect IN THE BACKGROUND and returns immediately -- it does not block, so poll g2status (or g2info for firmware/MAC/battery) to see when the link is up, and nearly every other command here requires that connection first. Display commands render to the lens: g2show prints text, g2ai/g2ai-noask/g2ai-direct push a front-pane AI answer card through the EvenAI pipeline, g2bmp shows a BMP file, and g2sensors/g2network/g2files/g2settingspage show built-in info pages; g2nav [on|off] enables menu-navigation mode and g2clear blanks the display. For audio, g2mic only sends the enable/disable control frame (LC3 decode is not yet wired, so no audio arrives); the working capture path is g2micrec (raw LC3 packets to SD) and g2micwav (decodes to a 16 kHz mono WAV on SD), each an SD-backed start/stop/status lifecycle that needs an SD card. closeg2 disconnects but keeps the GATT cache for fast reconnect; closeg2 full also frees the cache to recover about 30 KB. The remaining g2* commands are low-level protocol probes and diagnostics (g2probe, g2protostats, g2devcfg, g2dumpframes).

- `openg2` *(admin)* — Connect to G2 glasses: openg2 [left|right|auto|saved] · `openg2 [left|right|auto|saved] (default auto; saved = peer MACs)`
- `closeg2` *(admin)* — Disconnect G2 glasses [full=also free ~30KB GATT cache]. · `closeg2 [full]`
- `g2status` — Show G2 connection status
- `g2info` — Dump device info (firmware, MAC, battery, etc.)
- `g2settings` — Settings debug: g2settings verbose [on|off] · `g2settings verbose [<on|off>] (bare verbose = toggle)`
- `g2liverate` — Get/set live-update probe cadence (ms), default 600: g2liverate [N] · `g2liverate [ms>=100] (bare = report)`
- `g2liveloop` — Q13/Q14 lens-idle keep-alive: g2liveloop keep [on|off] (default off → break on lens timeout) · `g2liveloop keep [<on|off>] (bare = report state)`
- `g2listrebuild` — REBUILD-list on swap when pure list + same row count [on|off] (default ON) · `g2listrebuild [<on|off>] (bare = report state)`
- `g2show` — Display text: g2show <text> · `g2show <text>`
- `g2ai` — Front-pane AI card (full pipeline): g2ai <text> · `g2ai <text>`
- `g2ai-noask` — Variant: skip ASK step: g2ai-noask <text> · `g2ai-noask <text>`
- `g2ai-direct` — Variant: CTRL+REPLY only: g2ai-direct <text> · `g2ai-direct <text>`
- `g2evenai` — Push into the matching live Hey-Even exchange (strict 16-hex ID required) · `g2evenai <askid|replyid|replypartid|replyendid|exitid> <16hex-id> [text] status: show active exchange ID/arm/generation capabilities: show guarded command contract replypartid: stream one delta (leading glue preserved) legacy ask/reply/replypart/replyend/exit fail closed; use g2ai for deliberate bench cards`
- `g2aih` — Front-pane card with custom heading: g2aih <heading>|<body> · `g2aih <heading>|<body> (no | = whole text as body)`
- `g2aiconfig` — Send EvenAI CONFIG (cmd=10): g2aiconfig [voiceSwitch] [streamSpeed] [duplexMode] · `g2aiconfig [voiceSwitch] [streamSpeed] [duplexMode] (defaults: 0 80 0; use - to omit a field)`
- `g2imgprobe` — Probe Cmd=3 multi-frag wire path: g2imgprobe [size_bytes] · `g2imgprobe [size_bytes] (1..4096, default 1024)`
- `g2micon` — G2 mic probe: AudioCtrCmd{en=1} on LEFT (or 'r' for RIGHT) · `g2micon [r] (default LEFT; arg starting r = RIGHT)`
- `g2micoff` — G2 mic probe: AudioCtrCmd{en=0} (stop stream)
- `g2micstats` — G2 mic probe: dump per-arm frame counters
- `g2conversate` — Native Conversate mic keepalive (no STT or file) · `g2conversate on | test [seconds 10..3600, default 300] | status | stop | off`
- `g2micreset` — G2 mic probe: zero per-arm counters
- `g2micverbose` — G2 mic probe: per-frame log [on|off] · `g2micverbose [<on|off>] (bare = toggle)`
- `g2micrec` — G2 mic dump: g2micrec start ["path"] | stop | status — writes raw 205B LC3 packets to SD · `g2micrec start ["path"] | stop | status (bare = status)`
- `g2micwav` — G2 mic decode: g2micwav start ["path"] | stop | status — decodes LC3 → 16k mono WAV on SD · `g2micwav start ["path"] | stop | status (bare = status)`
- `g2protostats` — Show G2 protocol stats per sid: g2protostats [verbose] · `g2protostats [verbose]`
- `g2probe` — Fire arbitrary pb cmd on non-mutation sids: g2probe <sid_hex> <cmd_dec> [body_hex] · `g2probe <sid_hex> <cmd_dec> [body_hex] (sids 01/03/04/09/80 blocked)`
- `g2devcfg` — Typed sid=0x80 sender: g2devcfg <heartbeat|auth|role|time|ring> [args] · `g2devcfg <heartbeat|auth|role <both|right|left>|time [tzQuarterHours]|ring <mac> <name>>`
- `g2notifenable` *(admin)* — Prime native notifications on sid 0x04 (enable + whitelist-disable) before g2nativenotify · `g2notifenable (sends NOTIF_CTRL enable + WHITELIST_CTRL disable to the right arm)`
- `g2control` *(admin)* — Persist/reconcile G2 device policy without overwriting official-app state by default · `g2control [<headup|notifications> <preserve|off|on>] (bare = status; work is queued to g2 control owner)`
- `g2nativeconfig` *(admin)* — Captured G2 config: selftest, HeadUp-adjacent dashboard/menu/notification replay · `g2nativeconfig <selftest|dashboard july31|notification july31|menu <id,id,...>> (writes require exact fw 2.2.6.10)`
- `g2notify` — Transient text (placeholder): g2notify [secs] <text> · `g2notify [<seconds>] <text> (seconds 1..599, default 5)`
- `g2nativenotify` *(admin)* — Native EFS notification card (real overlay, admin): g2nativenotify selftest | <title>|<body> · `g2nativenotify selftest | <title>|<body> | <name>|<title>|<body>`
- `g2bmp` — Display BMP: g2bmp </path.bmp> [brightness -100..100] [contrast -100..100] [holdSeconds 0..120] · `g2bmp </path/to/file.bmp> [brightness -100..100] [contrast -100..100] [holdSeconds 0..120]`
- `g2map` — Render the offline map on the G2 lens (288x144) · `g2map (renders the current map view; double-tap the lens to dismiss)`
- `g2health` — Open the Health (R1 vitals + graphs) app on the G2 lens · `g2health (Overview/HR/HRV/SpO2/Battery on the lens; Back to exit)`
- `g2sensors` — Show device's sensor list on the G2 lens
- `g2network` — Show Network info page on the G2 lens
- `g2settingspage` — Show Settings inspector page on the G2 lens
- `g2files` — Show Files browser page on the G2 lens
- `g2clear` — Clear G2 display
- `g2scan` — Scan for G2 glasses
- `g2init` — Initialize G2 client mode
- `g2deinit` — Deinitialize G2 client mode
- `g2nav` — Menu navigation mode: g2nav [on|off|toggle] (bare = report state) · `g2nav [on|off|toggle] (bare = report state)`
- `g2streamres` — Lens stream resolution: g2streamres [<W>x<H>] (bare = report; e.g., 96x96, 160x120, 288x144) · `g2streamres [<W>x<H>] (W 16..288, H 16..144; bare = report)`
- `g2streamtonemap` — Lens stream 4-bpp tone: 0=Linear 1=Balanced 2=Shadows 3=Legacy (bare = report) · `g2streamtonemap [<0|1|2|3|linear|balanced|shadows|legacy|off|on>] (bare = report state)` _(setting · enum · default 1 (Balanced) · options 0=Linear, 1=Balanced, 2=Shadows, 3=Legacy)_
- `g2packrate` — SD-pack animation cadence: g2packrate [<ms>] (range 20..2000, default 80) · `g2packrate [<ms>] (20..2000; bare = report)` _(setting · int 20–2000 · default 80)_
- `g2envgap` *(admin)* — Image inter-envelope gap override: g2envgap [<5..500>|auto] (bare = report) · `g2envgap [<5..500>|auto] (runtime only; bare = report)`
- `g2connpri` *(admin)* — Probe the BLE conn-interval admission boundary: g2connpri [<min> <max>|default] (bare = report) · `g2connpri [<min> <max>|default] (ticks of 1.25 ms; runtime only; bare = report)`
- `g2battery` — Query G2 battery % on connected temples
- `g2glasses` *(admin)* — Change glasses-device settings (including capture-proven HeadUp on fw 2.2.6.10) · `g2glasses [show|refresh] | g2glasses <brightness|autobright|weardetect|x|y|headup|headangle|silent|unitformat|distunit|timeformat|dateformat|tempunit> [value]`
- `g2verbose` — Scan-verbose logging: g2verbose [on|off|toggle] (bare = report state) · `g2verbose [on|off|toggle] (bare = report state)`
- `g2hijacktest` — Simulate a Blocks tap (status-page hijack)
- `g2reopen` — Re-open the hijacked Blocks app after an abnormal exit
- `g2dumpframes` — Print the recent G2 envelope ring buffer
- `g2recover` — Try to reconnect a missing G2 temple without tearing down the connected one

### `even_r1` — Even R1 ring link, health, and controls

_Requires `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES`._

**Firmware module overview (context):** This subsystem talks to the Even R1 smart ring over BLE through a serialized, profile-gated transaction owner. ringscan [seconds] discovers the ring and ringconnect [mac] connects (auto-scanning when no MAC is given, or connecting directly when one is), with ringstatus and ringdisconnect for state and teardown. ringquery is the main data command, requesting wear/heart-rate/HRV/SpO2/temperature/activity/sleep readings. Its raw diagnostic form is admin-only, requires confirmation for SETs, and prohibits user-profile writes. Ring health collection and low-power desired state are managed through the authenticated Health surfaces; health SETs remain ACKed-unverified while low power has capture-proven readback. debugringdump toggles a redacted byte dump for debugging. Bridging ring data onto the G2 glasses is deliberately unavailable -- the commands exist in the code but are intentionally left unregistered because both approaches proved to be dead ends.

- `ringstatus` — Show R1 ring connection status
- `ringscan` — Scan for the R1 ring: ringscan [seconds] (default 30, max 300) · `ringscan [seconds] (1..300, default 30)`
- `ringconnect` *(admin)* — Connect to the R1 ring: ringconnect [mac|reconnect] · `ringconnect [mac|reconnect] (no arg = scan-then-connect; mac = direct; reconnect = drop+settle+connect)`
- `ringdisconnect` *(admin)* — Disconnect from the R1 ring
- `ringquery` — Queue an R1 query: ringquery <wear|hr|hrv|spo2|temp|activity|sleep|raw> [type] · `ringquery <wear|hr|hrv|spo2|temp|activity|sleep> [daily|point|measure] | raw <module> <cmd> <subCmd> [hex_payload] [status=NN] (raw is admin-only; SET requires confirmation)`

### `llm` — On-device LLM text generation

_Requires `ENABLE_LLM_BACKEND`._

**Firmware module overview (context):** On-device large language model that runs a quantized model file entirely on the device (model weights held in PSRAM). A model must be loaded before generation: llmload [file.bin] loads one (bare filenames are looked up on the SD card under /sd/llm then internal /system/llm), llmmodels lists available files, llmunload frees the PSRAM, llmstatus shows engine state, and llmautostart 0|1 / llmdefaultmodel control boot-time loading. Two generate forms: bare 'llmgenerate <prompt>' BLOCKS and prints the whole reply, while 'llmgenerate json ...' starts async and returns a session id immediately — then poll llmresult json <offset> repeatedly (each call returns new text, the running total length, and a done flag) until done flips true; llmstop aborts an in-progress generation. The engine keeps a multi-turn conversation: llmclear resets it, llmretry regenerates the last reply (async), and llmturns json <index> reads back one turn at a time. The llm* setters (temperature, topp, minp, maxtokens, sentencelimit, hardcap, reppenalty/repwindow, maxcontext, kvprec, norepeatngram, confthreshold, contentboost) are admin-only sampler and KV-cache defaults that persist to flash; kvprec and maxcontext only take effect on the next model load.

- `llmstatus` — Show LLM engine status (add 'json' for JSON output)
- `llmload` *(admin)* — Load model [model.bin] · `llmload [filename.bin]`
- `llmunload` *(admin)* — Unload model and free PSRAM
- `llmautostart` *(admin)* — Auto-load default model at boot (0|1) · `llmautostart <0|1>` _(setting · bool · default off)_
- `llmmodels` — List available model files (add 'json' for JSON output)
- `llmgenerate` — Ask the loaded model a question · `llmgenerate <question> | llmgenerate do: <intent> The question is wrapped in the model's Q:/A: format for you, same as the web chat. Prefix 'do:' to ask for a command instead of an answer. A prompt that already starts with 'Q:' is sent as-is.`
- `llmresult` — Poll streamed generation (JSON) · `llmresult json <offset>`
- `llmstop` — Stop in-progress generation
- `llmcorrupttest` *(admin)* — Debug: force corruption-recovery test
- `llmclear` — Reset the LLM conversation
- `llmretry` — Regenerate the last reply (JSON)
- `llmturns` — Read a conversation turn (JSON) · `llmturns json <index>`
- `llmmenu` — Guided-input menu status/listing (add 'json') · `llmmenu | llmmenu json | llmmenu json tpl <g> <off> | llmmenu json ent <g> <off> Lists this model's guided question templates + entity rosters (empty if the model ships none).`
- `llmask` — Ask a guided question by index · `llmask <group> <template> [entity] | llmask json <gen> <g> <t> [e] | llmask repeat Composes the question on-device from 'llmmenu' indices and streams the answer (read it with 'llmresult json 0').`
- `llmtemperature` *(admin)* — Set default sampling temperature · `llmtemperature <0.0-2.0>` _(setting · float · default 0.5)_
- `llmtopp` *(admin)* — Set default Top-P threshold · `llmtopp <0.0-1.0>` _(setting · float · default 0.8)_
- `llmmaxtokens` *(admin)* — Set default max tokens per reply · `llmmaxtokens <1-512>` _(setting · int 1–512 · default 256)_
- `llmsentencelimit` *(admin)* — Set default sentence stop limit · `llmsentencelimit <0-20>` _(setting · int 0–20 · default 2)_
- `llmhardcap` *(admin)* — Set default hard token cap · `llmhardcap <0-512>` _(setting · int 0–512 · default 80)_
- `llmreppenalty` *(admin)* — Set default repetition penalty · `llmreppenalty <1.0-3.0>` _(setting · float · default 1.3)_
- `llmrepwindow` *(admin)* — Set default rep-penalty look-back · `llmrepwindow <1-32>` _(setting · int 1–LLM_DEFAULT_REP_WINDOW · default 32)_
- `llmmaxcontext` *(admin)* — Set KV cache context window (0=auto) · `llmmaxcontext <0-4096>` _(setting · int 0–LLM_SETTING_MAX_CONTEXT · default 0)_
- `llmdefaultmodel` *(admin)* — Set default model filename · `llmdefaultmodel <filename.bin>` _(setting · string · default "model.bin")_
- `llmminp` *(admin)* — Set min-p sampling floor (0=off) · `llmminp <0.0-1.0>` _(setting · float · default 0.0)_
- `llmkvprec` *(admin)* — KV cache precision (0=FP32,1=FP16,2=INT8) · `llmkvprec <0..2> (0=FP32,1=FP16,2=INT8; reload model to apply)` _(setting · enum · default 1 (FP16) · options 0=FP32, 1=FP16, 2=INT8)_
- `llmnorepeatngram` *(admin)* — Ban repeating generated n-grams (0=off) · `llmnorepeatngram <0-8> (default 0=off; 3 breaks verbatim phrase loops)` _(setting · int 0–8 · default 0)_
- `llmconfthreshold` *(admin)* — Low-confidence hedge threshold (0=off) · `llmconfthreshold <-8.0-0> (mean logprob; default -1.0, 0 disables)` _(setting · float · default -1.0)_
- `llmcontentboost` *(admin)* — On-topic logit bonus (0=off) · `llmcontentboost <0.0-4.0> (default 1.5; higher = stickier to prompt words)` _(setting · float · default 1.5)_
- `llmdomaingate` *(admin)* — Refuse prompts outside the model's domain (0|1) · `llmdomaingate <0|1> (only enforced when the model .bin carries a domain vocab)` _(setting · bool · default on)_
- `llmprofile` *(admin)* — Per-section forward-pass timing breakdown (0|1) · `llmprofile <0|1> (diagnostic; splits qkv/attn/ffn/cls after each generation. Turn OFF other debugllm* flags for clean numbers)` _(setting · bool · default off)_

### `settingsedit` — Per-field settings save commands

_Always compiled._

**Firmware module overview (context):** Static CLI commands the web/OLED settings screen uses to persist individual settings fields that have no dedicated module command. Each writes one setting via handleSettingCommand; the value is read live or applied on next start. Fields that need a live apply action are routed to their module command instead of getting one of these.

- `sessionidleweb` *(admin)* — Set web CLI session idle-logout (min) · `sessionidleweb <0-1440>` _(setting · int 0–1440 · default 60)_
- `sessionidleserial` *(admin)* — Set serial session idle-logout (min) · `sessionidleserial <0-1440>` _(setting · int 0–1440 · default 60)_
- `sessionidleble` *(admin)* — Set BLE session idle-logout (min) · `sessionidleble <0-1440>` _(setting · int 0–1440 · default 15)_
- `sessionidledisplay` *(admin)* — Set OLED session idle-logout (min) · `sessionidledisplay <0-1440>` _(setting · int 0–1440 · default 60)_
- `sessionidleuart` *(admin)* — Set UART link session idle-logout (min) · `sessionidleuart <0-1440>` _(setting · int 0–1440 · default 0)_
- `powerdim` *(admin)* — Set display dim level (%) · `powerdim <0-100>` _(setting · int 0–100 · default 30)_
- `logcategorytags` *(admin)* — Set log category-tags flag (persist only) · `logcategorytags <0|1>` _(setting · bool · default on)_
- `tofi2cclockhz` *(admin)* — Set ToF I2C clock (Hz) · `tofi2cclockhz <50000-400000>` _(setting · int 50000–400000 · default 200000)_
- `presencedevicepollms` *(admin)* — Set presence sensor poll interval (ms) · `presencedevicepollms <50-5000>` _(setting · int 50–5000 · default 100)_
- `apdsdevicepollms` *(admin)* — Set APDS poll interval (ms) · `apdsdevicepollms <value>` _(setting · int 50–5000 · default 200)_
- `fmradiodevicepollms` *(admin)* — Set FM radio poll interval (ms) · `fmradiodevicepollms <value>` _(setting · int 100–5000 · default 250)_
- `gpsdevicepollms` *(admin)* — Set GPS poll interval (ms) · `gpsdevicepollms <value>` _(setting · int 50–10000 · default 200)_
- `sensorlogpath` *(admin)* — Set default sensor-log file path · `sensorlogpath <"/path">` _(setting · string · default (empty))_
- `sensorlogmask` *(admin)* — Set sensor-log sensor bitmask · `sensorlogmask <0-255>` _(setting · enum · default 0 · options bitmask:1|Thermal, ToF, IMU, Gamepad, APDS, GPS, Presence, R1 Health)_
- `sensorlogformat` *(admin)* — Set sensor-log format (0=text,1=csv,2=track) · `sensorlogformat <0|1|2>` _(setting · enum · default 0 (Text) · options 0=Text, 1=CSV, 2=Track)_
- `systemlogflags` *(admin)* — Set system-log debug category mask (hex) · `systemlogflags <0x...>` _(setting · string · default (empty))_
- `eirequirelabels` *(admin)* — Set Edge Impulse require-labels flag · `eirequirelabels <0|1>` _(setting · bool · default on)_
- `eimaxdetections` *(admin)* — Set Edge Impulse max detections · `eimaxdetections <value>` _(setting · int 1–10 · default 5)_
- `eiinputsize` *(admin)* — Set Edge Impulse input size · `eiinputsize <value>` _(setting · int 48–320 · default 96)_
- `eiinterval` *(admin)* — Set Edge Impulse inference interval (ms) · `eiinterval <100-10000>` _(setting · int 100–10000 · default 1000)_
- `srautostart` *(admin)* — Set ESP-SR auto-start flag · `srautostart <0|1>` _(setting · bool · default off)_
- `srmodelsource` *(admin)* — Set ESP-SR model source · `srmodelsource <value>` _(setting · enum · default 0 (Partition) · options 0=Partition, 1=SD, 2=LittleFS)_
- `sttsavetranscripts` *(admin)* — Save recognized text; changes apply to the next STT session. · `sttsavetranscripts [0|1]` _(setting · bool · default off)_
- `eventlog` *(admin)* — Enable/disable the structured event-history log (events.log) · `eventlog <0|1> One line per system event, durable across reboots. Display/behavior unaffected.` _(setting · bool · default on)_
- `notifydevicebanners` *(admin)* — Enable/disable OLED notification banners · `notifydevicebanners <0|1>` _(setting · bool · default on)_
- `notifydevicetoasts` *(admin)* — Enable/disable web notification toasts · `notifydevicetoasts <0|1>` _(setting · bool · default on)_
- `notifydevicequeue` *(admin)* — Enable/disable the notification-center queue · `notifydevicequeue <0|1>` _(setting · bool · default on)_
- `notifydeviceg2` *(admin)* — Enable/disable G2 lens notification cards · `notifydeviceg2 <0|1>` _(setting · bool · default on)_
- `notifydeviceapp` *(admin)* — Enable/disable Android app notification cards · `notifydeviceapp <0|1> Cards go only to BLE sessions that are logged in; an unauthenticated app sees none.` _(setting · bool · default on)_
- `espnowcapturetosd` *(admin)* — Capture ESP-NOW frames to the SD card · `espnowcapturetosd <0|1> Needs an SD card mounted; frames are appended as they arrive.` _(setting · bool · default off)_
- `espnowcaptureskipheartbeats` *(admin)* — Omit heartbeat frames from the ESP-NOW capture · `espnowcaptureskipheartbeats <0|1>` _(setting · bool · default on)_
- `wifienabled` *(admin)* — Enable/disable WiFi entirely (ESP-NOW unaffected): <0|1> · `wifienabled <0|1>` _(setting · bool · default on)_
- `wifiautostart` *(admin)* — Connect to a saved WiFi network at boot: <0|1> · `wifiautostart <0|1>` _(setting · bool · default on)_
- `sensorlogenabled` *(admin)* — Enable/disable sensor logging entirely: <0|1> · `sensorlogenabled <0|1>` _(setting · bool · default on)_
- `systemlogenabled` *(admin)* — Enable/disable system logging entirely: <0|1> · `systemlogenabled <0|1>` _(setting · bool · default on)_
- `thermalenabled` *(admin)* — Enable/disable the thermal camera subsystem · `thermalenabled <0|1>` _(setting · bool · default on)_
- `tofenabled` *(admin)* — Enable/disable the ToF distance sensor subsystem · `tofenabled <0|1>` _(setting · bool · default on)_
- `imuenabled` *(admin)* — Enable/disable the IMU subsystem · `imuenabled <0|1>` _(setting · bool · default on)_
- `gpsenabled` *(admin)* — Enable/disable the GPS subsystem · `gpsenabled <0|1>` _(setting · bool · default on)_
- `fmradioenabled` *(admin)* — Enable/disable the FM radio subsystem · `fmradioenabled <0|1>` _(setting · bool · default on)_
- `apdsenabled` *(admin)* — Enable/disable the APDS gesture sensor subsystem · `apdsenabled <0|1>` _(setting · bool · default on)_
- `rtcenabled` *(admin)* — Enable/disable the RTC subsystem · `rtcenabled <0|1>` _(setting · bool · default on)_
- `presenceenabled` *(admin)* — Enable/disable the presence sensor subsystem · `presenceenabled <0|1>` _(setting · bool · default on)_
- `inputenabled` *(admin)* — Enable/disable the input device subsystem · `inputenabled <0|1>` _(setting · bool · default on)_
- `cameraenabled` *(admin)* — Enable/disable the camera subsystem · `cameraenabled <0|1>` _(setting · bool · default on)_
- `micenabled` *(admin)* — Enable/disable the microphone subsystem · `micenabled <0|1>` _(setting · bool · default on)_
- `srenabled` *(admin)* — Enable/disable the speech-recognition subsystem · `srenabled <0|1>` _(setting · bool · default on)_
- `llmenabled` *(admin)* — Enable/disable the on-device LLM subsystem · `llmenabled <0|1>` _(setting · bool · default on)_
- `httpenabled` *(admin)* — Enable/disable the web server subsystem · `httpenabled <0|1>` _(setting · bool · default on)_
- `bleenabled` *(admin)* — Enable/disable the Bluetooth subsystem · `bleenabled <0|1>` _(setting · bool · default on)_
- `espnowautostart` *(admin)* — Start ESP-NOW at boot · `espnowautostart <0|1>` _(setting · bool · default on)_
- `oledautostart` *(admin)* — Start the OLED display at boot · `oledautostart <0|1>` _(setting · bool · default on)_
- `eiautostart` *(admin)* — Start Edge Impulse inference at boot · `eiautostart <0|1>` _(setting · bool · default on)_
- `automationautostart` *(admin)* — Start the automation scheduler at boot · `automationautostart <0|1>` _(setting · bool · default on)_
- `notifydevicekind` *(admin)* — Set per-event notification visibility (device-wide) · `notifydevicekind [list [json]] | <kind> [all|admin|off] Bare: show non-default kinds; list: show every kind (json = machine form) <kind> alone shows its level; with a level, sets and persists it admin: only admin viewers see it; off: hidden for everyone Levels affect banners/toasts/queue only - events and automations still fire`
- `notifyusermute` — Mute event kinds from notifications for YOUR user · `notifyusermute [<kind,kind,...>|set <kind> <on|off>|patch <+kind,-kind>|all|none] Bare: show; legacy list: replace; set: change one; patch: change several all/none: mute every current kind/clear; applies only to your logged-in user List valid kinds with 'events kinds'`
- `notifyusershow` — Force event kinds through YOUR importance floor · `notifyusershow [<kind,kind,...>|set <kind> <on|off>|patch <+kind,-kind>|all|none] Bare: show; legacy list: replace; set: change one; patch: change several all/none: force every current kind/clear; overrides your notifylevel List valid kinds with 'events kinds'`
- `notifylevel` — Set YOUR notification importance floor · `notifylevel [verbose|standard|alert] Bare: show your current floor (default: standard) verbose: everything; standard: skip routine chatter; alert: security/safety only Nothing is lost - filtered kinds still reach the notification center and automations`
