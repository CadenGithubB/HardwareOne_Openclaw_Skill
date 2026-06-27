# Changelog

Notable changes to the HardwareOne OpenClaw skill. Versioning follows
[Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-06-27

Multi-device support: one agent can now control several HardwareOne devices — a
direct-HTTP master as the entry point, with ESP-NOW mesh devices behind it.

### Added
- Host-only JSON device registry (`~/.openclaw/hardwareone.devices.json`) with a
  `defaults` block, per-device `role` (master | worker | backup), and free-form names.
- `device` parameter on `hardwareone_cli` / `hardwareone_get` / `hardwareone_ping` to
  target a specific device, plus a new `hardwareone_devices` tool that lists names + roles
  (and online state with `probe`). The agent only ever sees names and roles — never IPs or
  credentials.
- `role: backup` failover — a backup becomes the default automatically when the master is
  unreachable (transport failure).
- `via: "mesh"` marker for devices reached only through the master's ESP-NOW (no direct
  HTTP); a direct call to one is rejected with a pointer to relay through the master.

### Changed
- `hw1.sh`: per-device session/scheme isolation; a distinct unreachable exit code so the
  gateway can fail over; the TLS flag is now `allowSelfSigned` (`HW1_INSECURE` kept as a
  deprecated alias).
- `SKILL.md`: multi-device guidance; the ESP-NOW async-result model (the result retriever
  varies by command — `espnowmessages` for remote/file, `espnowdevices` for metadata, …);
  a "stop guessing, use `help`" rule; and that a 401 is a host-side credential issue the
  agent can't fix.
- Regenerated the command catalog from firmware `2d466cf`: ESP-NOW/bond commands now flag
  whether they are async (naming their result retriever) or fire-and-forget.

### Backward compatible
- A single-device setup using the flat `hardwareone.env` (`HW1_URL`/`HW1_USER`/`HW1_PASS`)
  is unchanged — the JSON registry is used only when it exists.

## [1.2.0] — 2026-06-26

Theme: improved command utilization and agentic device use — the agent now gets each
module's mental model and clearer guidance on finding and using commands. Also includes
http/https transport and credential-handling fixes from the same period.

### Added
- Per-module subsystem overviews in the generated command catalog, sourced from the
  firmware's `CommandModule.long_description`, so each module leads with how it works
  (e.g. ESP-NOW's asynchronous result flow) instead of a bare command list.
- ESP-NOW usage guidance in `SKILL.md`: `espnowremote` / `espnowfetch` / `espnowbrowse`
  are asynchronous (results arrive via `espnowmessages json`), plus the remote-exec
  file-transfer pattern.

### Changed
- Command discovery in `SKILL.md`: search the generated catalog or the device's `help`
  before guessing a command; don't web-search for device commands.
- Regenerated the catalog from firmware `f5fcc22` (824 commands, 43 modules,
  409 settings). The generator now parses multi-line module rows and substitutes the
  board-conditional `HW_GPIO_MAX_STR` macro.

### Fixed
- `hw1.sh` auto-detects http vs https from a bare IP, with a self-correcting cache.

### Security
- Device credentials load from a host-only path outside the skill directory, so they are
  no longer mirrored into the agent sandbox.

### Docs
- README demo walkthrough (screenshots); clarified the deploy skills-path default and
  made the plugin path portable.

## [1.1.0] — 2026-06-22

Baseline: reworked to the OpenClaw gateway-tool model, added the firmware-synced
command/settings catalog generator, vendored the gateway plugin, and added the deploy
bundle.
