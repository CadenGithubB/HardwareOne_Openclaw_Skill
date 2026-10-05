# Changelog

Notable changes to the HardwareOne OpenClaw skill. Versioning follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.8.0] — 2026-10-05

Catch-up with eleven firmware releases. The skill was last synced to HardwareOne
v0.99.7; this release regenerates everything from v0.99.96 plus unreleased work
(`a172013`) and teaches the agent the subsystems that arrived in between: signed OTA,
the ESP32-C6 radio companion, the Raspberry Pi co-processor, a backend-selectable
LLM, local speech-to-text, the LED matrix, multi-hop mesh routing, session epochs,
and inline `confirm` words. The firmware repository was renamed from
`hardwareone-idf` to `HardwareOne`.

### Added
- Firmware 0.99.8 through 0.99.96 plus unreleased work (`a172013`) command coverage:
  eight new modules (`c6`, `ota`, `cm5`, `stt`, `transcription`, `health`, `matrix`,
  `liveaudio`; `c6` is post-0.99.96), 55 commands and 22 settings. `SKILL.md` gains
  recipes for the signed OTA lifecycle, the radio companion, the Pi co-processor,
  local STT and transcription, the LED matrix, multi-hop mesh routing, `power json`,
  and the new `Firmware & OTA` and `Radio companion` event families.
- Sessions and identity guidance: every transport carries a session epoch, a refusal
  ending `before command execution.` is retried once, `whoami` reports the account
  name, an `(admin)` marker and the transport, and `guest` is a real view-only role
  that the web server refuses before any command runs, so nothing (not even `whoami`)
  works through the gateway for it.
- Confirmation-prompt guidance: the gateway is a machine transport that can neither
  open nor answer interactive yes/no prompts, so the agent uses the inline `confirm`
  word where the catalog shows one and otherwise reports that a human session is
  needed. The plugin README carries the same gotcha.
- `references/api-reference.md` sections for sessions and epochs, confirmation and
  machine transports, signed OTA, the radio companion, the Pi co-processor, local STT
  and transcription, the LED matrix, power, and WiFi radio ownership. "Delivery is not
  completion" now lists the queued operations (`ringscan`/`ringconnect` →
  `ringstatus`, `g2recover` → `g2status`, OTA and ring writes answering with a
  transaction handle, `cm5 power`/`cm5 fan` requests, `stt` sessions).
- Wrapper exit-code contract: 0 ok; 1 transport or configuration error; 3 the device
  executed the request and rejected the command, with stdout holding exactly the
  device's own diagnostic text; 7 device unreachable (the plugin fails over on it).
  A CLI command fails over on exit 7 alone: the wrapper exits 7 only from its pre-login
  probe, so a transport error after that (exit 1) may mean the command already reached
  the master, and it is never re-run on the backup. The read-only ping still fails over
  on the wrapper's transport-error wording.
  A malformed `HW1_URL` (unsupported scheme, no host, a path or query) now exits 1
  instead of 7, so a configuration typo never triggers failover; a refused
  connection or a probe that did not answer as a HardwareOne device still exits 7.
  Documented in the wrapper header, its usage text, the plugin README, and the root
  README. A 401 on a command earns exactly one re-login and one retry; a second 401
  exits 1 with the device's own text instead of logging in a third time.
- Plugin unit tests (`plugin/hardwareone-tool.test.js`, run with `node --test`) for
  the input cap and the non-ASCII refusal, exit-3 pass-through, the mesh relay
  surfacing a master's rejection, the slow-command spawn timeout, the mesh frame
  cap, and the camera reporting `opencamera`'s own refusal; the wrapper transport
  suite grows to 138 assertions covering 200, 400, 401-then-200, persistent 401,
  403, 429, 500, the exit-1 versus exit-7 split, and the slow-command timeout list
  in every spelling the firmware accepts.
- The plugin now waits as long as the wrapper does: `hardwareone_cli` spawns the
  wrapper under the device's `timeout` / `HW1_TIMEOUT` (default 30 s) for an ordinary
  command and, for the same first-word list the wrapper uses (`llmgenerate`,
  `llmload`, `llmask`, `opencamera`, `certgen`, `c6update`, `otastage`, `otaupdate`,
  `stt`), under the device's `timeoutLong` / `HW1_TIMEOUT_LONG` (default 300 s) plus
  that per-request cap as grace for the probe and a re-login, instead of killing every
  call at a fixed 30 s before the wrapper's own cap could matter. The caps and the
  `Error: hardwareone timeout after <N>ms` text are documented in the plugin README,
  the templates and the skill's error table. `details.timeoutMs` reports the cap a
  call ran under.
- The wrapper lower-cases the slow-command first word with `tr`, so `hw1.sh` still runs
  under the bash 3.2 that macOS ships (`${var,,}` needs bash 4).
- A command relayed to a mesh device is refused up front, with the limit named, when
  `user:pass:cmd` cannot fit the master's 217-byte `espnowremote` payload (a payload
  over one frame's 202 plaintext bytes goes out as an encrypted multi-fragment
  message), rather than after a wrapper round trip to the master's own "too long"
  text. The refusal names the command's own length only, never the credential-derived
  byte total. The tool descriptions and `SKILL.md` say mesh commands stay under roughly
  190 characters.
- `hardwareone_camera` keeps the result of its automatic `opencamera` and reports the
  device's own reason (`Camera is disabled`, `Camera initialization failed`, a role
  error) instead of a generic "not started, retry with ensureOn" message.
- Focused fake-transport tests for scheme pinning, HTTP opt-in, downgrade resistance,
  pre-login endpoint recognition, and curl isolation.
- The generator understands registered names that contain spaces (the 14 `cm5 ...`
  rows render as their own commands and count in the header totals), resolves a
  dispatcher-style setting `cmdKey` through the same longest-prefix rule the firmware
  uses (rendered as ``command `power mode` (via `power`)``), and parses hexadecimal
  range bounds so `matrixaddress 0x70..0x77` audits cleanly.

### Changed
- Regenerated the exhaustive references from HardwareOne v0.99.96 plus unreleased
  work (`a172013`): 963 unique command names, 966 registry entries across 52 modules,
  and 304 persisted settings (289 linked to registered commands or dispatcher forms).
  Removed from the catalog: `espnowmeshadaptivettl`, `espnowmeshsave`, `g2pet`,
  `healthtrack` (now `healthlogging`), `ringverbose` (now `debugringdump`); `dictate`
  is no longer a CLI command. Compile guards: `llm` is `ENABLE_LLM_BACKEND`,
  `neopixel`/`led` are `ENABLE_NEOPIXEL`, `sd` is `ENABLE_SD_CARD`.
- Argument limit raised to the firmware's `CMD_INPUT_MAX`: `hardwareone_cli` accepts
  up to 2047 characters (was 512) and the skill says a longer command is rejected whole
  by the device, never truncated.
- Device rejections reach the agent as the device's own text with no `[exit N]`
  prefix. `SKILL.md`'s error table keys on that text and adds rows for the session
  epoch (`before command execution.`), radio busy errors from `closewifi` /
  `wifidisconnect` / `radiopower off` / `openespnow`, the co-processor's
  `host not present` / `host stale` / `host not ready`, queued replies, and
  prompts that cannot be answered.
- Mesh relay: a `via: "mesh"` device must be securely paired with the relaying master
  (consent pairing or `espnowpairsecure`), because since firmware v0.99.9 a device
  executes only session-encrypted ESP-NOW command frames from a paired peer. Stated in
  `SKILL.md`, the operating reference, the tool descriptions, the plugin README, and
  `hardwareone.devices.json.template`. The relay surfaces the master's own rejection
  text instead of an offline verdict, and stops polling if the master rejects the
  `espnowmessages` poll itself.
- Settings batching guidance now documents what the firmware does: a `beginwrite`
  issued through the gateway is owned by the web session's epoch, so it survives
  across separate tool calls, values take effect in RAM at once, an idle batch is
  flushed after about two minutes, and a session renewal starts a new scope. The agent
  is told to keep batches short and read a setting back.
- LLM guidance is backend-selectable: models are `<source>:<name>` (`onboard:...`,
  `cm5:...`); which sources exist depends on the build (the developer default compiles
  both, the Pocket Assistant profile has only the Pi source, the Headless profile has
  no LLM), so the agent reads `llmmodels` / `features`; `Do:` mode exists only for an
  on-board model that declares it.
- `SKILL.md` intro counts, subsystem list, deployment profiles (Headless Node, Pocket
  Assistant on the XIAO ESP32-S3 without MQTT/I2C/OLED/local input, P4X-EYE handheld)
  and the `g2probe` / `g2imgprobe` test-suite caveat.
- The wrapper's slow-command timeout list now covers `c6update`, `otastage`,
  `otaupdate`, `llmask` and `stt` in addition to the LLM, camera and `certgen` cases,
  and drops `camerastart`, which is not a registered command. The first word is
  matched the way the firmware resolves it: case-insensitively and after leading
  whitespace, so `OtaUpdate confirm` and `  stt start` get the long cap too.
- `SKILL.md` and the operating reference state the gateway's real input rule
  (printable ASCII only, so accents and emoji are refused as well as control
  characters), list the gateway's own unprefixed `Error: ...` answers next to the
  `[exit N]` transport prefix, and mark the input-check rows of the error table as
  gateway-side rather than device text.
- Corrections against the firmware source: `automation run id=<id>` (a name is not
  accepted); `power json` reports the CPU clock steps, the five presets and the
  `sleepAllowed` gate, not a list of sleep modes; the whole `g2glasses` command is
  admin, `show` included; `otapin clear confirm` is no longer listed among the inline
  confirm forms that work through the gateway; the `matrix` recipe adds `size` and
  `panel`; the plugin README names consent pairing beside `espnowpairsecure`; the
  session-epoch text no longer blames the gateway's web session, which the wrapper
  renews on a 401 by itself.
- Generator default `--firmware` path is `../HardwareOne`; every `hardwareone-idf`
  link and path in the README, tools README and templates was updated.
- `plugin/package.json` 1.7.0 → 1.8.0; the plugin README documents the exit codes,
  the 2047-character cap, the mesh pairing requirement, and the tests.

### Fixed
- Super-admin detection in the generator had silently regressed to zero: since
  firmware v0.99.89 `CommandEntry` has no voice fields, so the old "eight or more
  fields, last is true" rule never fired. The parser now reads the
  `requiresSuperAdmin` field by position; the catalog marks 25 unique super-admin
  names again.
- The `matrixaddress` audit false positive (help `0x70-0x77` read as `70-0`).
- The wrapper printed a generic `Error: bad request (400)` and hid the device's
  diagnostic for an unknown command or bad usage; it now passes the body through.

### Security
- Pin explicit `http://` and `https://` device URLs to their configured scheme. Bare
  hosts now use HTTPS and can fall back to HTTP only after an HTTPS connection refusal
  when `HW1_ALLOW_HTTP=1` / `allowHttp: true` is explicitly configured.
- Reject redirects, non-200 responses, unexpected content types, oversized responses,
  and non-HardwareOne `/api/ping` payloads before sending login credentials. TLS errors
  and timeouts never authorize an HTTP downgrade.
- Isolate device requests from user curl configuration and ambient proxy variables,
  restrict curl to HTTP(S), and disable redirects.
- None of the 84 pre-existing transport assertions changed, so the hardening above is
  intact under the new exit-code contract.

### Known firmware audit findings
- The skill's own audit reports 15 settings whose editor command is not a registered
  command (seven at the v0.99.7 baseline; the eight new ones are the four `matrix*`
  keys, the two `g2Device` desired-state keys and the two `sensorLog` ring keys),
  including the four `matrix*` setting `cmdKey`s (`matrixbrightness`, `matrixpanel`,
  `matrixrotation`, `matrixsquare`) that the firmware's own audit flags as bound to no
  command; two range mismatches
  (`cameramaxstoredimages` help `0-1200` vs setting `0-1000`; `espnowchannel` help
  `1-13` vs setting `0-13`); and no enum-choice mismatches.
- The firmware's `tools/command_registry.py audit` reports 16 problems: nine `ota*`
  names registered twice because the stub table and the real table both parse, the
  `espnowenabled` / `pendinglist` / `serialrequireauth` duplicates, and the four
  `matrix*` `cmdKey`s above. The skill reports registry entries as-is; it does not
  hide or modify firmware-owned metadata. Its 966 registry entries versus the firmware
  tool's 975 come from keeping one parse per array variable (`otaCommands` is defined
  under both `#if HW1_OTA_LAYOUT` and `#else` with the same nine names); the 963
  unique names match the firmware's `docs/COMMAND_REFERENCE.md` exactly.
- The firmware's `docs/COMMAND_REFERENCE.md` marks only 16 commands as super-admin;
  nine more (`c6update`, `otaack`, `otacancel`, `otapin`, `otarecovery`,
  `otaresetjournal`, `otastage`, `otaupdate`, `otawrite`) pass a bare `true` in the
  sixth field that the firmware tool's regex does not recognise. The runtime gates on
  that field, so the skill's catalog marks them super-admin.
- The firmware's `tools/settings_registry.py` fails to import on Python 3.11 (a
  backslash inside an f-string); a firmware-side issue.

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
