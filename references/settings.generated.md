# HardwareOne — Settings Catalog

<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: tools/sync_command_reference.py -->

> Firmware source `a172013` · 304 settings · 289 linked to commands

Every persisted setting, grouped by area. Each setting is read/written by the CLI command shown (its `cmdKey`, else its key). Ordinary setters persist immediately; use `beginwrite`, make several changes, then `savesettings` to batch one flash write. Values marked **secret** are encrypted on disk and never echoed; **read-only** values are device-managed (e.g. counters).


### anoEncoder

- **I2C Address** (`anoEncoderI2cAddr`) — setting · int 1–127 · default I2C_ADDR_ANO_ENCODER · command `anoencoderi2caddr`
- **Invert rotation** (`anoEncoderInvert`) — setting · bool · default off · command `anoencoderinvert`
- **Swap LEFT/RIGHT buttons** (`anoEncoderSwapLeftRight`) — setting · bool · default on · command `anoencoderswaplr`
- **Swap UP/DOWN buttons** (`anoEncoderSwapUpDown`) — setting · bool · default on · command `anoencoderswapud`

### apds

- **Auto-start after boot** (`apdsAutoStart`) — setting · bool · default off · command `apdsautostart`
- **Poll Interval (ms)** (`apdsDevicePollMs`) — setting · int 50–5000 · default 200 · command `apdsdevicepollms`
- **Enabled** (`apdsEnabled`) — setting · bool · default on · command `apdsenabled`

### automation

- **Auto-start at boot** (`automationAutoStart`) — setting · bool · default on · command `automationautostart`
- **Automations Enabled** (`automationsEnabled`) — setting · bool · default on · command `automationsEnabled` _(no distinct command)_

### batteryLog

- **Battery log enabled** (`enabled`) — setting · bool · default on · command `enabled` _(no distinct command)_
- **Battery log interval (ms)** (`intervalMs`) — setting · int 5000–3600000 · default 60000 · command `intervalMs` _(no distinct command)_

### bluetooth

- **Enabled** (`bleEnabled`) — setting · bool · default on · command `bleenabled`
- **Require Secure Channel** (`bleRequireSecureChannel`) — setting · bool · default on · command `blesecure`
- **Secure Channel Secret** (`bleSecureChannelSecret`) — setting · string · default (hidden) · secret · command `blesecret`
- **Auto-start at boot** (`bluetoothAutoStart`) — setting · bool · default off · command `bleautostart`
- **Device Name** (`bluetoothDeviceName`) — setting · string · default "HardwareOne" · command `blename`
- **Mode (0=server, 1=g2)** (`bluetoothMode`) — setting · enum · default kBleModeDefaultForBuild · options 0=Server, 1=Client (G2) · command `blemode`
- **Require Authentication** (`bluetoothRequireAuth`) — setting · bool · default on · command `blerequireauth`
- **TX Power (0-7)** (`bluetoothTxPower`) — setting · int 0–7 · default 3 · command `bletxpower`

### camera

- **Exposure Compensation (-2 to 2)** (`cameraAELevel`) — setting · int -2–2 · default 0 · command `cameraexposure`
- **Enable auto-capture** (`cameraAutoCapture`) — setting · bool · default off · command `cameraautocapture`
- **Auto-capture interval (sec)** (`cameraAutoCaptureInterval`) — setting · int 10–3600 · default 60 · command `cameraautocaptureinterval`
- **Auto-start after boot** (`cameraAutoStart`) — setting · bool · default off · command `cameraautostart`
- **Brightness (-2 to 2)** (`cameraBrightness`) — setting · int -2–2 · default 2 · command `camerabrightness`
- **Photo folder path** (`cameraCaptureFolder`) — setting · string · default "/photos" · command `cameracapturefolder`
- **Contrast (-2 to 2)** (`cameraContrast`) — setting · int -2–2 · default 2 · command `cameracontrast`
- **Denoise (0-8)** (`cameraDenoise`) — setting · int 0–8 · default 0 · command `cameradenoise`
- **Enabled** (`cameraEnabled`) — setting · bool · default on · command `cameraenabled`
- **Resolution** (`cameraFramesize`) — setting · enum · default 10 (240x240) · options 0=320x240 (QVGA), 1=640x480 (VGA), 2=800x600 (SVGA), 3=1024x768 (XGA), 4=1280x1024 (SXGA), 5=1600x1200 (UXGA), 6=96x96, 7=160x120 (QQVGA), 8=176x144 (QCIF), 9=240x176 (HQVGA), 10=240x240, 11=1280x720 (HD), 12=400x296 (CIF) · command `cameraframesize`
- **Horizontal mirror** (`cameraHMirror`) — setting · bool · default off · command `camerahmirror`
- **Max images (0=unlimited)** (`cameraMaxStoredImages`) — setting · int 0–1000 · default 100 · command `cameramaxstoredimages`
- **JPEG quality (0-63, lower=better)** (`cameraQuality`) — setting · int 0–63 · default 12 · command `cameraquality`
- **Saturation (-2 to 2)** (`cameraSaturation`) — setting · int -2–2 · default 2 · command `camerasaturation`
- **Send to target after capture** (`cameraSendAfterCapture`) — setting · bool · default off · command `camerasendaftercapture`
- **Sharpness (-2 to 2, OV3660)** (`cameraSharpness`) — setting · int -2–2 · default 0 · command `camerasharpness`
- **Special Effect** (`cameraSpecialEffect`) — setting · enum · default 0 (None) · options 0=None, 1=Negative, 2=Grayscale, 3=Red Tint, 4=Green Tint, 5=Blue Tint, 6=Sepia · command `cameraeffect`
- **Storage Location** (`cameraStorageLocation`) — setting · enum · default 1 (SD Card) · options 0=LittleFS (Internal), 1=SD Card, 2=Both · command `camerastoragelocation`
- **Camera FPS (higher=smoother)** (`cameraStreamFps`) — setting · int 1–20 · default 5 · command `camerafps`
- **ESP-NOW target device name** (`cameraTargetDevice`) — setting · string · default (empty) · command `cameratargetdevice`
- **Vertical flip** (`cameraVFlip`) — setting · bool · default off · command `cameravflip`
- **White Balance** (`cameraWBMode`) — setting · enum · default 0 (Auto) · options 0=Auto, 1=Sunny, 2=Cloudy, 3=Office, 4=Home · command `camerawb`
- **G2 SD-pack animation cadence (ms per frame)** (`g2PackRateMs`) — setting · int 20–2000 · default 80 · command `g2packrate`
- **G2 lens 4-bpp tone** (`g2StreamToneMap`) — setting · enum · default 1 (Balanced) · options 0=Linear, 1=Balanced, 2=Shadows, 3=Legacy · command `g2streamtonemap`

### cli

- **OLED History** (`oledHistorySize`) — setting · int 10–100 · default 50 · command `oledclihistorysize`

### clock

- **NTP Server** (`ntpServer`) — setting · string · default "pool.ntp.org" · command `ntpserver`
- **Timezone** (`tzOffsetMinutes`) — setting · enum · default 0 (UTC+0 (London/GMT · Dublin)) · options -720=UTC-12 (Baker Island), -660=UTC-11 (Samoa), -600=UTC-10 (Hawaii/HST), -540=UTC-9 (Alaska/AKST), -480=UTC-8 (Pacific/PST), -420=UTC-7 (Mountain/MST · Pacific/PDT), -360=UTC-6 (Central/CST · Mountain/MDT), -300=UTC-5 (Eastern/EST · Central/CDT), -240=UTC-4 (Atlantic/AST · Eastern/EDT), -180=UTC-3 (Argentina · Atlantic/ADT), -120=UTC-2 (Mid-Atlantic), -60=UTC-1 (Azores), 0=UTC+0 (London/GMT · Dublin), 60=UTC+1 (Berlin/Paris/CET · London/BST), 120=UTC+2 (Cairo/Athens/EET · Paris/CEST), 180=UTC+3 (Moscow/Baghdad), 240=UTC+4 (Dubai/Baku), 300=UTC+5 (Karachi/Tashkent), 330=UTC+5:30 (Mumbai/Delhi/IST), 360=UTC+6 (Dhaka/Almaty), 420=UTC+7 (Bangkok/Jakarta), 480=UTC+8 (Beijing/Singapore), 540=UTC+9 (Tokyo/Seoul/JST), 570=UTC+9:30 (Adelaide/ACST), 600=UTC+10 (Sydney/AEST), 660=UTC+11 (Solomon Islands), 720=UTC+12 (Fiji/Auckland/NZST) · command `tzoffsetminutes`

### companion

- **Hold in reset while idle** (`c6AutoHold`) — setting · bool · default off · command `c6autohold`
- **Auto-recover after an outage** (`c6AutoRecover`) — setting · bool · default on · command `c6autorecover`
- **Heartbeat interval (s, 0=off)** (`c6HeartbeatSec`) — setting · int 0–60 · default 5 · command `c6heartbeat`

### crash

- **Abnormal Reset Count** (`crashCount`) — setting · int 0–0xFFFF · default 0 · read-only · command `crashCount` _(no distinct command)_
- **Last Reset Reason** (`lastResetReason`) — setting · int 0–0xFF · default 0 · read-only · command `lastResetReason` _(no distinct command)_

### debug

- **Log Level** (`logLevel`) — setting · enum · default 3 (debug) · options 0=error, 1=warn, 2=info, 3=debug · command `loglevel`
- **Sample Interval (sec)** (`sampleIntervalSec`) — setting · int 0–300 · default 30 · command `memorysampleintervalsec`
- **Allow page console.log** (`webConsole`) — setting · bool · default off · command `webconsole`

### edgeImpulse

- **Continuous Mode** (`continuous`) — setting · bool · default off · command `eicontinuous`
- **Auto-start at boot** (`eiAutoStart`) — setting · bool · default on · command `eiautostart`
- **Enable Inference** (`enabled`) — setting · bool · default off · command `eienable`
- **Input Size** (`inputSize`) — setting · int 48–320 · default 96 · command `eiinputsize`
- **Interval (ms)** (`intervalMs`) — setting · int 100–10000 · default 1000 · command `eiinterval`
- **Max Detections** (`maxDetections`) — setting · int 1–10 · default 5 · command `eimaxdetections`
- **Min Confidence** (`minConfidence`) — setting · float · default 0.6 · command `eiconfidence`
- **Require Labels** (`requireLabels`) — setting · bool · default on · command `eirequirelabels`

### espnow

- **Accept Sensor Control** (`acceptSensorControl`) — setting · bool · default off · command `espnowacceptsensorcontrol`
- **Backup Master Enabled** (`backupEnabled`) — setting · bool · default off · command `espnowbackupenable`
- **Backup MAC** (`backupMAC`) — setting · string · default (empty) · command `espnowmeshbackup`
- **Backup Master Fingerprint** (`backupMasterFingerprint`) — setting · string · default (empty) · command `espnowbackupfingerprint`
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
- **Skip heartbeat frames in capture** (`captureSkipHeartbeats`) — setting · bool · default on · command `espnowcaptureskipheartbeats`
- **Capture ESP-NOW traffic to SD card** (`captureToSd`) — setting · bool · default off · command `espnowcapturetosd`
- **Preferred Channel (0=auto)** (`channel`) — setting · int 0–13 · default 0 · command `espnowchannel`
- **Device Name** (`deviceName`) — setting · string · default (empty) · command `espnowsetname`
- **ESP-NOW Enabled** (`enabled`) — setting · bool · default off · command `espnowenabled`
- **Auto-start at boot** (`espnowAutoStart`) — setting · bool · default on · command `espnowautostart`
- **Failover Timeout (ms)** (`failoverTimeout`) — setting · int 5000–120000 · default 20000 · command `espnowfailovertimeout`
- **First Time Setup** (`firstTimeSetup`) — setting · bool · default off · command `espnowfirsttimesetup`
- **Friendly Name** (`friendlyName`) — setting · string · default (empty) · command `espnowfriendlyname`
- **Heartbeat Broadcast** (`heartbeatBroadcast`) — setting · bool · default on · command `espnowheartbeatbroadcast`
- **Master Fingerprint** (`masterFingerprint`) — setting · string · default (empty) · command `espnowmasterfingerprint`
- **Heartbeat Interval (ms)** (`masterHeartbeatInterval`) — setting · int 1000–60000 · default 10000 · command `espnowheartbeatinterval`
- **Master MAC** (`masterMAC`) — setting · string · default (empty) · command `espnowmeshmaster`
- **Mesh Mode** (`mesh`) — setting · bool · default off · command `espnowmode`
- **Max Peer Slots (reboot)** (`meshPeerMax`) — setting · int 1–16 · default 8 · command `espnowmeshpeermax`
- **Relay for peers** (`meshRelay`) — setting · bool · default on · command `espnowmeshrelay`
- **Mesh Role** (`meshRole`) — setting · enum · default 0 (Worker) · options 0=Worker, 1=Master, 2=Backup Master · command `espnowmeshrole`
- **TTL** (`meshTTL`) — setting · int 1–10 · default 3 · command `espnowmeshttl`
- **Room** (`room`) — setting · string · default (empty) · command `espnowroom`
- **Sensor Broadcast Interval (ms)** (`sensorBroadcastIntervalMs`) — setting · int 100–10000 · default 1000 · command `espnowsensorbroadcastinterval`
- **Stationary** (`stationary`) — setting · bool · default off · command `espnowstationary`
- **Tags** (`tags`) — setting · string · default (empty) · command `espnowtags`
- **Auto Refresh Topology** (`topoAutoRefresh`) — setting · bool · default off · command `espnowtopoautorefresh`
- **Topo Discovery Interval (ms)** (`topoDiscoveryInterval`) — setting · int 0–300000 · default 0 · command `espnowtopodiscoveryinterval`
- **User Sync Enabled** (`userSyncEnabled`) — setting · bool · default off · command `espnowusersync`
- **Worker Status Interval (ms)** (`workerStatusInterval`) — setting · int 5000–120000 · default 30000 · command `espnowworkerstatusinterval`
- **Zone** (`zone`) — setting · string · default (empty) · command `espnowzone`

### espsr

- **Auto-start at boot** (`srAutoStart`) — setting · bool · default off · command `srautostart`
- **Command timeout (ms)** (`srCommandTimeout`) — setting · int 1000–30000 · default 6000 · command `srtimeout`
- **Enabled** (`srEnabled`) — setting · bool · default on · command `srenabled`
- **Model source (0=partition, 1=SD, 2=LittleFS)** (`srModelSource`) — setting · enum · default 0 (Partition) · options 0=Partition, 1=SD, 2=LittleFS · command `srmodelsource`

### fmRadio

- **Auto-start after boot** (`fmRadioAutoStart`) — setting · bool · default off · command `fmradioautostart`
- **Poll Interval (ms)** (`fmRadioDevicePollMs`) — setting · int 100–5000 · default 250 · command `fmradiodevicepollms`
- **Enabled** (`fmRadioEnabled`) — setting · bool · default on · command `fmradioenabled`

### g2Device

- **HeadUp desired** (`headUpDesired`) — setting · enum · default 0 (Preserve) · options 0=Preserve, 1=Off, 2=On · read-only · command `headUpDesired` _(no distinct command)_
- **Native notifications desired** (`notificationsDesired`) — setting · enum · default 0 (Preserve) · options 0=Preserve, 1=Off (unsupported), 2=On · read-only · command `notificationsDesired` _(no distinct command)_

### gps

- **Auto-start after boot** (`gpsAutoStart`) — setting · bool · default off · command `gpsautostart`
- **Poll Interval (ms)** (`gpsDevicePollMs`) — setting · int 50–10000 · default 200 · command `gpsdevicepollms`
- **Enabled** (`gpsEnabled`) — setting · bool · default on · command `gpsenabled`

### http

- **Auto-start at boot** (`httpAutoStart`) — setting · bool · default on · command `httpAutoStart`
- **Enabled** (`httpEnabled`) — setting · bool · default on · command `httpenabled`
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
- **Enabled** (`imuEnabled`) — setting · bool · default on · command `imuenabled`
- **Orientation Correction** (`imuOrientationCorrectionEnabled`) — setting · bool · default on · command `imuorientationcorrection`
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
- **Enabled** (`inputEnabled`) — setting · bool · default on · command `inputenabled`

### led

- **Brightness** (`ledBrightness`) — setting · int 0–100 · default 100 · command `ledbrightness`
- **Startup Color** (`ledStartupColor`) — setting · string · default "cyan" · command `ledstartupcolor`
- **Startup Color 2** (`ledStartupColor2`) — setting · string · default "magenta" · command `ledstartupcolor2`
- **Startup Duration (ms)** (`ledStartupDuration`) — setting · int 100–10000 · default 1000 · command `ledstartupduration`
- **Startup Effect** (`ledStartupEffect`) — setting · enum · default "rainbow" · options none, rainbow, pulse, fade, blink, strobe · command `ledstartupeffect`
- **Startup Enabled** (`ledStartupEnabled`) — setting · bool · default on · command `ledstartupenabled`

### llm

- **Auto-start at boot** (`autoStart`) — setting · bool · default off · command `llmautostart`
- **Confidence gate mean-logprob (0=off)** (`confThreshold`) — setting · float · default -1.0 · command `llmconfthreshold`
- **Content boost (0=off)** (`contentBoost`) — setting · float · default 1.5 · command `llmcontentboost`
- **Default Model** (`defaultModel`) — setting · string · default "model.bin" · command `llmdefaultmodel`
- **Domain gate (refuse off-topic)** (`domainGate`) — setting · bool · default on · command `llmdomaingate`
- **Hard Cap** (`hardCap`) — setting · int 0–512 · default 80 · command `llmhardcap`
- **KV Cache (0=FP32,1=FP16,2=INT8, reload to apply)** (`kvPrecision`) — setting · enum · default 1 (FP16) · options 0=FP32, 1=FP16, 2=INT8 · command `llmkvprec`
- **Enabled** (`llmEnabled`) — setting · bool · default on · command `llmenabled`
- **Max Context (0=auto)** (`maxContext`) — setting · int 0–LLM_SETTING_MAX_CONTEXT · default 0 · command `llmmaxcontext`
- **Max Tokens** (`maxTokens`) — setting · int 1–512 · default 256 · command `llmmaxtokens`
- **Min-P (0=off)** (`minP`) — setting · float · default 0.0 · command `llmminp`
- **No-repeat n-gram (0=off)** (`noRepeatNgram`) — setting · int 0–8 · default 0 · command `llmnorepeatngram`
- **Profiler (per-section fwd timing)** (`profile`) — setting · bool · default off · command `llmprofile`
- **Rep Penalty** (`repPenalty`) — setting · float · default 1.3 · command `llmreppenalty`
- **Rep Window** (`repWindow`) — setting · int 1–LLM_DEFAULT_REP_WINDOW · default 32 · command `llmrepwindow`
- **Sentence Limit** (`sentenceLimit`) — setting · int 0–20 · default 2 · command `llmsentencelimit`
- **Temperature** (`temperature`) — setting · float · default 0.5 · command `llmtemperature`
- **Top-P** (`topP`) — setting · float · default 0.8 · command `llmtopp`

### maps

- **Tile cache size (KB, effective on next map load)** (`cacheSizeKB`) — setting · int 256–4096 · default 1280 · command `mapcachekb`
- **Visible layers (bitmask, 0-0x3FF)** (`layers`) — setting · int 0–0x3FF · default 0x3FF · command `maplayers`
- **Default zoom (0.5-20.0)** (`zoom`) — setting · float · default 1.0 · command `mapzoom`

### mic

- **Enabled** (`micEnabled`) — setting · bool · default on · command `micenabled`
- **Mic source** (`micSource`) — setting · enum · default "auto" · options auto|Auto, pdm|Onboard PDM, g2|G2 glasses · command `micsource`
- **Auto-start after boot** (`microphoneAutoStart`) — setting · bool · default off · command `micautostart`
- **Bit depth (cosmetic; WAV is always 16-bit)** (`microphoneBitDepth`) — setting · enum · default 16 (16-bit) · options 16=16-bit, 32=32-bit · command `micbitdepth`
- **Software gain (%)** (`microphoneGain`) — setting · int 0–100 · default 70 · command `micgain`
- **Sample rate (Hz, PDM only)** (`microphoneSampleRate`) — setting · int 8000–48000 · default 16000 · command `micsamplerate`

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

### notif

- **Android app cards** (`notifApp`) — setting · bool · default on · command `notifydeviceapp`
- **OLED banners** (`notifBanners`) — setting · bool · default on · command `notifydevicebanners`
- **G2 lens cards** (`notifG2`) — setting · bool · default on · command `notifydeviceg2`
- **Notification center** (`notifQueue`) — setting · bool · default on · command `notifydevicequeue`
- **Web toasts** (`notifToasts`) — setting · bool · default on · command `notifydevicetoasts`

### oled

- **Auto-start at boot** (`oledAutoStart`) — setting · bool · default on · command `oledautostart`
- **Boot Duration (ms)** (`oledBootDuration`) — setting · int 500–10000 · default 2000 · command `oledbootduration`
- **Boot Mode** (`oledBootMode`) — setting · enum · default "logo" · options logo, status, sensors, thermal, network, mesh, off · command `oledbootmode`
- **Brightness** (`oledBrightness`) — setting · int 0–255 · default 255 · command `oledbrightness`
- **Default Mode** (`oledDefaultMode`) — setting · enum · default "status" · options logo, status, sensors, thermal, network, mesh, off · command `oleddefaultmode`
- **OLED Enabled** (`oledEnabled`) — setting · bool · default off · command `oledenabled`
- **Flip display 180°** (`oledFlipped`) — setting · bool · default off · command `oledflip`
- **Require Authentication** (`oledRequireAuth`) — setting · bool · default on · command `oledrequireauth`
- **Thermal Color Mode** (`oledThermalColorMode`) — setting · enum · default "3level" · options 3level, grayscale · command `oledthermalcolormode`
- **Thermal Scale** (`oledThermalScale`) — setting · float · default 2.5 · command `oledthermalscale`
- **Update Interval (ms)** (`oledUpdateInterval`) — setting · int 10–1000 · default 125 · command `oledupdateinterval`

### output

- **Display Require Auth** (`displayRequireAuth`) — setting · bool · default on · command `displayrequireauth`
- **Serial Output** (`serial`) — setting · bool · default on · command `outserial`
- **Serial Require Auth** (`serialRequireAuth`) — setting · bool · default on · command `serialrequireauth`
- **BLE Idle Logout (min, 0=off)** (`sessionIdleBle`) — setting · int 0–1440 · default 15 · command `sessionidleble`
- **Display Idle Logout (min, 0=off)** (`sessionIdleDisplay`) — setting · int 0–1440 · default 60 · command `sessionidledisplay`
- **Serial Idle Logout (min, 0=off)** (`sessionIdleSerial`) — setting · int 0–1440 · default 60 · command `sessionidleserial`
- **UART Idle Logout (min, 0=off)** (`sessionIdleUart`) — setting · int 0–1440 · default 0 · command `sessionidleuart`
- **Web Idle Logout (min, 0=off)** (`sessionIdleWeb`) — setting · int 0–1440 · default 60 · command `sessionidleweb`
- **UART Link Baud (0=board default)** (`uartLinkBaud`) — setting · int 0–UART_LINK_BAUD_MAX · default 0 · command `uartlinkbaud`
- **UART Link Enabled** (`uartLinkEnabled`) — setting · bool · default off · command `uartlink`
- **UART Require Auth** (`uartRequireAuth`) — setting · bool · default on · command `uartrequireauth`

### power

- **Auto Mode** (`autoMode`) — setting · bool · default off · command `power auto` (via `power`)
- **Battery Threshold (%)** (`batteryThreshold`) — setting · int 0–100 · default 20 · command `power threshold` (via `power`)
- **Display Dim Level (%)** (`displayDimLevel`) — setting · int 0–100 · default 30 · command `powerdim`
- **Power Mode** (`mode`) — setting · enum · default 0 · options Performance, Balanced, PowerSaver, UltraSaver, Locked · command `power mode` (via `power`)
- **Power saving (min, 0=disabled)** (`powerSaveMinutes`) — setting · int 0–1440 · default 10 · command `powersave`
- **Sleep cooldown (ms, 0=disabled)** (`transitionCooldownMs`) — setting · int 0–60000 · default 5000 · command `powercooldown`

### presence

- **Auto-start after boot** (`presenceAutoStart`) — setting · bool · default off · command `presenceautostart`
- **Poll Interval (ms)** (`presenceDevicePollMs`) — setting · int 50–5000 · default 100 · command `presencedevicepollms`
- **Enabled** (`presenceEnabled`) — setting · bool · default on · command `presenceenabled`

### rtc

- **Auto-start after boot** (`rtcAutoStart`) — setting · bool · default on · command `rtcautostart`
- **Enabled** (`rtcEnabled`) — setting · bool · default on · command `rtcenabled`
- **RTC time has been set (NTP/manual)** (`rtcTimeHasBeenSet`) — setting · bool · default off · read-only · command `rtcTimeHasBeenSet` _(no distinct command)_

### sensorLog

- **Capture at-rest encryption** (`captureEncryptMode`) — setting · enum · default 1 (Health) · options 0=Off, 1=Health, 2=All · command `capturecrypt`
- **Health logging** (`healthLoggingEnabled`) — setting · bool · default off · command `healthlogging`
- **Health logging poll interval (sec)** (`healthLoggingPollIntervalSec`) — setting · int 60–86400 · default 900 · command `healthlogging interval` (via `healthlogging`)
- **Ring health collection desired** (`ringHealthCollectionDesired`) — setting · enum · default 0 (Preserve) · options 0=Preserve, 1=Off, 2=On · read-only · command `ringHealthCollectionDesired` _(no distinct command)_
- **Ring low power desired** (`ringLowPowerDesired`) — setting · enum · default 0 (Preserve) · options 0=Preserve, 1=Off, 2=On · read-only · command `ringLowPowerDesired` _(no distinct command)_
- **Auto-start logging after boot** (`sensorLogAutoStart`) — setting · bool · default off · command `sensorlog autostart` (via `sensorlog`)
- **Enabled** (`sensorLogEnabled`) — setting · bool · default on · command `sensorlogenabled`
- **Format** (`sensorLogFormat`) — setting · enum · default 0 (Text) · options 0=Text, 1=CSV, 2=Track · command `sensorlogformat`
- **Poll interval (ms)** (`sensorLogIntervalMs`) — setting · int 100–3600000 · default 5000 · command `sensorlog interval` (via `sensorlog`)
- **Sensors to log** (`sensorLogMask`) — setting · enum · default 0 · options bitmask:1|Thermal, ToF, IMU, Gamepad, APDS, GPS, Presence, R1 Health · command `sensorlogmask`
- **Rotations (old logs to keep)** (`sensorLogMaxRotations`) — setting · int 0–9 · default 3 · command `sensorlog rotations` (via `sensorlog`)
- **Max file size (bytes)** (`sensorLogMaxSize`) — setting · int 10240–10485760 · default 256000 · command `sensorlog maxsize` (via `sensorlog`)
- **Log file path** (`sensorLogPath`) — setting · string · default (empty) · command `sensorlogpath`

### settings

- **I2C address (reboot required)** (`matrixAddress`) — setting · enum · default 112 (0x70) · options 112=0x70, 113=0x71, 114=0x72, 115=0x73, 116=0x74, 117=0x75, 118=0x76, 119=0x77 · command `matrixaddress`
- **Brightness (applied on next matrix command)** (`matrixBrightness`) — setting · int 0–15 · default 4 · command `matrixbrightness` _(no distinct command)_
- **I2C bus (reboot required)** (`matrixBus`) — setting · enum · default 0 (I2C1) · options 0=I2C1, 1=I2C2 · command `matrixbus`
- **8x8 square (next matrix command)** (`matrixPanel`) — setting · enum · default 0 (First square) · options 0=First square, 1=Second square · command `matrixpanel` _(no distinct command)_
- **Rotation (applied on next matrix command)** (`matrixRotation`) — setting · enum · default 1 (16x8) · options 0=8x16, 1=16x8, 2=8x16 inverted, 3=16x8 inverted · command `matrixrotation` _(no distinct command)_
- **Use one 8x8 square (next matrix command)** (`matrixSquare`) — setting · bool · default off · command `matrixsquare` _(no distinct command)_

### stt

- **Save STT transcripts** (`sttsavetranscripts`) — setting · bool · default off · command `sttsavetranscripts`

### systemLog

- **Structured event history (events.log)** (`eventLog`) — setting · bool · default on · command `eventlog`
- **Auto-start logging after boot** (`systemLogAutoStart`) — setting · bool · default off · command `log autostart` (via `log`)
- **Include category tags** (`systemLogCategoryTags`) — setting · bool · default on · command `logcategorytags`
- **Enabled** (`systemLogEnabled`) — setting · bool · default on · command `systemlogenabled`
- **Debug message categories** (`systemLogFlags`) — setting · string · default (empty) · command `systemlogflags`
- **Log file path (empty = auto-generate)** (`systemLogPath`) — setting · string · default (empty) · command `systemLogPath` _(no distinct command)_

### thermal

- **Auto-start after boot** (`thermalAutoStart`) — setting · bool · default off · command `thermalautostart`
- **Poll Interval (ms)** (`thermalDevicePollMs`) — setting · int 100–2000 · default 100 · command `thermaldevicepollms`
- **EWMA Factor** (`thermalEWMAFactor`) — setting · float · default 0.2 · command `thermalewmafactor`
- **Enabled** (`thermalEnabled`) — setting · bool · default on · command `thermalenabled`
- **I2C Clock (Hz)** (`thermalI2cClockHz`) — setting · int 100000–1000000 · default 400000 · command `thermali2cclockhz`
- **Interp. Buffer** (`thermalInterpolationBufferSize`) — setting · int 1–10 · default 2 · command `thermalinterpolationbuffersize`
- **Interpolation** (`thermalInterpolationEnabled`) — setting · bool · default on · command `thermalinterpolationenabled`
- **Interp. Steps** (`thermalInterpolationSteps`) — setting · int 1–8 · default 5 · command `thermalinterpolationsteps`
- **Default Palette** (`thermalPaletteDefault`) — setting · enum · default "grayscale" · options grayscale, iron, rainbow, hot, coolwarm · command `thermalpalettedefault`
- **Polling (ms)** (`thermalPollingMs`) — setting · int 50–5000 · default 250 · command `thermalpollingms`
- **Rolling Alpha** (`thermalRollingMinMaxAlpha`) — setting · float · default 0.6 · command `thermalrollingminmaxalpha`
- **Rolling Min/Max** (`thermalRollingMinMaxEnabled`) — setting · bool · default on · command `thermalrollingminmaxenabled`
- **Guard Celsius** (`thermalRollingMinMaxGuardC`) — setting · float · default 0.3 · command `thermalrollingminmaxguardc`
- **Rotation** (`thermalRotation`) — setting · enum · default 0 (0°) · options 0=0°, 1=90°, 2=180°, 3=270° · command `thermalrotation`
- **Target FPS** (`thermalTargetFps`) — setting · int 1–8 · default 8 · command `thermaltargetfps`
- **Temporal Alpha** (`thermalTemporalAlpha`) — setting · float · default 0.5 · command `thermaltemporalalpha`
- **Transition (ms)** (`thermalTransitionMs`) — setting · int 0–5000 · default 80 · command `thermaltransitionms`
- **Upscale Factor** (`thermalUpscaleFactor`) — setting · int 1–4 · default 1 · command `thermalupscalefactor`
- **Web Max FPS** (`thermalWebMaxFps`) — setting · int 1–30 · default 10 · command `thermalwebmaxfps`

### tof

- **Auto-start after boot** (`tofAutoStart`) — setting · bool · default off · command `tofautostart`
- **Poll Interval (ms)** (`tofDevicePollMs`) — setting · int 100–2000 · default 220 · command `tofdevicepollms`
- **Enabled** (`tofEnabled`) — setting · bool · default on · command `tofenabled`
- **I2C Clock (Hz)** (`tofI2cClockHz`) — setting · int 50000–400000 · default 200000 · command `tofi2cclockhz`
- **Max Distance (mm)** (`tofMaxDistanceMm`) — setting · int 100–10000 · default 3400 · command `tofmaxdistancemm`
- **Polling (ms)** (`tofPollingMs`) — setting · int 50–5000 · default 220 · command `tofpollingms`
- **Stability Threshold** (`tofStabilityThreshold`) — setting · int 0–50 · default 3 · command `tofstabilitythreshold`
- **Transition (ms)** (`tofTransitionMs`) — setting · int 0–5000 · default 200 · command `toftransitionms`

### wifi

- **Auto-reconnect after drop** (`wifiAutoReconnect`) — setting · bool · default on · command `wifiautoreconnect`
- **Connect at boot** (`wifiAutoStart`) — setting · bool · default on · command `wifiautostart`
- **Enabled** (`wifiEnabled`) — setting · bool · default on · command `wifienabled`
