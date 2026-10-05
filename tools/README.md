# Maintenance tools

## `sync_command_reference.py`

Regenerates two references directly from the [HardwareOne](https://github.com/CadenGithubB/HardwareOne)
firmware, so this skill never drifts out of date as commands/settings are added, renamed, or removed:

- [`../references/cli-commands.generated.md`](../references/cli-commands.generated.md) — every CLI registry entry, with admin/super-admin flag, argument syntax, feature gate, and (for config commands) the value type/range/default pulled from the settings table. The header distinguishes unique names from registry entries so duplicate registrations are visible rather than counted as extra capabilities.
- [`../references/settings.generated.md`](../references/settings.generated.md) — every configurable setting grouped by area, cross-linked to the command that reads/writes it.

### How it works

Every firmware CLI command is a `CommandEntry { "name", "help", requiresAdmin, ...,
requiresSuperAdmin }`
inside a per-module array (`wifiCommands[]`, `espNowCommands[]`, …). `gCommandModules[]`
in `System_Utils.cpp` aggregates those arrays in display order, each wrapped in its
compile-time `#if ENABLE_*` guard. The script parses both — brace- and string-aware,
so it handles multi-line entries and quoted help text that simple `grep`/`sed` miss —
plus the `SettingEntry` tables, which it joins to commands via each setting's `cmdKey`
(or its key). It emits each command's admin flag, usage syntax, feature gate, and the
type/range/default/options of any setting the command controls. It deliberately excludes
`System_SensorStubs.cpp`, whose disabled-build placeholder arrays mirror real command
tables and are not live registry entries.

A registered name may contain spaces (`cm5 status`, `cm5 power reboot`). The firmware
resolves a command line by the longest registered name that prefixes it, so each such row
is a distinct command. It is listed on its own under its module, in registry order, and
counted in the header totals.

The settings join uses the same longest-prefix rule. A `cmdKey` that is itself a registered
name (`matrixaddress`, or a multi-word row such as `cm5 power`) annotates that command with
the setting's type/range/default. A dispatcher-style `cmdKey` (`power mode`, `sensorlog interval`)
resolves through the shorter registered name; the settings catalog keeps the full editor
command and names the dispatcher it runs through. Generated provenance is the short Git
revision when the scanned source is clean. If `components/hardwareone/` or `main/` has
uncommitted source changes, it becomes `<commit>+dirty.<content-hash>`; unrelated notes
elsewhere in the checkout do not make the catalog dirty.

### Usage

```bash
# Regenerate the catalog (defaults: firmware ../HardwareOne, output ../references/…)
python3 tools/sync_command_reference.py

# Point at a firmware checkout elsewhere
python3 tools/sync_command_reference.py --firmware ~/esp/HardwareOne
HW1_FIRMWARE=~/esp/HardwareOne python3 tools/sync_command_reference.py

# Also emit a machine-readable catalog (for other tooling)
python3 tools/sync_command_reference.py --json references/cli-commands.json

# CI / pre-commit: fail (exit 1) if the committed catalog is stale; writes nothing
python3 tools/sync_command_reference.py --check

# Audit metadata gaps: settings whose UI-editor command isn't a registered command,
# plus command/setting range and enum-choice mismatches (writes nothing)
python3 tools/sync_command_reference.py --audit
```

`--check` ignores the firmware-source provenance line, so it only fails when the
actual command set has changed — not on every unrelated firmware commit.

### When to run it

After any firmware change that adds, renames, or removes a CLI command (or a whole
module), changes privilege metadata, help/usage text, a setting, or a setting's
`cmdKey`. Commit both regenerated reference files with the skill update.

### The firmware's own generator and audit

The firmware repository ships its own tooling in `tools/command_registry.py`:

```bash
# in the HardwareOne checkout
python3 tools/command_registry.py reference   # writes docs/COMMAND_REFERENCE.md
python3 tools/command_registry.py audit       # drift report; exit 1 on problems
```

`reference` writes the firmware's developer-facing `docs/COMMAND_REFERENCE.md` (name,
privilege, help and usage per command). `audit` detects duplicate names, unregistered
arrays, missing module arrays, unresolved command invocations in code, and `cmdKey`
values bound to no command. This skill's generator reads the same `CommandEntry` and
`SettingEntry` tables but produces the agent-facing catalogs: feature gates, admin and
super-admin markers, and the settings metadata (type, range, default, options, secret,
read-only) joined onto each command. Run both audits after a firmware change. The
firmware audit's findings are firmware issues to review; this generator reports the
source as-is and must not silently repair them. A quick cross-check is that the unique
command names in `cli-commands.generated.md` match the names in `docs/COMMAND_REFERENCE.md`.

Optional — wire it into the firmware repo's pre-commit hook so the catalog can never
silently fall behind:

```bash
python3 /absolute/path/to/this/skill/tools/sync_command_reference.py --check --quiet
```

### Requirements

Python 3.9+ (standard library only — no third-party packages). The firmware repo only
needs to be present on disk; `git` is optional and used solely for the commit-hash
provenance stamp.
