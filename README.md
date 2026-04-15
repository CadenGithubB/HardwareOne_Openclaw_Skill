# HardwareOne ESP32 Integration for OpenClaw

A skill for interfacing with HardwareOne ESP32 devices via HTTP/HTTPS within OpenClaw.

## What it does

Interfaces with HardwareOne ESP32-based IoT devices for:
- Sensor reading (when supported by device firmware)
- System management (status, uptime, temperature, voltage, memory, filesystem)
- ESP-NOW mesh networking coordination
- On-device LLM control
- Camera, microphone, and other peripherals (if compiled in)

## Installation

1. **Clone to your OpenClaw skills directory:**
   ```bash
   cd ~/.openclaw/workspace/skills
   git clone https://github.com/CadenGithubB/HardwareOne-Openclaw-Skill.git hardwareone
   ```
   Or copy manually:
   ```bash
   cp -r HardwareOne-Openclaw-Skill/ ~/.openclaw/workspace/skills/hardwareone
   ```

2. **Configure credentials:**
   ```bash
   cp ~/.openclaw/workspace/skills/hardwareone/.env.template ~/.openclaw/workspace/skills/hardwareone/.env
   ```
   Then edit `.env` with your device details:
   ```
   HW1_URL=http://YOUR_DEVICE_IP
   HW1_USER=your_username
   HW1_PASS=your_password
   ```

3. **Ensure the script is executable:**
   ```bash
   chmod +x ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh
   ```

4. **Add to OpenClaw config** (if not auto-detected):
   Ensure `"hardwareone"` is in `skills.allowBundled` in your `openclaw.json`.

5. **Test the connection:**
   ```bash
   bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh --ping
   ```

## Usage

### Basic Commands

```bash
# Check device health
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh --ping

# Get system status
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "status"

# Check uptime
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "uptime"

# Read device temperature
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "temperature"

# Check memory and filesystem
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "memsample"
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "taskstats"
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "fsusage"
```

### Feature Check (IMPORTANT!)

**Always check available features first** before attempting sensor commands:

```bash
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "features"
```

Output shows:
- `[ON]` = active, commands work
- `[OFF]` = compiled but disabled
- `[N/C]` = **not compiled**, commands don't exist on this device

### Sensor Commands

Most sensors follow this pattern (only if feature shows `[ON]` or `[OFF]`):

```bash
# Enable sensor
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "openthermal"

# Read sensor data
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "thermalread"

# Disable sensor
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh "closethermal"
```

### API Endpoint Access

```bash
# List all sensors
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh --get /api/sensors

# List filesystem contents
bash ~/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh --get "/api/files/list?path=/"
```

## Directory Structure

```
hardwareone/
├── SKILL.md              # Skill brain file (read by OpenClaw agent)
├── .env                  # Device credentials (never commit!)
├── .env.template         # Credential template
├── scripts/
│   └── hw1.sh            # CLI wrapper script
└── references/
    └── api-reference.md  # Complete API and command reference
```

## Available Features (Device Dependent)

### Core Commands (Always Available)
- `status` - Device status overview
- `uptime` - System uptime
- `temperature` - ESP32 temperature sensor
- `voltage` - Power information
- `memsample` - Memory snapshot
- `memreport` - Memory usage report
- `taskstats` - Task statistics
- `fsusage` - Filesystem usage
- `features` - List active/inactive features

### Optional Features (Check `[ON]`/`[OFF]`/`[N/C]`)
- **Network**: WiFi, HTTP, Bluetooth, ESP-NOW, MQTT
- **Display**: OLED, LED control
- **Sensors**: Thermal, ToF, IMU, GPS, FM Radio, APDS, RTC, Presence, Camera, Microphone
- **Advanced**: I2C, Edge Impulse, Automation

## Security Notes

- **Never commit `.env` file** — it contains device credentials
- Script handles re-authentication on session expiry automatically
- Admin privileges required for some operations (e.g., filesystem, user management)

## Error Recovery

- **Unknown command**: Check `references/api-reference.md` for correct command names
- **Not initialized**: Run the corresponding `open<sensor>` command first
- **Not connected**: Hardware/wiring issue, don't retry automatically
- **Empty output**: Report to user, don't fabricate responses
- **403**: Requires admin privileges

## Troubleshooting

- **Connection fails**: Verify device IP, username, and password in `.env`
- **Script not found**: Ensure `hw1.sh` is executable (`chmod +x`)
- **Permission denied**: Check file permissions on the scripts directory

## Updating

Pull latest changes and restart the OpenClaw gateway if needed:
```bash
cd ~/.openclaw/workspace/skills/hardwareone
git pull
```

## Credits

- Based on [HardwareOne](https://github.com/CadenGithubB/hardwareone-idf) ESP32 firmware
- Integrated with the [OpenClaw](https://github.com/openclaw/openclaw) skill system

## License

MIT License — see [LICENSE](LICENSE) for details.
