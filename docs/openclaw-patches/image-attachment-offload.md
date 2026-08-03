# OpenClaw image-attachment offload compatibility patch

This runbook documents an **OpenClaw core workaround**, not a HardwareOne skill or
plugin change. It is for a specific failure mode where an image appears correctly in
Control/WebChat, but the agent describes an unrelated scene because the image bytes were
replaced with a `media://inbound/...` reference before the model turn.

The observed OpenClaw build used this generated runtime constant:

```js
const OFFLOAD_THRESHOLD_BYTES = 2e6;
```

Images larger than 2,000,000 bytes were offloaded even though OpenClaw accepted images up
to its separate `MAX_IMAGE_BYTES` limit. In that build, the offloaded reference was not
rehydrated into pixels for the local Ollama vision model. Changing the threshold to the
existing image limit kept otherwise-valid images inline:

```js
const OFFLOAD_THRESHOLD_BYTES = MAX_IMAGE_BYTES;
```

This is a compatibility patch to generated distribution code. A future OpenClaw update
can rename the generated file, change the surrounding logic, fix the underlying handoff,
or overwrite the patch. Never apply it solely because the constants happen to exist.

## When this runbook applies

Use it only after confirming all of the following:

1. The same image works when sent directly to the chosen vision model.
2. Small images work in OpenClaw chat, while larger images render in the UI but are
   misidentified by the agent.
3. Gateway logs say `Offloaded attachment` or `Offloaded image` for a failing image.
4. The failing image is below OpenClaw's accepted image-size limit.
5. The installed runtime contains exactly one active
   `const OFFLOAD_THRESHOLD_BYTES = 2e6;` definition in the attachment-normalization code.

If direct model inference also fails, fix the model/provider configuration first. This
patch cannot add vision support to a model or repair invalid image data.

## Phase 1: collect facts without changing anything

Run this in `bash` or `zsh` as the same user that runs the OpenClaw gateway. It writes
nothing. It deliberately prints selected configuration fields rather than the entire
configuration, which may contain credentials.

```bash
echo '=== EXECUTABLES AND VERSIONS ==='
command -v openclaw || true
command -v node || true
command -v npm || true
openclaw --version 2>&1 || true
node --version 2>&1 || true
npm --version 2>&1 || true

OPENCLAW_CONFIG="${OPENCLAW_CONFIG:-$HOME/.openclaw/openclaw.json}"
echo "Config: $OPENCLAW_CONFIG"

echo '=== REDACTED IMAGE/MODEL CONFIGURATION ==='
if command -v jq >/dev/null 2>&1 && test -f "$OPENCLAW_CONFIG"; then
  jq '{
    defaultModel: .agents.defaults.model,
    imageModel: .agents.defaults.imageModel,
    mediaImage: .tools.media.image,
    mediaModels: .tools.media.models,
    ollama: {
      baseUrl: (.models.providers.ollama.baseUrl // .models.providers.ollama.baseURL),
      api: .models.providers.ollama.api,
      models: [
        .models.providers.ollama.models[]? |
        {id, name, input, reasoning, contextWindow, maxTokens}
      ]
    }
  }' "$OPENCLAW_CONFIG"
else
  echo 'jq or the OpenClaw config is unavailable; do not print the whole config publicly.'
fi

echo '=== INSTALLED OPENCLAW ROOT ==='
OPENCLAW_ENTRY="$(command -v openclaw 2>/dev/null || true)"
OPENCLAW_REAL=""
if test -n "$OPENCLAW_ENTRY"; then
  OPENCLAW_REAL="$(perl -MCwd=abs_path -e 'print abs_path(shift)' "$OPENCLAW_ENTRY" 2>/dev/null || true)"
fi
echo "Launcher: $OPENCLAW_ENTRY"
echo "Resolved: $OPENCLAW_REAL"

OPENCLAW_ROOT=""
if command -v npm >/dev/null 2>&1; then
  NPM_ROOT="$(npm root -g 2>/dev/null || true)"
  if test -d "$NPM_ROOT/openclaw"; then
    OPENCLAW_ROOT="$NPM_ROOT/openclaw"
  fi
fi
if test -z "$OPENCLAW_ROOT" && test -n "$OPENCLAW_REAL"; then
  SEARCH_DIR="$(dirname "$OPENCLAW_REAL")"
  while test "$SEARCH_DIR" != /; do
    if test -f "$SEARCH_DIR/package.json" &&
       command -v jq >/dev/null 2>&1 &&
       test "$(jq -r '.name // empty' "$SEARCH_DIR/package.json" 2>/dev/null)" = openclaw; then
      OPENCLAW_ROOT="$SEARCH_DIR"
      break
    fi
    SEARCH_DIR="$(dirname "$SEARCH_DIR")"
  done
fi
echo "OpenClaw root: $OPENCLAW_ROOT"

echo '=== MATCHING GENERATED CODE (READ ONLY) ==='
if test -n "$OPENCLAW_ROOT" && test -d "$OPENCLAW_ROOT/dist"; then
  grep -R -n -F 'const OFFLOAD_THRESHOLD_BYTES = 2e6;' "$OPENCLAW_ROOT/dist" 2>/dev/null || true
  grep -R -n -F 'Offloaded attachment' "$OPENCLAW_ROOT/dist" 2>/dev/null | head -20 || true
else
  echo 'Could not locate the installed OpenClaw dist directory.'
fi

echo '=== RECENT OFFLOAD LOGS ==='
openclaw logs --plain --limit 2000 --max-bytes 2000000 2>&1 |
  grep -Ei 'offloaded (attachment|image)|media://inbound|image|attachment' |
  tail -200 || true
```

Also record the dimensions and exact byte size of one working and one failing image:

```bash
WORKING_IMAGE='/absolute/path/to/a/working-image.png'
FAILING_IMAGE='/absolute/path/to/a/failing-image.png'

for IMAGE_FILE in "$WORKING_IMAGE" "$FAILING_IMAGE"; do
  echo "=== $IMAGE_FILE ==="
  test -f "$IMAGE_FILE" || { echo 'missing'; continue; }
  if stat -f '%z' "$IMAGE_FILE" >/dev/null 2>&1; then
    stat -f 'bytes: %z' "$IMAGE_FILE"        # macOS
  else
    stat -c 'bytes: %s' "$IMAGE_FILE"        # Linux
  fi
  command -v sips >/dev/null 2>&1 && sips -g pixelWidth -g pixelHeight "$IMAGE_FILE"
  command -v file >/dev/null 2>&1 && file "$IMAGE_FILE"
done
```

Test the failing file directly through OpenClaw before touching its runtime. Substitute
the actual image-capable model configured on that host:

```bash
FAILING_IMAGE='/absolute/path/to/a/failing-image.png'
VISION_MODEL='ollama/qwen3-vl:4b'

openclaw infer model run \
  --local \
  --model "$VISION_MODEL" \
  --prompt 'Identify the main object. Answer with one noun only.' \
  --file "$FAILING_IMAGE" \
  --json
```

Give the complete output of Phase 1 to the person or AI diagnosing the host. Do not include
passwords, API keys, cookies, or an unredacted `openclaw.json`.

## Phase 2: prepare and inspect a patch candidate

Continue only if the evidence matches the failure mode above. This phase creates a changed
copy in a temporary directory and displays the diff. It does **not** alter OpenClaw.

```bash
test -n "$OPENCLAW_ROOT" || { echo 'OPENCLAW_ROOT is not set'; return 1 2>/dev/null || exit 1; }

MATCH_LIST="$(mktemp)"
grep -R -l -F 'const OFFLOAD_THRESHOLD_BYTES = 2e6;' "$OPENCLAW_ROOT/dist" \
  > "$MATCH_LIST" 2>/dev/null || true
MATCH_COUNT="$(wc -l < "$MATCH_LIST" | tr -d '[:space:]')"

if test "$MATCH_COUNT" != 1; then
  echo "Expected exactly one match; found $MATCH_COUNT. Stop and inspect:"
  sed -n '1,20p' "$MATCH_LIST"
  return 1 2>/dev/null || exit 1
fi

ATTACHMENT_CODE="$(sed -n '1p' "$MATCH_LIST")"
PATCH_DIR="$(mktemp -d)"
PATCH_CANDIDATE="$PATCH_DIR/$(basename "$ATTACHMENT_CODE")"
cp -p "$ATTACHMENT_CODE" "$PATCH_CANDIDATE"

perl -pi -e \
  's/const OFFLOAD_THRESHOLD_BYTES = 2e6;/const OFFLOAD_THRESHOLD_BYTES = MAX_IMAGE_BYTES;/' \
  "$PATCH_CANDIDATE"

echo "Active file: $ATTACHMENT_CODE"
echo "Candidate:   $PATCH_CANDIDATE"
diff -u "$ATTACHMENT_CODE" "$PATCH_CANDIDATE" || true

NODE_BIN="$(command -v node 2>/dev/null || true)"
if test -n "$NODE_BIN"; then
  "$NODE_BIN" --check "$PATCH_CANDIDATE"
else
  echo 'Node is not on PATH. Find the Node executable used by OpenClaw before installation.'
fi
```

The diff must contain exactly one code change: `2e6` becomes `MAX_IMAGE_BYTES`. Lines
beginning with `-` and `+` are diff output—do not paste those lines back into a shell.

If `node --check` reports an unknown extension, the temporary filename lost its `.js`
suffix. The commands above preserve the original basename and therefore avoid that issue.

## Phase 3: back up, install atomically, and verify

Only run this after a human has approved the one-line diff and the syntax check passed.
The backup is stored outside the npm package so an upgrade cannot erase it.

```bash
test -f "$ATTACHMENT_CODE" || { echo 'Active file is missing'; return 1 2>/dev/null || exit 1; }
test -f "$PATCH_CANDIDATE" || { echo 'Candidate is missing'; return 1 2>/dev/null || exit 1; }
test -n "$NODE_BIN" || { echo 'NODE_BIN is not set'; return 1 2>/dev/null || exit 1; }

PATCH_STAMP="$(date +%Y%m%d-%H%M%S)"
PATCH_BACKUP_DIR="$HOME/.openclaw/patch-backups/image-offload-$PATCH_STAMP"
mkdir -p "$PATCH_BACKUP_DIR"
PATCH_BACKUP="$PATCH_BACKUP_DIR/$(basename "$ATTACHMENT_CODE")"
cp -p "$ATTACHMENT_CODE" "$PATCH_BACKUP"

INSTALL_DIR="$(mktemp -d "$(dirname "$ATTACHMENT_CODE")/.image-offload-patch.XXXXXX")"
INSTALL_FILE="$INSTALL_DIR/$(basename "$ATTACHMENT_CODE")"
cp -p "$PATCH_CANDIDATE" "$INSTALL_FILE"

if "$NODE_BIN" --check "$INSTALL_FILE"; then
  mv "$INSTALL_FILE" "$ATTACHMENT_CODE"
  rmdir "$INSTALL_DIR"
else
  echo 'Syntax check failed; active OpenClaw file was not changed.'
  return 1 2>/dev/null || exit 1
fi

echo "Backup: $PATCH_BACKUP"
grep -n -F 'OFFLOAD_THRESHOLD_BYTES' "$ATTACHMENT_CODE"
openclaw gateway restart
```

Open a **fresh chat** and retry both the working and failing images. Then inspect the logs:

```bash
openclaw logs --plain --limit 1000 --max-bytes 2000000 2>&1 |
  grep -Ei 'offloaded (attachment|image)|media://inbound|image|attachment' |
  tail -100 || true
```

Success means the larger, still-valid image reaches the model and is identified correctly;
it is not enough that the UI thumbnail renders.

## Rollback

Use the exact backup path printed during installation:

```bash
PATCH_BACKUP='/absolute/path/printed/by/the/install/step.js'
ATTACHMENT_CODE='/absolute/path/to/the/active/generated-file.js'
NODE_BIN="$(command -v node)"

"$NODE_BIN" --check "$PATCH_BACKUP" &&
  cp -p "$PATCH_BACKUP" "$ATTACHMENT_CODE" &&
  openclaw gateway restart
```

If OpenClaw was upgraded after the patch, do not copy an old generated file over the new
release. Reinstall or repair the current OpenClaw version instead, then diagnose that
version from Phase 1.

## Suggested handoff prompt for an AI

Copy this prompt together with the **redacted** Phase 1 output:

> Diagnose this OpenClaw image failure from the supplied evidence. Do not edit anything
> yet. First verify that direct vision inference succeeds, correlate image byte sizes with
> gateway offload logs, locate the active OpenClaw installation without assuming an npm
> prefix, and confirm whether exactly one generated attachment-normalization file contains
> `const OFFLOAD_THRESHOLD_BYTES = 2e6;`. If and only if those checks match, create a
> temporary candidate changing that value to the already-imported `MAX_IMAGE_BYTES`, show
> the complete diff, run the actual OpenClaw Node executable's syntax check, and wait for
> approval. Before installation, make a timestamped backup outside the package directory.
> Install atomically, restart the gateway, test in a fresh chat, and provide an exact
> rollback command. Never print secrets or overwrite a newer release with an older backup.

## Longer-term fix

Prefer an OpenClaw release that correctly rehydrates managed inbound image references or
routes them through configured media understanding. After every OpenClaw upgrade, assume
this workaround has been removed and rerun Phase 1 from scratch. Do not automatically
reapply a patch to a renamed or materially changed generated file.
