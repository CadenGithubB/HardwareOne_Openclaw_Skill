---
name: hardwareone
description: Interface with HardwareOne ESP32 devices via HTTP/HTTPS for sensor reading, system management, ESP-NOW mesh networking, and on-device LLM control.
triggers:
  - hardwareone
  - hardware one
  - hw1
  - esp32
  - sensor data
  - device status
  - espnow
  - mesh network
metadata: {"clawdbot":{"requires":{"bins":["curl"]},"config":{"env":{"HW1_URL":{"description":"HardwareOne device base URL","required":true},"HW1_USER":{"description":"Device username","required":true},"HW1_PASS":{"description":"Device password","required":true}}}}}
---

# HardwareOne

ESP32-based IoT platform with 499+ CLI commands, I2C sensors, camera, microphone, ESP-NOW mesh, MQTT, automations, and on-device LLM.

## IMPORTANT: How to interact with this device

ALWAYS use the wrapper script below. NEVER use curl directly. NEVER guess command names or API endpoints. If you do not know the exact command, read `{baseDir}/references/api-reference.md` BEFORE trying anything. NEVER fabricate or invent output — if a command returns empty or fails, say so.

**Run a CLI command:**
```
bash {baseDir}/scripts/hw1.sh "<command>"
```

**Health check:**
```
bash {baseDir}/scripts/hw1.sh --ping
```

**GET an API endpoint (--get and the path are SEPARATE arguments, do NOT quote them together):**
```
bash {baseDir}/scripts/hw1.sh --get <path>
```

Common examples:
```
bash {baseDir}/scripts/hw1.sh "status"
bash {baseDir}/scripts/hw1.sh "uptime"
bash {baseDir}/scripts/hw1.sh "temperature"
bash {baseDir}/scripts/hw1.sh --ping
bash {baseDir}/scripts/hw1.sh --get /api/sensors
bash {baseDir}/scripts/hw1.sh --get "/api/files/list?path=/"
```

DO NOT use curl, wget, or any HTTP client directly. The script manages authentication cookies, re-login on 401, and rate-limit handling automatically. Credentials are loaded from `{baseDir}/.env`.

## CRITICAL: Check available features FIRST

Not all commands exist on every device. Firmware builds vary — many modules may not be compiled in.

**Before trying any sensor, display, or network module commands**, run:
```
bash {baseDir}/scripts/hw1.sh "features"
```

This returns each feature's state: `[ON]`, `[OFF]`, or `[N/C]`.
- `[ON]` = active — its commands work
- `[OFF]` = compiled but disabled — can be toggled on (admin)
- `[N/C]` = **not compiled** — its commands **DO NOT EXIST** on this device. Do not attempt them.

For example, if `thermal` shows `[N/C]`, then `openthermal`, `thermalread`, `closethermal` etc. will all return "Unknown command." Do NOT try them.

**Always-available commands** (not tied to a feature flag): `status`, `uptime`, `time`, `temperature`, `voltage`, `memsample`, `memreport`, `taskstats`, `fsusage`, `help`, `features`, `ledcolor`, `ledeffect`

## Sensor Workflow

Most sensors follow Enable --> Read --> Disable (only if the sensor's feature shows `[ON]` or `[OFF]`):
1. `open<sensor>` (e.g., `openthermal`)
2. `<sensor>read` (e.g., `thermalread`)
3. `close<sensor>` (e.g., `closethermal`)

## Multi-Device (ESP-NOW)

If bonded as master, data may come from workers.
- Check topology: run `bondstatus`
- Remote sensors: `bash {baseDir}/scripts/hw1.sh --get /api/sensors/remote`
- Remote commands: `espnowremote <peer> <user> <pass> <cmd>`

## Error Recovery

- "Unknown command" --> Do NOT guess alternatives. Read `{baseDir}/references/api-reference.md` to find the correct command name.
- "Error: Not initialized" --> Run the corresponding `open<sensor>` command first
- "Usage: ..." --> Wrong syntax; check `{baseDir}/references/api-reference.md`
- 401 --> Script handles re-auth automatically; if persistent, check HW1_USER/HW1_PASS
- 403 --> Admin privileges required; inform user
- "[Sensor] Error: Not connected" --> Hardware/wiring issue; do not retry, report to user
- Empty output --> Report to user that the command returned no data. Do NOT make up a response.

## Reference

- Full command and endpoint list: `{baseDir}/references/api-reference.md` — READ THIS before guessing command names
