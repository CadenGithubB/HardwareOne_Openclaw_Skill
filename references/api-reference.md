# HardwareOne API and CLI Reference

**This is a custom embedded CLI on an ESP32 microcontroller, NOT a Linux/Unix shell.**
Standard commands like `ls`, `cd`, `cat`, `dir`, `ps`, `rm`, `cp`, `mv`, `df`, `mount`, `grep`, `find`, `echo`, `sysinfo`, `ifconfig`, `ping` DO NOT EXIST.
Every valid command is listed below. If a command is not in this file, it does not exist on this device.

## Quick Index — every command grouped by module

**System:** status, uptime, time, timeset(admin), reboot(admin), temperature, voltage, cpufreq(admin), memsample, memreport, taskstats, broadcast(admin), wait, lightsleep(admin), fsusage
**WiFi:** openwifi, closewifi, wifistatus, wifiscan, wifilist, wifiadd(admin), wifirm(admin), wifipromote(admin), ntpsync
**HTTP Server:** openhttp, closehttp, httpstatus, certinfo, certgen(admin)
**Filesystem:** files(admin), mkdir(admin), rmdir(admin), filecreate(admin), fileview(admin), filedelete(admin), filerename(admin)
**SD Card:** sdmount, sdunmount, sdformat(admin), sdinfo, sddiag
**Users:** login, logout, useradd(admin), userdel(admin), userlist(admin), userpromote(admin), userdemote(admin), sessionlist(admin), pendinglist(admin)
**Sensors — pattern:** open<sensor>, <sensor>read, close<sensor>, <sensor>autostart
**Thermal:** openthermal, closethermal, thermalread, thermalautostart, thermaldiag, thermalpollingms, thermalpalettedefault, thermalrotation, thermalinterpolationenabled, thermalinterpolationsteps, thermalupscalefactor, thermaltargetfps, thermaldevicepollms, thermaltemporalalpha, thermalewmafactor
**IMU:** openimu, closeimu, imuread, imumode, imucalibrate, imuautostart, imupollingms, imustreamrate, imustreamduration
**ToF:** opentof, closetof, tofread, tofautostart, tofpollingms, tofcalibrate
**GPS:** opengps, closegps, gpsread, gpsautostart
**APDS:** openapds, closeapds, apdscolor, apdsprox, apdsgesture
**Presence:** openpresence, closepresence, presenceread, presenceautostart
**RTC:** openrtc, closertc, rtcread, rtcset(admin)
**Camera:** opencamera, closecamera, cameraread, cameracapture, cameraresolution, cameraquality, cameraeffect, cameraexposure, cameraflash
**Microphone:** openmic, closemic, micread, miclevel, micrecord, micsamplerate
**FM Radio:** openfm, closefm, fmread, fmseek, fmfreq, fmvolume, fmband, fmstereo
**Servo/PWM:** openservo, closeservo, servoangle, servosweep, servolist
**Gamepad:** opengamepad, closegamepad, gamepadread
**OLED:** openoled, closeoled, oledwrite, oledclear, oledbright
**I2C Bus:** i2cscan, i2cread, i2cwrite, i2cdetect, i2chealth
**ESP-NOW:** espnowstart, espnowstop, espnowstatus, espnowpeer, espnowsend, espnowremote, espnowscan, espnowping
**Bonding:** bondmaster, bondworker, bondstatus, bondpeer, bondkick, bondbreak
**MQTT:** openmqtt, closemqtt, mqttstatus, mqttpublish, mqttsubscribe, mqttunsubscribe, mqttdiscover
**Automations:** automation (subcommands: add, list, enable, disable, delete, run, status)
**LLM:** llm (subcommands: enable, disable, prompt, status, model, config)
**LED/NeoPixel:** ledcolor, ledeffect, ledclear, ledon, ledoff, ledbright, ledstartupeffect(admin)
**Bluetooth:** blescan, bleconnect, bledisconnect, blestatus
**Sensor Logging:** sensorlog (subcommands: start, stop, list, delete, config)
**Maps:** mapload, mapsave, maplist, mapdelete, mapwaypoint, maptrack
**Images:** imagecapture, imagelist, imagedelete, imagesend
**Power:** batterystatus, batterycalibrate(admin)
**Settings:** set(admin), settingslist, settingsreset(admin)
**Debug:** debug (flag commands for all subsystems)
**CLI Navigation:** help, back, exit, clear
**Features:** features, featuresetup(admin)

## Feature → Command Mapping

**Not all commands exist on every device.** Run `features` first. If a feature shows `[N/C]` (not compiled), ALL commands in that group will return "Unknown command" — do not attempt them.

| Feature ID    | Commands (only exist if feature is `[ON]` or `[OFF]`) |
|---------------|-------------------------------------------------------|
| `wifi`        | openwifi, closewifi, wifistatus, wifiscan, wifilist, wifiadd, wifirm, wifipromote, ntpsync |
| `http`        | openhttp, closehttp, httpstatus, certinfo, certgen |
| `bluetooth`   | openble, closeble, blestatus, bleinfo, blename, blesend, blestream |
| `espnow`      | openespnow, closeespnow, espnowstatus, espnowlist, espnowpair, espnowsend, espnowbroadcast, espnowremote, + all mesh/bonding commands |
| `mqtt`        | openmqtt, closemqtt, mqttstatus, mqttHost, mqttPort, mqttPublish*, mqttSubscribe* |
| `oled`        | openoled, closeoled, oledstatus, oledtext, oledclear, oledbrightness, oledmode |
| `led`         | ledcolor, ledeffect, ledbrightness, ledstartupenabled, ledstartupeffect |
| `i2c`         | i2cscan, i2creset, i2cpause, i2cresume, i2chealth, i2cmetrics, sensors, devices, discover |
| `thermal`     | openthermal, closethermal, thermalread, thermalautostart, thermaldiag, + all thermal* settings |
| `tof`         | opentof, closetof, tofread, tofautostart, + all tof* settings |
| `imu`         | openimu, closeimu, imuread, imuautostart, imucalibrate, + all imu* settings |
| `gps`         | opengps, closegps, gpsread, gpsautostart, gpslog |
| `apds`        | openapds, closeapds, apdsread, apdsmode, apdscolor, apdsproximity, apdsgesture |
| `rtc`         | openrtc, closertc, rtcread, rtcset, rtcsync |
| `presence`    | openpresence, closepresence, presenceread, presenceautostart |
| `camera`      | opencamera, closecamera, cameraread, cameracapture, camerasave, + all camera* settings |
| `microphone`  | openmic, closemic, micread, miclevel, micrecord, miclist, + all mic* settings |
| `fmradio`     | openfmradio, closefmradio, fmradioread, fmradiotune, fmradioseek, fmradiovolume |
| `gamepad`     | opengamepad, closegamepad, gamepadread |
| `espsr`       | Speech recognition commands (requires microphone) |
| `edgeimpulse` | ML inference commands (requires camera) |
| `automation`  | automation, automationlist, automationadd, automationrun, autolog, validate-conditions |

**Always available** (no feature flag): status, uptime, time, temperature, voltage, memsample, memreport, taskstats, fsusage, features, help, login, logout

## HTTP API Endpoints

Use `bash {baseDir}/scripts/hw1.sh --get <path>` for authenticated GET requests.

**Note:** API endpoints for features showing `[N/C]` will return 404. Only endpoints for compiled features are registered.

### Health and System
- `GET /api/ping` -- Health check
- `GET /api/system` -- System status (CPU, memory, uptime)

### Sensors
- `GET /api/sensors` -- All current sensor data
- `GET /api/sensors/status` -- Sensor operational status (supports SSE)
- `GET /api/sensors/remote` -- Sensor data from bonded worker devices

### Files
- `GET /api/files/list?path=/` -- List directory contents
- `GET /api/files/read?path=/file.txt` -- Read file content

### ESP-NOW and Bonding
- `GET /api/espnow/metadata` -- Peer metadata
- `GET /api/espnow/remotecap` -- Remote device capabilities
- `GET /api/bond/status` -- Bonding status (master/worker roles)

### Other
- `GET /api/automations` -- List automations

---

## CLI Command Reference

All CLI commands are executed via `bash {baseDir}/scripts/hw1.sh "<command>"`, which POSTs to `/api/cli`.

### Core -- System

```
status                          - System status (WiFi, FS, memory)
uptime                          - Device uptime
time                            - Current time (uptime + NTP)
timeset <YYYY-MM-DD HH:MM:SS>  - Set time (or unix timestamp)
reboot                          - Restart device
temperature                     - ESP32 internal temperature
voltage                         - Supply voltage
cpufreq                         - Get/set CPU frequency
memsample                       - Memory snapshot with component breakdown
memreport                       - Comprehensive memory report
taskstats                       - FreeRTOS task statistics
broadcast <message>             - Send message to all users (admin)
wait <ms>                       - Delay execution
lightsleep [seconds]            - Enter light sleep (default 20s)
```

### WiFi -- Network

```
openwifi [ssid]                 - Connect to WiFi
closewifi                       - Disconnect
wifistatus                      - Connection info
wifiscan                        - Scan for APs
wifilist                        - List saved networks
wifiadd <ssid> <pass> [priority] [hidden]  - Save a network
wifirm <ssid>                   - Remove saved network
wifipromote <ssid>              - Promote to top priority
ntpsync                         - Sync time from NTP
```

### HTTP Server

```
openhttp                        - Start HTTP/HTTPS server
closehttp                       - Stop server
httpstatus                      - Server status and IP
certinfo                        - HTTPS certificate details
certgen [rsa]                   - Generate self-signed cert (default: ECDSA P-256)
```

### Sensors -- I2C

Pattern: `open<sensor>` to enable, `<sensor>read` to read, `close<sensor>` to disable.

#### Thermal Camera (MLX90640)
```
openthermal                     - Start thermal sensor
closethermal                    - Stop thermal sensor
thermalread                     - Read min/max/avg temperature
thermalautostart [on|off]       - Auto-start on boot
thermaldiag                     - Run diagnostics
thermalpollingms <50-5000>      - UI polling interval
thermalpalettedefault <name>    - Palette: grayscale|iron|rainbow|hot|coolwarm
thermalrotation <0-3>           - Rotate image (0/90/180/270)
thermalinterpolationenabled <0|1>
thermalinterpolationsteps <1-8>
thermalupscalefactor <1-4>
thermaltargetfps <1-8>
thermaldevicepollms <100-2000>  - Hardware poll interval
thermaltemporalalpha <0.0-1.0>  - Temporal smoothing
thermalewmafactor <0.0-1.0>    - EWMA smoothing
```

#### IMU (BNO055 9-DoF)
```
openimu                         - Start IMU
closeimu                        - Stop IMU
imuread                         - Read orientation data
imuautostart [on|off]           - Auto-start on boot
imuactions                      - Action detection (tap, shake)
imupollingms <50-2000>          - UI polling interval
imudevicepollms <50-1000>       - Hardware poll interval
imuorientationmode <0-8>
imuorientationcorrection <0|1>
imupitchoffset <-180..180>
imurolloffset <-180..180>
imuyawoffset <-180..180>
imuewmafactor <0.0-1.0>
```

#### Time-of-Flight (VL53L4CX)
```
opentof                         - Start ToF sensor
closetof                        - Stop ToF sensor
tofread                         - Read distance measurement(s)
tofautostart [on|off]           - Auto-start on boot
tofpollingms <50-5000>          - UI polling interval
tofdevicepollms <100-2000>      - Hardware poll interval
tofmaxdistancemm <100-10000>
tofstabilitythreshold <0-50>
```

#### GPS (PA1010D)
```
opengps                         - Start GPS
closegps                        - Stop GPS
gpsread                         - Read location, speed, heading
gpsautostart [on|off]           - Auto-start on boot
gpslog [interval_ms]            - Start track logging
```

#### Gesture/Light/Proximity (APDS9960)
```
openapds                        - Start sensor
closeapds                       - Stop sensor
apdsread                        - Read status and data
apdsmode <color|proximity|gesture> [on|off]  - Enable/disable mode
apdscolor                       - Read color/RGB values
apdsproximity                   - Read proximity
apdsgesture                     - Read gesture (up/down/left/right)
apdsautostart [on|off]          - Auto-start on boot
```

#### Presence/Motion (STHS34PF80 IR)
```
openpresence                    - Start presence sensor
closepresence                   - Stop sensor
presenceread                    - Read presence, motion, temperature
presencestatus                  - Sensor status
presenceautostart [on|off]      - Auto-start on boot
```

#### RTC (DS3231)
```
openrtc                         - Start RTC
closertc                        - Stop RTC
rtcread [status|temp]           - Read time or temp compensation
rtcset <datetime|timestamp>     - Set RTC time
rtcsync [to|from]               - Sync to/from system clock
rtcautostart [on|off]           - Auto-start on boot
```

#### Camera (ESP32-S3 only)
```
opencamera                      - Start camera
closecamera                     - Stop camera
cameraread                      - Camera status
cameracapture                   - Capture frame
camerasave                      - Save frame to storage
camerares <res>                 - Resolution preset
cameraquality <0-63>            - JPEG quality (lower = better)
camerabrightness <-2..2>
cameracontrast <-2..2>
camerasaturation <-2..2>
cameraexposure <-2..2>
cameraaec <on|off>              - Auto exposure
cameraagc <on|off>              - Auto gain
camerahmirror <on|off>
cameravflip <on|off>
cameraautostart <on|off>
cameraautocapture <on|off>
cameraautocaptureinterval <sec>
camerasendaftercapture <on|off> - Send via ESP-NOW after capture
cameratargetdevice <name>
camerastoragelocation <0-2>     - LittleFS/SD/both
cameratiny                      - Capture small frame (for ESP-NOW)
```

#### Microphone (ESP32-S3 only)
```
openmic                         - Start microphone
closemic                        - Stop microphone
micread                         - Microphone status
miclevel                        - Current audio level
micviz                          - Real-time level visualizer
micrecord                       - Start/stop WAV recording
miclist                         - List recordings
micdelete                       - Delete recording(s)
micsamplerate                   - Get/set sample rate
micgain                         - Get/set gain
micbitdepth                     - Get/set bit depth
micautostart [on|off]
```

#### FM Radio (RDA5807)
```
openfmradio                     - Start FM radio
closefmradio                    - Stop FM radio
fmradioread                     - Tuner status
fmradiotune <MHz>               - Tune (e.g., fmradiotune 101.5)
fmradioseek [up|down]           - Seek next station
fmradiovolume <0-15>
fmradiomute / fmradiounmute
fmradioautostart [on|off]
```

#### Servo (PCA9685)
```
servo <channel> <angle>         - Move servo to angle
pwm <channel> <value> [freq]    - Raw PWM output
servoprofile <ch> <min> <max> <center> <name>  - Configure profile
servolist                       - List profiles
servocalibrate <channel>        - Calibration mode
```

#### Gamepad (Seesaw)
```
opengamepad                     - Start gamepad
closegamepad                    - Stop gamepad
gamepadread                     - Read axes and buttons
gamepadautostart [on|off]
```

#### OLED Display (SSD1306)
```
openoled                        - Start OLED
closeoled                       - Stop OLED
oledstatus                      - OLED status
oledmode <mode>                 - Display mode
oledtext <message>              - Custom text overlay
oledclear                       - Clear display
oledbrightness <0-255>
oledupdateinterval <ms>         - Update interval (10-1000ms)
oledbootmode <logo|status|thermal|off>
oleddefaultmode <status|thermal|off>
oledenabled <0|1>
```

### I2C Bus Management
```
i2cscan                         - Scan bus for devices
i2creset                        - Reset I2C bus
i2cpause / i2cresume            - Pause/resume sensor polling
i2crecover <address>            - Clear degraded state
i2cmetrics                      - Bus performance metrics
i2cstats                        - Bus error statistics
i2chealth                       - Per-device health
sensors [filter]                - List I2C sensors
sensorinfo <name>               - Sensor details
sensorautostart [sensor] [on|off]
devices                         - I2C device registry
discover                        - Re-scan I2C bus
```

### ESP-NOW Mesh

```
openespnow                      - Initialize ESP-NOW
closeespnow                     - Deinitialize
espnowstatus                    - Status and config
espnowstats                     - Message/error counters
espnowlist                      - List paired peers
espnowpair <mac> <name>         - Pair with device
espnowunpair <name_or_mac>      - Remove peer
espnowsend <name_or_mac> <msg>  - Send message (auto-routes via mesh)
espnowbroadcast <message>       - Broadcast to all
espnowsendfile <name_or_mac> <path>                    - Send file
espnowbrowse <name_or_mac> <user> <pass> [path]        - Browse remote FS
espnowfetch <name_or_mac> <user> <pass> <path>         - Fetch remote file
espnowremote <name_or_mac> <user> <pass> <cmd>         - Execute remote cmd
```

#### Mesh Routing
```
espnowmode [direct|mesh]        - Get/set routing mode
espnowmeshstatus                - Peer health (heartbeats, ACKs)
espnowmeshmetrics               - Routing metrics
espnowmeshttl [1-10|adaptive]   - Get/set TTL
espnowmeshtopo                  - Discover topology (master only)
espnowtimesync                  - Broadcast NTP time (master only)
espnowtimestatus                - Time sync status
```

#### Device Identity
```
espnowsetname [name]            - Get/set device name
espnowroom [name]               - Get/set room
espnowzone [name]               - Get/set zone
espnowtags [tag1,tag2,...]      - Get/set tags
espnowfriendlyname [name]       - Get/set friendly name
espnowstationary [0|1]          - Get/set stationary flag
espnowdeviceinfo                - All local metadata
espnowdevices                   - All mesh devices (master)
espnowrooms                     - Rooms and devices (master)
espnowfind <query>              - Find by name, room, or tag
espnowroomcmd <room> <cmd>      - Run cmd on all in room
espnowtagcmd <tag> <cmd>        - Run cmd on all with tag
```

#### Sensor Streaming
```
espnowworker [show|on|off|interval <ms>|fields <list>]  - Worker reporting
espnowsensorstream <sensor> <on|off>   - Stream to master (worker)
espnowsensorstatus              - Remote sensor cache (master)
```

#### Security
```
espnowsetpassphrase "phrase"    - Set encryption passphrase
espnowencstatus                 - Encryption status
espnowpairsecure <mac> <name>   - Pair with encryption
espnowrequestmeta <name_or_mac> - Pull metadata from peer
espnowusersync [on|off]         - Credential sync across mesh
```

### Bonding (Master/Worker)

Requires ENABLE_BONDED_MODE. Two devices share command registries.

```
bondconnect <mac_or_name>       - Connect to bonded peer
bonddisconnect                  - Disconnect
bondstatus                      - Bond status
bondrole <master|worker>        - Set role
bondshowcap                     - Local capability summary
bondrequestcap                  - Request peer capabilities
bondshowmanifest                - Local manifest (UI + CLI)
bondrequestmanifest             - Request peer manifest
bondshowremotemanifest [fwHash] - Show cached remote manifest
bondstream <sensor> <on|off>    - Stream sensor to master (worker)
openstream                      - Stream all output to ESP-NOW caller (admin)
closestream                     - Stop streaming
```

### Filesystem (LittleFS)

```
fsusage                         - Filesystem usage
files [path]                    - List files (default '/')
mkdir <path>                    - Create directory
rmdir <path>                    - Remove directory
filecreate <path> [content]     - Create file
fileview <path> [offset]        - View file contents
filedelete <path>               - Delete file
filerename <oldpath> <newname>  - Rename file
```

### SD Card
```
sdmount                         - Mount SD card
sdunmount                       - Unmount
sdformat                        - Format as FAT32
sdinfo                          - SD card info
sddiag                          - Hardware diagnostics
```

### MQTT (Home Assistant)

```
openmqtt                        - Start MQTT client
closemqtt                       - Stop MQTT client
mqttstatus                      - Connection status
mqttautostart [0|1]             - Auto-connect on boot
mqttHost [hostname]             - Broker host/IP
mqttPort [port]                 - Broker port (default 1883)
mqttUser [user|clear]           - Username
mqttPassword [pass|clear]       - Password
mqttBaseTopic [topic|auto]      - Base topic prefix
mqttTLSMode [0|1|2]             - TLS (0=off, 1=verify, 2=no-verify)
mqttCACertPath [path|clear]     - CA cert path
mqttPublishIntervalMs [ms]      - Publish interval
mqttDiscoveryPrefix [prefix]    - HA discovery prefix
mqttPublishWiFi [0|1]
mqttPublishSystem [0|1]
mqttPublishThermal [0|1]
mqttPublishToF [0|1]
mqttPublishIMU [0|1]
mqttPublishPresence [0|1]
mqttPublishGPS [0|1]
mqttPublishAPDS [0|1]
mqttPublishRTC [0|1]
mqttPublishGamepad [0|1]
mqttSubscribeTopics [topics]    - External subscriptions
mqttExternalSensors             - External sensor data via MQTT
```

### Automations

```
automation                      - System status
automationlist                  - List all automations
automationadd                   - Add automation (JSON)
automationrun id=<id>           - Run by ID
autolog start <file>            - Start execution log
autolog stop                    - Stop log
autolog status                  - Log status
validate-conditions <expr>      - Validate syntax
print <message>                 - Broadcast to all outputs
```

Automation syntax:
```
NAME: <name>
SCHEDULE: TIME=HH:MM | INTERVAL=Xs/Xm/Xh | BOOT
IF <condition> THEN <command>; <command>
```
Operators: `>`, `<`, `=`, `!=`, `CONTAINS` (tags only).

### Users (Admin)

```
userlist                        - List all users
useradd <user> <pass> [0|1]     - Create user (1=admin)
userdelete <user>               - Delete user
userchangepassword <cur> <new> <confirm>
userresetpassword <user> <pass> [0|1]  - Reset password (admin)
userpromote <user>              - Grant admin
userdemote <user>               - Remove admin
userrequest <user> <pass>       - Request account (self-reg)
userapprove <user>              - Approve pending (admin)
userdeny <user>                 - Deny pending (admin)
pendinglist                     - Pending requests
usersync <user> <target>        - Sync creds to ESP-NOW peer
sessionlist                     - Active sessions
sessionrevoke <sid|user> [reason]
serialrequireauth [on|off]
ban <ip> [reason]               - Ban IP (admin)
unban <ip>                      - Remove ban
banlist                         - List bans
banuser <user> [reason]         - Ban account
unbanuser <user>                - Remove account ban
login <user> <pass>
logout
```

### On-Device LLM

```
llmstatus                       - Engine state, model config, PSRAM usage
llmload [model.bin]             - Load model (default: /system/llm/model.bin)
llmunload                       - Unload and free PSRAM
llmmodels                       - List models on LittleFS + SD
llmgenerate <prompt>            - Generate text (synchronous)
llmstop                         - Stop in-progress generation
```

Generation modes: normal (natural language) or Do: (prompt ends with `Do:` token, outputs CLI command).

### LED / NeoPixel
```
ledcolor <color>                - Set color (name or hex)
ledcolor off                    - Turn off
ledeffect <effect>              - Run effect
ledbrightness <0-100>
ledstartupenabled [0|1]
ledstartupeffect <none|rainbow|pulse|fade|blink|strobe>
ledstartupcolor <color>
ledstartupcolor2 <color>
ledstartupduration <ms>
```

### Bluetooth (BLE)

Requires ENABLE_BLUETOOTH.

```
openble                         - Start BLE advertising
closeble                        - Stop BLE
blestatus                       - Connection status
bleinfo                         - Config and settings
blename [name]                  - Get/set device name
bletxpower [0-7]
bledisconnect
blesend <message>               - Send to BLE client
blestream <on|off|sensors|system>
bleautostart [on|off]
blerequireauth [on|off]
```

### Sensor Logging
```
sensorlog start <sensor>        - Start logging to CSV
sensorlog stop <sensor>         - Stop logging
sensorlog status                - Active logs
sensorlog format <sensor>       - Set format
sensorlog maxsize <sensor>      - Max file size
sensorlog rotations <sensor>    - Rotation count
sensorlog sensors               - Loggable sensors
```

### Images
```
capture [littlefs|sd|both]      - Capture and save image
images [littlefs|sd]            - List saved images
imageview <path>                - Image file info
imagedelete <path>              - Delete image
imagesend <device> [path]       - Send via ESP-NOW
```

### Maps and Waypoints

Requires ENABLE_MAPS.

```
maplist                         - Available map files
mapload <path>                  - Load map into memory
mapunload                       - Unload map
map                             - Current map + GPS position
whereami                        - Location context (map, room, zone)
search <name>                   - Search map features
waypoint list / add / del / goto / clear
gpstrack status / load / clear
gpslog [interval_ms]            - Start GPS logging
```

### Power and Battery
```
power                           - Power mode status
power mode <mode>               - Set power mode
power auto                      - Auto power management
battery status                  - Voltage, charge, status
battery calibrate               - Recalibrate ADC
```

### Settings
```
wifiautoreconnect <0|1>
ntpserver <hostname>
tzoffsetminutes <-720..720>
httpAutoStart <0|1>
httpsEnabled <0|1>              - Enable HTTPS (reboot required)
webclihistorysize <1-100>
beginwrite                      - Start batch settings update
savesettings                    - Flush to flash
features                        - Show feature list with status and heap cost
features <id> <on|off>          - Toggle a feature (admin)
featuresetup                    - Feature config wizard (admin)
```

#### Feature States

The `features` command lists all registered features with their heap cost and current state:

| State   | Meaning |
|---------|---------|
| `[ON]`  | Feature is compiled into the firmware **and currently active**. It is using heap memory. |
| `[OFF]` | Feature is compiled into the firmware but **disabled**. Can be toggled on with `features <id> on` (admin only). |
| `[N/C]` | Feature is **not compiled** into this firmware build. Cannot be enabled — a different firmware build is required. |

Only features showing `[ON]` or `[OFF]` can be toggled. Features showing `[N/C]` are absent from the firmware binary entirely.

Example output:
```
 wifi         ~24KB  [ON]     ← active, using ~24KB heap
 bluetooth    ~12KB  [N/C]    ← not in this firmware build
 automation   ~ 8KB  [OFF]    ← compiled but currently disabled
```

### Debug Flags
```
debug<flagname> 1               - Enable (persistent)
debug<flagname> 1 temp          - Enable (runtime only)
debug<flagname> 0               - Disable
```

Flags: `debughttp`, `debugwifi`, `debugespnow`, `debugespnowcore`, `debugespnowmesh`, `debugespnowrouter`, `debugespnowstream`, `debugespnowmetadata`, `debugmqtt`, `debugautomations`, `debugsensors`, `debugstorage`, `debugcli`, `debugauth`, `debugperformance`, `debugsystem`, `debugusers`, `debugllm`, `debugllmload`, `debugllmtokenizer`, `debugllmforward`, `debugllmgenerate`, `debugllmmemory`.

---

## Error Handling

### HTTP JSON Errors

Format: `{"success": false, "error": "<message>"}` with HTTP status codes.

| Code | Meaning | Action |
|------|---------|--------|
| 401  | Auth required/expired | Re-authenticate and retry (hw1.sh does this automatically) |
| 403  | Insufficient permissions | Inform user admin access is needed |
| 429  | Rate limited | Wait `retry_after_ms` then retry once (hw1.sh handles this) |
| 400  | Bad request | Check command syntax |
| 404  | Not found | Resource does not exist |
| 500  | Server error | Report to user |

### Authentication Error Codes

JSON response `error` field values:
- `auth_required` -- session expired or missing
- `user_not_found` -- username does not exist
- `password_not_allowed` -- incorrect password

Rate limiting on failed auth (tiered lockout):
- 5 failed attempts --> 30 second lockout
- 10 failed attempts --> 5 minute lockout
- 20 failed attempts --> 30 minute lockout

### CLI Output Errors

Any response starting with `Error:` or `Usage:` is a failure.
- `Error: Not initialized` or `Error: Not started` -- sensor/module is off; run `open<module>` first
- `Usage: <cmd> <args>` -- malformed command; check syntax above and retry

### Sensor/Hardware Errors

Prefixed with `[SensorName] Error:` for identification.
- `[IMU] Error: Not connected. Check wiring.` -- hardware issue, do not retry
- `[Thermal] Error: Failed to enqueue open (queue full)` -- system busy, wait and retry
- `[GPS] Error: Module not connected or initialized` -- hardware issue
- `[Servo] Error: PCA9685 not found at 0x40 - check wiring` -- hardware issue

For hardware errors: report the issue to the user. Do not retry.
For queue/resource errors: wait briefly and retry once.
