#!/usr/bin/env python3
"""
sync_command_reference.py — Regenerate the HardwareOne CLI reference straight from
the firmware source of truth.

Every CLI command in the firmware is a `CommandEntry`:

    { "name", "help", requiresAdmin /*bool*/, handler, "usage"/*opt*/, ...voice }

grouped into per-module arrays aggregated, in order and wrapped in their `#if`
guards, by `gCommandModules[]` (System_Utils.cpp).

Most "configuration" commands are also `SettingEntry` rows:

    { "jsonKey", SETTING_TYPE, &gSettings.x, intDef, floatDef, "strDef",
      min, max, "label", "enum,options", isSecret, "group", "cmdKey", readOnly }

The CLI command for a setting is its `cmdKey` (or the `jsonKey` if none). This
script parses both tables, joins them, and emits:

  * references/cli-commands.generated.md — every command, with admin flag, usage
    syntax, the feature gate that compiles it in, and (for setting-backed commands)
    the value type / range / default / options pulled from the settings table.
  * references/settings.generated.md — every setting grouped by area, cross-linked
    to its command.

Re-run whenever the firmware changes; nothing here is hand-maintained.

Usage:
    tools/sync_command_reference.py [--firmware PATH] [--output PATH]
        [--settings-output PATH] [--json PATH] [--check] [--quiet]

Exit codes: 0 ok / 1 --check stale / 2 parse or IO error
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent

ARRAY_DEF_RE = re.compile(r"\bCommandEntry\s+(\w+)\s*\[\s*\]\s*[^=;{]*=\s*\{")
SETTING_ARRAY_DEF_RE = re.compile(r"\bSettingEntry\s+(\w+)\s*\[\s*\]\s*[^=;{]*=\s*\{")
MODULE_TABLE_RE = re.compile(r"\bgCommandModules\s*\[\s*\]\s*=\s*\{")
STRING_RE = re.compile(r'"((?:[^"\\]|\\.)*)"')
NAME_RE = re.compile(r"[A-Za-z][A-Za-z0-9_\-]*$")
SETTINGS_SUFFIX_RE = re.compile(r"(Settings?|Setting)(Entry|Entries)$")

SRC_SUFFIXES = {".cpp", ".cc", ".cxx", ".c", ".h", ".hpp"}
PROVENANCE_PREFIX = "> Firmware commit"
NUMERIC_TYPES = {
    "SETTING_INT", "SETTING_U8", "SETTING_U16", "SETTING_U32",
    "SETTING_I32", "SETTING_FLOAT",
}
AUDIT_RANGE_RE = re.compile(r"(-?\d+)\s*(?:\.\.|[-–—])\s*(-?\d+)")
AUDIT_CHOICE_RE = re.compile(r"[<\[]\s*([0-9]+(?:\s*\|\s*[0-9]+)+)\s*[>\]]")


# ── brace / field scanning (string- and comment-aware) ───────────────────────
def _match_brace(text: str, open_idx: int) -> int:
    """Index just past the '}' matching the '{' at open_idx (-1 if unbalanced)."""
    depth, i, n, in_str = 0, open_idx, len(text), None
    while i < n:
        c = text[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in "\"'":
            in_str = c
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            j = text.find("\n", i)
            i = n if j == -1 else j
            continue
        elif c == "/" and i + 1 < n and text[i + 1] == "*":
            j = text.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def _top_entries(block: str):
    """The text inside each top-level `{ ... }` group of an array body."""
    out, depth, start, i, n, in_str = [], 0, None, 0, len(block), None
    while i < n:
        c = block[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in "\"'":
            in_str = c
        elif c == "/" and i + 1 < n and block[i + 1] == "/":
            j = block.find("\n", i)
            i = n if j == -1 else j
            continue
        elif c == "/" and i + 1 < n and block[i + 1] == "*":
            j = block.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        elif c == "{":
            if depth == 0:
                start = i + 1
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start is not None:
                out.append(block[start:i])
                start = None
        i += 1
    return out


def _split_fields(body: str):
    """Split one initializer body on top-level commas (ignoring commas inside
    strings or any (), [], {} — e.g. lambdas, casts, nested inits)."""
    fields, cur, depth, i, n, in_str = [], [], 0, 0, len(body), None
    while i < n:
        c = body[i]
        if in_str:
            cur.append(c)
            if c == "\\" and i + 1 < n:
                cur.append(body[i + 1])
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in "\"'":
            in_str = c
            cur.append(c)
        elif c == "/" and i + 1 < n and body[i + 1] == "/":
            j = body.find("\n", i)
            i = n if j == -1 else j
            continue
        elif c == "/" and i + 1 < n and body[i + 1] == "*":
            j = body.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        elif c in "([{":
            depth += 1
            cur.append(c)
        elif c in ")]}":
            depth -= 1
            cur.append(c)
        elif c == "," and depth == 0:
            fields.append("".join(cur).strip())
            cur = []
        else:
            cur.append(c)
        i += 1
    last = "".join(cur).strip()
    if last:
        fields.append(last)
    return fields


def _unescape(s: str) -> str:
    s = s.replace('\\"', '"').replace("\\\\", "\\").replace("\\n", " ").replace("\\t", " ")
    return " ".join(s.split())


def _as_str(field):
    """Concatenated string literal(s) in a field, or None for nullptr / non-string."""
    if field is None:
        return None
    lits = STRING_RE.findall(field)
    if not lits:
        return None
    return _unescape("".join(lits))


def _is_true(field) -> bool:
    return field is not None and field.strip() == "true"


# ── parsing entries ──────────────────────────────────────────────────────────
def _parse_command(body):
    f = _split_fields(body)
    if not f:
        return None
    name = _as_str(f[0])
    if not name or not NAME_RE.match(name):
        return None
    return {
        "name": name,
        "help": (_as_str(f[1]) if len(f) > 1 else "") or "",
        "admin": len(f) > 2 and f[2].strip() == "true",
        "usage": _as_str(f[4]) if len(f) > 4 else None,
    }


def _parse_setting(body, area):
    f = _split_fields(body)
    if len(f) < 3:
        return None
    key = _as_str(f[0])
    typ = f[1].strip() if len(f) > 1 else ""
    if not key or not typ.startswith("SETTING_"):
        return None

    def g(i):
        return f[i].strip() if len(f) > i else None

    s = {
        "key": key,
        "type": typ,
        "intDefault": g(3),
        "floatDefault": g(4),
        "stringDefault": _as_str(f[5]) if len(f) > 5 else None,
        "min": g(6),
        "max": g(7),
        "label": _as_str(f[8]) if len(f) > 8 else None,
        "options": _as_str(f[9]) if len(f) > 9 else None,
        "secret": _is_true(g(10)),
        "group": _as_str(f[11]) if len(f) > 11 else None,
        "cmdKey": _as_str(f[12]) if len(f) > 12 else None,
        "readOnly": _is_true(g(13)),
        "area": area,
    }
    s["command"] = (s["cmdKey"] or s["key"])
    return s


def _settings_area(var: str) -> str:
    return SETTINGS_SUFFIX_RE.sub("", var) or var


# ── settings value helpers ───────────────────────────────────────────────────
_OPTION_RE = re.compile(r"^\s*(-?\d+)\s*[:|]\s*(.+?)\s*$")


def _enum_options(s):
    """Parse the options CSV into (index|None, label) pairs. Handles both the
    `index:Label` and `index|Label` firmware conventions."""
    if not s.get("options"):
        return []
    out = []
    for seg in s["options"].split(","):
        seg = seg.strip()
        if seg:
            m = _OPTION_RE.match(seg)
            out.append((int(m.group(1)), m.group(2).strip()) if m else (None, seg))
    return out


def _render_options(opts):
    if all(idx is not None for idx, _ in opts):
        return ", ".join(f"{idx}={label}" for idx, label in opts)
    return ", ".join(label for _, label in opts)


def _setting_default(s):
    t, opts = s["type"], _enum_options(s)
    if t == "SETTING_BOOL":
        return "on" if (s["intDefault"] in ("1", "true")) else "off"
    if t == "SETTING_FLOAT":
        v = (s["floatDefault"] or "").rstrip("f")
        return v or "0"
    if t == "SETTING_STRING":
        if s["secret"]:
            return "(hidden)"
        return f'"{s["stringDefault"]}"' if s["stringDefault"] else "(empty)"
    # integer-like
    iv = s["intDefault"]
    if opts and iv and iv.lstrip("-").isdigit():
        idx = int(iv)
        for oi, label in opts:
            if oi == idx:
                return f"{idx} ({label})"
    return iv or "0"


def _setting_range(s):
    if s["type"] not in NUMERIC_TYPES or s["type"] == "SETTING_FLOAT":
        return None
    lo, hi = s["min"], s["max"]
    if lo is None or hi is None or (lo == "0" and hi == "0"):
        return None
    return f"{lo}–{hi}"  # en dash


def _type_label(s):
    if _enum_options(s):
        return "enum"
    return {
        "SETTING_BOOL": "bool", "SETTING_FLOAT": "float", "SETTING_STRING": "string",
    }.get(s["type"], "int")


def _setting_annotation(s):
    tl = _type_label(s)
    parts = [tl]
    if tl != "enum":                       # for an enum, the options list IS the range
        rng = _setting_range(s)
        if rng:
            parts[0] = f"{tl} {rng}"
    parts.append(f"default {_setting_default(s)}")
    opts = _enum_options(s)
    if opts and tl == "enum":
        parts.append("options " + _render_options(opts))
    if s["secret"]:
        parts.append("secret")
    if s["readOnly"]:
        parts.append("read-only")
    return "setting · " + " · ".join(parts)


# ── firmware collection ──────────────────────────────────────────────────────
def collect(firmware: Path):
    roots = [firmware / "components" / "hardwareone", firmware / "main"]
    files = sorted(
        p for root in roots if root.is_dir()
        for p in root.rglob("*") if p.suffix in SRC_SUFFIXES
    )
    if not files:
        raise SystemExit(f"error: no firmware sources under {roots[0]} — check --firmware")

    cmd_arrays: dict[str, list] = {}
    settings: list = []
    seen_setting_arrays: dict[str, int] = {}
    module_block = None
    warnings: list[str] = []

    for f in files:
        text = f.read_text(errors="replace")
        # Firmware-specific macros that appear inside usage/help string literals.
        # This is a text parser, not a compiler, so substitute with a readable
        # placeholder. HW_GPIO_MAX_STR expands to the board's max GPIO number
        # on-device (39 on classic ESP32 / 48 on ESP32-S3); show it board-agnostically.
        text = text.replace("HW_GPIO_MAX_STR", '"N"')

        for m in ARRAY_DEF_RE.finditer(text):
            var = m.group(1)
            end = _match_brace(text, m.end() - 1)
            if end == -1:
                warnings.append(f"unbalanced CommandEntry array '{var}' in {f.name}")
                continue
            entries = [e for e in (_parse_command(s) for s in _top_entries(text[m.end():end - 1])) if e]
            if var not in cmd_arrays or len(entries) > len(cmd_arrays[var]):
                cmd_arrays[var] = entries

        for m in SETTING_ARRAY_DEF_RE.finditer(text):
            var = m.group(1)
            end = _match_brace(text, m.end() - 1)
            if end == -1:
                warnings.append(f"unbalanced SettingEntry array '{var}' in {f.name}")
                continue
            area = _settings_area(var)
            entries = [e for e in (_parse_setting(s, area) for s in _top_entries(text[m.end():end - 1])) if e]
            if seen_setting_arrays.get(var, -1) < len(entries):
                # replace any prior (shorter) parse of the same array
                settings = [s for s in settings if s.get("_var") != var]
                for e in entries:
                    e["_var"] = var
                settings.extend(entries)
                seen_setting_arrays[var] = len(entries)

        if module_block is None:
            mt = MODULE_TABLE_RE.search(text)
            if mt:
                end = _match_brace(text, mt.end() - 1)
                if end != -1:
                    module_block = text[mt.end():end - 1]

    if module_block is None:
        raise SystemExit("error: could not locate gCommandModules[] in firmware sources")

    modules = _parse_module_table(module_block, warnings)
    for mod in modules:
        cmds = cmd_arrays.get(mod["array"])
        if cmds is None:
            warnings.append(f"module '{mod['name']}' -> array '{mod['array']}' not found")
            cmds = []
        mod["commands"] = cmds

    stats = _join_settings(modules, settings, warnings)
    return modules, settings, warnings, stats


def _brace_delta(s: str) -> int:
    """Net change in brace depth across one line (string/comment aware).
    Braces inside string literals (e.g. an overview containing `{a,b}`) are ignored."""
    depth, i, n, in_str = 0, 0, len(s), None
    while i < n:
        c = s[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in "\"'":
            in_str = c
        elif c == "/" and i + 1 < n and s[i + 1] == "/":
            break
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        i += 1
    return depth


def _parse_module_table(block, warnings):
    """Brace-aware parse of gCommandModules[]. Rows may span many lines because the
    long_description (field 3) is a wrapped, multi-literal C string. Preprocessor
    guards (#if/#endif) sit between rows at depth 0 and are tracked into each row."""
    modules, cond = [], []
    buf, depth = "", 0
    for raw in block.splitlines():
        line = raw.strip()
        if depth == 0 and not buf and line.startswith("#"):
            pp = line[1:].strip().split(None, 1)
            kw = pp[0] if pp else ""
            arg = pp[1].strip() if len(pp) > 1 else ""
            if kw in ("if", "ifdef", "ifndef"):
                cond.append(arg)
            elif kw == "elif" and cond:
                cond[-1] = arg
            elif kw == "else" and cond:
                cond[-1] = f"!({cond[-1]})"
            elif kw == "endif" and cond:
                cond.pop()
            continue
        if depth == 0 and not buf and not line.startswith("{"):
            continue  # blank / comment line between rows
        buf += raw + "\n"
        depth += _brace_delta(raw)
        if depth <= 0 and buf.strip():
            _emit_module_row(buf.strip(), list(cond), modules, warnings)
            buf, depth = "", 0
    if buf.strip():
        warnings.append(f"unparsed trailing module text: {buf.strip()[:60]}")
    return modules


def _emit_module_row(row_text, cond, modules, warnings):
    """Parse one `{ name, description, long_description, array, count, flags, isConnected }`
    row. Fields are split top-level so commas inside the wrapped overview don't fool us."""
    lb, rb = row_text.find("{"), row_text.rfind("}")
    if lb == -1 or rb == -1 or rb < lb:
        warnings.append(f"unparsed module row: {row_text[:60]}")
        return
    f = _split_fields(row_text[lb + 1:rb])
    if len(f) < 6:
        warnings.append(f"module row has {len(f)} fields (<6): {row_text[:60]}")
        return
    name = _as_str(f[0])
    if not name:
        warnings.append(f"module row missing name: {row_text[:60]}")
        return
    modules.append({
        "name": name,
        "description": _as_str(f[1]) or "",
        "long_description": _as_str(f[2]),  # None when the row leaves it nullptr
        "array": f[3].strip(),
        "flags": f[5].strip(),
        "guard": " && ".join(c for c in cond if c) or None,
    })


def _join_settings(modules, settings, warnings):
    """Attach each setting to its CLI command (cmdKey, else jsonKey, else area+key)."""
    by_lower = {}
    for mod in modules:
        for c in mod["commands"]:
            by_lower.setdefault(c["name"].lower(), c)
    matched = 0
    for s in settings:
        candidates = [s["cmdKey"], s["key"], f"{s['area']}{s['key']}"]
        hit = next((by_lower[c.lower()] for c in candidates if c and c.lower() in by_lower), None)
        if hit is not None:
            if "setting" in hit:
                warnings.append(f"setting collision on command '{hit['name']}' ({s['key']})")
                s["command"] = hit["name"]
                continue
            hit["setting"] = s
            s["command"] = hit["name"]
            matched += 1
        else:
            s["command"] = None
    return {
        "commands": sum(len(m["commands"]) for m in modules),
        "modules": len(modules),
        "settings": len(settings),
        "settings_matched": matched,
        "settings_orphan": len(settings) - matched,
        "with_usage": sum(1 for m in modules for c in m["commands"] if c.get("usage")),
    }


def firmware_commit(firmware: Path):
    try:
        r = subprocess.run(["git", "-C", str(firmware), "rev-parse", "--short", "HEAD"],
                           capture_output=True, text=True, timeout=5)
        return r.stdout.strip() or None
    except Exception:
        return None


# ── rendering ────────────────────────────────────────────────────────────────
def _command_line(c):
    line = f"- `{c['name']}`"
    if c["admin"]:
        line += " *(admin)*"
    if c["help"]:
        line += f" — {c['help']}"
    usage = c.get("usage")
    if usage:
        usage = re.sub(r"^[Uu]sage:\s*", "", usage)
        line += f" · `{usage}`"
    if c.get("setting"):
        line += f" _({_setting_annotation(c['setting'])})_"
    return line


def render_commands(modules, commit, stats):
    out = ["# HardwareOne — CLI Command Catalog", ""]
    out += ["<!-- GENERATED FILE — DO NOT EDIT BY HAND.",
            "     Regenerate with: tools/sync_command_reference.py",
            "     Source of truth: firmware gCommandModules[] + SettingEntry tables. -->", ""]
    c = f"`{commit}`" if commit else "(unknown)"
    out.append(f"{PROVENANCE_PREFIX} {c} · {stats['commands']} commands · {stats['modules']} modules")
    out += ["",
            "Generated directly from the firmware command tables, so it always matches the "
            "build it came from. **Feature gating still applies:** a module whose compile guard "
            "is not defined is absent entirely — run `features` on the device for live "
            "`[ON]`/`[OFF]`/`[N/C]` state. Admin-only commands are marked *(admin)*. Commands "
            "backed by a stored setting show their value type / range / default / options; see "
            "[`settings.generated.md`](settings.generated.md) for the full configuration view.",
            "", "## Modules", "", "| Module | Compiled when | Commands |",
            "|--------|---------------|----------|"]
    for m in modules:
        gate = "always" if not m["guard"] else f"`{m['guard']}`"
        out.append(f"| `{m['name']}` | {gate} | {len(m['commands'])} |")
    out.append(f"| **Total** | | **{stats['commands']}** |")
    out += ["", "## Commands by module"]
    for m in modules:
        out += ["", f"### `{m['name']}` — {m['description']}", "",
                "_Always compiled._" if not m["guard"] else f"_Requires `{m['guard']}`._", ""]
        if m.get("long_description"):
            out += [m["long_description"], ""]
        if not m["commands"]:
            out.append("_(no commands parsed)_")
            continue
        out += [_command_line(c) for c in m["commands"]]
    out.append("")
    return "\n".join(out)


def render_settings(settings, commit, stats):
    out = ["# HardwareOne — Settings Catalog", ""]
    out += ["<!-- GENERATED FILE — DO NOT EDIT BY HAND.",
            "     Regenerate with: tools/sync_command_reference.py -->", ""]
    c = f"`{commit}`" if commit else "(unknown)"
    out.append(f"{PROVENANCE_PREFIX} {c} · {stats['settings']} settings · "
               f"{stats['settings_matched']} linked to commands")
    out += ["",
            "Every persisted setting, grouped by area. Each setting is read/written by the CLI "
            "command shown (its `cmdKey`, else its key). Set a value with that command; persist "
            "with `savesettings`. Values marked **secret** are encrypted on disk and never echoed; "
            "**read-only** values are device-managed (e.g. counters).", ""]
    by_area: dict[str, list] = {}
    for s in settings:
        by_area.setdefault(s["area"], []).append(s)
    for area in sorted(by_area):
        out += ["", f"### {area}", ""]
        for s in sorted(by_area[area], key=lambda x: x["key"]):
            label = s["label"] or s["key"]
            cmd = f"`{s['command']}`" if s["command"] else f"`{s['cmdKey'] or s['key']}` _(no distinct command)_"
            out.append(f"- **{label}** (`{s['key']}`) — {_setting_annotation(s)} · command {cmd}")
    out.append("")
    return "\n".join(out)


def _as_int(x):
    try:
        return int(str(x), 0)  # base 0 → handles "1023" and "0x3FF" alike
    except (ValueError, TypeError):
        return None


def render_audit(modules, settings, commit):
    """Report metadata gaps that silently break things — derived from the same
    settings<->command join used to build the catalogs."""
    all_cmd = sorted({c["name"] for m in modules for c in m["commands"]})
    out = [f"HardwareOne metadata audit  ·  firmware {commit or 'unknown'}", ""]

    # [A] settings whose UI editor would run a command that isn't registered.
    cmd_lower = {n.lower() for n in all_cmd}

    def _editor_cmd_works(s):
        # The editor sends "<cmdKey-or-key> <value>"; a subcommand form like
        # "sensorlog autostart" works as long as its FIRST token is a real command.
        toks = (s["cmdKey"] or s["key"]).split()
        return bool(toks) and toks[0].lower() in cmd_lower

    orphans = [s for s in settings if s["command"] is None and not _editor_cmd_works(s)]
    out.append(f"[A] {len(orphans)} setting(s) whose editor command is NOT a registered command")
    out.append("    The OLED/web settings editor runs `<cmdKey-or-key> <value>`; if that command does")
    out.append("    not exist, editing the setting silently no-ops. Point cmdKey at the real command,")
    out.append("    or confirm the setting is intentionally CLI-less.")
    for s in sorted(orphans, key=lambda x: (x["area"].lower(), x["key"].lower())):
        ui_cmd = s["cmdKey"] or s["key"]
        hint = [n for n in all_cmd if n.lower().startswith(s["area"].lower())][:5]
        tail = f"   ~ {', '.join(hint)}" if hint else ""
        out.append(f"    {s['area']:<14} {s['key']:<28} sends `{ui_cmd}`{tail}")
    out.append("")

    # [B] a setter command whose stated numeric range disagrees with its setting.
    rmism = []
    for m in modules:
        for c in m["commands"]:
            st = c.get("setting")
            if not st or st["type"] not in NUMERIC_TYPES or st["type"] == "SETTING_FLOAT":
                continue
            lo, hi = st["min"], st["max"]
            if lo is None or hi is None or (lo == "0" and hi == "0"):
                continue
            mm = AUDIT_RANGE_RE.search(f"{c['help']} {c.get('usage') or ''}")
            if not mm:
                continue
            a_lo, a_hi, s_lo, s_hi = (_as_int(mm.group(1)), _as_int(mm.group(2)),
                                      _as_int(lo), _as_int(hi))
            if None not in (a_lo, a_hi, s_lo, s_hi) and (a_lo, a_hi) != (s_lo, s_hi):
                rmism.append((c["name"], f"{mm.group(1)}-{mm.group(2)}", f"{lo}-{hi}", st["key"]))
    out.append(f"[B] {len(rmism)} command(s) whose stated range disagrees with the setting (review)")
    for name, says, real, key in sorted(rmism):
        out.append(f"    {name:<24} help says {says:<10} setting is {real}  ({key})")
    out.append("")

    # [C] a setter command whose stated value-choices count disagrees with the enum.
    cmism = []
    for m in modules:
        for c in m["commands"]:
            st = c.get("setting")
            if not st:
                continue
            opts = _enum_options(st)
            if not opts:
                continue
            cm = AUDIT_CHOICE_RE.search(f"{c['help']} {c.get('usage') or ''}")
            if cm:
                stated = cm.group(1).replace(" ", "").split("|")
                if len(stated) != len(opts):
                    cmism.append((c["name"], cm.group(1), len(opts), st["key"]))
    out.append(f"[C] {len(cmism)} command(s) whose stated choices disagree with the enum options (review)")
    for name, says, n, key in sorted(cmism):
        out.append(f"    {name:<24} help shows <{says}>  setting has {n} options  ({key})")
    out.append("")
    return "\n".join(out)


def _comparable(text: str) -> str:
    return "\n".join(ln for ln in text.splitlines() if not ln.startswith(PROVENANCE_PREFIX))


# ── CLI ──────────────────────────────────────────────────────────────────────
def _write_or_check(path: Path, text: str, check: bool, quiet: bool):
    if check:
        if not path.exists():
            print(f"CHECK FAILED: {path} does not exist", file=sys.stderr)
            return False
        if _comparable(path.read_text()) != _comparable(text):
            print(f"CHECK FAILED: {path} is stale — regenerate and commit", file=sys.stderr)
            return False
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    if not quiet:
        rel = path.relative_to(SKILL_ROOT) if path.is_relative_to(SKILL_ROOT) else path
        print(f"wrote {rel}")
    return True


def main(argv=None):
    default_fw = os.environ.get("HW1_FIRMWARE") or str((SKILL_ROOT / ".." / "hardwareone-idf").resolve())
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--firmware", default=default_fw)
    ap.add_argument("--output", default=str(SKILL_ROOT / "references" / "cli-commands.generated.md"))
    ap.add_argument("--settings-output", default=str(SKILL_ROOT / "references" / "settings.generated.md"))
    ap.add_argument("--json", default=None, help="also write a combined machine-readable catalog")
    ap.add_argument("--check", action="store_true", help="exit 1 if any output is stale (writes nothing)")
    ap.add_argument("--audit", action="store_true",
                    help="report metadata gaps (orphan settings, range/choice mismatches); writes nothing")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    firmware = Path(args.firmware).expanduser().resolve()
    if not firmware.is_dir():
        print(f"error: firmware path not found: {firmware}", file=sys.stderr)
        return 2

    modules, settings, warnings, stats = collect(firmware)
    commit = firmware_commit(firmware)

    if args.audit:
        print(render_audit(modules, settings, commit))
        return 0

    if not args.quiet:
        print(f"firmware : {firmware}  (commit {commit or 'unknown'})")
        print(f"modules  : {stats['modules']}")
        print(f"commands : {stats['commands']}  ({stats['with_usage']} with usage syntax)")
        print(f"settings : {stats['settings']}  ({stats['settings_matched']} linked, "
              f"{stats['settings_orphan']} unlinked)")
        for w in warnings:
            print(f"warning: {w}", file=sys.stderr)

    cmd_md = render_commands(modules, commit, stats)
    set_md = render_settings(settings, commit, stats)

    if args.check:
        ok = _write_or_check(Path(args.output), cmd_md, True, args.quiet)
        ok = _write_or_check(Path(args.settings_output), set_md, True, args.quiet) and ok
        if ok and not args.quiet:
            print("check: catalogs are up to date")
        return 0 if ok else 1

    _write_or_check(Path(args.output), cmd_md, False, args.quiet)
    _write_or_check(Path(args.settings_output), set_md, False, args.quiet)

    if args.json:
        for m in modules:
            for c in m["commands"]:
                c.pop("_var", None)
        for s in settings:
            s.pop("_var", None)
        jp = Path(args.json)
        jp.parent.mkdir(parents=True, exist_ok=True)
        jp.write_text(json.dumps(
            {"firmware_commit": commit, "stats": stats, "modules": modules, "settings": settings},
            indent=2))
        if not args.quiet:
            print(f"wrote {jp}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
