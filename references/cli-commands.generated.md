# HardwareOne — CLI Command Catalog

<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: tools/sync_command_reference.py
     Source of truth: firmware gCommandModules[] + SettingEntry tables. -->

> Firmware commit `7e2a634` · 822 commands · 43 modules

Generated directly from the firmware command tables, so it always matches the build it came from. **Feature gating still applies:** a module whose compile guard is not defined is absent entirely — run `features` on the device for live `[ON]`/`[OFF]`/`[N/C]` state. Admin-only commands are marked *(admin)*. Commands backed by a stored setting show their value type / range / default / options; see [`settings.generated.md`](settings.generated.md) for the full configuration view.

## Modules

| Module | Compiled when | Commands |
|--------|---------------|----------|
| `cli` | always | 4 |
| `system` | always | 21 |
| `wifi` | `ENABLE_WIFI` | 19 |
| `espnow` | `ENABLE_ESPNOW` | 113 |
| `mqtt` | `ENABLE_MQTT` | 28 |
| `bluetooth` | `ENABLE_BLUETOOTH` | 21 |
| `filesystem` | always | 10 |
| `sd` | `defined(SD_CS_PIN)` | 5 |
| `oled` | always | 20 |
| `neopixel` | always | 3 |
| `led` | always | 6 |
| `servo` | `ENABLE_SERVO` | 5 |
| `thermal` | `ENABLE_THERMAL_SENSOR` | 20 |
| `tof` | `ENABLE_TOF_SENSOR` | 9 |
| `imu` | `ENABLE_IMU_SENSOR` | 15 |
| `input` | `ENABLE_OLED_INPUT` | 4 |
| `gamepad` | `ENABLE_GAMEPAD_SENSOR` | 1 |
| `anoencoder` | `ENABLE_ANO_ENCODER` | 5 |
| `apds` | `ENABLE_APDS_SENSOR` | 8 |
| `gps` | `ENABLE_GPS_SENSOR` | 5 |
| `fmradio` | `ENABLE_FM_RADIO` | 9 |
| `rtc` | `ENABLE_RTC_SENSOR` | 6 |
| `presence` | `ENABLE_PRESENCE_SENSOR` | 5 |
| `camera` | `ENABLE_CAMERA_SENSOR` | 49 |
| `microphone` | `ENABLE_MICROPHONE_SENSOR` | 12 |
| `edgeimpulse` | `ENABLE_EDGE_IMPULSE` | 16 |
| `espsr` | `ENABLE_ESP_SR` | 47 |
| `i2c` | `ENABLE_I2C_SYSTEM` | 33 |
| `automation` | `ENABLE_AUTOMATION` | 8 |
| `battery` | `ENABLE_BATTERY_MONITOR` | 3 |
| `debug` | always | 170 |
| `settings` | always | 16 |
| `sensorlog` | always | 1 |
| `users` | always | 22 |
| `features` | always | 2 |
| `image` | `ENABLE_CAMERA_SENSOR` | 4 |
| `map` | `ENABLE_MAPS` | 11 |
| `mapsettings` | `ENABLE_MAPS` | 3 |
| `power` | always | 3 |
| `setpattern` | `ENABLE_OLED_DISPLAY` | 1 |
| `even_g2` | `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES` | 46 |
| `even_r1` | `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES` | 6 |
| `llm` | `ENABLE_ONDEVICE_LLM` | 27 |
| **Total** | | **822** |

## Commands by module

### `cli` — Help and CLI navigation

_Always compiled._

- `help` — Display help menu (help [topic]) · `help [<module>|sensors|all|tail]`
- `back` — Return to main help menu
- `exit` — Exit help mode
- `clear` — Clear CLI history

### `system` — Core system commands

_Always compiled._

- `status` — Show system status (WiFi, FS, memory).
- `uptime` — Show device uptime.
- `time` — Show device time (uptime + NTP if synced).
- `timeset` *(admin)* — Set time manually: timeset YYYY-MM-DD HH:MM:SS or <unix_timestamp>. · `timeset <YYYY-MM-DD HH:MM:SS>|<unix_timestamp>`
- `memsample` — Memory snapshot with component requirements. Use 'memsample track [on|off|reset|status]' for allocation tracking. · `memsample [track <on|off|reset|status>]`
- `memreport` — Comprehensive memory report (Task Manager style).
- `fsusage` — Show filesystem usage.
- `testencryption` *(admin)* — Test WiFi password encryption (admin only).
- `testpassword` *(admin)* — Test user password hashing (admin only).
- `temperature` — Read ESP32 internal temperature.
- `voltage` — Read supply voltage.
- `cpufreq` *(admin)* — Get/set CPU frequency. · `cpufreq [80|160|240]`
- `taskstats` — Detailed task statistics.
- `perftop` — Live performance snapshot: loop laps/s, period, per-section timing, worst stalls + live task CPU%.
- `reboot` *(admin)* — Reboot the system.
- `factoryreset` *(admin)* — Wipe user accounts and reboot to re-run setup wizard. · `factoryreset (no args, confirmation required) Deletes /system/users/users.json so the first-time setup wizard runs on next boot. WiFi credentials and other settings are preserved.`
- `broadcast` *(admin)* — Send message to all or specific user. · `broadcast <message>`
- `pendinglist` *(admin)* — List pending user requests.
- `wait` — Delay execution for N milliseconds: wait <ms>. · `wait <ms> (1..60000)`
- `sleep` — Alias for wait: sleep <ms>. · `sleep <ms> (1..60000)`
- `lightsleep` *(admin)* — Enter ESP32 light sleep: lightsleep [seconds] (default 20s). · `lightsleep [seconds] (1..3600, default 20)`

### `wifi` — Network management (connect, scan, add/remove networks)

_Requires `ENABLE_WIFI`._

- `wifiread` — Read current WiFi connection info.
- `wifistatus` — Show current WiFi connection info.
- `wifilist` — List saved WiFi networks.
- `wifiadd` *(admin)* — Add WiFi network: <ssid> <pass> [priority] [hidden] · `wifiadd <ssid> <pass> [priority] [hidden0|1]`
- `wifirm` *(admin)* — Remove WiFi network: <ssid> · `wifirm <ssid>`
- `wifipromote` *(admin)* — Promote WiFi to top priority: <ssid> · `wifipromote <ssid>`
- `openwifi` — Connect to WiFi: [--best | --index <N>] (default: best) · `openwifi [--best | --index <1..N>]`
- `closewifi` — Disconnect from WiFi (also stops HTTP server + web output to free heap).
- `wifidisconnect` — Disconnect from the current network but keep the radio on (HTTP/web stay up).
- `wifiscan` — Scan for available WiFi networks.
- `wifigettxpower` — Set WiFi TX power: <dBm> (alias of wifitxpower) · `wifigettxpower <dBm> (sets TX power; clamps to ~2..21 dBm)`
- `ntpsync` — Sync time with NTP server.
- `ntpstatus` — Show NTP configuration and sync state.
- `openhttp` — Start HTTP server.
- `closehttp` — Stop HTTP server.
- `httpread` — Read HTTP server status.
- `httpstatus` — Show HTTP server status.
- `certinfo` — Show HTTPS certificate details.
- `certgen` *(admin)* — Generate self-signed HTTPS certificate: [rsa] (default: ECDSA P-256) · `certgen [rsa] Default: ECDSA P-256 (~1s). Use 'certgen rsa' for RSA-2048 (~30-60s).`

### `espnow` — ESP-NOW wireless communication (peer-to-peer, mesh)

_Requires `ENABLE_ESPNOW`._

- `espnowread` — Read ESP-NOW status and configuration.
- `espnowstatus` — Show ESP-NOW status and configuration.
- `espnowstats` — Show ESP-NOW statistics (messages, errors, etc.).
- `espnowrouterstats` — Show message router statistics and metrics.
- `espnowbroadcaststats` — Show broadcast ACK tracking statistics.
- `espnowresetstats` *(admin)* — Reset ESP-NOW statistics counters.
- `espnowsaturation` — Show ESP-NOW link saturation: frames/sec, stream-queue depth, drops, ACK RTT (rolling 30s).
- `espnowsaturationreset` — Clear the saturation rolling window (use before a stress test).
- `espnowidentity` — Show long-term Ed25519 identity (MAC, pub key, createdAtSec, regenCount).
- `espnowregenidentity` *(admin)* — Regenerate Ed25519 identity. Requires '--confirm-wipe-all-bonds'. · `espnowregenidentity --confirm-wipe-all-bonds`
- `espnowkeyex` *(admin)* — Initiate KEY_EX handshake with a peer (Phase 3.3 — runs alongside legacy pairing). · `espnowkeyex <mac> [<mesh>]`
- `espnowprobe` *(admin)* — Reachability probe via KEY_EX. Synchronous, bounded timeout. Reports alive+mesh+firmware in one shot (no plaintext on the wire). · `espnowprobe <name_or_mac> [<timeoutMs (50-5000, default 500)>] [<mesh>]`
- `espnowsessionopen` *(admin)* — Initiate SESSION handshake (Phase 3.4 — requires prior espnowkeyex). · `espnowsessionopen <mac> [<mesh>]`
- `espnowsessions` — Show in-RAM session state (peer, sessionId, dir, age, counters).
- `espnowsessionsend` *(admin)* — Send AEAD-wrapped TEXT through active session (Phase 3.5a demo). · `espnowsessionsend <mac> <message>`
- `espnowrekey` *(admin)* — Force immediate SESSION_REKEY for a peer (Phase 3.6 — manual trigger). · `espnowrekey <mac>`
- `espnowsubs` — Phase 5: list peers + their event-subscription bitmaps (what they want from us).
- `espnowrequestevents` *(admin)* — Phase 5: ask a peer to send US only events in <bitmask>. Updates state ON THE PEER. · `espnowrequestevents <mac> <bitmask>`
- `openespnow` *(admin)* — Initialize ESP-NOW communication.
- `closeespnow` *(admin)* — Deinitialize ESP-NOW and free resources.
- `espnowpair` *(admin)* — Pair ESP-NOW device: 'espnowpair <mac> <name> [mesh]'. · `espnowpair <mac> <name> [mesh]`
- `espnowunpair` *(admin)* — Unpair ESP-NOW device (also clears its crypto identity): 'espnowunpair <name_or_mac>'. · `espnowunpair <name_or_mac>`
- `espnowforget` *(admin)* — Forget a peer's crypto identity + close its session: 'espnowforget <name_or_mac>'. · `espnowforget <name_or_mac>`
- `espnowlist` — List all paired ESP-NOW devices.
- `espnowmessages` — Buffered message history as JSON: 'espnowmessages json [sinceSeq] [mac]' — async results of espnowremote/browse/fetch. · `espnowmessages [json] [<sinceSeq>] [<AA:BB:CC:DD:EE:FF>]`
- `espnowmeshstatus` — Show mesh peer health (heartbeats & ACKs).
- `espnowmeshmetrics` — Show mesh routing metrics (forwards, path stats, drops).
- `espnowmeshes` *(admin)* — Manage multi-mesh slots: 'espnowmeshes [list|add|remove|enable|setdefault|rename] ...'. · `espnowmeshes list espnowmeshes add <label> (then set passphrase via 'espnowsetpassphrase <label> <pw>') espnowmeshes remove <label> (alias: disable) espnowmeshes enable <label> espnowmeshes setdefault <label> espnowmeshes rename <oldLabel> <newLabel>`
- `espnowmode` *(admin)* — Get/set ESP-NOW mode: 'espnowmode [direct|mesh]'. · `espnowmode [direct|mesh]` _(setting · bool · default off)_
- `espnowmeshttl` — Get/set mesh TTL: 'espnowmeshttl [1-10|adaptive]'. · `espnowmeshttl [<1..10>|adaptive]` _(setting · int 1–10 · default 3)_
- `espnowsetname` *(admin)* — Get/set device name: 'espnowsetname [name]'. · `espnowsetname [<name>] (<=20 chars; letters, numbers, - and _ only)` _(setting · string · default (empty))_
- `espnowhbmode` — Get/set heartbeat mode: 'espnowhbmode [public|private]'. · `espnowhbmode [public|private]`
- `espnowmeshrole` *(admin)* — Get/set mesh role: 'espnowmeshrole [worker|master|backup]'. · `espnowmeshrole [worker|master|backup]` _(setting · enum · default 0 (Worker) · options 0=Worker, 1=Master, 2=Backup Master)_
- `espnowmeshmaster` *(admin)* — Get/set master MAC: 'espnowmeshmaster [MAC]'. · `espnowmeshmaster [<AA:BB:CC:DD:EE:FF>]` _(setting · string · default (empty))_
- `espnowmeshbackup` *(admin)* — Get/set backup MAC: 'espnowmeshbackup [MAC]'. · `espnowmeshbackup [<AA:BB:CC:DD:EE:FF>]` _(setting · string · default (empty))_
- `espnowbackupenable` *(admin)* — Enable/disable backup master feature: 'espnowbackupenable [on|off]'. · `espnowbackupenable [on|off]` _(setting · bool · default off)_
- `espnowmeshtopo` — Discover mesh topology (master only).
- `espnowtoporesults` — Get topology discovery results.
- `espnowtimesync` — Broadcast NTP time to mesh (master only).
- `espnowtimestatus` — Show time synchronization status.
- `espnowmeshsave` — Manually save mesh peer topology to filesystem.
- `espnowroom` — Get/set device room: 'espnowroom [name]'. · `espnowroom [Kitchen|Bedroom|...] espnowroom clear` _(setting · string · default (empty))_
- `espnowzone` — Get/set device zone: 'espnowzone [name]'. · `espnowzone [Counter|Door|Ceiling|...] espnowzone clear` _(setting · string · default (empty))_
- `espnowtags` — Get/set device tags: 'espnowtags [tag1,tag2,...]'. · `espnowtags stationary,thermal espnowtags clear` _(setting · string · default (empty))_
- `espnowfriendlyname` — Get/set friendly display name: 'espnowfriendlyname [name]'. · `espnowfriendlyname [<name>] (<=47 chars) espnowfriendlyname clear` _(setting · string · default (empty))_
- `espnowstationary` — Get/set stationary flag: 'espnowstationary [0|1]'. · `espnowstationary [on|off|0|1]` _(setting · bool · default off)_
- `espnowdeviceinfo` — Show all local device metadata.
- `espnowdevices` — List all mesh devices with room/zone/tags/status: espnowdevices [json].
- `espnowrooms` — List rooms and their devices (master).
- `espnowfind` — Find devices by name, room, or tag: 'espnowfind <query>'. · `espnowfind <query>`
- `espnowroomcmd` *(admin)* — Run command on all devices in a room. · `espnowroomcmd <room> <user> <pass> <command>`
- `espnowtagcmd` *(admin)* — Run command on all devices with a tag. · `espnowtagcmd <tag> <user> <pass> <command>`
- `espnowsend` — Send message (auto-routes via mesh if enabled): 'espnowsend <name_or_mac> <message>'. · `espnowsend <name_or_mac> <message>`
- `espnowbroadcast` — Broadcast message: 'espnowbroadcast <message>'. · `espnowbroadcast <message>`
- `espnowsendfile` — Send file: 'espnowsendfile <name_or_mac> "<filepath>"'. · `espnowsendfile <name_or_mac> "<filepath>"`
- `espnowbrowse` — Browse remote files: 'espnowbrowse <name_or_mac> <user> <pass> ["path"]'. · `espnowbrowse <target> <username> <password> ["path"]`
- `espnowfetch` — Fetch remote file: 'espnowfetch <name_or_mac> <user> <pass> "<path>"'. · `espnowfetch <target> <username> <password> "<path>"`
- `espnowremote` — Execute remote command: 'espnowremote <name_or_mac> <user> <pass> <cmd>'. · `espnowremote <target> <username> <password> <command>`
- `openstream` *(admin)* — Start streaming all output to ESP-NOW caller (admin, remote only).
- `closestream` *(admin)* — Stop streaming output to ESP-NOW device (admin).
- `espnowworker` — Configure worker status reporting: 'espnowworker [show|on|off|interval <ms>|fields <list>]'. · `espnowworker [show|on|off|interval <ms>|fields <heap,rssi,thermal,imu>]`
- `espnowsensorstream` — Enable/disable sensor data streaming to master (worker only): 'espnowsensorstream <sensor> <on|off>'. · `espnowsensorstream <thermal|tof|imu|gps|input|fmradio|camera|microphone|rtc|presence|apds> <on|off>`
- `espnowsensorstatus` — Show remote sensor cache (master) or worker streaming status (worker).
- `espnowsensorbroadcast` — Enable/disable all sensor ESP-NOW communication: 'espnowsensorbroadcast <on|off>'. · `espnowsensorbroadcast [on|off]`
- `espnowusersync` *(admin)* — Enable/disable user credential sync: 'espnowusersync [on|off]'. · `espnowusersync [on|off]` _(setting · bool · default off)_
- `espnowrequestmeta` — Request metadata from peer: 'espnowrequestmeta <name_or_mac>'. · `espnowrequestmeta <name_or_mac>`
- `bondconnect` — Connect to bonded peer device: 'bondconnect <mac_or_name>'. · `bondconnect <mac_or_name>`
- `bonddisconnect` — Disconnect from bonded peer device.
- `bondstatus` — Show bond mode status and configuration.
- `bondrole` — Set bond mode role: 'bondrole <master|worker>'. · `bondrole <master|worker>` _(setting · enum · default 0 (Worker (compute/network)) · options 0=Worker (compute/network), 1=Master (display/gamepad))_
- `bondshowcap` — Show local device capability summary.
- `bondrequestcap` — Request capability summary from bonded peer.
- `bondshowmanifest` — Show local device manifest (UI apps + CLI commands).
- `bondrequestmanifest` — Request full manifest from bonded peer.
- `bondrequestsettings` — Request settings file from bonded peer.
- `bondrequestschema` — Request settings schema from bonded peer.
- `bondresync` — Force re-sync of bond state (cap+manifest+settings+schema). Use when UI is stuck on 'Establishing Bond' or peer state looks stale. · `bondresync [--cap|--manifest|--settings|--schema|--all]`
- `bondshowremotemanifest` — Show cached remote manifest(s): 'bondshowremotemanifest [fwHash]'. · `bondshowremotemanifest [<fwHash>]`
- `bondstream` — Stream sensor data to bonded master (worker only): 'bondstream <sensor> <on|off>'. · `bondstream <sensor> <on|off> bondstream (show status)`
- `bondtestsensor` — Test v3 sensor data transmission: 'bondtestsensor [sensor_type]'. · `bondtestsensor [thermal|tof|imu|gps|gamepad|fmradio]`
- `espnowsetpassphrase` *(admin)* — Set encryption passphrase on a mesh: 'espnowsetpassphrase <mesh> <phrase>'. · `espnowsetpassphrase <mesh> <passphrase> espnowsetpassphrase <mesh> clear`
- `espnowencstatus` *(admin)* — Show ESP-NOW encryption status and key fingerprint.
- `espnowpairsecure` *(admin)* — Pair device with encryption: 'espnowpairsecure <mac> <name> [mesh]'. · `espnowpairsecure <mac_address> <device_name> [mesh]`
- `teststreams` — Test topology stream management functions.
- `testconcurrent` — Test concurrent topology streams (simulated).
- `testcleanup` — Test cleanup of stale topology streams.
- `testfilelock` — Test file transfer lock acquire/release.
- `espnowenabled` *(admin)* — Enable/disable ESP-NOW (0|1, takes effect after reboot). · `espnowenabled <0|1>` _(setting · bool · default off)_
- `espnowbuffers` — Show/adjust ESP-NOW buffer sizes: 'espnowbuffers [tx|rx|chunk|filechunk] [value]'. · `espnowbuffers [tx|rx|chunk|filechunk] [<value>] (tx 1..16, rx 64..512, chunk 100..212, filechunk 100..216)`
- `espnowfirsttimesetup` *(admin)* — Set first time setup flag: <0|1> · `espnowfirsttimesetup <0|1>` _(setting · bool · default off)_
- `espnowheartbeatinterval` *(admin)* — Set master heartbeat interval: <1000-60000 ms> · `espnowheartbeatinterval <1000..60000>` _(setting · int 1000–60000 · default 10000)_
- `espnowfailovertimeout` *(admin)* — Set failover timeout: <5000-120000 ms> · `espnowfailovertimeout <5000..120000>` _(setting · int 5000–120000 · default 20000)_
- `espnowworkerstatusinterval` *(admin)* — Set worker status interval: <5000-120000 ms> · `espnowworkerstatusinterval <5000..120000>` _(setting · int 5000–120000 · default 30000)_
- `espnowtopodiscoveryinterval` *(admin)* — Set topology discovery interval: <0-300000 ms> · `espnowtopodiscoveryinterval <0..300000>` _(setting · int 0–300000 · default 0)_
- `espnowtopoautorefresh` *(admin)* — Set auto refresh topology: <0|1> · `espnowtopoautorefresh <0|1>` _(setting · bool · default off)_
- `espnowheartbeatbroadcast` *(admin)* — Set heartbeat broadcast: <0|1> · `espnowheartbeatbroadcast <0|1>` _(setting · bool · default on)_
- `espnowmeshadaptivettl` *(admin)* — Set adaptive TTL: <0|1> · `espnowmeshadaptivettl <0|1>` _(setting · bool · default off)_
- `espnowmeshpeermax` *(admin)* — Set max peer slots: <1-16> (reboot required) · `espnowmeshpeermax <1..16>` _(setting · int 1–16 · default 8)_
- `espnowsensorbroadcastinterval` *(admin)* — Set sensor broadcast interval: <100-10000 ms> · `espnowsensorbroadcastinterval <100..10000>` _(setting · int 100–10000 · default 1000)_
- `espnowtxqueuesize` *(admin)* — Set TX queue size: <1-16> · `espnowtxqueuesize <1..16>` _(setting · int 1–16 · default 8)_
- `espnowrxbuffersize` *(admin)* — Set RX buffer size: <64-512> · `espnowrxbuffersize <64..512>` _(setting · int 64–512 · default 256)_
- `espnowchunksize` *(admin)* — Set chunk size: <100-212> · `espnowchunksize <100..212>` _(setting · int 100–212 · default 200)_
- `espnowfilechunksize` *(admin)* — Set file chunk size: <100-216> · `espnowfilechunksize <100..216>` _(setting · int 100–216 · default 216)_
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

### `mqtt` — MQTT broker connection for Home Assistant

_Requires `ENABLE_MQTT`._

- `debugmqtt` *(admin)* — MQTT debug logging [0|1] · `debugmqtt [0|1]` _(setting · bool · default off)_
- `mqttclientenabled` *(admin)* — Enable/disable MQTT [0|1] · `mqttclientenabled [0|1]` _(setting · bool · default off)_
- `openmqtt` — Start MQTT client
- `closemqtt` — Stop MQTT client
- `mqttstatus` — Show MQTT status
- `mqttautostart` *(admin)* — MQTT auto-start [0|1] · `mqttautostart [0|1]` _(setting · bool · default off)_
- `mqttHost` *(admin)* — MQTT broker host [hostname] · `mqttHost [hostname]` _(setting · string · default (empty))_
- `mqttPort` *(admin)* — MQTT broker port [port] · `mqttPort [port]` _(setting · int 1–65535 · default 1883)_
- `mqttTLSMode` *(admin)* — TLS mode [0|1|2] · `mqttTLSMode [0|1|2|none|tls|verify]` _(setting · enum · default 0 (None) · options 0=None, 1=TLS, 2=TLS+Verify)_
- `mqttCACertPath` *(admin)* — CA cert path [path|clear] · `mqttCACertPath [path|clear]` _(setting · string · default "/system/certs/mqtt_ca.crt")_
- `mqttSubscribeExternal` *(admin)* — External subscriptions [0|1] · `mqttSubscribeExternal [0|1]` _(setting · bool · default off)_
- `mqttSubscribeTopics` *(admin)* — Subscribe topics [topics] · `mqttSubscribeTopics [topic1,topic2,...]` _(setting · string · default (empty))_
- `mqttExternalSensors` — List external sensor data
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

- `openble` — Start Bluetooth LE and begin advertising.
- `closeble` — Stop Bluetooth LE and deinitialize.
- `bleread` — Read Bluetooth connection status.
- `blestatus` — Show Bluetooth connection status.
- `bleinfo` — Show BLE configuration and settings.
- `blename` — Get/set BLE device name [name]. · `blename [name]`
- `bletxpower` — Get/set BLE TX power [0-7]. · `bletxpower [0..7]` _(setting · int 0–7 · default 3)_
- `bledisconnect` — Disconnect current BLE client.
- `bleadv` — Start/stop/toggle BLE advertising [start|stop|toggle]. · `bleadv [start|stop|toggle]`
- `blesend` — Send message to BLE client: <message>. · `blesend <message>`
- `blestream` — Control streaming: <on|off|sensors|system>. · `blestream [on|off|sensors|system|events|interval] | interval <sensor_ms> <system_ms>`
- `bleevent` — Send event to BLE client: <event>. · `bleevent <message>`
- `bleautostart` — Enable/disable BLE auto-start after boot [on|off]. · `bleautostart [on|off]` _(setting · bool · default on)_
- `blerequireauth` *(admin)* — Enable/disable BLE authentication requirement [on|off]. · `blerequireauth [on|off]` _(setting · bool · default on)_
- `blemode` — Get/set BLE mode [server|client]. · `blemode [server|client]` _(setting · enum · default 0 (Server) · options 0=Server, 1=Client (G2))_
- `blesecret` *(admin)* — Set/clear the BLE Secure Channel passphrase: blesecret <phrase|clear>. · `blesecret <passphrase|clear>` _(setting · string · default (hidden) · secret)_
- `blesecure` *(admin)* — Require app-layer BLE encryption [on|off]. · `blesecure [on|off]` _(setting · bool · default on)_
- `bleautoconnect` — Per-peer auto-reconnect at boot: bleautoconnect <name> [on|off]. `blepeers` lists names. · `bleautoconnect <peer-name> [on|off]`
- `blepeers` — List all registered BLE peers and their state.
- `g2autoconnect` — Alias for `bleautoconnect g2-glasses [on|off]`. · `g2autoconnect [on|off]`
- `ringautoconnect` — Alias for `bleautoconnect r1-ring [on|off]`. · `ringautoconnect [on|off]`

### `filesystem` — File operations and storage management

_Always compiled._

- `files` *(admin)* — List files ["path"] | files json ["path"] | files stats json ["path"] · `files ["path"] - List files in LittleFS (default '/') files json ["path"] - List as JSON (app/BLE): {success,dirPerms,files[]} files stats json ["path"] - Storage usage JSON for the path's tier Paths are always double-quoted, e.g. files "/logging_captures"`
- `mkdir` *(admin)* — Create directory: "<path>" · `mkdir "<path>"`
- `rmdir` *(admin)* — Remove directory: "<path>" · `rmdir "<path>"`
- `filecreate` *(admin)* — Create file: "<path>" · `filecreate "<path>"`
- `fileview` *(admin)* — View file: "<path>" · `fileview "<path>"`
- `fileread` *(admin)* — Read file chunk as JSON: "<path>" [offset] [len] [b64] · `fileread "<path>" [offset] [len] [b64] - Chunked permission-guarded read (app/BLE). Returns {success,size,offset,len,eof,enc,data}; loop offset until eof.`
- `filewrite` *(admin)* — Write file chunk: "<path>" <offset> <b64chunk> [final] · `filewrite "<path>" <offset> <b64chunk> [final] - Sequential chunked write (app/BLE). offset 0 truncates/creates; later offsets must equal current size; 'final' runs post-save hooks.`
- `filedelete` *(admin)* — Delete file: "<path>" [confirm] · `filedelete "<path>" [confirm]`
- `filerename` *(admin)* — Rename file: "<oldpath>" "<newname>" · `filerename "<oldpath>" "<newname>"`
- `logtier` — Show current log storage tier (LittleFS vs SD overflow). · `logtier - Report which tier logs are writing to and free space on each.`

### `sd` — SD card mount, format, and info

_Requires `defined(SD_CS_PIN)`._

- `sdmount` — Mount SD card · `sdmount - Attempt to mount SD card at /sd`
- `sdunmount` *(admin)* — Unmount SD card · `sdunmount - Safely unmount SD card`
- `sdformat` — Format SD card as FAT32 · `sdformat confirm - Format SD card (WARNING: erases all data)`
- `sdinfo` — Show SD card information · `sdinfo - Display SD card type, size, and usage`
- `sddiag` — SD card hardware diagnostics · `sddiag - Test raw SPI communication with SD card`

### `oled` — OLED display control and graphics

_Always compiled._

- `openoled` — Start OLED display.
- `closeoled` — Stop OLED display.
- `oledread` — Read OLED display status.
- `oledstart` — Start OLED display.
- `oledstop` — Stop OLED display.
- `oledmode` — Set display mode: <mode> · `oledmode <menu|status|sensordata|sensorlist|thermal|network|mesh|gps|text|logo|anim|imuactions|fmradio|files|automations|espnow|memory|off> Example: oledmode memory Example: oledmode off`
- `oledtext` — Set custom text: <message> · `oledtext <message>`
- `oledanim` — Select animation: <name> or fps <1-60> · `oledanim <name> oledanim fps <1-60>`
- `oledclear` — Clear OLED display.
- `oledstatus` — Show OLED status.
- `oledrequireauth` *(admin)* — OLED auth requirement: <0|1> · `oledrequireauth <0|1>` _(setting · bool · default on)_
- `oledenabled` — Enable/disable OLED: <0|1> · `oledenabled <0|1>` _(setting · bool · default off)_
- `oledbootmode` — OLED boot mode: <logo|status|sensors|thermal|network|mesh|off> · `oledbootmode <logo|status|sensors|thermal|network|mesh|off>` _(setting · enum · default "logo" · options logo, status, sensors, thermal, network, mesh, off)_
- `oleddefaultmode` — OLED default mode: <logo|status|sensors|thermal|network|mesh|off> · `oleddefaultmode <logo|status|sensors|thermal|network|mesh|off>` _(setting · enum · default "status" · options logo, status, sensors, thermal, network, mesh, off)_
- `oledbootduration` — Boot animation duration (ms): <0-60000> · `oledbootduration <0..60000>` _(setting · int 500–10000 · default 2000)_
- `oledupdateinterval` — Display update interval (ms): <10-1000> · `oledupdateinterval <10..1000>` _(setting · int 10–1000 · default 125)_
- `oledbrightness` — Display brightness: <0-255> · `oledbrightness <0..255>` _(setting · int 0–255 · default 255)_
- `oledflip` — Flip display 180°: [on|off|toggle] · `oledflip [on|off|toggle]` _(setting · bool · default on)_
- `oledthermalscale` — Thermal image scale: <0.1-10.0> · `oledthermalscale <0.1..10.0>` _(setting · float · default 2.5)_
- `oledthermalcolormode` — Thermal color mode: <3level|grayscale> · `oledthermalcolormode <3level|grayscale>` _(setting · enum · default "3level" · options 3level, grayscale)_

### `neopixel` — RGB LED strip and effects

_Always compiled._

- `ledcolor` — Set LED color: <color> · `ledcolor <red|green|blue|yellow|magenta|cyan|white|orange|purple|pink>`
- `ledclear` — Turn off LED.
- `ledeffect` — Run LED effect: <effect> · `ledeffect <fade|blink|pulse|strobe|off> [color] [color2] [duration 100..60000]`

### `led` — LED brightness and startup effects

_Always compiled._

- `ledbrightness` — Set LED brightness 0-100. · `ledbrightness <0..100>` _(setting · int 0–255 · default 100)_
- `ledstartupenabled` — Enable/disable LED startup effect [0|1]. · `ledstartupenabled <0|1>` _(setting · bool · default on)_
- `ledstartupeffect` — Set LED startup effect [none|rainbow|pulse|fade|blink|strobe]. · `ledstartupeffect <none|rainbow|pulse|fade|blink|strobe>` _(setting · enum · default "rainbow" · options none, rainbow, pulse, fade, blink, strobe)_
- `ledstartupcolor` — Set LED startup primary color. · `ledstartupcolor <red|green|blue|cyan|magenta|yellow|white|orange|purple>` _(setting · string · default "cyan")_
- `ledstartupcolor2` — Set LED startup secondary color. · `ledstartupcolor2 <red|green|blue|cyan|magenta|yellow|white|orange|purple>` _(setting · string · default "magenta")_
- `ledstartupduration` — Set LED startup effect duration in ms. · `ledstartupduration <100..10000>` _(setting · int 100–10000 · default 1000)_

### `servo` — PCA9685 servo motor control

_Requires `ENABLE_SERVO`._

- `servo` — Control servo motor: servo <channel> <angle>. · `servo <channel> <angle>`
- `pwm` — Set PWM output: pwm <channel> <value> [freq]. · `pwm <channel> <value> [freq]`
- `servoprofile` — Configure servo profile: servoprofile <ch> <minPulse> <maxPulse> <centerPulse> <name>. · `servoprofile <ch> <minPulse> <maxPulse> <centerPulse> <name>`
- `servolist` — List configured servo profiles.
- `servocalibrate` — Enter calibration mode: servocalibrate <channel>. · `servocalibrate <channel>`

### `thermal` — MLX90640 thermal camera (32x24)

_Requires `ENABLE_THERMAL_SENSOR`._

- `openthermal` — Start MLX90640 thermal sensor.
- `closethermal` — Stop MLX90640 thermal sensor.
- `thermalread` — Read thermal sensor data (min/max/avg).
- `thermalpollingms` *(admin)* — Thermal UI polling: <50..5000> · `thermalpollingms <50..5000>` _(setting · int 50–5000 · default 250)_
- `thermalpalettedefault` *(admin)* — Thermal palette: <grayscale|iron|rainbow|hot|coolwarm> · `thermalpalettedefault <grayscale|iron|rainbow|hot|coolwarm>` _(setting · enum · default "grayscale" · options grayscale, iron, rainbow, hot, coolwarm)_
- `thermalewmafactor` *(admin)* — Thermal EWMA factor: <0.0..1.0> · `thermalewmafactor <0.0..1.0>` _(setting · float · default 0.2)_
- `thermaltransitionms` *(admin)* — Thermal transition time: <0..5000> · `thermaltransitionms <0..5000>` _(setting · int 0–5000 · default 80)_
- `thermalupscalefactor` *(admin)* — Thermal upscale factor: <1..4> · `thermalupscalefactor <1..4>` _(setting · int 1–4 · default 1)_
- `thermalrollingminmaxenabled` *(admin)* — Thermal rolling min/max: <0|1> · `thermalrollingminmaxenabled <0|1>` _(setting · bool · default on)_
- `thermalrollingminmaxalpha` *(admin)* — Thermal rolling alpha: <0.0..1.0> · `thermalrollingminmaxalpha <0.0..1.0>` _(setting · float · default 0.6)_
- `thermalrollingminmaxguardc` *(admin)* — Thermal rolling guard: <0.0..10.0> · `thermalrollingminmaxguardc <0.0..10.0>` _(setting · float · default 0.3)_
- `thermaltemporalalpha` *(admin)* — Thermal temporal alpha: <0.0..1.0> · `thermaltemporalalpha <0.0..1.0>` _(setting · float · default 0.5)_
- `thermalrotation` *(admin)* — Thermal rotation: <0|1|2|3> · `thermalrotation <0|1|2|3> (0=0°, 1=90°, 2=180°, 3=270°)` _(setting · int 0–3 · default 0)_
- `thermalinterpolationenabled` *(admin)* — Thermal interpolation: <0|1> · `thermalinterpolationenabled <0|1>` _(setting · bool · default on)_
- `thermalinterpolationsteps` *(admin)* — Thermal interp steps: <1..8> · `thermalinterpolationsteps <1..8>` _(setting · int 1–8 · default 5)_
- `thermalinterpolationbuffersize` *(admin)* — Thermal interp buffer: <1..10> · `thermalinterpolationbuffersize <1..10>` _(setting · int 1–10 · default 2)_
- `thermaltargetfps` *(admin)* — Thermal target FPS: <1..8> · `thermalTargetFps <1..8>` _(setting · int 1–8 · default 8)_
- `thermaldevicepollms` *(admin)* — Thermal device poll: <100..2000> · `thermalDevicePollMs <100..2000>` _(setting · int 50–1000 · default 100)_
- `thermaldiag` — Run thermal sensor diagnostics.
- `thermalautostart` — Enable/disable thermal auto-start after boot [on|off] · `thermalautostart [on|off]` _(setting · bool · default off)_

### `tof` — VL53L4CX time-of-flight distance sensor

_Requires `ENABLE_TOF_SENSOR`._

- `opentof` — Start VL53L4CX ToF sensor.
- `closetof` — Stop VL53L4CX ToF sensor.
- `tofread` — Read ToF distance sensor.
- `tofpollingms` *(admin)* — ToF UI polling: <50..5000> · `tofpollingms <50..5000>` _(setting · int 50–5000 · default 220)_
- `tofstabilitythreshold` *(admin)* — ToF stability threshold: <0..50> · `tofstabilitythreshold <0..50>` _(setting · int 0–50 · default 3)_
- `toftransitionms` *(admin)* — ToF transition time: <0..5000> · `toftransitionms <0..5000>` _(setting · int 0–5000 · default 200)_
- `tofmaxdistancemm` *(admin)* — ToF max distance: <100..10000> · `tofmaxdistancemm <100..10000>` _(setting · int 100–10000 · default 3400)_
- `tofdevicepollms` *(admin)* — ToF device poll: <100..2000> · `tofDevicePollMs <100..2000>` _(setting · int 100–2000 · default 220)_
- `tofautostart` — Enable/disable ToF auto-start after boot [on|off] · `tofautostart [on|off]` _(setting · bool · default off)_

### `imu` — BNO055 9-DOF orientation sensor

_Requires `ENABLE_IMU_SENSOR`._

- `openimu` — Start BNO055 IMU sensor.
- `closeimu` — Stop BNO055 IMU sensor.
- `imuread` — Read IMU sensor data.
- `imuactions` — Show IMU action detection state.
- `imupollingms` *(admin)* — IMU UI polling interval: <50..2000> · `imupollingms <50..2000>` _(setting · int 50–2000 · default 200)_
- `imuewmafactor` *(admin)* — IMU EWMA smoothing: <0.0..1.0> · `imuewmafactor <0.0..1.0>` _(setting · float · default 0.1)_
- `imutransitionms` *(admin)* — IMU transition time: <0..1000> · `imutransitionms <0..1000>` _(setting · int 0–1000 · default 100)_
- `imuwebmaxfps` *(admin)* — IMU web max FPS: <1..30> · `imuwebmaxfps <1..30>` _(setting · int 1–30 · default 15)_
- `imudevicepollms` *(admin)* — IMU device poll interval: <50..1000> · `imuDevicePollMs <50..1000>` _(setting · int 50–1000 · default 200)_
- `imuorientationmode` *(admin)* — IMU orientation mode: <0..8> · `imuorientationmode <0..8>` _(setting · enum · default 8 (Upside Down) · options 0=Normal, 1=Flip Pitch, 2=Flip Roll, 3=Flip Yaw, 4=Flip Pitch+Roll, 5=Roll 180 Fix, 6=Rotate 90 CCW, 7=Alt Extreme Pitch, 8=Upside Down)_
- `imuorientationcorrection` *(admin)* — IMU orientation correction: <0|1> · `imuorientationcorrection <0|1>`
- `imupitchoffset` *(admin)* — IMU pitch offset: <-180..180> · `imupitchoffset <-180..180>` _(setting · float · default 0.0)_
- `imurolloffset` *(admin)* — IMU roll offset: <-180..180> · `imurolloffset <-180..180>` _(setting · float · default 0.0)_
- `imuyawoffset` *(admin)* — IMU yaw offset: <-180..180> · `imuyawoffset <-180..180>` _(setting · float · default 0.0)_
- `imuautostart` — Enable/disable IMU auto-start after boot [on|off] · `imuautostart [on|off]` _(setting · bool · default off)_

### `input` — Input device (gamepad or ANO encoder)

_Requires `ENABLE_OLED_INPUT`._

- `openinput` — Start the input device (gamepad or ANO encoder).
- `closeinput` — Stop the input device.
- `inputautostart` — Enable/disable input device auto-start [on|off] · `inputautostart [on|off]` _(setting · bool · default off)_
- `inputdevicepollms` *(admin)* — Set input device poll interval ms [10-1000] · `inputdevicepollms <10-1000>` _(setting · int 10–1000 · default 90)_

### `gamepad` — Seesaw gamepad — raw debug commands

_Requires `ENABLE_GAMEPAD_SENSOR`._

- `gamepadread` — Read Seesaw gamepad state (x/y/buttons).

### `anoencoder` — ANO rotary encoder — debug + driver-specific config

_Requires `ENABLE_ANO_ENCODER`._

- `anoencoderread` — Read ANO encoder state.
- `anoencoderi2caddr` *(admin)* — Set ANO I2C address [1-127] · `anoencoderi2caddr <1-127>` _(setting · int 1–127 · default I2C_ADDR_ANO_ENCODER)_
- `anoencoderinvert` — Invert rotation direction [on|off] · `anoencoderinvert [on|off]` _(setting · bool · default off)_
- `anoencoderswapud` — Swap UP/DOWN buttons [on|off|toggle] · `anoencoderswapud [on|off|toggle]` _(setting · bool · default on)_
- `anoencoderswaplr` — Swap LEFT/RIGHT buttons [on|off|toggle] · `anoencoderswaplr [on|off|toggle]` _(setting · bool · default on)_

### `apds` — APDS9960 color, proximity, gesture sensor

_Requires `ENABLE_APDS_SENSOR`._

- `openapds` — Start APDS9960 sensor.
- `closeapds` — Stop APDS9960 sensor.
- `apdsread` — Read APDS9960 sensor status and data.
- `apdsmode` — Control APDS modes: apdsmode <color|proximity|gesture> [on|off]. · `apdsmode <color|proximity|gesture> [<on|off>]`
- `apdscolor` — Read APDS9960 color values.
- `apdsproximity` — Read APDS9960 proximity value.
- `apdsgesture` — Read APDS9960 gesture.
- `apdsautostart` — Enable/disable APDS auto-start after boot [on|off] · `apdsautostart [on|off]` _(setting · bool · default off)_

### `gps` — PA1010D GPS module

_Requires `ENABLE_GPS_SENSOR`._

- `opengps` — Start PA1010D GPS module.
- `closegps` — Stop PA1010D GPS module.
- `gpsread` — Read GPS location and time data.
- `gpsautostart` — Enable/disable GPS auto-start after boot [on|off] · `gpsautostart [on|off]` _(setting · bool · default off)_
- `gpslog` — Set up and start GPS track logging now (persists across boots). Usage: gpslog [interval_ms] · `gpslog [interval_ms] Sets gpsAutoStart, sensorlog format=track, sensors=gps, and autostart, then starts both the GPS sensor and sensor logging immediately. interval_ms: log interval in ms (default 1000, min 100) Example: gpslog (1-second logging) gpslog 500 (500ms logging)`

### `fmradio` — RDA5807 FM radio receiver

_Requires `ENABLE_FM_RADIO`._

- `openfmradio` — Start FM Radio sensor.
- `closefmradio` — Stop FM Radio sensor.
- `fmradioread` — Read FM Radio status.
- `fmradiotune` — Tune to frequency: <freq> · `fmradiotune <frequency> (e.g., 103.9 or 10390)`
- `fmradioseek` — Seek next station [up|down] · `fmradioseek [up|down]`
- `fmradiovolume` — Set volume: <0-15> · `fmradiovolume <0-15>`
- `fmradiomute` — Mute audio
- `fmradiounmute` — Unmute audio
- `fmradioautostart` — Enable/disable FM Radio auto-start after boot [on|off] · `fmradioautostart [on|off]` _(setting · bool · default off)_

### `rtc` — DS3231 precision RTC

_Requires `ENABLE_RTC_SENSOR`._

- `openrtc` — Start DS3231 RTC sensor.
- `closertc` — Stop DS3231 RTC sensor.
- `rtcread` — Read RTC status [status|temp] · `rtcread [status|temp]`
- `rtcset` *(admin)* — Set RTC time: <datetime|timestamp> · `rtcset YYYY-MM-DD HH:MM:SS or rtcset <unix_timestamp>`
- `rtcsync` *(admin)* — Sync time: [to|from] · `rtcsync [to|from] (to=RTC->system, from=system->RTC)`
- `rtcautostart` — Enable/disable RTC auto-start after boot [on|off] · `rtcautostart [on|off]` _(setting · bool · default on)_

### `presence` — STHS34PF80 IR presence/motion sensor

_Requires `ENABLE_PRESENCE_SENSOR`._

- `openpresence` — Start STHS34PF80 IR presence/motion sensor.
- `closepresence` — Stop STHS34PF80 sensor.
- `presenceread` — Read STHS34PF80 presence/motion/temperature data.
- `presencestatus` — Show STHS34PF80 sensor status.
- `presenceautostart` — Enable/disable presence auto-start after boot [on|off] · `presenceautostart [on|off]` _(setting · bool · default off)_

### `camera` — ESP32-S3 DVP camera sensor

_Requires `ENABLE_CAMERA_SENSOR`._

- `cameraread` — Read camera status
- `opencamera` — Start camera sensor.
- `closecamera` — Stop camera sensor.
- `cameracapture` — Capture a single frame
- `camerasave` — Save current frame to storage
- `camerares` — Set camera resolution: <res> · `camerares <96x96|qqvga|qcif|hqvga|240x240|qvga|cif|vga|svga|xga|sxga|uxga>`
- `cameraframesize` *(admin)* — Set resolution by index: <0-10> · `cameraframesize <0..10> (0-5: QVGA..UXGA, 6-10: 96x96/QQVGA/QCIF/HQVGA/240x240)` _(setting · enum · default 10 (240x240) · options 0=320x240 (QVGA), 1=640x480 (VGA), 2=800x600 (SVGA), 3=1024x768 (XGA), 4=1280x1024 (SXGA), 5=1600x1200 (UXGA), 6=96x96, 7=160x120 (QQVGA), 8=176x144 (QCIF), 9=240x176 (HQVGA), 10=240x240)_
- `cameraquality` — Set JPEG quality: <0-63> · `cameraquality <0..63> (lower = better quality, larger file)` _(setting · int 0–63 · default 12)_
- `camerafps` *(admin)* — Camera FPS: <1-20> · `camerafps <1..20>` _(setting · int 1–20 · default 5)_
- `cameratiny` — Capture tiny frame for ESP-NOW
- `camerabrightness` — Set brightness: <-2..2> · `camerabrightness <-2..2>` _(setting · int -2–2 · default 2)_
- `cameracontrast` — Set contrast: <-2..2> · `cameracontrast <-2..2>` _(setting · int -2–2 · default 2)_
- `camerasaturation` — Set saturation: <-2..2> · `camerasaturation <-2..2>` _(setting · int -2–2 · default 2)_
- `camerawb` *(admin)* — White balance mode: <0-4> · `camerawb <0..4> (0=Auto,1=Sunny,2=Cloudy,3=Office,4=Home)`
- `camerasharpness` *(admin)* — Set sharpness: <-2..2> · `camerasharpness <-2..2> (OV3660 only)` _(setting · int -2–2 · default 0)_
- `cameradenoise` *(admin)* — Set denoise level: <0-8> · `cameradenoise <0..8>` _(setting · int 0–8 · default 0)_
- `cameraeffect` *(admin)* — Special effect: <0-6> · `cameraeffect <0..6> (0=None,1=Negative,2=Grayscale,3=Red,4=Green,5=Blue,6=Sepia)`
- `cameraexposure` *(admin)* — Set AE level: <-2..2> · `cameraexposure <-2..2> (negative=darker)`
- `cameraaec` *(admin)* — Auto exposure: <on|off> · `cameraaec <on|off|1|0|true|auto>`
- `cameraaecvalue` *(admin)* — Exposure value: <0-1200> · `cameraaecvalue <0..1200>`
- `cameraagc` *(admin)* — Auto gain: <on|off> · `cameraagc <on|off|1|0|true|auto>`
- `cameraagcgain` *(admin)* — Gain value: <0-30> · `cameraagcgain <0..30>`
- `cameragainceiling` *(admin)* — Gainceiling: <0-6> (2X..128X) · `cameragainceiling <0..6> (2X..128X)`
- `camerawhitebal` *(admin)* — AWB master: <on|off> · `camerawhitebal <on|off>`
- `cameraawbgain` *(admin)* — AWB gain: <on|off> · `cameraawbgain <on|off>`
- `cameraaec2` *(admin)* — Alt AEC algorithm: <on|off> · `cameraaec2 <on|off>`
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
- `cameramaxstoredimages` *(admin)* — Max stored: <0-1000> · `cameramaxstoredimages <0..1000> (0=unlimited)` _(setting · int 0–1000 · default 100)_
- `cameraautocapture` *(admin)* — Auto-capture: <on|off> · `cameraautocapture <on|off|1|0|true>` _(setting · bool · default off)_
- `cameraautocaptureinterval` *(admin)* — Auto-capture: <sec> · `cameraautocaptureinterval <10..3600>` _(setting · int 10–3600 · default 60)_
- `camerasendaftercapture` *(admin)* — Send after capture: <on|off> · `camerasendaftercapture <on|off|1|0|true>` _(setting · bool · default off)_
- `cameratargetdevice` *(admin)* — Target device: <name> · `cameratargetdevice <name>` _(setting · string · default (empty))_
- `camerarecord` — Start/stop MJPEG-AVI recording (SD only): <start|stop> · `camerarecord <start|stop|1|0>`
- `cameravideolist` — List AVI recordings on SD
- `cameravideodelete` *(admin)* — Delete recording: "<filename>" · `cameravideodelete "<filename>"`

### `microphone` — PDM microphone audio sensor

_Requires `ENABLE_MICROPHONE_SENSOR`._

- `micread` — Read microphone sensor status. · `micread`
- `openmic` — Start microphone sensor.
- `closemic` — Stop microphone sensor.
- `miclevel` — Get current audio level. · `miclevel`
- `micviz` — Real-time audio level visualizer. · `micviz (press any key to stop)`
- `micrecord` — Start/stop recording to WAV file. · `micrecord <start|stop>`
- `miclist` — List saved recordings. · `miclist`
- `micdelete` *(admin)* — Delete recording(s). · `micdelete "<filename>" | micdelete all`
- `micsamplerate` — Get/set sample rate. · `micsamplerate [8000-48000]`
- `micgain` — Get/set microphone gain. · `micgain [0-100]`
- `micbitdepth` — Get/set bit depth. · `micbitdepth [16|32]`
- `micautostart` — Enable/disable microphone auto-start after boot [on|off] · `micautostart [on|off]`

### `edgeimpulse` — Edge Impulse ML inference

_Requires `ENABLE_EDGE_IMPULSE`._

- `ei` — Edge Impulse ML inference commands. · `ei <subcommand>`
- `eienable` — Enable/disable Edge Impulse inference. · `eienable <0|1>` _(setting · bool · default off)_
- `eidetect` — Run single object detection inference. · `eidetect`
- `eifile` — Run inference on stored JPEG image. · `eifile "<path>"`
- `eicontinuous` — Start/stop continuous inference mode. · `eicontinuous <0|1>` _(setting · bool · default off)_
- `eiconfidence` — Set minimum detection confidence. · `eiconfidence <0.0-1.0>`
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

### `espsr` — ESP-SR speech recognition

_Requires `ENABLE_ESP_SR`._

- `sr` — ESP-SR speech recognition commands. · `sr <enable|start|stop|status|stack|cmds|debug|confidence|timeout|tuning|accept|dyngain|raw|autotune|snip>`
- `srenable` *(admin)* — Enable/disable ESP-SR (compile-time flag). · `srenable <0|1>`
- `opensr` — Start ESP-SR pipeline. · `opensr`
- `closesr` — Stop ESP-SR pipeline. · `closesr`
- `srstatus` — Show ESP-SR status. · `srstatus`
- `srstack` — Show sr_task stack high-water mark (run after voice stress test). · `srstack`
- `srstart` — Start ESP-SR pipeline. · `srstart`
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
- `srconfidence` — Get/set command confidence threshold. · `srconfidence [0.0-1.0]`
- `sraccept` — Configure target acceptance policy (gap acceptance). · `sraccept [on|off|floor <0.0-1.0>|gap <0.0-1.0>|speech <0|1>]`
- `srdyngain` — Configure dynamic gain normalization (MultiNet input only). · `srdyngain [on|off|min <0.1-10>|max <0.1-10>|target <1000-30000>|alpha <0.0-1.0>|reset]`
- `srraw` — Toggle raw output mode (shows all MultiNet hypotheses). · `srraw [on|off]`
- `srautotune` — Auto-cycle through gain configurations to find best settings. · `srautotune [start|stop|status]`
- `srtimeout` — Get/set command listening timeout. · `srtimeout [1000-30000]`
- `setmicsource` — Phase 2B: switch SR feed source (local PDM / G2 left temple). · `setmicsource [local|g2]`
- `srtuning` — Show/set audio tuning parameters. · `srtuning [gain|agc|vad]`
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
- `voicecancel` — Cancel current voice command sequence.
- `voicehelp` — Show available voice options for current state.

### `i2c` — I2C bus diagnostics and scanning

_Requires `ENABLE_I2C_SYSTEM`._

- `i2cbusenabled` *(admin)* — Enable/disable I2C1 bus: <0|1> (reboot required) · `i2cBusEnabled <0|1>` _(setting · bool · default on)_
- `i2csdapin` *(admin)* — Set I2C1 SDA pin: <0..39> · `i2cSdaPin <0..39>` _(setting · int 0–48 · default I2C_SDA_PIN_DEFAULT)_
- `i2csclpin` *(admin)* — Set I2C1 SCL pin: <0..39> · `i2cSclPin <0..39>` _(setting · int 0–48 · default I2C_SCL_PIN_DEFAULT)_
- `i2c2busenabled` *(admin)* — Enable/disable I2C2 bus: <0|1> (reboot required) · `i2c2BusEnabled <0|1>` _(setting · bool · default off)_
- `i2c2sdapin` *(admin)* — Set I2C2 SDA pin: <-1..48> (-1=unavailable) · `i2c2SdaPin <-1..48>` _(setting · int -1–48 · default I2C2_SDA_PIN_DEFAULT)_
- `i2c2sclpin` *(admin)* — Set I2C2 SCL pin: <-1..48> (-1=unavailable) · `i2c2SclPin <-1..48>` _(setting · int -1–48 · default I2C2_SCL_PIN_DEFAULT)_
- `oledbus` *(admin)* — Route OLED to bus: <0|1> (reboot required) · `oledBus <0|1>` _(setting · enum · default OLED_BUS_DEFAULT · options 0=I2C1, 1=I2C2)_
- `inputbus` *(admin)* — Route input device to bus: <0|1> (reboot required) · `inputBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `gpsbus` *(admin)* — Route PA1010D GPS to bus: <0|1> (reboot required) · `gpsBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `rtcbus` *(admin)* — Route DS3231 RTC to bus: <0|1> (reboot required) · `rtcBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `fmradiobus` *(admin)* — Route RDA5807 FM radio to bus: <0|1> (reboot required) · `fmRadioBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `presencebus` *(admin)* — Route STHS34PF80 presence to bus: <0|1> (reboot required) · `presenceBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `imubus` *(admin)* — Route BNO055 IMU to bus: <0|1> (reboot required) · `imuBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `thermalbus` *(admin)* — Route MLX90640 thermal to bus: <0|1> (reboot required) · `thermalBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `tofbus` *(admin)* — Route VL53L4CX ToF to bus: <0|1> (reboot required) · `tofBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `apdsbus` *(admin)* — Route APDS9960 gesture to bus: <0|1> (reboot required) · `apdsBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `servobus` *(admin)* — Route PCA9685 servo to bus: <0|1> (reboot required) · `servoBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `fuelgaugebus` *(admin)* — Route MAX17048 fuel gauge to bus: <0|1> (reboot required) · `fuelGaugeBus <0|1>` _(setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2)_
- `i2creset` *(admin)* — Reset I2C bus: pause polling, recover bus, resume.
- `i2cpause` *(admin)* — Pause all I2C sensor polling.
- `i2cresume` *(admin)* — Resume I2C sensor polling.
- `i2crecover` *(admin)* — Clear degraded state for device: <address> · `i2crecover <address> (hex 0x01-0x7F or decimal 1-127)`
- `i2cmetrics` — Show I2C bus performance metrics.
- `i2cscan` — Scan I2C bus for devices.
- `detect` — Detect hardware: scan I2C buses, diff vs. configured features. · `detect [apply] detect - read-only report (present/enabled/missing) detect apply - auto-enable cheap detected devices (admin; reboot for some)`
- `i2cstats` — I2C bus statistics and errors.
- `i2chealth` — Show per-device I2C health status.
- `sensors` — List I2C sensors [filter] · `sensors [filter] - filter by name, description, or manufacturer sensors json [brief] - live state (+readings; 'brief' = state only, no data) Example: sensors temperature, sensors json brief`
- `sensorinfo` — Sensor details: <name> · `sensorinfo <sensor_name> Example: sensorinfo BNO055`
- `devices` — Show discovered I2C device registry.
- `discover` — Re-scan and register I2C devices.
- `devicefile` — Show device registry JSON file.
- `sensorautostart` *(admin)* — Sensor auto-start: [sensor] [on|off] · `sensorautostart [sensor] [on|off] sensorautostart all [on|off] Sensors: thermal, tof, imu, gps, fmradio, apds, input`

### `automation` — Scheduled tasks and conditional commands

_Requires `ENABLE_AUTOMATION`._

- `automation` — Automation system: automation <subcommand> [args]. · `automation <system enable|disable|status [json] | list [json] | add | enable | disable | delete | run | trigger | sanitize | recompute>`
- `automationlist` — List all automations.
- `automationadd` — Add automation (KEY=VALUE; name/type/command required). Same as 'automation add'. · `automationadd name=<name> type=atTime|afterDelay|interval command=<cmd>|commands=<c1;c2> [time=HH:MM] [delayms=<n>] [intervalms=<n>] [days=Mon,Tue] [condition=<expr>] [enabled=1] [runatboot=1]`
- `automationrun` — Run automation by ID: automationrun id=<id>.
- `automationtrigger` — Arm afterDelay automation timer: automationtrigger id=<id>.
- `autolog` — Automation logging: autolog start "<file>" | stop | status. · `autolog start "<filename>" | autolog stop | autolog status`
- `validate-conditions` *(admin)* — Validate conditional automation syntax: validate-conditions IF temp>75 THEN ledcolor red. · `validate-conditions IF <expr> THEN <command> [ELSE <command>] (e.g. validate-conditions IF temp>75 THEN ledcolor red)`
- `print` — Broadcast a message to all outputs: print <message>.

### `battery` — Battery voltage and charge monitoring

_Requires `ENABLE_BATTERY_MONITOR`._

- `batterystatus` — Show battery voltage, charge level, and status
- `batterycalibrate` *(admin)* — Recalibrate battery ADC readings
- `batterylog` — Battery time-series CSV log (on/off/interval/tail/clear) · `batterylog [on|off|interval <s>|tail|clear]`

### `debug` — System debugging and diagnostics

_Always compiled._

- `debughttp` *(admin)* — Debug HTTP requests. · `debughttp <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debughttps` *(admin)* — Debug HTTPS/TLS handshake + connection errors (ESP-IDF logs). · `debughttps <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsse` *(admin)* — Debug Server-Sent Events. · `debugsse <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcli` *(admin)* — Debug CLI processing. · `debugcli <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugauth` *(admin)* — Debug authentication (parent flag). · `debugauth <0|1>` _(setting · bool · default off)_
- `debugespnow` *(admin)* — Debug ESP-NOW (parent flag). · `debugespnow <0|1>` _(setting · bool · default off)_
- `debugbluetooth` *(admin)* — Debug Bluetooth (parent flag). · `debugbluetooth <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugbluetoothcore` *(admin)* — Debug Bluetooth core lifecycle. · `debugbluetoothcore <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugbluetoothgatt` *(admin)* — Debug Bluetooth GATT operations. · `debugbluetoothgatt <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugbluetoothdata` *(admin)* — Debug Bluetooth command/data path. · `debugbluetoothdata <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcamera` *(admin)* — Debug camera (parent flag). · `debugcamera <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcameralifecycle` *(admin)* — Debug camera init/stop/PWDN-RESET/GPIO state. · `debugcameralifecycle <0|1>` _(setting · bool · default off)_
- `debugcameracapture` *(admin)* — Debug captureFrame, JPEG validation, fb buffer, recovery. · `debugcameracapture <0|1>` _(setting · bool · default off)_
- `debugcamerasettings` *(admin)* — Debug runtime camera resolution/quality changes. · `debugcamerasettings <0|1>` _(setting · bool · default off)_
- `debugcameravideo` *(admin)* — Debug video recording start/finalize, frame writing. · `debugcameravideo <0|1>` _(setting · bool · default off)_
- `debugdisplay` *(admin)* — Debug OLED init/probe/boot-animation/mode-transitions. · `debugdisplay <0|1>` _(setting · bool · default off)_
- `debugmicrophone` *(admin)* — Debug microphone operations. · `debugmicrophone <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debuggps` *(admin)* — Debug GPS sensor (PA1010D). · `debuggps <0|1>` _(setting · bool · default off)_
- `debugrtc` *(admin)* — Debug RTC sensor (DS3231). · `debugrtc <0|1>` _(setting · bool · default off)_
- `debugimu` *(admin)* — Debug IMU sensor (BNO055). · `debugimu <0|1>` _(setting · bool · default off)_
- `debugthermal` *(admin)* — Debug thermal sensor (MLX90640). · `debugthermal <0|1>` _(setting · bool · default off)_
- `debugtof` *(admin)* — Debug ToF sensor (VL53L4CX). · `debugtof <0|1>` _(setting · bool · default off)_
- `debuginput` *(admin)* — Debug input abstraction layer (HAL_Input + OLED dispatch). · `debuginput <0|1>` _(setting · bool · default off)_
- `debuganoencoder` *(admin)* — Debug ANO rotary encoder driver internals. · `debuganoencoder <0|1>` _(setting · bool · default off)_
- `debugapds` *(admin)* — Debug APDS sensor (APDS9960). · `debugapds <0|1>` _(setting · bool · default off)_
- `debugpresence` *(admin)* — Debug presence sensor (STHS34PF80). · `debugpresence <0|1>` _(setting · bool · default off)_
- `debugthermallifecycle` *(admin)* — Debug thermal init/connect/recovery. · `debugthermallifecycle <0|1>` _(setting · bool · default off)_
- `debugthermalpolling` *(admin)* — Debug thermal poll cadence/FPS/capture. · `debugthermalpolling <0|1>` _(setting · bool · default off)_
- `debugthermalvalues` *(admin)* — Debug thermal value updates/interpolation. · `debugthermalvalues <0|1>` _(setting · bool · default off)_
- `debugtoflifecycle` *(admin)* — Debug ToF init/connect/recovery. · `debugtoflifecycle <0|1>` _(setting · bool · default off)_
- `debugtofpolling` *(admin)* — Debug ToF poll cadence/capture. · `debugtofpolling <0|1>` _(setting · bool · default off)_
- `debugtofvalues` *(admin)* — Debug ToF range/object detection values. · `debugtofvalues <0|1>` _(setting · bool · default off)_
- `debuginputlifecycle` *(admin)* — Debug input abstraction layer lifecycle. · `debuginputlifecycle <0|1>` _(setting · bool · default off)_
- `debuginputpolling` *(admin)* — Debug input abstraction layer poll/dispatch. · `debuginputpolling <0|1>` _(setting · bool · default off)_
- `debuginputvalues` *(admin)* — Debug input abstraction layer event values. · `debuginputvalues <0|1>` _(setting · bool · default off)_
- `debuganoencoderlifecycle` *(admin)* — Debug ANO encoder init/connect/recovery. · `debuganoencoderlifecycle <0|1>` _(setting · bool · default off)_
- `debuganoencoderpolling` *(admin)* — Debug ANO encoder poll/encoder reads. · `debuganoencoderpolling <0|1>` _(setting · bool · default off)_
- `debuganoencodervalues` *(admin)* — Debug ANO encoder rotation/button events. · `debuganoencodervalues <0|1>` _(setting · bool · default off)_
- `debugimulifecycle` *(admin)* — Debug IMU init/connect/recovery. · `debugimulifecycle <0|1>` _(setting · bool · default off)_
- `debugimupolling` *(admin)* — Debug IMU poll cadence. · `debugimupolling <0|1>` _(setting · bool · default off)_
- `debugimuvalues` *(admin)* — Debug IMU orientation/acceleration values. · `debugimuvalues <0|1>` _(setting · bool · default off)_
- `debugapdslifecycle` *(admin)* — Debug APDS init/connect/recovery. · `debugapdslifecycle <0|1>` _(setting · bool · default off)_
- `debugapdspolling` *(admin)* — Debug APDS poll cadence. · `debugapdspolling <0|1>` _(setting · bool · default off)_
- `debugapdsvalues` *(admin)* — Debug APDS color/proximity/gesture values. · `debugapdsvalues <0|1>` _(setting · bool · default off)_
- `debuggpslifecycle` *(admin)* — Debug GPS init/connect/recovery. · `debuggpslifecycle <0|1>` _(setting · bool · default off)_
- `debuggpspolling` *(admin)* — Debug GPS poll cadence. · `debuggpspolling <0|1>` _(setting · bool · default off)_
- `debuggpsvalues` *(admin)* — Debug GPS NMEA/fix/coordinate values. · `debuggpsvalues <0|1>` _(setting · bool · default off)_
- `debugrtclifecycle` *(admin)* — Debug RTC init/connect/recovery. · `debugrtclifecycle <0|1>` _(setting · bool · default off)_
- `debugrtcpolling` *(admin)* — Debug RTC poll cadence. · `debugrtcpolling <0|1>` _(setting · bool · default off)_
- `debugrtcvalues` *(admin)* — Debug RTC time-read values. · `debugrtcvalues <0|1>` _(setting · bool · default off)_
- `debugfmradiolifecycle` *(admin)* — Debug FM radio init/tune/recovery. · `debugfmradiolifecycle <0|1>` _(setting · bool · default off)_
- `debugfmradiopolling` *(admin)* — Debug FM radio poll cadence. · `debugfmradiopolling <0|1>` _(setting · bool · default off)_
- `debugfmradiovalues` *(admin)* — Debug FM radio RDS/RSSI/state values. · `debugfmradiovalues <0|1>` _(setting · bool · default off)_
- `debugmiclifecycle` *(admin)* — Debug microphone init/start/stop. · `debugmiclifecycle <0|1>` _(setting · bool · default off)_
- `debugmicpolling` *(admin)* — Debug microphone capture cadence. · `debugmicpolling <0|1>` _(setting · bool · default off)_
- `debugmicvalues` *(admin)* — Debug microphone level/sample values. · `debugmicvalues <0|1>` _(setting · bool · default off)_
- `debugpresencelifecycle` *(admin)* — Debug presence sensor init/connect/recovery. · `debugpresencelifecycle <0|1>` _(setting · bool · default off)_
- `debugpresencepolling` *(admin)* — Debug presence sensor poll cadence. · `debugpresencepolling <0|1>` _(setting · bool · default off)_
- `debugpresencevalues` *(admin)* — Debug presence detection values. · `debugpresencevalues <0|1>` _(setting · bool · default off)_
- `debugmaps` *(admin)* — Debug maps (parent flag). · `debugmaps <0|1>` _(setting · bool · default off)_
- `debugmapsloading` *(admin)* — Debug map file loading and tile directory. · `debugmapsloading <0|1>` _(setting · bool · default off)_
- `debugmapsrendering` *(admin)* — Debug map render pipeline and feature drawing. · `debugmapsrendering <0|1>` _(setting · bool · default off)_
- `debugmapsperf` *(admin)* — Debug map performance timing (render ms, tile I/O, cache, FPS). · `debugmapsperf <0|1>` _(setting · bool · default off)_
- `debugllm` *(admin)* — Debug on-device LLM (parent flag). · `debugllm <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugllmload` *(admin)* — Debug LLM checkpoint load and validation. · `debugllmload <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugllmtokenizer` *(admin)* — Debug LLM tokenizer / BPE. · `debugllmtokenizer <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugllmforward` *(admin)* — Debug LLM transformer forward (verbose). · `debugllmforward <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugllmgenerate` *(admin)* — Debug LLM generation loop and sampling. · `debugllmgenerate <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugllmmemory` *(admin)* — Debug LLM PSRAM budget and context cap. · `debugllmmemory <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugi2c` *(admin)* — Debug I2C bus (parent flag). · `debugi2c <0|1>` _(setting · bool · default off)_
- `debugi2cbus` *(admin)* — Debug I2C bus lifecycle, polling pause/resume, status bumps. · `debugi2cbus <0|1>` _(setting · bool · default off)_
- `debugi2cdiscovery` *(admin)* — Debug I2C device probing, registry, scan results. · `debugi2cdiscovery <0|1>` _(setting · bool · default off)_
- `debugi2cautostart` *(admin)* — Debug I2C sensor auto-start orchestration + init results. · `debugi2cautostart <0|1>` _(setting · bool · default off)_
- `debugwifi` *(admin)* — Debug WiFi operations. · `debugwifi <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstorage` *(admin)* — Debug storage operations. · `debugstorage <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugperformance` *(admin)* — Debug performance metrics. · `debugperformance <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugdatetime` *(admin)* — Debug NTP/date-time (parent flag). · `debugdatetime <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugdatetimesync` *(admin)* — Debug NTP sync loop (DNS, wait, result). · `debugdatetimesync <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugdatetimesetup` *(admin)* — Debug NTP setup / configTime calls. · `debugdatetimesetup <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugdatetimeanchor` *(admin)* — Debug NTP boot anchor write/read. · `debugdatetimeanchor <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugdatetimeresolve` *(admin)* — Debug NTP timestamp resolution for users. · `debugdatetimeresolve <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugverbose` *(admin)* — Global debug verbosity override (forces all debug + loglevel=DEBUG). · `debugverbose <0|1>`
- `debugbuffer` *(admin)* — Show debug ring buffer status.
- `debugcommandflow` *(admin)* — Debug command flow. · `debugcommandflow <0|1>` _(setting · bool · default off)_
- `debugusers` *(admin)* — Debug user management. · `debugusers <0|1>` _(setting · bool · default off)_
- `debugsystem` *(admin)* — Debug system/boot operations. · `debugsystem <0|1>` _(setting · bool · default off)_
- `debugespnowstream` *(admin)* — Debug ESP-NOW streaming output. · `debugespnowstream <0|1>` _(setting · bool · default off)_
- `debugespnowcore` *(admin)* — Debug ESP-NOW core operations. · `debugespnowcore <0|1>` _(setting · bool · default off)_
- `debugespnowrouter` *(admin)* — Debug ESP-NOW router operations. · `debugespnowrouter <0|1>` _(setting · bool · default off)_
- `debugespnowmesh` *(admin)* — Debug ESP-NOW mesh operations. · `debugespnowmesh <0|1>` _(setting · bool · default off)_
- `debugespnowtopo` *(admin)* — Debug ESP-NOW topology discovery. · `debugespnowtopo <0|1>` _(setting · bool · default off)_
- `debugespnowencryption` *(admin)* — Debug ESP-NOW encryption. · `debugespnowencryption <0|1>` _(setting · bool · default off)_
- `debugespnowmetadata` *(admin)* — Debug ESP-NOW metadata exchange (REQ/RESP/PUSH). · `debugespnowmetadata <0|1>` _(setting · bool · default off)_
- `debugautoscheduler` *(admin)* — Debug automations scheduler. · `debugautoscheduler <0|1>` _(setting · bool · default off)_
- `debugautoexec` *(admin)* — Debug automations execution. · `debugautoexec <0|1>` _(setting · bool · default off)_
- `debugautocondition` *(admin)* — Debug automations conditions. · `debugautocondition <0|1>` _(setting · bool · default off)_
- `debugautotiming` *(admin)* — Debug automations timing. · `debugautotiming <0|1>` _(setting · bool · default off)_
- `debugmemory` *(admin)* — Debug memory (parent flag). · `debugmemory <0|1>` _(setting · bool · default off)_
- `loglink` *(admin)* — Route ESP-IDF logs through the unified output queue (stops UART interleave). · `loglink <0|1>`
- `debugmemoryheap` *(admin)* — Debug per-task heap (free/min/largest), DRAM low watermark. · `debugmemoryheap <0|1>` _(setting · bool · default off)_
- `debugmemorystack` *(admin)* — Debug per-task stack watermarks + peak reports. · `debugmemorystack <0|1>` _(setting · bool · default off)_
- `debugmemorybuffers` *(admin)* — Debug response/cookie buffer sizing diagnostics. · `debugmemorybuffers <0|1>` _(setting · bool · default off)_
- `debugmqtt` *(admin)* — Debug MQTT (parent flag). · `debugmqtt <0|1> [temp|runtime]`
- `debugmqttconnection` *(admin)* — Debug MQTT connect/disconnect/TLS/init. · `debugmqttconnection <0|1>` _(setting · bool · default off)_
- `debugmqttpubsub` *(admin)* — Debug MQTT publish/subscribe + received messages. · `debugmqttpubsub <0|1>` _(setting · bool · default off)_
- `debugmqttdiscovery` *(admin)* — Debug MQTT Home Assistant auto-discovery. · `debugmqttdiscovery <0|1>` _(setting · bool · default off)_
- `debugmqttcommands` *(admin)* — Debug MQTT inbound commands + auth. · `debugmqttcommands <0|1>` _(setting · bool · default off)_
- `debugauthsessions` *(admin)* — Debug auth sessions. · `debugauthsessions <0|1>` _(setting · bool · default off)_
- `debugauthcookies` *(admin)* — Debug auth cookies. · `debugauthcookies <0|1>` _(setting · bool · default off)_
- `debugauthlogin` *(admin)* — Debug auth login. · `debugauthlogin <0|1>` _(setting · bool · default off)_
- `debugauthbootid` *(admin)* — Debug auth boot ID. · `debugauthbootid <0|1>` _(setting · bool · default off)_
- `debughttphandlers` *(admin)* — Debug HTTP handlers. · `debughttphandlers <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debughttprequests` *(admin)* — Debug HTTP requests. · `debughttprequests <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debughttpresponses` *(admin)* — Debug HTTP responses. · `debughttpresponses <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debughttpstreaming` *(admin)* — Debug HTTP streaming. · `debughttpstreaming <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugwificonnection` *(admin)* — Debug WiFi connection. · `debugwificonnection <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugwificonfig` *(admin)* — Debug WiFi config. · `debugwificonfig <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugwifiscanning` *(admin)* — Debug WiFi scanning. · `debugwifiscanning <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugwifidriver` *(admin)* — Debug WiFi driver. · `debugwifidriver <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstoragefiles` *(admin)* — Debug storage files. · `debugstoragefiles <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstoragejson` *(admin)* — Debug storage JSON. · `debugstoragejson <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstoragesettings` *(admin)* — Debug storage settings. · `debugstoragesettings <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstoragemigration` *(admin)* — Debug storage migration. · `debugstoragemigration <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstoragepermissions` *(admin)* — Debug storage [PERM] DENY audit. · `debugstoragepermissions <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugstack` *(admin)* — Low-level stack/heap trace to Serial: <on|off>. · `debugstack <0|1|on|off>`
- `debugsystemboot` *(admin)* — Debug system boot. · `debugsystemboot <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsystemconfig` *(admin)* — Debug system config. · `debugsystemconfig <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsystemtasks` *(admin)* — Debug system tasks. · `debugsystemtasks <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsystemhardware` *(admin)* — Debug system hardware. · `debugsystemhardware <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugusersmgmt` *(admin)* — Debug users management. · `debugusersmgmt <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugusersregister` *(admin)* — Debug users registration. · `debugusersregister <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugusersquery` *(admin)* — Debug users query. · `debugusersquery <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcliexecution` *(admin)* — Debug CLI execution. · `debugcliexecution <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcliqueue` *(admin)* — Debug CLI queue. · `debugcliqueue <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugclivalidation` *(admin)* — Debug CLI validation. · `debugclivalidation <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugperfstack` *(admin)* — Debug performance stack. · `debugperfstack <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugperfheap` *(admin)* — Debug performance heap. · `debugperfheap <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugperftiming` *(admin)* — Debug performance timing. · `debugperftiming <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsseconnection` *(admin)* — Debug SSE connection. · `debugsseconnection <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsseevents` *(admin)* — Debug SSE events. · `debugsseevents <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugssebroadcast` *(admin)* — Debug SSE broadcast. · `debugssebroadcast <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcmdflowrouting` *(admin)* — Debug command flow routing. · `debugcmdflowrouting <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcmdflowqueue` *(admin)* — Debug command flow queue. · `debugcmdflowqueue <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcmdflowcontext` *(admin)* — Debug command flow context. · `debugcmdflowcontext <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugcommandsystem` *(admin)* — Debug modular command registry operations. · `debugcommandsystem <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugautomations` *(admin)* — Debug automations scheduler and actions. · `debugautomations <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debuglogger` *(admin)* — Debug sensor logger internals. · `debuglogger <0|1> [temp|runtime]` _(setting · bool · default off)_
- `commandmodulesummary` *(admin)* — Show command module summary.
- `settingsmodulesummary` *(admin)* — Show settings module summary.
- `outdisplay` *(admin)* — Enable/disable display output. · `outdisplay <0|1> [persist|temp]` _(setting · bool · default off)_
- `outg2` — Enable/disable G2 glasses output. · `outg2 <0|1> - streams CLI output to G2 glasses` _(setting · bool · default off)_
- `debugg2` *(admin)* — Debug G2 smart glasses BLE operations. · `debugg2 <0|1>` _(setting · bool · default off)_
- `debugg2lifecycle` *(admin)* — Debug G2 BLE lifecycle (scan/connect/MTU). · `debugg2lifecycle <0|1>` _(setting · bool · default off)_
- `debugg2protocol` *(admin)* — Debug G2 envelope TX/RX, CRC, fragmentation. · `debugg2protocol <0|1>` _(setting · bool · default off)_
- `debugg2events` *(admin)* — Debug G2 DevEvents/SysEvents/gestures. · `debugg2events <0|1>` _(setting · bool · default off)_
- `debugg2pages` *(admin)* — Debug G2 page-swap worker / hijack / lens state. · `debugg2pages <0|1>` _(setting · bool · default off)_
- `debugg2heartbeat` *(admin)* — Debug G2 heartbeat TX + acks (loud). · `debugg2heartbeat <0|1>` _(setting · bool · default off)_
- `debugg2dump` *(admin)* — Debug G2 ring-buffer dumps on errors. · `debugg2dump <0|1>` _(setting · bool · default off)_
- `outble` — Enable/disable BLE broadcast output. · `outble <0|1> - streams broadcast output to authenticated BLE clients`
- `debugsr` *(admin)* — Debug ESP-SR speech recognition (parent flag). · `debugsr <0|1> [temp|runtime]` _(setting · bool · default off)_
- `debugsrwake` *(admin)* — Debug SR wake word detection events. · `debugsrwake <0|1>` _(setting · bool · default off)_
- `debugsrcommand` *(admin)* — Debug SR MultiNet command recognition. · `debugsrcommand <0|1>` _(setting · bool · default off)_
- `debugsrafe` *(admin)* — Debug SR AFE chain (VAD/noise/gain). · `debugsrafe <0|1>` _(setting · bool · default off)_
- `debugsrlifecycle` *(admin)* — Debug SR init/start/stop verbose. · `debugsrlifecycle <0|1>` _(setting · bool · default off)_
- `debugsrtuning` *(admin)* — Debug SR auto-tune sweeps + threshold. · `debugsrtuning <0|1>` _(setting · bool · default off)_
- `debugfmradio` *(admin)* — Debug FM Radio operations. · `debugfmradio <0|1>` _(setting · bool · default off)_
- `memorysampleintervalsec` *(admin)* — Set memory sampling interval in seconds (0=disabled). · `memorysampleintervalsec <0-300>` _(setting · int 0–300 · default 30)_
- `loglevel` *(admin)* — Set log level (error|warn|info|debug). · `loglevel <error|warn|info|debug>` _(setting · enum · default 3 (debug) · options 0=error, 1=warn, 2=info, 3=debug)_
- `log` — System-wide logging to file. · `log <start|stop|status> start ["filepath"] [flags=0xXXXX] [tags=0|1]: Begin system logging filepath: Log file path, quoted (auto-generated if omitted) flags: Debug flags to enable (e.g., flags=0x0203)`
- `webconsole` *(admin)* — Enable/disable browser-side debug console output in the web UI. · `webconsole <0|1>` _(setting · bool · default off)_

### `settings` — Device configuration and preferences

_Always compiled._

- `controls` — Per-module control descriptor (JSON): controls json [module] · `controls json <module> (e.g. 'controls json imu'); 'controls json' lists modules`
- `wifitxpower` *(admin)* — Set WiFi TX power: <dBm> · `wifitxpower <dBm>`
- `wifiautoreconnect` *(admin)* — WiFi auto-reconnect: <0|1> · `wifiautoreconnect <0|1>` _(setting · bool · default on)_
- `ntpserver` *(admin)* — Set NTP server: <hostname> · `ntpserver <host>` _(setting · string · default "pool.ntp.org")_
- `tzoffsetminutes` *(admin)* — Set timezone offset: <-720..720> · `tzoffsetminutes <-720..720>` _(setting · enum · default 0 (UTC+0 (London/GMT · Dublin)) · options -720=UTC-12 (Baker Island), -660=UTC-11 (Samoa), -600=UTC-10 (Hawaii/HST), -540=UTC-9 (Alaska/AKST), -480=UTC-8 (Pacific/PST), -420=UTC-7 (Mountain/MST · Pacific/PDT), -360=UTC-6 (Central/CST · Mountain/MDT), -300=UTC-5 (Eastern/EST · Central/CDT), -240=UTC-4 (Atlantic/AST · Eastern/EDT), -180=UTC-3 (Argentina · Atlantic/ADT), -120=UTC-2 (Mid-Atlantic), -60=UTC-1 (Azores), 0=UTC+0 (London/GMT · Dublin), 60=UTC+1 (Berlin/Paris/CET · London/BST), 120=UTC+2 (Cairo/Athens/EET · Paris/CEST), 180=UTC+3 (Moscow/Baghdad), 240=UTC+4 (Dubai/Baku), 300=UTC+5 (Karachi/Tashkent), 330=UTC+5:30 (Mumbai/Delhi/IST), 360=UTC+6 (Dhaka/Almaty), 420=UTC+7 (Bangkok/Jakarta), 480=UTC+8 (Beijing/Singapore), 540=UTC+9 (Tokyo/Seoul/JST), 570=UTC+9:30 (Adelaide/ACST), 600=UTC+10 (Sydney/AEST), 660=UTC+11 (Solomon Islands), 720=UTC+12 (Fiji/Auckland/NZST))_
- `espnowenabled` *(admin)* — Enable/disable ESP-NOW: <0|1> (reboot required) · `espnowenabled <0|1>`
- `httpAutoStart` *(admin)* — Auto-start HTTP server at boot: <0|1> · `httpAutoStart <0|1>` _(setting · bool · default on)_
- `httpsEnabled` *(admin)* — Enable/disable HTTPS: <0|1> (reboot required) · `httpsEnabled <0|1>` _(setting · bool · default off)_
- `webclihistorysize` *(admin)* — Set web CLI history size: <1..100> · `webclihistorysize <1..100>` _(setting · int 1–100 · default 10)_
- `oledclihistorysize` *(admin)* — Set OLED CLI history size: <10..100> · `oledclihistorysize <10..100>` _(setting · int 10–100 · default 50)_
- `outserial` *(admin)* — Set serial output: <0|1> [persist|temp] · `outserial <0|1> [persist|temp]` _(setting · bool · default on)_
- `outweb` *(admin)* — Set web output: <0|1> [persist|temp] · `outweb <0|1> [persist|temp]` _(setting · bool · default on)_
- `serialrequireauth` *(admin)* — Require auth for serial: <0|1> · `serialrequireauth <0|1>` _(setting · bool · default on)_
- `displayrequireauth` *(admin)* — Require auth for display: <0|1> · `displayrequireauth <0|1>` _(setting · bool · default on)_
- `beginwrite` *(admin)* — Start a batch settings update — defers flash write until savesettings.
- `savesettings` *(admin)* — Flush deferred settings to flash (single write).

### `sensorlog` — Sensor data logging to files

_Always compiled._

- `sensorlog` — Sensor data logging: start, stop, status, format, maxsize, rotations, sensors · `sensorlog <start|stop|status|format|maxsize|rotations|sensors> [args...] start <filepath> [interval_ms]: Begin logging (default 5000ms) stop: Stop logging status: Show current logging status format <text|csv|track>: Set log format (default: text) track = GPS-only compact format with signal loss dedup maxsize <bytes>: Set max file size before rotation (default: 256000) rotations <count>: Set number of old logs to keep (0-9, default: 3) sensors <thermal|tof|imu|gamepad|apds|gps|presence|all|none>: Select sensors to log`

### `users` — User authentication and management

_Always compiled._

- `login` — Login: <user> <pass> [transport] · `login <username> <password> [transport] Transport: serial (default), display, bluetooth`
- `logout` — Logout [transport] · `logout [transport] Transport: serial (default), display, bluetooth, g2`
- `serialrequireauth` *(admin)* — Enable/disable serial auth requirement [on|off]. · `serialrequireauth [on|off]`
- `userapprove` *(admin)* — Approve pending request: <username> · `userapprove <username>`
- `userdeny` *(admin)* — Deny pending request: <username> · `userdeny <username>`
- `userpromote` *(admin)* — Promote to admin: <username> · `userpromote <username>`
- `userdemote` *(admin)* — Demote from admin: <username> · `userdemote <username>`
- `userdelete` *(admin)* — Delete user: <username> · `userdelete <username>`
- `userchangepassword` — Change own password: <currentPass> <newPass> <confirmPass> · `userchangepassword <currentPassword> <newPassword> <confirmPassword>`
- `userresetpassword` *(admin)* — Reset user password: <username> <newPassword> [0|1] · `userresetpassword <username> <newPassword> [0|1] Optional: 1 = require password change on next login`
- `useradd` *(admin)* — Create user: <username> <password> [0|1] · `useradd <username> <password> [0|1] Optional: 1 = require new password on next login, 0 = omit`
- `userlist` *(admin)* — List all users.
- `userrequest` — Request account: <user> <pass> [confirm] · `userrequest <username> <password> [confirmPassword]`
- `usersync` *(admin)* — Sync a user to another device over ESP-NOW. · `usersync <username> <userPass> <device> <targetAdminUser> <targetAdminPass> <yourAdminPass> targetAdminUser/targetAdminPass = an admin account on the RECEIVING device (validated there). yourAdminPass = your admin password on THIS device; userPass = the synced user's password.`
- `pendinglist` *(admin)* — List pending user requests.
- `sessionlist` *(admin)* — List active sessions.
- `sessionrevoke` *(admin)* — Revoke session: <sid|user> [reason] · `sessionrevoke sid <sid> [reason] sessionrevoke user <username> [reason]`
- `ban` *(admin)* — Permanently ban an IP: <ip> [reason] · `ban <ip> [reason] Blocks all access from the IP until manually unbanned.`
- `unban` *(admin)* — Remove an IP ban: <ip> · `unban <ip>`
- `banlist` *(admin)* — List all banned IPs.
- `banuser` *(admin)* — Permanently ban a user account: <username> [reason] · `banuser <username> [reason] Prevents the account from logging in until manually unbanned.`
- `unbanuser` *(admin)* — Remove a user account ban: <username> · `unbanuser <username>`

### `features` — System feature management

_Always compiled._

- `features` — Show/toggle system features with heap estimates. · `features - List all features features <id> - Show feature details features <id> <on|off> - Enable/disable feature`
- `featuresetup` *(admin)* — Run the interactive feature configuration wizard. · `featuresetup - Launch the feature toggle wizard (serial + OLED)`

### `image` — Image capture and management

_Requires `ENABLE_CAMERA_SENSOR`._

- `capture` — Capture and save image: capture [littlefs|sd|both] · `capture [littlefs|lfs|sd|both]`
- `images` — List saved images: images [littlefs|sd] · `images [sd] [json]`
- `imagedelete` *(admin)* — Delete image: imagedelete "<path>" · `imagedelete "<path>"`
- `imagesend` — Send image via ESP-NOW: imagesend <device> ["<path>"] · `imagesend <device> ["<path>"]`

### `map` — Map navigation and waypoints

_Requires `ENABLE_MAPS`._

- `map` — Show current map info
- `mapload` — Load map file: "<path>" · `mapload "<path>"`
- `mapunload` — Unload current map (free PSRAM on device)
- `maplist` — List available maps
- `whereami` — Show current location context
- `search` — Search map features: <name> · `search <name>`
- `waypoint` — Manage waypoints: <list|add|del|goto|clear|clearall|rename|notes> · `waypoint [list|add <lat> <lon> [name]|del <index>|goto <index>|clear|clearall|rename <index> <name>|notes <index> <notes>]`
- `gpstrack` — Manage GPS tracks: <status|load|clear> · `gpstrack [status|load <filepath>|clear]`
- `waypointfile` — Link file to waypoint: "<file>" <wpName> · `waypointfile "<file>" <wpName> | waypointfile "<file>" <lat> <lon> [wpName]`
- `waypointfiles` — Waypoint files: <name> [del <idx>] · `waypointfiles <wpName> [del <index>]`
- `maporganize` — Organize map files in /maps into subdirectories

### `mapsettings` — Maps app settings (zoom, layers, cache)

_Requires `ENABLE_MAPS`._

- `mapzoom` *(admin)* — Set default map zoom: <0.5..20.0> · `mapzoom <0.5..20.0>` _(setting · float · default 1.0)_
- `maplayers` *(admin)* — Set visible layer bitmask: <0..1023> · `maplayers <bitmask 0..1023>` _(setting · int 0–0x3FF · default 0x3FF)_
- `mapcachekb` *(admin)* — Set tile cache size in KB (reboot to apply) · `mapcachekb <256..4096>` _(setting · int 256–4096 · default 1024)_

### `power` — Power management

_Always compiled._

- `power` — Power management [mode] [auto] [threshold] · `power [mode <0-3>] [auto <on|off>] [threshold <percent>]`
- `powercooldown` — Sleep transition cooldown (ms; 0 disables) · `powercooldown <0..60000>` _(setting · int 0–60000 · default 5000)_
- `powersave` — Idle power-save: OLED off + downclock (0 disables) · `powersave <0..1440>` _(setting · int 0–1440 · default 10)_

### `setpattern` — OLED gamepad password entry

_Requires `ENABLE_OLED_DISPLAY`._

- `setgamepadpassword` *(admin)* — Set gamepad joystick password (OLED).

### `even_g2` — Even G2 smart glasses control

_Requires `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES`._

- `openg2` — Connect to G2 glasses: openg2 [left|right|auto] · `openg2 [left|right|auto] (default auto)`
- `closeg2` — Disconnect G2 glasses [full=also free ~30KB GATT cache]. · `closeg2 [full]`
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
- `g2aih` — Front-pane card with custom heading: g2aih <heading>|<body> · `g2aih <heading>|<body> (no | = whole text as body)`
- `g2aiconfig` — Probe EvenAI CONFIG (cmd=10): g2aiconfig [voiceSwitch] [streamSpeed], use - to omit · `g2aiconfig [voiceSwitch] [streamSpeed] (use - to omit a field; bare = empty body)`
- `g2imgprobe` — Probe Cmd=3 multi-frag wire path: g2imgprobe [size_bytes] · `g2imgprobe [size_bytes] (1..4096, default 1024)`
- `g2micon` — G2 mic probe: AudioCtrCmd{en=1} on LEFT (or 'r' for RIGHT) · `g2micon [r] (default LEFT; arg starting r = RIGHT)`
- `g2micoff` — G2 mic probe: AudioCtrCmd{en=0} (stop stream)
- `g2micstats` — G2 mic probe: dump per-arm frame counters
- `g2micreset` — G2 mic probe: zero per-arm counters
- `g2micverbose` — G2 mic probe: per-frame log [on|off] · `g2micverbose [<on|off>] (bare = toggle)`
- `g2micrec` — G2 mic dump: g2micrec start ["path"] | stop | status — writes raw 205B LC3 packets to SD · `g2micrec start ["path"] | stop | status (bare = status)`
- `g2micwav` — G2 mic decode: g2micwav start ["path"] | stop | status — decodes LC3 → 16k mono WAV on SD · `g2micwav start ["path"] | stop | status (bare = status)`
- `g2protostats` — Show G2 protocol stats per sid: g2protostats [verbose] · `g2protostats [verbose]`
- `g2probe` — Fire arbitrary pb cmd: g2probe <sid_hex> <cmd_dec> [body_hex] · `g2probe <sid_hex> <cmd_dec> [body_hex] (sid=0x80 blocked)`
- `g2devcfg` — Typed sid=0x80 sender: g2devcfg <heartbeat|auth|role|time|ring> [args] · `g2devcfg <heartbeat|auth|role <both|right|left>|time [tzQuarterHours]|ring <mac> <name>>`
- `g2notify` — Transient text (placeholder): g2notify [secs] <text> · `g2notify [<seconds>] <text> (seconds 1..599, default 5)`
- `g2bmp` — Display BMP: g2bmp </path.bmp> [brightness -100..100] [contrast -100..100] [holdSeconds 0..120] · `g2bmp </path/to/file.bmp> [brightness -100..100] [contrast -100..100] [holdSeconds 0..120]`
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
- `g2streamtonemap` — Lens stream auto-levels: g2streamtonemap [on|off] (bare = report state) · `g2streamtonemap [<on|off>] (bare = report state)` _(setting · bool · default on)_
- `g2packrate` — SD-pack animation cadence: g2packrate [<ms>] (range 20..2000, default 80) · `g2packrate [<ms>] (20..2000; bare = report)` _(setting · int 20–2000 · default 80)_
- `g2battery` — Query G2 battery % on connected temples
- `g2mic` — Enable/disable G2 mic capture: g2mic <on|off> · `g2mic <on|off>`
- `g2verbose` — Scan-verbose logging: g2verbose [on|off|toggle] (bare = report state) · `g2verbose [on|off|toggle] (bare = report state)`
- `g2hijacktest` — Simulate a Blocks tap (status-page hijack)
- `g2reopen` — Re-open the hijacked Blocks app after an abnormal exit
- `g2dumpframes` — Print the recent G2 envelope ring buffer
- `g2recover` — Try to reconnect a missing G2 temple without tearing down the connected one

### `even_r1` — Even R1 ring control (info-only)

_Requires `ENABLE_BLUETOOTH && ENABLE_G2_GLASSES`._

- `ringstatus` — Show R1 ring connection status
- `ringscan` — Scan for the R1 ring: ringscan [seconds] (default 30, max 300) · `ringscan [seconds] (1..300, default 30)`
- `ringconnect` — Connect to the R1 ring: ringconnect [mac] (auto-scans if no mac; bypasses scan with mac) · `ringconnect [mac] (no mac = scan-then-connect; mac = direct connect, no scan)`
- `ringdisconnect` — Disconnect from the R1 ring
- `ringverbose` — Toggle full hex dump of ring notify frames · `ringverbose [<on|off>] (bare = toggle)`
- `ringquery` — Send an R1 health/status request: ringquery <wear|health|hr|hrv|spo2|temp|activity|sleep|report|raw> [type] [hex_payload] · `ringquery <wear|health|hr|hrv|spo2|temp|activity|sleep|report|raw> [args] | <hr|hrv|spo2|temp|activity|sleep> [daily|point|measure] | report <on|off|0xNN> | raw <module> <cmd> <subCmd> [hex_payload] [status=NN]`

### `llm` — On-device LLM text generation

_Requires `ENABLE_ONDEVICE_LLM`._

- `llmstatus` — Show LLM engine status
- `llmload` *(admin)* — Load model [model.bin] · `llmload [filename.bin]`
- `llmunload` *(admin)* — Unload model and free PSRAM
- `llmautostart` *(admin)* — Auto-load default model at boot (0|1) · `llmautostart <0|1>` _(setting · bool · default off)_
- `llmmodels` — List available model files
- `llmgenerate` — Generate text from prompt · `llmgenerate <prompt text>`
- `llmresult` — Poll streamed generation (JSON) · `llmresult json <offset>`
- `llmstop` — Stop in-progress generation
- `llmcorrupttest` *(admin)* — Debug: force corruption-recovery test
- `llmclear` — Reset the LLM conversation
- `llmretry` — Regenerate the last reply (JSON)
- `llmturns` — Read a conversation turn (JSON) · `llmturns json <index>`
- `llmtemperature` *(admin)* — Set default sampling temperature · `llmtemperature <0.0-2.0>` _(setting · float · default 0.5)_
- `llmtopp` *(admin)* — Set default Top-P threshold · `llmtopp <0.0-1.0>` _(setting · float · default 0.8)_
- `llmmaxtokens` *(admin)* — Set default max tokens per reply · `llmmaxtokens <1-512>` _(setting · int 1–512 · default 256)_
- `llmsentencelimit` *(admin)* — Set default sentence stop limit · `llmsentencelimit <0-20>` _(setting · int 0–20 · default 2)_
- `llmhardcap` *(admin)* — Set default hard token cap · `llmhardcap <0-512>` _(setting · int 0–512 · default 80)_
- `llmreppenalty` *(admin)* — Set default repetition penalty · `llmreppenalty <1.0-3.0>` _(setting · float · default 1.3)_
- `llmrepwindow` *(admin)* — Set default rep-penalty look-back · `llmrepwindow <1-128>` _(setting · int 1–128 · default 32)_
- `llmmaxcontext` *(admin)* — Set KV cache context window (0=auto) · `llmmaxcontext <0-4096>` _(setting · int 0–4096 · default 0)_
- `llmusemirostat2` *(admin)* — Enable/disable Mirostat 2 sampling · `llmusemirostat2 <0|1>` _(setting · bool · default off)_
- `llmmirostattau` *(admin)* — Set Mirostat target surprise (bits) · `llmmirostattau <1-10>` _(setting · float · default 5.0)_
- `llmmirostateta` *(admin)* — Set Mirostat learning rate · `llmmirostateta <0.01-0.5>` _(setting · float · default 0.1)_
- `llmdyntemp` *(admin)* — Enable/disable dynamic temperature · `llmdyntemp <0|1>` _(setting · bool · default off)_
- `llmdefaultmodel` *(admin)* — Set default model filename · `llmdefaultmodel <filename.bin>` _(setting · string · default "model.bin")_
- `llmminp` *(admin)* — Set min-p sampling floor (0=off) · `llmminp <0.0-1.0>` _(setting · float · default 0.0)_
- `llmkvprec` *(admin)* — KV cache precision (0=FP32,1=FP16,2=INT8) · `llmkvprec <0..2> (0=FP32,1=FP16,2=INT8; reload model to apply)` _(setting · enum · default 0 (FP32) · options 0=FP32, 1=FP16, 2=INT8)_
