# Maintenance tools

## `sync_command_reference.py`

Regenerates two references directly from the HardwareOne firmware, so this skill never
drifts out of date as commands/settings are added, renamed, or removed:

- [`../references/cli-commands.generated.md`](../references/cli-commands.generated.md) — every CLI command, with admin flag, argument syntax, feature gate, and (for config commands) the value type/range/default pulled from the settings table.
- [`../references/settings.generated.md`](../references/settings.generated.md) — every configurable setting grouped by area, cross-linked to the command that reads/writes it.

### How it works

Every firmware CLI command is a `CommandEntry { "name", "help", requiresAdmin, ... }`
inside a per-module array (`wifiCommands[]`, `espNowCommands[]`, …). `gCommandModules[]`
in `System_Utils.cpp` aggregates those arrays in display order, each wrapped in its
compile-time `#if ENABLE_*` guard. The script parses both — brace- and string-aware,
so it handles multi-line entries and quoted help text that simple `grep`/`sed` miss —
plus the `SettingEntry` tables, which it joins to commands via each setting's `cmdKey`
(or its key). It emits each command's admin flag, usage syntax, feature gate, and the
type/range/default/options of any setting the command controls.

### Usage

```bash
# Regenerate the catalog (defaults: firmware ../hardwareone-idf, output ../references/…)
python3 tools/sync_command_reference.py

# Point at a firmware checkout elsewhere
python3 tools/sync_command_reference.py --firmware ~/esp/hardwareone-idf
HW1_FIRMWARE=~/esp/hardwareone-idf python3 tools/sync_command_reference.py

# Also emit a machine-readable catalog (for other tooling)
python3 tools/sync_command_reference.py --json references/cli-commands.json

# CI / pre-commit: fail (exit 1) if the committed catalog is stale; writes nothing
python3 tools/sync_command_reference.py --check

# Audit metadata gaps: settings whose UI-editor command isn't a registered command,
# plus command/setting range and enum-choice mismatches (writes nothing)
python3 tools/sync_command_reference.py --audit
```

`--check` ignores the firmware-commit provenance line, so it only fails when the
actual command set has changed — not on every unrelated firmware commit.

### When to run it

After any firmware change that adds, renames, or removes a CLI command (or a whole
module). Commit the regenerated `references/cli-commands.generated.md` with it.

Optional — wire it into the firmware repo's pre-commit hook so the catalog can never
silently fall behind:

```bash
python3 /absolute/path/to/this/skill/tools/sync_command_reference.py --check --quiet
```

### Requirements

Python 3.9+ (standard library only — no third-party packages). The firmware repo only
needs to be present on disk; `git` is optional and used solely for the commit-hash
provenance stamp.
