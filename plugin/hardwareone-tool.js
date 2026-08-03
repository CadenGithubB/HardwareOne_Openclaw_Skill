import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Host-side wrapper the tools shell out to. Defaults to the standard skill location
// under the gateway user's home; set HW1_SCRIPT to override if your skill lives elsewhere.
const HW1_SCRIPT =
  process.env.HW1_SCRIPT ||
  `${process.env.HOME}/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh`;
// Host-only registry / credential files. NEVER mounted into the sandbox — the gateway
// reads them here and passes only the chosen device's connection to hw1.sh. The agent
// only ever learns device NAMES and ROLES, never any address or credential.
const HW1_DEVICES_FILE =
  process.env.HW1_DEVICES_FILE || `${process.env.HOME}/.openclaw/hardwareone.devices.json`;
const HW1_ENV = process.env.HW1_ENV || `${process.env.HOME}/.openclaw/hardwareone.env`;

const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const RELAY_TIMEOUT_MS = 15_000;      // how long to poll for a mesh peer's async reply
const RELAY_POLL_INTERVAL_MS = 800;   // gap between espnowmessages polls
const MSG_CMD_RESULT = 6;             // espnowmessages `type` value for a remote-command result
const IMAGE_MAX_B64_BYTES = 8 * 1024 * 1024; // base64 of a device image (frames are small; cap generously)
const CAMERA_WARMUP_MS = 90_000;      // `opencamera` can block while the sensor powers up (~60s max)

const SAFE_CLI_RE = /^[\x20-\x7E]+$/;
const SAFE_DEVICE_RE = /^[A-Za-z0-9_-]{1,40}$/;
const UNREACHABLE_RE = /could not reach|connection refused|timed out|resolve host|TLS\/certificate/i;

const truthy = (v) => v === true || v === 1 || v === "1" || v === "true";

// Operator-authored, agent-visible note about a device's hardware/software setup. The
// registry is host-only (trusted input), but we still collapse control chars to spaces and
// cap the length so the hardwareone_devices payload stays tidy and single-line.
const MAX_DESCRIPTION_LEN = 280;
function cleanDescription(v) {
  if (v == null) return "";
  const s = String(v).replace(/[\x00-\x1F\x7F]+/g, " ").replace(/\s+/g, " ").trim();
  if (s.length <= MAX_DESCRIPTION_LEN) return s;
  let cut = s.slice(0, MAX_DESCRIPTION_LEN - 1);
  if (/[\uD800-\uDBFF]$/.test(cut)) cut = cut.slice(0, -1); // don't sever a surrogate pair
  return cut.trimEnd() + "…";
}

// ── device registry ──────────────────────────────────────────────────────────
// A device is either reached DIRECTLY over HTTP (url + creds), or only via the master's
// ESP-NOW mesh (`"via": "mesh"` — no url/creds; the agent reaches it by running
// `espnowremote` on the master). Exactly one DIRECT master is the HTTP entry point and
// the mesh jumping-off point. Connection + role only — a device's room/location/purpose
// is NOT here; that lives on the device (espnowroom/zone/tags) and in the memory note.
// Falls back to the legacy flat hardwareone.env (HW1_URL/USER/PASS) for a single device.
function normalizeDevice(name, raw, defaults) {
  const m = { ...defaults, ...raw };
  const role = String(m.role || "worker").toLowerCase();
  const via = String(m.via || "direct").toLowerCase();
  if (via === "mesh") {
    // mesh-only: no direct HTTP. Reached by relaying `espnowremote` through the master,
    // which needs an account ON THE PEER (user/pass) — injected host-side, never seen by
    // the agent. So a mesh device needs creds too (espnowremote can't run without them).
    if (!m.user || !m.pass) return null;
    return { name, via: "mesh", role, user: String(m.user), pass: String(m.pass), description: cleanDescription(m.description) };
  }
  if (!m.url || !m.user || !m.pass) return null; // a direct device needs all three
  return {
    name, via: "direct", role,
    url: String(m.url),
    user: String(m.user),
    pass: String(m.pass),
    allowSelfSigned: truthy(m.allowSelfSigned),
    cacert: m.cacert ? String(m.cacert) : "",
    connectTimeout: m.connectTimeout,
    timeout: m.timeout,
    timeoutLong: m.timeoutLong,
    authProbe: m.authProbe,
    description: cleanDescription(m.description),
  };
}

async function readJsonRegistry(warnings) {
  let text;
  try {
    text = await fs.readFile(HW1_DEVICES_FILE, "utf8");
  } catch (e) {
    if (e.code !== "ENOENT") warnings.push(`could not read ${HW1_DEVICES_FILE}: ${e.message}`);
    return null;
  }
  let json;
  try { json = JSON.parse(text); }
  catch (e) { warnings.push(`invalid JSON in ${HW1_DEVICES_FILE}: ${e.message}`); return null; }
  if (!json || typeof json !== "object" || !json.devices || typeof json.devices !== "object") {
    warnings.push(`${HW1_DEVICES_FILE} has no "devices" object`);
    return null;
  }
  const defaults = json.defaults && typeof json.defaults === "object" ? json.defaults : {};
  const devices = {};
  for (const [name, raw] of Object.entries(json.devices)) {
    if (!SAFE_DEVICE_RE.test(name)) { warnings.push(`ignored invalid device name '${name}'`); continue; }
    const d = normalizeDevice(name, raw && typeof raw === "object" ? raw : {}, defaults);
    if (!d) {
      warnings.push(`device '${name}' is missing required fields — a direct device needs url+user+pass; a mesh device ("via":"mesh") needs user+pass (for the espnowremote relay) — skipped`);
      continue;
    }
    if (d.via === "mesh" && d.role === "master") {
      warnings.push(`device '${name}' is via:mesh but role:master — the master must be directly reachable; treating it as a worker`);
      d.role = "worker";
    }
    if (d.via === "mesh" && (/\s/.test(d.user) || /\s/.test(d.pass))) {
      warnings.push(`mesh device '${name}' has whitespace in its credentials — espnowremote splits arguments on spaces, so the relay will fail; use space-free user/pass`);
    }
    devices[name] = d;
  }
  return { devices, declaredDefault: json.default };
}

// Legacy single-device flat env (HW1_URL/USER/PASS in hardwareone.env or process.env).
async function readLegacyDevice(warnings) {
  let text = "";
  try { text = await fs.readFile(HW1_ENV, "utf8"); } catch { /* fine — maybe creds are in process.env */ }
  const fileEnv = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    fileEnv[m[1]] = v;
  }
  const get = (k) => (process.env[k] !== undefined ? process.env[k] : fileEnv[k]);
  const url = get("HW1_URL"), user = get("HW1_USER"), pass = get("HW1_PASS");
  if (!url || !user || !pass) return null;
  return {
    name: "default", via: "direct", url, user, pass, role: "master",
    allowSelfSigned: truthy(get("HW1_ALLOW_SELF_SIGNED")) || truthy(get("HW1_INSECURE")),
    cacert: get("HW1_CACERT") || "",
  };
}

// Build { devices, default, warnings }. JSON registry wins; legacy flat env is the fallback.
async function buildRegistry() {
  const warnings = [];
  const notes = [];
  const reg = await readJsonRegistry(warnings);
  if (reg && Object.keys(reg.devices).length > 0) {
    const { devices, declaredDefault } = reg;
    const names = Object.keys(devices);
    const directNames = names.filter((n) => devices[n].via === "direct");
    const masters = directNames.filter((n) => devices[n].role === "master");
    let def = declaredDefault;
    if (def && !devices[def]) { warnings.push(`default '${def}' is not a configured device`); def = undefined; }
    if (def && devices[def] && devices[def].via === "mesh") {
      warnings.push(`default '${def}' is mesh-only and can't be the direct endpoint; pick a direct master`);
      def = undefined;
    }
    if (!def) {
      if (directNames.length === 0) {
        warnings.push('no directly-reachable device — at least one needs url+user+pass to be the HTTP entry point (the master)');
      } else {
        // Two or more co-equal direct devices is a SUPPORTED config, not a misconfiguration.
        // Deterministically pick an implicit default so bare (un-targeted) commands always
        // resolve. Prefer a master, else any direct device; choose by SORTED name so the pick
        // is stable regardless of JSON key order (numeric-like keys don't keep insertion order).
        const pool = (masters.length ? masters : directNames).slice().sort();
        def = pool[0];
        if (pool.length > 1) {
          notes.push(`multiple co-equal direct devices (${pool.join(", ")}); bare commands use '${def}' — set "default" to choose one, and name each device explicitly to avoid ambiguity`);
        }
      }
    }
    return { devices, default: def || null, warnings, notes };
  }
  const legacy = await readLegacyDevice(warnings);
  if (legacy) return { devices: { default: legacy }, default: "default", warnings, notes };
  return { devices: {}, default: null, warnings, notes };
}

// A backup must itself be directly reachable (it becomes the HTTP endpoint on failover).
function backupName(registry) {
  const b = Object.keys(registry.devices).filter(
    (n) => registry.devices[n].role === "backup" && registry.devices[n].via === "direct");
  return b.length >= 1 ? b[0] : null;
}

// ── spawning hw1.sh for one specific device ──────────────────────────────────
function cookieDirFor(name) {
  return `/tmp/hw1/${String(name).replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

function runHw1(device, argv, opts = {}) {
  const timeoutMs = opts.timeoutMs || TIMEOUT_MS;
  const maxBytes = opts.maxBytes || MAX_OUTPUT_BYTES;
  const env = {
    ...process.env,
    HW1_URL: device.url,
    HW1_USER: device.user,
    HW1_PASS: device.pass,
    HW1_COOKIE_DIR: cookieDirFor(device.name),
  };
  delete env.HW1_INSECURE; // legacy alias — never let a stale global leak across devices
  if (device.allowSelfSigned) env.HW1_ALLOW_SELF_SIGNED = "1"; else delete env.HW1_ALLOW_SELF_SIGNED;
  if (device.cacert) env.HW1_CACERT = device.cacert; else delete env.HW1_CACERT;
  if (device.connectTimeout != null) env.HW1_CONNECT_TIMEOUT = String(device.connectTimeout);
  if (device.timeout != null) env.HW1_TIMEOUT = String(device.timeout);
  if (device.timeoutLong != null) env.HW1_TIMEOUT_LONG = String(device.timeoutLong);
  if (device.authProbe) env.HW1_AUTH_PROBE = String(device.authProbe);

  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(HW1_SCRIPT, argv, { stdio: ["ignore", "pipe", "pipe"], env });
    let stdout = "";
    let stderr = "";
    let truncated = false;
    const timer = setTimeout(() => {
      try { proc.kill("SIGKILL"); } catch {}
      rejectPromise(new Error(`hardwareone timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    proc.stdout.on("data", (chunk) => {
      if (stdout.length + chunk.length > maxBytes) {
        stdout += chunk.slice(0, maxBytes - stdout.length).toString();
        truncated = true;
        proc.stdout.removeAllListeners("data");
      } else {
        stdout += chunk.toString();
      }
    });
    proc.stderr.on("data", (chunk) => {
      if (stderr.length < 4096) stderr += chunk.toString().slice(0, 4096 - stderr.length);
    });
    proc.on("error", (err) => { clearTimeout(timer); rejectPromise(err); });
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code, stdout, stderr, truncated });
    });
  });
}

function isUnreachable(res) {
  return res.exitCode === 7 || (res.stderr && UNREACHABLE_RE.test(res.stderr));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pull the JSON object out of a CLI response (which may carry a `[CMD] …-> OK` line
// before or after the payload).
function extractJson(text) {
  const i = text.indexOf("{");
  const j = text.lastIndexOf("}");
  if (i < 0 || j < i) return null;
  try { return JSON.parse(text.slice(i, j + 1)); } catch { return null; }
}

// ── mesh relay ────────────────────────────────────────────────────────────────
// A mesh-only peer has no direct HTTP. To run a command on it we relay through the
// master: `espnowremote <peer> <peer-user> <peer-pass> <cmd>` (the peer's own account,
// injected host-side — the agent never sees it), then poll `espnowmessages json` for the
// async reply (type=MSG_CMD_RESULT, correlated by reqId, reassembled from piece/of frames).
function relayMaster(registry) {
  const m = registry.default ? registry.devices[registry.default] : null;
  return m && m.via === "direct" ? m : null;
}

// Poll the master's message buffer for one espnowremote reply. Walks forward by seq
// (each message seen once), reassembling fragments in piece order once all `of` arrive.
async function pollMeshResult(master, mac, reqId) {
  const deadline = Date.now() + RELAY_TIMEOUT_MS;
  const pieces = new Map(); // piece (1-based) -> text
  let total = null;
  let cursor = 0;
  const macArg = mac ? ` ${mac}` : "";
  while (Date.now() < deadline) {
    let page;
    try { page = await runHw1(master, [`espnowmessages json ${cursor}${macArg}`]); }
    catch { await sleep(RELAY_POLL_INTERVAL_MS); continue; }
    const parsed = extractJson(page.stdout || "");
    const msgs = parsed && Array.isArray(parsed.messages) ? parsed.messages : [];
    let advanced = false;
    for (const m of msgs) {
      if (typeof m.seq === "number" && m.seq > cursor) { cursor = m.seq; advanced = true; }
      if (m.reqId === reqId && m.type === MSG_CMD_RESULT && m.sent === false) {
        pieces.set(Number(m.piece) || 1, String(m.msg == null ? "" : m.msg));
        if (m.of) total = Number(m.of);
      }
    }
    if (total != null && pieces.size >= total) {
      let text = "";
      for (let p = 1; p <= total; p++) text += pieces.get(p) || "";
      return { text: text.length ? text : "(empty reply)" };
    }
    // a full page may mean more already-buffered messages above the cursor — keep paging;
    // otherwise we've caught up, so wait before checking for new arrivals.
    if (msgs.length >= 8 && advanced) continue;
    await sleep(RELAY_POLL_INTERVAL_MS);
  }
  return { timedOut: true };
}

// Relay one CLI command to a mesh peer and return its reply (or a clean timeout/error).
async function relayMeshCommand(registry, peer, command) {
  const master = relayMaster(registry);
  if (!master) return errorResult(`cannot reach mesh device '${peer.name}': no direct master is configured to relay through`);
  if (/\s/.test(peer.user) || /\s/.test(peer.pass)) {
    return errorResult(`mesh device '${peer.name}' has whitespace in its credentials; espnowremote can't pass those — set space-free user/pass in the registry`);
  }
  let res;
  try { res = await runHw1(master, [`espnowremote ${peer.name} ${peer.user} ${peer.pass} ${command}`]); }
  catch (err) { return errorResult(`relay to '${peer.name}' via '${master.name}' failed: ${String(err && err.message ? err.message : err)}`); }
  const out = ((res.stdout || "") + (res.stderr || "")).trim();
  const tag = `[via ${master.name} → ${peer.name}] `;
  const reqIdMatch = out.match(/reqId\s+(\d+)/i);
  if (res.exitCode !== 0 || !reqIdMatch) {
    // dispatch failed (not paired, encryption off, bad usage, self-target, …) — surface it
    return { content: [{ type: "text", text: tag + (out || "(no output)") }], details: { device: peer.name, via: "mesh", relay: master.name, dispatchFailed: true } };
  }
  const reqId = Number(reqIdMatch[1]);
  const macMatch = out.match(/\b([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})\b/);
  const result = await pollMeshResult(master, macMatch ? macMatch[1] : "", reqId);
  if (result.timedOut) {
    return { content: [{ type: "text", text: tag + `delivered, but no reply within ${RELAY_TIMEOUT_MS / 1000}s — the peer may be offline, out of range, or the command produced no output.` }], details: { device: peer.name, via: "mesh", relay: master.name, timedOut: true } };
  }
  return { content: [{ type: "text", text: tag + result.text }], details: { device: peer.name, via: "mesh", relay: master.name, reqId } };
}

// "Ping" a mesh peer = the synchronous ESP-NOW reachability probe, run on the master.
async function relayMeshProbe(registry, peer) {
  const master = relayMaster(registry);
  if (!master) return errorResult(`cannot reach mesh device '${peer.name}': no direct master to relay through`);
  try {
    const r = await runHw1(master, [`espnowprobe ${peer.name}`]);
    const out = ((r.stdout || "") + (r.stderr || "")).trim() || "(no output)";
    return { content: [{ type: "text", text: `[via ${master.name} → ${peer.name}] ${out}` }], details: { device: peer.name, via: "mesh", relay: master.name } };
  } catch (err) { return errorResult(String(err && err.message ? err.message : err)); }
}

// Resolve the target device, run, and fail over to a backup ONLY when the implicit
// default (the master) is unreachable. An explicitly named device is never failed over.
// A mesh-only device has no direct HTTP — its commands are relayed through the master via
// espnowremote (creds injected host-side; the async reply is polled back).
async function runOnDevice(requestedDevice, argv) {
  const registry = await buildRegistry();
  if (Object.keys(registry.devices).length === 0) {
    const why = registry.warnings.length ? " — " + registry.warnings.join("; ") : "";
    return errorResult(`no HardwareOne devices configured${why} (see hardwareone.devices.json.template / .env.template)`);
  }

  let device, allowFailover = false;
  if (requestedDevice) {
    device = registry.devices[requestedDevice];
    if (!device) {
      return errorResult(`unknown device '${requestedDevice}'. Configured: ${Object.keys(registry.devices).join(", ")}`);
    }
    if (device.via === "mesh") {
      // mesh peer: relay through the master (creds injected host-side; async reply polled back)
      if (argv.length === 1 && argv[0] === "--ping") return relayMeshProbe(registry, device);
      if (argv.length === 1 && !argv[0].startsWith("--")) return relayMeshCommand(registry, device, argv[0]);
      return errorResult(`'${requestedDevice}' is a mesh device — only CLI commands can be relayed to it`);
    }
  } else {
    if (!registry.default) {
      return errorResult(`no default device — ${registry.warnings.join("; ") || 'set "default" or one ROLE=master'}`);
    }
    device = registry.devices[registry.default];
    allowFailover = device.role === "master";
  }

  let res;
  try { res = await runHw1(device, argv); }
  catch (err) { return errorResult(String(err && err.message ? err.message : err)); }

  if (allowFailover && isUnreachable(res)) {
    const bname = backupName(registry);
    if (bname && bname !== device.name) {
      try {
        const r2 = await runHw1(registry.devices[bname], argv);
        return formatResult(r2, { device: bname, failedOverFrom: device.name });
      } catch { /* fall through and report the original failure */ }
    }
  }
  return formatResult(res, { device: device.name });
}

// ── result formatting ────────────────────────────────────────────────────────
function formatResult(res, meta = {}) {
  const body = res.stdout && res.stdout.length > 0 ? res.stdout : (res.stderr || "(no output)");
  const suffix = res.truncated ? "\n\n[output truncated]" : "";
  const prefix = res.exitCode !== 0 ? `[exit ${res.exitCode}] ` : "";
  const fo = meta.failedOverFrom
    ? `[failed over ${meta.failedOverFrom} → ${meta.device}: master unreachable]\n`
    : "";
  return {
    content: [{ type: "text", text: fo + prefix + body + suffix }],
    details: {
      device: meta.device,
      failedOverFrom: meta.failedOverFrom,
      exitCode: res.exitCode,
      truncated: res.truncated,
      stderr: res.stderr || undefined,
    },
  };
}

function errorResult(message) {
  return { content: [{ type: "text", text: "Error: " + message }], details: { error: true } };
}

function validDeviceParam(device) {
  return device === undefined || (typeof device === "string" && SAFE_DEVICE_RE.test(device));
}

const DEVICE_PARAM = {
  type: "string",
  description: "Optional device name (from hardwareone_devices). Omit to use the default device; when hardwareone_devices lists more than one direct device they are co-equal targets, so name the one you mean rather than relying on the default for an ambiguous request. A device shown with access:mesh is relayed through the master automatically — address it by name exactly like a direct device; the relay is async, so it can take a few seconds and reports cleanly if the peer is offline.",
};

// ── image / camera (binary fetch → image content block) ──────────────────────
// hw1.sh `--get-b64 <path>` performs an authenticated binary GET and prints base64 to
// stdout (one line, unwrapped) plus an `HTTP <code> <content-type>` line to stderr. Only
// DIRECT HTTP(S) devices can serve binary — a mesh peer has no HTTP, so image tools reject
// it. The 64KB text cap is raised for this path (a JPEG frame's base64 can exceed it).
async function runHw1Image(device, path) {
  let res;
  try { res = await runHw1(device, ["--get-b64", path], { maxBytes: IMAGE_MAX_B64_BYTES }); }
  catch (err) { return { error: String(err && err.message ? err.message : err) }; }
  const line = ((res.stderr || "").match(/HTTP\s+(\d{3})\s*(\S*)/g) || []).pop();
  const mm = line ? line.match(/HTTP\s+(\d{3})\s*(\S*)/) : null;
  const code = mm ? Number(mm[1]) : (res.exitCode === 0 ? 200 : 0);
  const contentType = mm && mm[2] ? mm[2] : "";
  return { code, contentType, b64: (res.stdout || "").trim(), exitCode: res.exitCode, stderr: res.stderr, truncated: res.truncated };
}

// Resolve the target for an HTTP-only (binary) feature: a DIRECT device only — never mesh.
function resolveDirectDevice(registry, requestedDevice) {
  if (requestedDevice) {
    const d = registry.devices[requestedDevice];
    if (!d) return { error: `unknown device '${requestedDevice}'. Configured: ${Object.keys(registry.devices).join(", ")}` };
    if (d.via !== "direct") return { error: `'${requestedDevice}' is a ${d.via} device — the camera is only available on devices reachable directly over HTTP/S (a mesh peer has no HTTP to serve an image).` };
    return { device: d };
  }
  if (!registry.default) return { error: `no default device — ${registry.warnings.join("; ") || "name a direct device"}` };
  const d = registry.devices[registry.default];
  if (!d || d.via !== "direct") return { error: "the default device is not reachable directly over HTTP/S; name a direct device." };
  return { device: d };
}

function descriptionText(result) {
  if (typeof result === "string") return result.trim();
  if (result && typeof result.text === "string") return result.text.trim();
  return "";
}

async function describeCameraImage(img, device, api) {
  const mediaUnderstanding = api && api.runtime && api.runtime.mediaUnderstanding;
  if (!mediaUnderstanding || typeof mediaUnderstanding.describeImageFile !== "function") {
    return { error: "this OpenClaw runtime does not expose mediaUnderstanding.describeImageFile" };
  }

  const mediaType = img.contentType && img.contentType.startsWith("image/") ? img.contentType : "image/jpeg";
  const extension = mediaType === "image/png" ? ".png" : mediaType === "image/webp" ? ".webp" : ".jpg";
  const scratch = await fs.mkdtemp(join(tmpdir(), "hardwareone-camera-"));
  const filePath = join(scratch, `camera-${device.name}${extension}`);

  try {
    await fs.writeFile(filePath, Buffer.from(img.b64, "base64"), { mode: 0o600 });
    const cfg = api.config;
    let agentDir;
    try {
      const identity = api.runtime.agent && api.runtime.agent.resolveAgentIdentity
        ? api.runtime.agent.resolveAgentIdentity(cfg)
        : null;
      const agentId = identity && (identity.agentId || identity.id) ? (identity.agentId || identity.id) : "main";
      if (api.runtime.agent && typeof api.runtime.agent.resolveAgentDir === "function") {
        agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);
      }
    } catch { /* describeImageFile can still resolve the configured image model without an explicit agentDir */ }

    const request = { filePath, cfg };
    if (agentDir) request.agentDir = agentDir;
    const result = await mediaUnderstanding.describeImageFile(request);
    const text = descriptionText(result);
    if (!text) return { error: "the configured OpenClaw image model returned no description" };
    return {
      text,
      provider: result && result.provider ? result.provider : undefined,
      model: result && result.model ? result.model : undefined,
    };
  } catch (err) {
    return { error: String(err && err.message ? err.message : err) };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true }).catch(() => {});
  }
}

function imageResult(img, device, analysis) {
  const mediaType = img.contentType && img.contentType.startsWith("image/") ? img.contentType : "image/jpeg";
  const kb = Math.round((img.b64.length * 3 / 4) / 1024);
  const analysisText = analysis && analysis.text
    ? `\n\nAutomatic visual description of this exact captured frame:\n${analysis.text}\n\nUse that description to answer the user's camera question. The image block is also attached for clients that can display or forward tool-result images.`
    : analysis && analysis.error
      ? `\n\nAutomatic visual description failed: ${analysis.error}. The capture itself succeeded and the image block is attached, but do not invent scene details or try image/exec/file paths; report the description failure.`
      : "\n\nThe image block is attached. Do not invent a filesystem path for it.";
  return {
    content: [
      { type: "text", text: `Camera image from '${device.name}' (${mediaType}, ~${kb} KB).${analysisText}` },
      // AgentToolResult uses OpenClaw's canonical image block, not the Anthropic
      // Messages API's nested `source` shape. The UI may render either shape, but
      // OpenClaw's model-facing image sanitizer requires top-level data + mimeType.
      { type: "image", data: img.b64, mimeType: mediaType },
    ],
    details: {
      device: device.name,
      mediaType,
      approxKB: kb,
      kind: "camera",
      description: analysis && analysis.text ? analysis.text : undefined,
      descriptionProvider: analysis && analysis.provider ? analysis.provider : undefined,
      descriptionModel: analysis && analysis.model ? analysis.model : undefined,
      descriptionError: analysis && analysis.error ? analysis.error : undefined,
    },
  };
}

export function createHardwareoneTools(api) {
  return [
    {
      name: "hardwareone_ping",
      label: "HardwareOne Ping",
      description:
        "Health-check a HardwareOne device — the default device, or the one named by `device`. " +
        "Returns hostname, MAC, firmware version.",
      parameters: { type: "object", properties: { device: DEVICE_PARAM }, required: [] },
      async execute(_toolCallId, params) {
        const device = params && params.device;
        if (!validDeviceParam(device)) return errorResult("device must be a short name (letters, digits, _ or -)");
        return runOnDevice(device, ["--ping"]);
      },
    },
    {
      name: "hardwareone_cli",
      label: "HardwareOne CLI",
      description:
        "Run a HardwareOne CLI command (e.g. 'status', 'features', 'temperature') on the default " +
        "device, or on the device named by `device` — including access:mesh devices, which are relayed " +
        "through the master automatically (just name them; the relay is async). Capabilities vary per " +
        "device — run 'features' first on an unfamiliar one, and check hardwareone_devices for the " +
        "operator's per-device description.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The CLI command, e.g. 'status' or 'features'." },
          device: DEVICE_PARAM,
        },
        required: ["command"],
      },
      async execute(_toolCallId, params) {
        const command = params && params.command;
        const device = params && params.device;
        if (typeof command !== "string" || command.length === 0 || command.length > 512) {
          return errorResult("command must be a non-empty string under 512 chars");
        }
        if (!SAFE_CLI_RE.test(command)) {
          return errorResult("command must be printable text (no control characters)");
        }
        if (!validDeviceParam(device)) return errorResult("device must be a short name (letters, digits, _ or -)");
        return runOnDevice(device, [command]);
      },
    },
    {
      name: "hardwareone_devices",
      label: "HardwareOne Devices",
      description:
        "List the configured HardwareOne devices with name, role (master/worker/backup), access " +
        "('direct' = reachable over HTTP, 'mesh' = relayed through the master automatically), and any " +
        "operator-written `description` of that device's hardware/software setup. Names, roles + " +
        "descriptions only — never addresses or credentials. Pass {\"probe\": true} to also report " +
        "which DIRECT devices are online. What each device IS also lives in your memory (search 'hardwareone').",
      parameters: {
        type: "object",
        properties: { probe: { type: "boolean", description: "Also ping each direct device to report online status (slower)." } },
        required: [],
      },
      async execute(_toolCallId, params) {
        const registry = await buildRegistry();
        const names = Object.keys(registry.devices);
        if (names.length === 0) {
          const why = registry.warnings.length ? " — " + registry.warnings.join("; ") : "";
          return errorResult(`no HardwareOne devices configured${why}`);
        }
        let devices = names.map((n) => {
          const dev = registry.devices[n];
          const entry = {
            name: n,
            role: dev.role,
            access: dev.via,
            default: n === registry.default,
          };
          if (dev.description) entry.description = dev.description;
          return entry;
        });
        if (params && params.probe) {
          devices = await Promise.all(devices.map(async (d) => {
            if (d.access === "mesh") return d; // can't HTTP-ping a mesh-only device
            try {
              const res = await runHw1(registry.devices[d.name], ["--ping"]);
              return { ...d, online: res.exitCode === 0 };
            } catch {
              return { ...d, online: false };
            }
          }));
        }
        const payload = { count: devices.length, default: registry.default, devices };
        if (registry.warnings.length) payload.warnings = registry.warnings;
        if (registry.notes && registry.notes.length) payload.notes = registry.notes;
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: payload };
      },
    },
    {
      name: "hardwareone_camera",
      label: "HardwareOne Camera",
      description:
        "Take a photo with a HardwareOne device's camera, describe that exact frame with OpenClaw's configured " +
        "image model, and also return the captured image for display. " +
        "Only works on devices reachable directly over HTTP/S (access:direct) — NOT mesh peers. By default it " +
        "starts the camera automatically if it is off (a few seconds to warm up). Use this whenever the user " +
        "asks what the device sees — to read a label, check a scene, count objects, inspect something. Use the " +
        "automatic visual description in the tool result; never call the separate image tool, invent a file path, " +
        "or fall back to CLI capture/fileview/base64/exec.",
      parameters: {
        type: "object",
        properties: {
          device: DEVICE_PARAM,
          ensureOn: { type: "boolean", description: "Start the camera automatically if it is off (default true)." },
          describe: { type: "boolean", description: "Describe the captured frame with OpenClaw's configured image model (default true). Set false only when the raw image is all you need." },
        },
        required: [],
      },
      async execute(_toolCallId, params) {
        const requested = params && params.device;
        const ensureOn = !params || params.ensureOn === undefined ? true : truthy(params.ensureOn);
        const describe = !params || params.describe === undefined ? true : truthy(params.describe);
        if (!validDeviceParam(requested)) return errorResult("device must be a short name (letters, digits, _ or -)");
        const registry = await buildRegistry();
        if (Object.keys(registry.devices).length === 0) return errorResult("no HardwareOne devices configured");
        const resolved = resolveDirectDevice(registry, requested);
        if (resolved.error) return errorResult(resolved.error);
        const device = resolved.device;

        let img = await runHw1Image(device, "/api/sensors/camera/frame");
        if (img.error) return errorResult(img.error);
        if (img.code === 501) return errorResult(`'${device.name}' has no camera (its firmware wasn't built with the camera feature).`);
        if (img.code === 503 && ensureOn) {
          // camera is off — start it (opencamera can block while the sensor powers up), then retry once.
          try { await runHw1(device, ["opencamera"], { timeoutMs: CAMERA_WARMUP_MS }); }
          catch (err) { return errorResult(`could not start the camera on '${device.name}': ${String(err && err.message ? err.message : err)}`); }
          img = await runHw1Image(device, "/api/sensors/camera/frame");
          if (img.error) return errorResult(img.error);
        }
        if (img.code === 503) return errorResult(`the camera on '${device.name}' is not started — retry with ensureOn:true, or run 'opencamera' via hardwareone_cli first.`);
        if (img.code !== 200) return errorResult(`camera fetch failed on '${device.name}' (HTTP ${img.code || "?"}${img.stderr ? ": " + img.stderr.trim().slice(0, 200) : ""}).`);
        if (!img.b64) return errorResult(`the camera on '${device.name}' returned an empty image.`);
        if (img.truncated) return errorResult(`the camera image from '${device.name}' exceeded the size cap — lower the resolution with 'camerares' via hardwareone_cli and retry.`);
        const analysis = describe ? await describeCameraImage(img, device, api) : null;
        return imageResult(img, device, analysis);
      },
    },
  ];
}
