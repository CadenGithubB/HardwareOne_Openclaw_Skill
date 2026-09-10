# Changelog

Notable changes to the HardwareOne OpenClaw skill. Versioning follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security
- Pin explicit `http://` and `https://` device URLs to their configured scheme. Bare
  hosts now use HTTPS and can fall back to HTTP only after an HTTPS connection refusal
  when `HW1_ALLOW_HTTP=1` / `allowHttp: true` is explicitly configured.
- Reject redirects, non-200 responses, unexpected content types, oversized responses,
  and non-HardwareOne `/api/ping` payloads before sending login credentials. TLS errors
  and timeouts never authorize an HTTP downgrade.
- Isolate device requests from user curl configuration and ambient proxy variables,
  restrict curl to HTTP(S), and disable redirects.

### Added
- Focused fake-transport tests for scheme pinning, HTTP opt-in, downgrade resistance,
  pre-login endpoint recognition, and curl isolation.

## [1.7.0] — 2026-08-03

### Added
- Firmware 0.99.7 command coverage: events and notification policy, separate subsystem
  enable/autostart controls, crash/boot diagnostics, RAM-flush recovery, consent-based
  ESP-NOW pairing, capture encryption and R1 health tracking, expanded G2/R1 commands,
  and guided/domain-aware LLM controls.
- Super-admin command metadata in the generated catalog and agent error-recovery rules
  for the current `guest` / `user` / `admin` / `superadmin` role model.
- Reproducible dirty-source provenance: catalogs generated from uncommitted firmware
  source carry a content hash, while unrelated untracked notes do not mark them dirty.

### Changed
- Regenerated the exhaustive references from HardwareOne v0.99.7 (`ee87ea7`): 899
  unique command names, 903 registry entries across 44 modules, and 285 persisted
  settings (278 linked to registered commands/dispatcher forms).
- Command guidance now matches case-insensitive longest-prefix dispatch, including
  valid forms such as `automation list`, `power mode`, and `sensorlog interval`.
- Settings guidance now reflects immediate persistence and the explicit
  `beginwrite` → edits → `savesettings` batching workflow.
- Replaced the duplicated hand-maintained command list with a focused operating guide
  for permissions, compile/enable/autostart/live state, structured results, async
  retrieval, health capture, wearables, mesh/bonding, and camera use.
- Extended the host wrapper's slow-command timeout to `certgen`; RSA-2048 certificate
  generation is documented by firmware as taking roughly 30–60 seconds.
- Replaced private-LAN example addresses with RFC-reserved documentation ranges and
  removed setup-specific UI screenshots in favor of a neutral text walkthrough.

### Known firmware audit findings
- The firmware registry currently contains three unexpected duplicate names
  (`espnowenabled`, `pendinglist`, `serialrequireauth`) plus the intentional
  `voicecancel` alias. The skill reports registry entries as-is; it does not hide or
  modify firmware-owned metadata.
- Seven settings are intentionally or currently CLI-unlinked, and `espnowchannel`
  documents `1–13` while its stored setting accepts `0–13` (`0` is the review case).
- The firmware-authored `even_g2` module overview still mentions the removed standalone
  `g2mic` name; the registered `g2mic*` bullet rows are authoritative.

## [1.6.0] — 2026-08-02

### Added
- **`hardwareone_camera` — the agent can see.** A new gateway tool takes a photo with a
  device's camera and returns it to the (multimodal) agent as an image content block, so it
  can actually look at and describe what the device sees. It is a purpose-built "take a
  picture" verb — the gateway performs the fixed host-side `GET /api/sensors/camera/frame`;
  the agent never constructs a path (unlike the removed `hardwareone_get`). It works **only
  on `direct` HTTP/S devices** — a `via:"mesh"` peer has no HTTP to serve binary and is
  rejected cleanly. By default it starts the camera if it's off (`ensureOn`) and warms up
  within a longer timeout. Backed by a new binary-safe `hw1.sh --get-b64 <path>` fetch mode
  (the existing text `--get` path corrupts binary), reusable by future image/audio tools.

### Note
- Requires the OpenClaw runtime to pass image tool-results through to a **multimodal** model;
  verify this on the host before relying on it (older text-only model setups will ignore the
  image and see only the accompanying text line).

### Changed
- `hardwareone_camera` now describes the captured frame inside the gateway with OpenClaw's
  configured image model and returns that description as ordinary tool text alongside the
  image block. This avoids the OpenClaw path where the Control UI renders a tool-result image
  but the next model turn cannot consume it and invents a nonexistent sandbox filename.
- Install the gateway plugin through OpenClaw's managed local-plugin workflow and import
  `definePluginEntry` from the public plugin SDK. This replaces the fragile global
  `dist/extensions` copy and per-release hashed import that could leave an obsolete plugin
  active after an OpenClaw core upgrade.
- Return camera frames using OpenClaw's canonical top-level image fields (`data` and
  `mimeType`). The previous nested Anthropic `source` shape could render in the Control UI
  while being discarded as malformed before reaching the vision model.

## [1.5.0] — 2026-07-14

### Added
- **Two co-equal direct HTTP endpoints.** Configure several `role: master` direct devices in
  `hardwareone.devices.json` and control each by name — the transport layer already isolates
  their sessions/credentials per device. `buildRegistry` now deterministically picks an implicit
  default when `default` is omitted — the first `role: master` direct device by name (or the first
  direct device if none is a master), stable regardless of JSON key order — so bare/un-targeted
  commands no longer hard-fail with two masters. Two
  co-equal masters is reported as an informational `notes` entry (surfaced by
  `hardwareone_devices`) instead of a "multiple masters" warning that framed a valid setup as a
  misconfiguration.
- **Per-device `description`.** An optional operator-written string on any device (direct or
  mesh) describing its hardware/software setup; surfaced to the agent via `hardwareone_devices`
  (still never url/user/pass). Control characters are collapsed to spaces and the value is
  capped at 280 characters.
- **Automatic mesh relay.** A `via: "mesh"` device is now addressed by name exactly like a
  direct device — the gateway relays the command through the master (`espnowremote`, peer
  credentials injected host-side) and polls the async reply back, instead of rejecting the call
  with a pointer to relay manually. `hardwareone_ping` on a mesh device runs the ESP-NOW
  reachability probe. Mesh devices now require `user`+`pass` in the registry (for the relay),
  which must be space-free.

### Changed
- Agent-facing copy no longer presumes a single master: `SKILL.md` "Multiple devices",
  `DEVICE_PARAM`, and the ping/cli/devices tool descriptions refer to "the default device" and
  guide the agent to name each co-equal target (and to read the operator `description`).
- `hardwareone.devices.json.template`: documents co-equal masters, the `description` field, and
  the mesh `user`/`pass` requirement; the worked examples carry descriptions.

## [1.4.0] — 2026-06-28

CLI-only: the agent now does everything through `hardwareone_cli`. The `hardwareone_get`
HTTP-API tool is gone — it proved flaky in practice (the agent guessed wrong `/api/*`
paths and floundered), and the firmware's CLI command registry is the complete,
self-describing command bus behind every transport, so the web API was only a narrower,
staler subset.

### Removed
- The `hardwareone_get` tool — from the plugin (tool, manifest contract, and the
  `deploy.sh` allowlist, which now prunes any stale entry on redeploy), `SKILL.md`, and
  `references/api-reference.md`. The agent's toolset is now `hardwareone_ping` /
  `hardwareone_cli` / `hardwareone_devices`.

### Changed
- `SKILL.md`: the CLI is stated as the device's entire interface (no `/api/...` paths);
  bonding reads the peer with `bondshowremotemanifest`; and a fix for the `help`
  module-vs-command trap (`battery` is a module — the command is `battery status`).
- `references/api-reference.md`: retitled "CLI Reference"; the HTTP API section and the
  HTTP-status error table are removed.
- Deploy is now authoritative, so a redeploy can't leave stale files behind: `deploy.sh`
  does a clean plugin install (`rm -rf` the destination first), and `install.sh` syncs the
  skill with `rsync --delete` (your host-side `.env` is excluded, so it's preserved).

### Added
- The deploy bundle's `install.sh` + `INSTALL.md` are now tracked in the repo (`deploy/`),
  so the bundle is reproducible from source instead of living only in the zip.

## [1.3.1] — 2026-06-28

Documentation: agent guidance for the ESP-NOW **bonding** subsystem (a paired
master/worker), which the skill barely covered before — the agent only knew `bondstatus`.

### Added
- `SKILL.md` bonding section: the 1:1 master/worker model and how it differs from the
  mesh — bonding syncs the worker's capability/manifest/settings and streams its sensors,
  but running a command on the worker still goes through `espnowremote`. Covers the
  `bondconnect` → `bondstatus` → `bondresync` flow and reading the *peer's* data via
  `bondshowremotemanifest` / `GET /api/bond/*` instead of the local `bondshowcap` /
  `bondshowmanifest` (which report your own device).
- `SKILL.md` secure-pairing note: `espnowpairsecure` + `espnowsetpassphrase` set up the
  encrypted session bonding requires (status via `espnowencstatus` / `espnowsessions`).

### Fixed
- `SKILL.md` listed `bondstatus` as the mesh-topology check; corrected to
  `espnowmeshstatus` / `espnowmeshtopo`.

### Changed
- Example device names/IPs in `hardwareone.devices.json.template` are neutral placeholders
  (`node-a` / `node-b`).
- Repo tidy: dropped internal design/working notes from `docs/` (the design lives in the
  code, this changelog, and `SKILL.md`); `.gitignore` now excludes build `*.zip` bundles.

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
