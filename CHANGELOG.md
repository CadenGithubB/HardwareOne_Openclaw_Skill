# Changelog

Notable changes to the HardwareOne OpenClaw skill. Versioning follows
[Semantic Versioning](https://semver.org/).

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
