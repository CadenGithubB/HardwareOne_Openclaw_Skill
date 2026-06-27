# HardwareOne Multi-Device — Phase 1 spec

Status: design, in implementation. The agent can address N HardwareOne devices by
name, defaults to the **master**, over direct HTTP, with **backup failover** and the
topology stored in the agent's memory vault. Existing single-device setups are
unchanged. Mesh-only peers are reached by the agent via `espnowremote` on the master
(no new gateway code — the "agent uses what's set, no auto-rerouting" decision).

## Information layers (keep topology out of the public skill)

| Layer | Holds | Lives in | Public |
| ----- | ----- | -------- | ------ |
| Skill | the mechanism (device param, list tool, "consult memory") | `SKILL.md` | yes |
| Host registry | connection: name → ip/creds/role | `~/.openclaw/hardwareone.devices.json` (or flat `hardwareone.env`) | no |
| Agent memory | the network shape (meaning/topology) | Obsidian vault note `homelab/hardwareone-setup` | no |

The agent never sees an IP or credential — only device **names** and **roles**. The
gateway maps name → connection privately.

## 1. Registry — the device list (`~/.openclaw/hardwareone.devices.json`, host-only)

A structured JSON file. The gateway parses it; `hw1.sh` never sees it. Device names are
free identifiers (**not** rooms) — a device's room/location is a device property
(`espnowroom`/`espnowzone`/`espnowtags`) and lives in the agent's memory note, never here.

```json
{
  "default": "gold",
  "defaults": { "user": "admin", "pass": "secret", "allowSelfSigned": true },
  "devices": {
    "gold":     { "url": "192.168.0.237", "role": "master" },
    "garage":   { "url": "192.168.0.51",  "role": "worker" },
    "backup-1": { "url": "192.168.0.88",  "role": "backup" }
  }
}
```

- `defaults` is merged into every device (per-device fields override). Per-device fields:
  `url`, `user`, `pass`, `role` (master|worker|backup), `allowSelfSigned`, `cacert`, and
  optional `connectTimeout` / `timeout` / `timeoutLong` / `authProbe`.
- A `"via": "mesh"` device has no `url`/creds — it's reached only through the master's
  `espnowremote`, listed as `access: "mesh"`, and a direct call to it is rejected. Exactly
  one DIRECT `master` is the HTTP entry point and the mesh jumping-off point.
- Backward-compatible: no `devices.json` → fall back to the flat `hardwareone.env`
  (`HW1_URL`/`HW1_USER`/`HW1_PASS`) as one `default` master. Existing setups: untouched.
- Validation (gateway): each DIRECT device needs `url`/`user`/`pass` (mesh devices need
  neither); exactly one direct `master` (else set `"default"`); the default must be direct;
  unknown device names rejected.

## 2. `hw1.sh` changes (small)

- **Per-device session isolation**: `COOKIE_DIR="${HW1_COOKIE_DIR:-/tmp/hw1}"`, created
  with `mkdir -p`. The gateway sets `/tmp/hw1/<device>` so cookie jar + http/https
  base-URL cache are per device.
- **Unreachable exit code**: `resolve_base` failure → `exit 7` (was `exit 1`), so the
  gateway can fail over. App/auth/HTTP errors stay `exit 1`.
- **TLS flag renamed**: `HW1_INSECURE` → `HW1_ALLOW_SELF_SIGNED` (old name kept as a
  deprecated alias).

## 3. Gateway plugin (`plugin/hardwareone-tool.js`)

- `buildRegistry()` parses the JSON registry (applying `defaults`), or the legacy flat
  env → `{name → {url,user,pass,role,allowSelfSigned,cacert,…}}` + a default.
- Target resolution per call: explicit `device` → that device (no failover — you asked
  for it). No `device` → default (`"default"`, else the master); if the master is
  unreachable (`exit 7` or an unreachable stderr message) and a `backup` exists → retry
  once on the backup, and report the failover.
- Connection passed to `hw1.sh` via `spawn`'s `env:` (`HW1_URL/USER/PASS/
  ALLOW_SELF_SIGNED/CACERT` + per-device `HW1_COOKIE_DIR`). `hw1.sh` prefers env over file.
- `device?` added to the three tools (optional, validated/rejected if unknown).
- New tool `hardwareone_devices { probe? }` → `[{name, role, default}]`; with
  `probe:true`, parallel `--ping` each and add `online`. Names + roles only, never creds.

## 4. SKILL.md — generic "Multiple devices" section (no device names)

Default → master; target another with `device`. List via `hardwareone_devices`.
Capabilities vary per device (run `features` each). Topology lives in memory — find it
with `note_search hardwareone`, read at session start, update on change (durable facts
only). Mesh-only peers reached via the master's `espnowremote`. Roles: master = default
+ relay; backup takes over if the master is unreachable; the rest are workers — the
`hardwareone_devices` role is the configured hint, the live role is `espnowmeshrole`.

## 5. Vault-note contract — `homelab/hardwareone-setup`

Agent-maintained via `note_write`. Body-only (plugin adds `# hardwareone-setup` +
`_updated_`), plain English, no emoji, first line = the Index blurb. Found via
`note_search hardwareone`. Holds the durable shape (names, roles, locations, what each
is, direct-vs-mesh); never IPs, live status, or firmware versions (get those live).

## 6. Wiring + deploy
- `openclaw.json`: add `hardwareone_devices` to `tools.alsoAllow` and
  `sandbox.tools.alsoAllow`; `deploy.sh` ensures both.
- Refresh deploy bundle; redeploy. Ship as 1.3.0 + CHANGELOG.

## 7. Edge cases
- Master down + no backup → report unreachable (no failover). Master down + backup that
  is also the firmware backup-master → HTTP default and mesh relay both recover.
- Unknown `device` → clear rejection. 0/2 masters → require `"default"`.
- Per-device feature/firmware variance → agent runs `features` per device. Registry-vs-
  live role drift → agent reconciles, notes it.

## 8. Build order
1. `hw1.sh` (cookie dir + exit 7 + flag rename) — testable standalone.
2. Plugin (JSON registry, resolve+failover, `device` param, `hardwareone_devices`, spawn env).
3. `hardwareone.devices.json.template` + `.env.template` backward-compat shim.
4. `openclaw.json` allowlist + `deploy.sh`.
5. SKILL.md section.
6. Seed the vault note; verify the agent reads/updates it.
7. Test: single-device regression → two-device targeting → failover → mesh-only.
8. Version bump (1.3.0) + changelog + redeploy.

## Out of scope (Phase 2+)
Transparent gateway relay for mesh-only (chose explicit), parallel fan-out, auto-
discovery wizard, mDNS/hostname resolution.
