# HardwareOne OpenClaw plugin (local)

Exposes three tools to the sandboxed OpenClaw agent that shell out to the existing
`hw1.sh` wrapper on the host, so the agent can reach the ESP32 on the LAN without
the sandbox itself gaining any network access.

## Files

| File | Purpose |
| ---- | ------- |
| `package.json`             | Declares the openclaw extension entry |
| `openclaw.plugin.json`     | Plugin manifest; MUST include `contracts.tools` |
| `index.js`                 | Plugin entry; calls `definePluginEntry` + `api.registerTool` |
| `hardwareone-tool.js`      | Three tool definitions + subprocess plumbing |

The tools shell to `/Users/openclaw/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh`
which sources its own `.env` for HW1_URL/HW1_USER/HW1_PASS. Credentials never
leave the host.

## Security boundary

- Input: every tool validates its argument against a character-class allowlist,
  length cap (512 chars), and for `hardwareone_get` a `^/api/...$` path regex.
- Process: `spawn` with argv array, never a shell. No `sh -c`.
- Runtime: 30 s timeout. stdout capped at 64 KB; stderr capped at 4 KB.
- Observability: each load logs `[hardwareone] ...` to gateway.err.log.

## OpenClaw config wiring (~/.openclaw/openclaw.json)

- `plugins.allow` must include `"hardwareone"`.
- `plugins.entries.hardwareone = {"enabled": true}`.
- `tools.alsoAllow` and `tools.sandbox.tools.alsoAllow` currently contain a
  shotgun set: `hardwareone_ping`, `hardwareone_cli`, `hardwareone_get`,
  `hardwareone`, and `group:plugins`. One of those is the minimal sufficient
  entry; narrowing is TBD. The agent sees the tools only when at least one
  of them is present in the SANDBOX allowlist.

## Editing the plugin — the jiti cache gotcha

OpenClaw transpiles plugins through jiti, which caches compiled CJS modules
under $TMPDIR/jiti/. Source edits are ignored until the corresponding cache
file is deleted. After any edit to index.js or hardwareone-tool.js, run:

    rm -f /var/folders/yk/tgfdks3d1b96nl9xn3mhmpm80000gp/T/jiti/hardwareone-*.cjs
    touch /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/extensions/hardwareone/*.js
    launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway

Symptom of a forgotten cache flush: stale errors that reference code you've
already removed from the source.

## Upgrading OpenClaw — the hash gotcha

index.js statically imports ../../plugin-entry-<HASH>.js. The hash is baked
at OpenClaw build time and changes every release. After npm update -g openclaw,
the plugin fails to load because the old filename no longer exists.

Re-point the import after any upgrade:

    NEW=$(ls /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/plugin-entry-*.js \
            | xargs -n1 basename | head -1)
    sed -i.bak "s|plugin-entry-[A-Za-z0-9_-]*\.js|$NEW|" \
      /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/extensions/hardwareone/index.js
    rm -f /var/folders/yk/tgfdks3d1b96nl9xn3mhmpm80000gp/T/jiti/hardwareone-*.cjs
    launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway

The npm update step will ALSO wipe this whole directory. Back it up first:

    BACKUP=~/hardwareone-plugin-backup
    mkdir -p "$BACKUP"
    cp -r /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/extensions/hardwareone/. "$BACKUP/"

To restore after upgrade:

    mkdir -p /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/extensions/hardwareone
    cp -r ~/hardwareone-plugin-backup/. \
      /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/extensions/hardwareone/
    # then run the hash-repoint step above

## Healthcheck

From the openclaw account:

    /usr/local/bin/node /Users/openclaw/.npm-global/lib/node_modules/openclaw/dist/index.js \
      plugins list 2>/dev/null | grep -A 1 hardware

Expected: a row with Status "loaded" and ID "hardwareone".

From a fresh agent session, this prompt should list three tool names:

    "List every tool available to you whose name starts with hardwareone."
