# HardwareOne — Settings Catalog

<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: tools/sync_command_reference.py -->

> Firmware commit `2d466cf` · 409 settings · 363 linked to commands

Every persisted setting, grouped by area. Each setting is read/written by the CLI command shown (its `cmdKey`, else its key). Set a value with that command; persist with `savesettings`. Values marked **secret** are encrypted on disk and never echoed; **read-only** values are device-managed (e.g. counters).


### anoEncoder

- **I2C Address** (`anoEncoderI2cAddr`) — setting · int 1–127 · default I2C_ADDR_ANO_ENCODER · command `anoencoderi2caddr`
- **Invert rotation** (`anoEncoderInvert`) — setting · bool · default off · command `anoencoderinvert`
- **Swap LEFT/RIGHT buttons** (`anoEncoderSwapLeftRight`) — setting · bool · default on · command `anoencoderswaplr`
- **Swap UP/DOWN buttons** (`anoEncoderSwapUpDown`) — setting · bool · default on · command `anoencoderswapud`

### apds

- **Auto-start after boot** (`apdsAutoStart`) — setting · bool · default off · command `apdsautostart`
- **Poll Interval (ms)** (`apdsDevicePollMs`) — setting · int 50–5000 · default 200 · command `apdsDevicePollMs` _(no distinct command)_

### automation

- **Automations Enabled** (`automationsEnabled`) — setting · bool · default on · command `automationsEnabled` _(no distinct command)_

### batteryLog

- **Battery log enabled** (`enabled`) — setting · bool · default on · command `enabled` _(no distinct command)_
- **Battery log interval (ms)** (`intervalMs`) — setting · int 5000–3600000 · default 60000 · command `intervalMs` _(no distinct command)_

### bluetooth

- **Require Secure Channel** (`bleRequireSecureChannel`) — setting · bool · default on · command `blesecure`
- **Secure Channel Secret** (`bleSecureChannelSecret`) — setting · string · default (hidden) · secret · command `blesecret`
- **Auto-start at boot** (`bluetoothAutoStart`) — setting · bool · default on · command `bleautostart`
- **Device Name** (`bluetoothDeviceName`) — setting · string · default "HardwareOne" · command `bluetoothDeviceName` _(no distinct command)_
- **Mode (0=server, 1=g2)** (`bluetoothMode`) — setting · enum · default 0 (Server) · options 0=Server, 1=Client (G2) · command `blemode`
- **Require Authentication** (`bluetoothRequireAuth`) — setting · bool · default on · command `blerequireauth`
- **TX Power (0-7)** (`bluetoothTxPower`) — setting · int 0–7 · default 3 · command `bletxpower`

### camera

- **Exposure Compensation (-2 to 2)** (`cameraAELevel`) — setting · int -2–2 · default 0 · command `cameraAELevel` _(no distinct command)_
- **Enable auto-capture** (`cameraAutoCapture`) — setting · bool · default off · command `cameraautocapture`
- **Auto-capture interval (sec)** (`cameraAutoCaptureInterval`) — setting · int 10–3600 · default 60 · command `cameraautocaptureinterval`
- **Auto-start after boot** (`cameraAutoStart`) — setting · bool · default off · command `cameraautostart`
- **Brightness (-2 to 2)** (`cameraBrightness`) — setting · int -2–2 · default 2 · command `camerabrightness`
- **Photo folder path** (`cameraCaptureFolder`) — setting · string · default "/photos" · command `cameracapturefolder`
- **Contrast (-2 to 2)** (`cameraContrast`) — setting · int -2–2 · default 2 · command `cameracontrast`
- **Denoise (0-8)** (`cameraDenoise`) — setting · int 0–8 · default 0 · command `cameradenoise`
- **Resolution** (`cameraFramesize`) — setting · enum · default 10 (240x240) · options 0=320x240 (QVGA), 1=640x480 (VGA), 2=800x600 (SVGA), 3=1024x768 (XGA), 4=1280x1024 (SXGA), 5=1600x1200 (UXGA), 6=96x96, 7=160x120 (QQVGA), 8=176x144 (QCIF), 9=240x176 (HQVGA), 10=240x240 · command `cameraframesize`
- **Horizontal mirror** (`cameraHMirror`) — setting · bool · default off · command `camerahmirror`
- **Max images (0=unlimited)** (`cameraMaxStoredImages`) — setting · int 0–1000 · default 100 · command `cameramaxstoredimages`
- **JPEG quality (0-63, lower=better)** (`cameraQuality`) — setting · int 0–63 · default 12 · command `cameraquality`
- **Saturation (-2 to 2)** (`cameraSaturation`) — setting · int -2–2 · default 2 · command `camerasaturation`
- **Send to target after capture** (`cameraSendAfterCapture`) — setting · bool · default off · command `camerasendaftercapture`
- **Sharpness (-2 to 2, OV3660)** (`cameraSharpness`) — setting · int -2–2 · default 0 · command `camerasharpness`
- **Special Effect** (`cameraSpecialEffect`) — setting · enum · default 0 (None) · options 0=None, 1=Negative, 2=Grayscale, 3=Red Tint, 4=Green Tint, 5=Blue Tint, 6=Sepia · command `cameraSpecialEffect` _(no distinct command)_
- **Storage Location** (`cameraStorageLocation`) — setting · enum · default 1 (SD Card) · options 0=LittleFS (Internal), 1=SD Card, 2=Both · command `camerastoragelocation`
- **Camera FPS (higher=smoother)** (`cameraStreamFps`) — setting · int 1–20 · default 5 · command `camerafps`
- **ESP-NOW target device name** (`cameraTargetDevice`) — setting · string · default (empty) · command `cameratargetdevice`
- **Vertical flip** (`cameraVFlip`) — setting · bool · default off · command `cameravflip`
- **White Balance** (`cameraWBMode`) — setting · enum · default 0 (Auto) · options 0=Auto, 1=Sunny, 2=Cloudy, 3=Office, 4=Home · command `cameraWBMode` _(no distinct command)_
- **G2 SD-pack animation cadence (ms per frame)** (`g2PackRateMs`) — setting · int 20–2000 · default 80 · command `g2packrate`
- **G2 lens auto-levels (stretches washed-out frames to full range)** (`g2StreamToneMap`) — setting · bool · default on · command `g2streamtonemap`

### cli

- **OLED History** (`oledHistorySize`) — setting · int 10–100 · default 50 · command `oledclihistorysize`

### crash

- **Abnormal Reset Count** (`crashCount`) — setting · int 0–0xFFFF · default 0 · read-only · command `crashCount` _(no distinct command)_
- **Last Reset Reason** (`lastResetReason`) — setting · int 0–0xFF · default 0 · read-only · command `lastResetReason` _(no distinct command)_

### debug

- **AFE / VAD** (`afe`) — setting · bool · default off · command `debugsrafe`
- **Boot anchors** (`anchor`) — setting · bool · default off · command `debugdatetimeanchor`
- **AutoStart** (`autoStart`) — setting · bool · default off · command `debugi2cautostart`
- **Boot** (`boot`) — setting · bool · default off · command `debugsystemboot`
- **Boot ID** (`bootId`) — setting · bool · default off · command `debugauthbootid`
- **Broadcast** (`broadcast`) — setting · bool · default off · command `debugssebroadcast`
- **Buffers** (`buffers`) — setting · bool · default off · command `debugmemorybuffers`
- **Bus** (`bus`) — setting · bool · default off · command `debugi2cbus`
- **Capture** (`capture`) — setting · bool · default off · command `debugcameracapture`
- **Command match** (`command`) — setting · bool · default off · command `debugsrcommand`
- **Commands** (`commands`) — setting · bool · default off · command `debugmqttcommands`
- **Condition** (`condition`) — setting · bool · default off · command `debugautocondition`
- **Config** (`config`) — setting · bool · default off · command `debugwificonfig`
- **Config** (`config`) — setting · bool · default off · command `debugsystemconfig`
- **Connection** (`connection`) — setting · bool · default off · command `debugsseconnection`
- **Connection** (`connection`) — setting · bool · default off · command `debugwificonnection`
- **Connection** (`connection`) — setting · bool · default off · command `debugmqttconnection`
- **Context** (`context`) — setting · bool · default off · command `debugcmdflowcontext`
- **Cookies** (`cookies`) — setting · bool · default off · command `debugauthcookies`
- **Core** (`core`) — setting · bool · default off · command `debugespnowcore`
- **Core** (`core`) — setting · bool · default off · command `debugbluetoothcore`
- **Data** (`data`) — setting · bool · default off · command `debugbluetoothdata`
- **Discovery** (`discovery`) — setting · bool · default off · command `debugi2cdiscovery`
- **Discovery** (`discovery`) — setting · bool · default off · command `debugmqttdiscovery`
- **Driver** (`driver`) — setting · bool · default off · command `debugwifidriver`
- **Dump** (`dump`) — setting · bool · default off · command `debugg2dump`
- **All Authentication** (`enabled`) — setting · bool · default off · command `debugauth`
- **All HTTP** (`enabled`) — setting · bool · default off · command `debughttp`
- **All HTTPS/TLS** (`enabled`) — setting · bool · default off · command `debughttps`
- **All SSE** (`enabled`) — setting · bool · default off · command `debugsse`
- **All WiFi** (`enabled`) — setting · bool · default off · command `debugwifi`
- **All Storage** (`enabled`) — setting · bool · default off · command `debugstorage`
- **All ESP-NOW** (`enabled`) — setting · bool · default off · command `debugespnow`
- **All Bluetooth** (`enabled`) — setting · bool · default off · command `debugbluetooth`
- **All System** (`enabled`) — setting · bool · default off · command `debugsystem`
- **All Users** (`enabled`) — setting · bool · default off · command `debugusers`
- **All CLI** (`enabled`) — setting · bool · default off · command `debugcli`
- **All Commands** (`enabled`) — setting · bool · default off · command `debugcommandflow`
- **All Performance** (`enabled`) — setting · bool · default off · command `debugperformance`
- **All Automations** (`enabled`) — setting · bool · default off · command `debugautomations`
- **All Camera** (`enabled`) — setting · bool · default off · command `debugcamera`
- **All OLED** (`enabled`) — setting · bool · default off · command `debugdisplay`
- **All Microphone** (`enabled`) — setting · bool · default off · command `debugmicrophone`
- **All GPS** (`enabled`) — setting · bool · default off · command `debuggps`
- **All RTC** (`enabled`) — setting · bool · default off · command `debugrtc`
- **All Presence** (`enabled`) — setting · bool · default off · command `debugpresence`
- **All FM Radio** (`enabled`) — setting · bool · default off · command `debugfmradio`
- **All Thermal** (`enabled`) — setting · bool · default off · command `debugthermal`
- **All IMU** (`enabled`) — setting · bool · default off · command `debugimu`
- **All Input** (`enabled`) — setting · bool · default off · command `debuginput`
- **All ANO Encoder** (`enabled`) — setting · bool · default off · command `debuganoencoder`
- **All ToF** (`enabled`) — setting · bool · default off · command `debugtof`
- **All APDS** (`enabled`) — setting · bool · default off · command `debugapds`
- **All Maps** (`enabled`) — setting · bool · default off · command `debugmaps`
- **All LLM** (`enabled`) — setting · bool · default off · command `debugllm`
- **All NTP/DateTime** (`enabled`) — setting · bool · default off · command `debugdatetime`
- **Enabled** (`enabled`) — setting · bool · default off · command `debuglogger`
- **All Memory** (`enabled`) — setting · bool · default off · command `debugmemory`
- **All G2** (`enabled`) — setting · bool · default off · command `debugg2`
- **All SR** (`enabled`) — setting · bool · default off · command `debugsr`
- **All I2C** (`enabled`) — setting · bool · default off · command `debugi2c`
- **All MQTT** (`enabled`) — setting · bool · default off · command `debugmqtt`
- **Encryption** (`encryption`) — setting · bool · default off · command `debugespnowencryption`
- **Events** (`events`) — setting · bool · default off · command `debugsseevents`
- **Events** (`events`) — setting · bool · default off · command `debugg2events`
- **Execution** (`execution`) — setting · bool · default off · command `debugcliexecution`
- **Execution** (`execution`) — setting · bool · default off · command `debugautoexec`
- **Files** (`files`) — setting · bool · default off · command `debugstoragefiles`
- **Forward** (`forward`) — setting · bool · default off · command `debugllmforward`
- **GATT** (`gatt`) — setting · bool · default off · command `debugbluetoothgatt`
- **Generate** (`generate`) — setting · bool · default off · command `debugllmgenerate`
- **Handlers** (`handlers`) — setting · bool · default off · command `debughttphandlers`
- **Hardware** (`hardware`) — setting · bool · default off · command `debugsystemhardware`
- **Heap** (`heap`) — setting · bool · default off · command `debugperfheap`
- **Heap** (`heap`) — setting · bool · default off · command `debugmemoryheap`
- **Heartbeat** (`heartbeat`) — setting · bool · default off · command `debugg2heartbeat`
- **JSON** (`json`) — setting · bool · default off · command `debugstoragejson`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugcameralifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugmiclifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debuggpslifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugrtclifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugpresencelifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugfmradiolifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugthermallifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugimulifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debuginputlifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debuganoencoderlifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugtoflifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugapdslifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugg2lifecycle`
- **Lifecycle** (`lifecycle`) — setting · bool · default off · command `debugsrlifecycle`
- **Load / checkpoint** (`load`) — setting · bool · default off · command `debugllmload`
- **Loading** (`loading`) — setting · bool · default off · command `debugmapsloading`
- **Log Level** (`logLevel`) — setting · enum · default 3 (debug) · options 0=error, 1=warn, 2=info, 3=debug · command `loglevel`
- **Login** (`login`) — setting · bool · default off · command `debugauthlogin`
- **Management** (`management`) — setting · bool · default off · command `debugusersmgmt`
- **Memory / PSRAM** (`memory`) — setting · bool · default off · command `debugllmmemory`
- **Mesh** (`mesh`) — setting · bool · default off · command `debugespnowmesh`
- **Metadata** (`metadata`) — setting · bool · default off · command `debugespnowmetadata`
- **Migration** (`migration`) — setting · bool · default off · command `debugstoragemigration`
- **Pages** (`pages`) — setting · bool · default off · command `debugg2pages`
- **Performance** (`perf`) — setting · bool · default off · command `debugmapsperf`
- **Permissions** (`permissions`) — setting · bool · default off · command `debugstoragepermissions`
- **Polling** (`polling`) — setting · bool · default off · command `debugmicpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debuggpspolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugrtcpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugpresencepolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugfmradiopolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugthermalpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugimupolling`
- **Polling** (`polling`) — setting · bool · default off · command `debuginputpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debuganoencoderpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugtofpolling`
- **Polling** (`polling`) — setting · bool · default off · command `debugapdspolling`
- **Protocol** (`protocol`) — setting · bool · default off · command `debugg2protocol`
- **Pub/Sub** (`pubsub`) — setting · bool · default off · command `debugmqttpubsub`
- **Query** (`query`) — setting · bool · default off · command `debugusersquery`
- **Queue** (`queue`) — setting · bool · default off · command `debugcliqueue`
- **Queue** (`queue`) — setting · bool · default off · command `debugcmdflowqueue`
- **Registration** (`registration`) — setting · bool · default off · command `debugusersregister`
- **Rendering** (`rendering`) — setting · bool · default off · command `debugmapsrendering`
- **Requests** (`requests`) — setting · bool · default off · command `debughttprequests`
- **Timestamp resolution** (`resolve`) — setting · bool · default off · command `debugdatetimeresolve`
- **Responses** (`responses`) — setting · bool · default off · command `debughttpresponses`
- **Router** (`router`) — setting · bool · default off · command `debugespnowrouter`
- **Routing** (`routing`) — setting · bool · default off · command `debugcmdflowrouting`
- **Sample Interval (sec)** (`sampleIntervalSec`) — setting · int 0–300 · default 30 · command `memorysampleintervalsec`
- **Scanning** (`scanning`) — setting · bool · default off · command `debugwifiscanning`
- **Scheduler** (`scheduler`) — setting · bool · default off · command `debugautoscheduler`
- **Sessions** (`sessions`) — setting · bool · default off · command `debugauthsessions`
- **Settings** (`settings`) — setting · bool · default off · command `debugstoragesettings`
- **Settings** (`settings`) — setting · bool · default off · command `debugcamerasettings`
- **Setup/configTime** (`setup`) — setting · bool · default off · command `debugdatetimesetup`
- **Stack** (`stack`) — setting · bool · default off · command `debugperfstack`
- **Stack** (`stack`) — setting · bool · default off · command `debugmemorystack`
- **Stream** (`stream`) — setting · bool · default off · command `debugespnowstream`
- **Streaming** (`streaming`) — setting · bool · default off · command `debughttpstreaming`
- **Sync loop** (`sync`) — setting · bool · default off · command `debugdatetimesync`
- **System** (`system`) — setting · bool · default off · command `debugcommandsystem`
- **Tasks** (`tasks`) — setting · bool · default off · command `debugsystemtasks`
- **Timing** (`timing`) — setting · bool · default off · command `debugperftiming`
- **Timing** (`timing`) — setting · bool · default off · command `debugautotiming`
- **Tokenizer** (`tokenizer`) — setting · bool · default off · command `debugllmtokenizer`
- **Topology** (`topology`) — setting · bool · default off · command `debugespnowtopo`
- **Tuning / threshold** (`tuning`) — setting · bool · default off · command `debugsrtuning`
- **Validation** (`validation`) — setting · bool · default off · command `debugclivalidation`
- **Values** (`values`) — setting · bool · default off · command `debugmicvalues`
- **Values** (`values`) — setting · bool · default off · command `debuggpsvalues`
- **Values** (`values`) — setting · bool · default off · command `debugrtcvalues`
- **Values** (`values`) — setting · bool · default off · command `debugpresencevalues`
- **Values** (`values`) — setting · bool · default off · command `debugfmradiovalues`
- **Values** (`values`) — setting · bool · default off · command `debugthermalvalues`
- **Values** (`values`) — setting · bool · default off · command `debugimuvalues`
- **Values** (`values`) — setting · bool · default off · command `debuginputvalues`
- **Values** (`values`) — setting · bool · default off · command `debuganoencodervalues`
- **Values** (`values`) — setting · bool · default off · command `debugtofvalues`
- **Values** (`values`) — setting · bool · default off · command `debugapdsvalues`
- **Video** (`video`) — setting · bool · default off · command `debugcameravideo`
- **Wake word** (`wake`) — setting · bool · default off · command `debugsrwake`
- **Allow page console.log** (`webConsole`) — setting · bool · default off · command `webconsole`

### edgeImpulse

- **Continuous Mode** (`continuous`) — setting · bool · default off · command `eicontinuous`
- **Enable Inference** (`enabled`) — setting · bool · default off · command `eienable`
- **Input Size** (`inputSize`) — setting · int 48–320 · default 96 · command `inputSize` _(no distinct command)_
- **Interval (ms)** (`intervalMs`) — setting · int 100–10000 · default 1000 · command `intervalMs` _(no distinct command)_
- **Max Detections** (`maxDetections`) — setting · int 1–10 · default 5 · command `maxDetections` _(no distinct command)_
- **Min Confidence** (`minConfidence`) — setting · float · default 0.6 · command `minConfidence` _(no distinct command)_
- **Require Labels** (`requireLabels`) — setting · bool · default on · command `requireLabels` _(no distinct command)_

### espnow

- **Backup Master Enabled** (`backupEnabled`) — setting · bool · default off · command `espnowbackupenable`
- **Backup MAC** (`backupMAC`) — setting · string · default (empty) · command `espnowmeshbackup`
- **Bond Mode Enabled** (`bondModeEnabled`) — setting · bool · default off · command `espnowbondmodeenabled`
- **Bond Peer MAC** (`bondPeerMac`) — setting · string · default (empty) · command `espnowbondpeermac`
- **Bond Role** (`bondRole`) — setting · enum · default 0 (Worker (compute/network)) · options 0=Worker (compute/network), 1=Master (display/gamepad) · command `bondrole`
- **Auto-stream FM Radio** (`bondStreamFmradio`) — setting · bool · default off · command `bondstreamfmradio`
- **Auto-stream GPS** (`bondStreamGps`) — setting · bool · default off · command `bondstreamgps`
- **Auto-stream IMU** (`bondStreamImu`) — setting · bool · default off · command `bondstreamimu`
- **Auto-stream Input Device** (`bondStreamInput`) — setting · bool · default off · command `bondstreaminput`
- **Auto-stream Presence** (`bondStreamPresence`) — setting · bool · default off · command `bondstreampresence`
- **Auto-stream RTC** (`bondStreamRtc`) — setting · bool · default off · command `bondstreamrtc`
- **Auto-stream Thermal** (`bondStreamThermal`) — setting · bool · default off · command `bondstreamthermal`
- **Auto-stream ToF** (`bondStreamTof`) — setting · bool · default off · command `bondstreamtof`
- **Skip heartbeat frames in capture** (`captureSkipHeartbeats`) — setting · bool · default on · command `espnowcaptureskipheartbeats` _(no distinct command)_
- **Capture ESP-NOW traffic to SD card** (`captureToSd`) — setting · bool · default off · command `espnowcapturetosd` _(no distinct command)_
- **Chunk Size** (`chunkSize`) — setting · int 100–212 · default 200 · command `espnowchunksize`
- **Device Name** (`deviceName`) — setting · string · default (empty) · command `espnowsetname`
- **ESP-NOW Enabled** (`enabled`) — setting · bool · default off · command `espnowenabled`
- **Failover Timeout (ms)** (`failoverTimeout`) — setting · int 5000–120000 · default 20000 · command `espnowfailovertimeout`
- **File Chunk Size** (`fileChunkSize`) — setting · int 100–216 · default 216 · command `espnowfilechunksize`
- **First Time Setup** (`firstTimeSetup`) — setting · bool · default off · command `espnowfirsttimesetup`
- **Friendly Name** (`friendlyName`) — setting · string · default (empty) · command `espnowfriendlyname`
- **Heartbeat Broadcast** (`heartbeatBroadcast`) — setting · bool · default on · command `espnowheartbeatbroadcast`
- **Heartbeat Interval (ms)** (`masterHeartbeatInterval`) — setting · int 1000–60000 · default 10000 · command `espnowheartbeatinterval`
- **Master MAC** (`masterMAC`) — setting · string · default (empty) · command `espnowmeshmaster`
- **Mesh Mode** (`mesh`) — setting · bool · default off · command `espnowmode`
- **Adaptive TTL** (`meshAdaptiveTTL`) — setting · bool · default off · command `espnowmeshadaptivettl`
- **Max Peer Slots (reboot)** (`meshPeerMax`) — setting · int 1–16 · default 8 · command `espnowmeshpeermax`
- **Mesh Role** (`meshRole`) — setting · enum · default 0 (Worker) · options 0=Worker, 1=Master, 2=Backup Master · command `espnowmeshrole`
- **TTL** (`meshTTL`) — setting · int 1–10 · default 3 · command `espnowmeshttl`
- **Room** (`room`) — setting · string · default (empty) · command `espnowroom`
- **RX Buffer Size** (`rxBufferSize`) — setting · int 64–512 · default 256 · command `espnowrxbuffersize`
- **Sensor Broadcast Interval (ms)** (`sensorBroadcastIntervalMs`) — setting · int 100–10000 · default 1000 · command `espnowsensorbroadcastinterval`
- **Stationary** (`stationary`) — setting · bool · default off · command `espnowstationary`
- **Tags** (`tags`) — setting · string · default (empty) · command `espnowtags`
- **Auto Refresh Topology** (`topoAutoRefresh`) — setting · bool · default off · command `espnowtopoautorefresh`
- **Topo Discovery Interval (ms)** (`topoDiscoveryInterval`) — setting · int 0–300000 · default 0 · command `espnowtopodiscoveryinterval`
- **TX Queue Size** (`txQueueSize`) — setting · int 1–16 · default 8 · command `espnowtxqueuesize`
- **User Sync Enabled** (`userSyncEnabled`) — setting · bool · default off · command `espnowusersync`
- **Worker Status Interval (ms)** (`workerStatusInterval`) — setting · int 5000–120000 · default 30000 · command `espnowworkerstatusinterval`
- **Zone** (`zone`) — setting · string · default (empty) · command `espnowzone`

### espsr

- **Auto-start at boot** (`srAutoStart`) — setting · bool · default off · command `srAutoStart` _(no distinct command)_
- **Command timeout (ms)** (`srCommandTimeout`) — setting · int 1000–30000 · default 6000 · command `srCommandTimeout` _(no distinct command)_
- **Model source (0=partition, 1=SD, 2=LittleFS)** (`srModelSource`) — setting · enum · default 0 (Partition) · options 0=Partition, 1=SD, 2=LittleFS · command `srModelSource` _(no distinct command)_

### fmRadio

- **Auto-start after boot** (`fmRadioAutoStart`) — setting · bool · default off · command `fmradioautostart`
- **Poll Interval (ms)** (`fmRadioDevicePollMs`) — setting · int 100–5000 · default 250 · command `fmRadioDevicePollMs` _(no distinct command)_

### gps

- **Auto-start after boot** (`gpsAutoStart`) — setting · bool · default off · command `gpsautostart`
- **Poll Interval (ms)** (`gpsDevicePollMs`) — setting · int 50–10000 · default 200 · command `gpsDevicePollMs` _(no distinct command)_

### http

- **Auto-start at boot** (`httpAutoStart`) — setting · bool · default on · command `httpAutoStart`
- **Enable HTTPS (requires certs + reboot)** (`httpsEnabled`) — setting · bool · default off · command `httpsEnabled`
- **Web CLI history size** (`webCliHistorySize`) — setting · int 1–100 · default 10 · command `webclihistorysize`

### i2c

- **APDS bus (reboot required)** (`apdsBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `apdsbus`
- **FM radio bus (reboot required)** (`fmRadioBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `fmradiobus`
- **Fuel gauge bus (reboot required)** (`fuelGaugeBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `fuelgaugebus`
- **GPS bus (reboot required)** (`gpsBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `gpsbus`
- **I2C2 Bus Enabled (reboot required)** (`i2c2BusEnabled`) — setting · bool · default off · command `i2c2busenabled`
- **I2C2 SCL Pin (reboot required, -1=unavailable)** (`i2c2SclPin`) — setting · int -1–HW_GPIO_MAX · default I2C2_SCL_PIN_DEFAULT · command `i2c2sclpin`
- **I2C2 SDA Pin (reboot required, -1=unavailable)** (`i2c2SdaPin`) — setting · int -1–HW_GPIO_MAX · default I2C2_SDA_PIN_DEFAULT · command `i2c2sdapin`
- **I2C1 Bus Enabled (reboot required)** (`i2cBusEnabled`) — setting · bool · default on · command `i2cbusenabled`
- **I2C1 SCL Pin (reboot required)** (`i2cSclPin`) — setting · int 0–HW_GPIO_MAX · default I2C_SCL_PIN_DEFAULT · command `i2csclpin`
- **I2C1 SDA Pin (reboot required)** (`i2cSdaPin`) — setting · int 0–HW_GPIO_MAX · default I2C_SDA_PIN_DEFAULT · command `i2csdapin`
- **IMU bus (reboot required)** (`imuBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `imubus`
- **Input device bus (reboot required)** (`inputBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `inputbus`
- **OLED bus (reboot required)** (`oledBus`) — setting · enum · default OLED_BUS_DEFAULT · options 0=I2C1, 1=I2C2 · command `oledbus`
- **Presence bus (reboot required)** (`presenceBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `presencebus`
- **RTC bus (reboot required)** (`rtcBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `rtcbus`
- **Servo bus (reboot required)** (`servoBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `servobus`
- **Thermal bus (reboot required)** (`thermalBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `thermalbus`
- **ToF bus (reboot required)** (`tofBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `tofbus`

### imu

- **Auto-start after boot** (`imuAutoStart`) — setting · bool · default off · command `imuautostart`
- **Poll Interval (ms)** (`imuDevicePollMs`) — setting · int 50–1000 · default 200 · command `imudevicepollms`
- **EWMA Factor** (`imuEWMAFactor`) — setting · float · default 0.1 · command `imuewmafactor`
- **Orientation Correction** (`imuOrientationCorrectionEnabled`) — setting · bool · default on · command `imuOrientationCorrectionEnabled` _(no distinct command)_
- **Orientation Mode** (`imuOrientationMode`) — setting · enum · default 8 (Upside Down) · options 0=Normal, 1=Flip Pitch, 2=Flip Roll, 3=Flip Yaw, 4=Flip Pitch+Roll, 5=Roll 180 Fix, 6=Rotate 90 CCW, 7=Alt Extreme Pitch, 8=Upside Down · command `imuorientationmode`
- **Pitch Offset** (`imuPitchOffset`) — setting · float · default 0.0 · command `imupitchoffset`
- **Polling (ms)** (`imuPollingMs`) — setting · int 50–2000 · default 200 · command `imupollingms`
- **Roll Offset** (`imuRollOffset`) — setting · float · default 0.0 · command `imurolloffset`
- **Transition (ms)** (`imuTransitionMs`) — setting · int 0–1000 · default 100 · command `imutransitionms`
- **Web Max FPS** (`imuWebMaxFps`) — setting · int 1–30 · default 15 · command `imuwebmaxfps`
- **Yaw Offset** (`imuYawOffset`) — setting · float · default 0.0 · command `imuyawoffset`

### input

- **Auto-start after boot** (`inputAutoStart`) — setting · bool · default off · command `inputautostart`
- **Poll Interval (ms)** (`inputDevicePollMs`) — setting · int 10–1000 · default 90 · command `inputdevicepollms`

### led

- **Brightness** (`ledBrightness`) — setting · int 0–100 · default 100 · command `ledbrightness`
- **Startup Color** (`ledStartupColor`) — setting · string · default "cyan" · command `ledstartupcolor`
- **Startup Color 2** (`ledStartupColor2`) — setting · string · default "magenta" · command `ledstartupcolor2`
- **Startup Duration (ms)** (`ledStartupDuration`) — setting · int 100–10000 · default 1000 · command `ledstartupduration`
- **Startup Effect** (`ledStartupEffect`) — setting · enum · default "rainbow" · options none, rainbow, pulse, fade, blink, strobe · command `ledstartupeffect`
- **Startup Enabled** (`ledStartupEnabled`) — setting · bool · default on · command `ledstartupenabled`

### llm

- **Auto-start at boot** (`autoStart`) — setting · bool · default off · command `llmautostart`
- **Default Model** (`defaultModel`) — setting · string · default "model.bin" · command `llmdefaultmodel`
- **Dynamic Temp** (`dynTemp`) — setting · bool · default off · command `llmdyntemp`
- **Hard Cap** (`hardCap`) — setting · int 0–512 · default 80 · command `llmhardcap`
- **KV Cache (0=FP32,1=FP16,2=INT8, reload to apply)** (`kvPrecision`) — setting · enum · default 0 (FP32) · options 0=FP32, 1=FP16, 2=INT8 · command `llmkvprec`
- **Max Context (0=auto)** (`maxContext`) — setting · int 0–4096 · default 0 · command `llmmaxcontext`
- **Max Tokens** (`maxTokens`) — setting · int 1–512 · default 256 · command `llmmaxtokens`
- **Min-P (0=off)** (`minP`) — setting · float · default 0.0 · command `llmminp`
- **Mirostat Eta** (`mirostatEta`) — setting · float · default 0.1 · command `llmmirostateta`
- **Mirostat Tau** (`mirostatTau`) — setting · float · default 5.0 · command `llmmirostattau`
- **Rep Penalty** (`repPenalty`) — setting · float · default 1.3 · command `llmreppenalty`
- **Rep Window** (`repWindow`) — setting · int 1–128 · default 32 · command `llmrepwindow`
- **Sentence Limit** (`sentenceLimit`) — setting · int 0–20 · default 2 · command `llmsentencelimit`
- **Temperature** (`temperature`) — setting · float · default 0.5 · command `llmtemperature`
- **Top-P** (`topP`) — setting · float · default 0.8 · command `llmtopp`
- **Use Mirostat 2** (`useMirostat2`) — setting · bool · default off · command `llmusemirostat2`

### maps

- **Tile cache size (KB, reboot to apply)** (`cacheSizeKB`) — setting · int 256–4096 · default 1024 · command `mapcachekb`
- **Visible layers (bitmask, 0-0x3FF)** (`layers`) — setting · int 0–0x3FF · default 0x3FF · command `maplayers`
- **Default zoom (0.5-20.0)** (`zoom`) — setting · float · default 1.0 · command `mapzoom`

### mic

- **Auto-start after boot** (`microphoneAutoStart`) — setting · bool · default off · command `microphoneAutoStart` _(no distinct command)_

### mqtt

- **Auto-start at boot** (`mqttAutoStart`) — setting · bool · default off · command `mqttautostart`
- **Base Topic** (`mqttBaseTopic`) — setting · string · default (empty) · command `mqttBaseTopic`
- **CA certificate path** (`mqttCACertPath`) — setting · string · default "/system/certs/mqtt_ca.crt" · command `mqttCACertPath`
- **MQTT Enabled** (`mqttClientEnabled`) — setting · bool · default off · command `mqttclientenabled`
- **Discovery Prefix** (`mqttDiscoveryPrefix`) — setting · string · default "homeassistant" · command `mqttDiscoveryPrefix`
- **Broker Host** (`mqttHost`) — setting · string · default (empty) · command `mqttHost`
- **Password** (`mqttPassword`) — setting · string · default (hidden) · secret · command `mqttPassword`
- **Broker Port** (`mqttPort`) — setting · int 1–65535 · default 1883 · command `mqttPort`
- **Publish APDS data** (`mqttPublishAPDS`) — setting · bool · default off · command `mqttPublishAPDS`
- **Publish GPS data** (`mqttPublishGPS`) — setting · bool · default off · command `mqttPublishGPS`
- **Publish IMU data** (`mqttPublishIMU`) — setting · bool · default off · command `mqttPublishIMU`
- **Publish input device data** (`mqttPublishInput`) — setting · bool · default off · command `mqttPublishInput`
- **Publish Interval (ms)** (`mqttPublishIntervalMs`) — setting · int 1000–300000 · default 10000 · command `mqttPublishIntervalMs`
- **Publish presence data** (`mqttPublishPresence`) — setting · bool · default off · command `mqttPublishPresence`
- **Publish RTC time** (`mqttPublishRTC`) — setting · bool · default off · command `mqttPublishRTC`
- **Publish system info** (`mqttPublishSystem`) — setting · bool · default off · command `mqttPublishSystem`
- **Publish thermal data** (`mqttPublishThermal`) — setting · bool · default off · command `mqttPublishThermal`
- **Publish ToF data** (`mqttPublishToF`) — setting · bool · default off · command `mqttPublishToF`
- **Publish WiFi info** (`mqttPublishWiFi`) — setting · bool · default off · command `mqttPublishWiFi`
- **Subscribe to external topics** (`mqttSubscribeExternal`) — setting · bool · default off · command `mqttSubscribeExternal`
- **Topics (comma-separated)** (`mqttSubscribeTopics`) — setting · string · default (empty) · command `mqttSubscribeTopics`
- **TLS Mode (0=None, 1=TLS, 2=TLS+Verify)** (`mqttTLSMode`) — setting · enum · default 0 (None) · options 0=None, 1=TLS, 2=TLS+Verify · command `mqttTLSMode`
- **Username** (`mqttUser`) — setting · string · default (empty) · command `mqttUser`

### oled

- **Boot Duration (ms)** (`oledBootDuration`) — setting · int 500–10000 · default 2000 · command `oledbootduration`
- **Boot Mode** (`oledBootMode`) — setting · enum · default "logo" · options logo, status, sensors, thermal, network, mesh, off · command `oledbootmode`
- **Brightness** (`oledBrightness`) — setting · int 0–255 · default 255 · command `oledbrightness`
- **Default Mode** (`oledDefaultMode`) — setting · enum · default "status" · options logo, status, sensors, thermal, network, mesh, off · command `oleddefaultmode`
- **OLED Enabled** (`oledEnabled`) — setting · bool · default off · command `oledenabled`
- **Flip display 180°** (`oledFlipped`) — setting · bool · default on · command `oledflip`
- **Require Authentication** (`oledRequireAuth`) — setting · bool · default on · command `oledrequireauth`
- **Thermal Color Mode** (`oledThermalColorMode`) — setting · enum · default "3level" · options 3level, grayscale · command `oledthermalcolormode`
- **Thermal Scale** (`oledThermalScale`) — setting · float · default 2.5 · command `oledthermalscale`
- **Update Interval (ms)** (`oledUpdateInterval`) — setting · int 10–1000 · default 125 · command `oledupdateinterval`

### output

- **Display Output** (`display`) — setting · bool · default off · command `outdisplay`
- **Display Require Auth** (`displayRequireAuth`) — setting · bool · default on · command `displayrequireauth`
- **G2 Glasses Output** (`g2`) — setting · bool · default off · command `outg2`
- **Serial Output** (`serial`) — setting · bool · default on · command `outserial`
- **Serial Require Auth** (`serialRequireAuth`) — setting · bool · default on · command `serialrequireauth`
- **BLE Idle Logout (min, 0=off)** (`sessionIdleBle`) — setting · int 0–1440 · default 15 · command `sessionidleble` _(no distinct command)_
- **Display Idle Logout (min, 0=off)** (`sessionIdleDisplay`) — setting · int 0–1440 · default 60 · command `sessionidledisplay` _(no distinct command)_
- **Serial Idle Logout (min, 0=off)** (`sessionIdleSerial`) — setting · int 0–1440 · default 60 · command `sessionidleserial` _(no distinct command)_
- **Web Idle Logout (min, 0=off)** (`sessionIdleWeb`) — setting · int 0–1440 · default 60 · command `sessionidleweb` _(no distinct command)_
- **Web Output** (`web`) — setting · bool · default on · command `outweb`

### power

- **Auto Mode** (`autoMode`) — setting · bool · default off · command `autoMode` _(no distinct command)_
- **Battery Threshold (%)** (`batteryThreshold`) — setting · int 0–100 · default 20 · command `batteryThreshold` _(no distinct command)_
- **Display Dim Level (%)** (`displayDimLevel`) — setting · int 0–100 · default 30 · command `displayDimLevel` _(no distinct command)_
- **Power Mode** (`mode`) — setting · enum · default 0 · options Performance, Balanced, PowerSaver, UltraSaver · command `mode` _(no distinct command)_
- **Power saving (min, 0=disabled)** (`powerSaveMinutes`) — setting · int 0–1440 · default 10 · command `powersave`
- **Sleep cooldown (ms, 0=disabled)** (`transitionCooldownMs`) — setting · int 0–60000 · default 5000 · command `powercooldown`

### presence

- **Auto-start after boot** (`presenceAutoStart`) — setting · bool · default off · command `presenceautostart`
- **Poll Interval (ms)** (`presenceDevicePollMs`) — setting · int 50–5000 · default 100 · command `presenceDevicePollMs` _(no distinct command)_

### rtc

- **Auto-start after boot** (`rtcAutoStart`) — setting · bool · default on · command `rtcautostart`
- **RTC time has been set (NTP/manual)** (`rtcTimeHasBeenSet`) — setting · bool · default off · read-only · command `rtcTimeHasBeenSet` _(no distinct command)_

### sensorLog

- **Auto-start logging after boot** (`sensorLogAutoStart`) — setting · bool · default off · command `sensorlog autostart` _(no distinct command)_
- **Format (0=text,1=csv,2=track)** (`sensorLogFormat`) — setting · enum · default 0 (Text) · options 0=Text, 1=CSV, 2=Track · command `sensorLogFormat` _(no distinct command)_
- **Poll interval (ms)** (`sensorLogIntervalMs`) — setting · int 100–3600000 · default 5000 · command `sensorLogIntervalMs` _(no distinct command)_
- **Sensor bitmask** (`sensorLogMask`) — setting · int 0–255 · default 0 · command `sensorLogMask` _(no distinct command)_
- **Log file path** (`sensorLogPath`) — setting · string · default "/logs/sensors/sensors.txt" · command `sensorLogPath` _(no distinct command)_

### systemLog

- **Auto-start logging after boot** (`systemLogAutoStart`) — setting · bool · default off · command `log autostart` _(no distinct command)_
- **Include category tags** (`systemLogCategoryTags`) — setting · bool · default on · command `systemLogCategoryTags` _(no distinct command)_
- **Log file path (empty = auto-generate)** (`systemLogPath`) — setting · string · default (empty) · command `systemLogPath` _(no distinct command)_

### thermal

- **Auto-start after boot** (`thermalAutoStart`) — setting · bool · default off · command `thermalautostart`
- **Poll Interval (ms)** (`thermalDevicePollMs`) — setting · int 100–2000 · default 100 · command `thermaldevicepollms`
- **EWMA Factor** (`thermalEWMAFactor`) — setting · float · default 0.2 · command `thermalewmafactor`
- **I2C Clock (Hz)** (`thermalI2cClockHz`) — setting · int 100000–1000000 · default 400000 · command `thermali2cclockhz`
- **Interp. Buffer** (`thermalInterpolationBufferSize`) — setting · int 1–10 · default 2 · command `thermalinterpolationbuffersize`
- **Interpolation** (`thermalInterpolationEnabled`) — setting · bool · default on · command `thermalinterpolationenabled`
- **Interp. Steps** (`thermalInterpolationSteps`) — setting · int 1–8 · default 5 · command `thermalinterpolationsteps`
- **Default Palette** (`thermalPaletteDefault`) — setting · enum · default "grayscale" · options grayscale, iron, rainbow, hot, coolwarm · command `thermalpalettedefault`
- **Polling (ms)** (`thermalPollingMs`) — setting · int 50–5000 · default 250 · command `thermalpollingms`
- **Rolling Alpha** (`thermalRollingMinMaxAlpha`) — setting · float · default 0.6 · command `thermalrollingminmaxalpha`
- **Rolling Min/Max** (`thermalRollingMinMaxEnabled`) — setting · bool · default on · command `thermalrollingminmaxenabled`
- **Guard Celsius** (`thermalRollingMinMaxGuardC`) — setting · float · default 0.3 · command `thermalrollingminmaxguardc`
- **Rotation (0-3)** (`thermalRotation`) — setting · int 0–3 · default 0 · command `thermalrotation`
- **Target FPS** (`thermalTargetFps`) — setting · int 1–8 · default 8 · command `thermaltargetfps`
- **Temporal Alpha** (`thermalTemporalAlpha`) — setting · float · default 0.5 · command `thermaltemporalalpha`
- **Transition (ms)** (`thermalTransitionMs`) — setting · int 0–5000 · default 80 · command `thermaltransitionms`
- **Upscale Factor** (`thermalUpscaleFactor`) — setting · int 1–4 · default 1 · command `thermalupscalefactor`
- **Web Max FPS** (`thermalWebMaxFps`) — setting · int 1–30 · default 10 · command `thermalwebmaxfps`

### tof

- **Auto-start after boot** (`tofAutoStart`) — setting · bool · default off · command `tofautostart`
- **Poll Interval (ms)** (`tofDevicePollMs`) — setting · int 100–2000 · default 220 · command `tofdevicepollms`
- **I2C Clock (Hz)** (`tofI2cClockHz`) — setting · int 50000–400000 · default 200000 · command `tofI2cClockHz` _(no distinct command)_
- **Max Distance (mm)** (`tofMaxDistanceMm`) — setting · int 100–10000 · default 3400 · command `tofmaxdistancemm`
- **Polling (ms)** (`tofPollingMs`) — setting · int 50–5000 · default 220 · command `tofpollingms`
- **Stability Threshold** (`tofStabilityThreshold`) — setting · int 0–50 · default 3 · command `tofstabilitythreshold`
- **Transition (ms)** (`tofTransitionMs`) — setting · int 0–5000 · default 200 · command `toftransitionms`

### wifi

- **Auto-reconnect** (`autoReconnect`) — setting · bool · default on · command `wifiautoreconnect`
- **WiFi Enabled** (`enabled`) — setting · bool · default on · command `wifienabled` _(no distinct command)_
- **NTP Server** (`ntpServer`) — setting · string · default "pool.ntp.org" · command `ntpserver`
- **WiFi Password** (`password`) — setting · string · default (hidden) · secret · command `wifipassword` _(no distinct command)_
- **WiFi SSID** (`ssid`) — setting · string · default (empty) · command `wifissid` _(no distinct command)_
- **Timezone** (`tzOffsetMinutes`) — setting · enum · default 0 (UTC+0 (London/GMT · Dublin)) · options -720=UTC-12 (Baker Island), -660=UTC-11 (Samoa), -600=UTC-10 (Hawaii/HST), -540=UTC-9 (Alaska/AKST), -480=UTC-8 (Pacific/PST), -420=UTC-7 (Mountain/MST · Pacific/PDT), -360=UTC-6 (Central/CST · Mountain/MDT), -300=UTC-5 (Eastern/EST · Central/CDT), -240=UTC-4 (Atlantic/AST · Eastern/EDT), -180=UTC-3 (Argentina · Atlantic/ADT), -120=UTC-2 (Mid-Atlantic), -60=UTC-1 (Azores), 0=UTC+0 (London/GMT · Dublin), 60=UTC+1 (Berlin/Paris/CET · London/BST), 120=UTC+2 (Cairo/Athens/EET · Paris/CEST), 180=UTC+3 (Moscow/Baghdad), 240=UTC+4 (Dubai/Baku), 300=UTC+5 (Karachi/Tashkent), 330=UTC+5:30 (Mumbai/Delhi/IST), 360=UTC+6 (Dhaka/Almaty), 420=UTC+7 (Bangkok/Jakarta), 480=UTC+8 (Beijing/Singapore), 540=UTC+9 (Tokyo/Seoul/JST), 570=UTC+9:30 (Adelaide/ACST), 600=UTC+10 (Sydney/AEST), 660=UTC+11 (Solomon Islands), 720=UTC+12 (Fiji/Auckland/NZST) · command `tzoffsetminutes`
