import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";

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

const SAFE_CLI_RE = /^[\x20-\x7E]+$/;
const SAFE_PATH_RE = /^\/api\/[A-Za-z0-9_\-\/.?=&%]*$/;
const SAFE_DEVICE_RE = /^[A-Za-z0-9_-]{1,40}$/;
const UNREACHABLE_RE = /could not reach|connection refused|timed out|resolve host|TLS\/certificate/i;

const truthy = (v) => v === true || v === 1 || v === "1" || v === "true";

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
    // mesh-only: no direct connection; reached through the master's espnowremote.
    return { name, via: "mesh", role };
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
      warnings.push(`device '${name}' is missing url/user/pass — skipped (use "via":"mesh" if it's reached through the master)`);
      continue;
    }
    if (d.via === "mesh" && d.role === "master") {
      warnings.push(`device '${name}' is via:mesh but role:master — the master must be directly reachable; treating it as a worker`);
      d.role = "worker";
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
      if (directNames.length === 0) warnings.push('no directly-reachable device — at least one needs url+user+pass to be the HTTP entry point (the master)');
      else if (masters.length === 1) def = masters[0];
      else if (directNames.length === 1) def = directNames[0];
      else if (masters.length === 0) warnings.push('no device has role "master"; set "default"');
      else warnings.push(`multiple masters (${masters.join(", ")}); set "default"`);
    }
    return { devices, default: def || null, warnings };
  }
  const legacy = await readLegacyDevice(warnings);
  if (legacy) return { devices: { default: legacy }, default: "default", warnings };
  return { devices: {}, default: null, warnings };
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

function runHw1(device, argv) {
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
      rejectPromise(new Error(`hardwareone timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    proc.stdout.on("data", (chunk) => {
      if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
        stdout += chunk.slice(0, MAX_OUTPUT_BYTES - stdout.length).toString();
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

// Resolve the target device, run, and fail over to a backup ONLY when the implicit
// default (the master) is unreachable. An explicitly named device is never failed over.
// A mesh-only device has no direct connection — calling it directly is rejected with
// guidance to relay through the master (no silent rerouting).
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
      const master = registry.default || "the master";
      return errorResult(
        `'${requestedDevice}' is mesh-only — reach it through the master '${master}' over the ESP-NOW ` +
        `system (run the command on '${master}' via hardwareone_cli; results are async via espnowmessages). ` +
        `Use the espnow* command that fits the task: espnowrequestmeta (a peer's metadata), espnowremote ` +
        `(run a CLI command on it), espnowfetch/espnowsendfile (files). Not sure which? Run 'help espnow' ` +
        `on '${master}', or search the catalog for 'espnow' — don't assume it's always espnowremote.`);
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
  description: "Optional device name (from hardwareone_devices). Omit to use the default master. A device shown with access:mesh can't be called directly — reach it via the master's ESP-NOW system (the right espnow* command for the task: espnowrequestmeta, espnowremote, espnowfetch, …; see help espnow).",
};

export function createHardwareoneTools() {
  return [
    {
      name: "hardwareone_ping",
      label: "HardwareOne Ping",
      description:
        "Health-check a HardwareOne device — the default master, or the one named by `device`. " +
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
        "master, or on the device named by `device`. Capabilities vary per device — run 'features' " +
        "first on an unfamiliar one. To reach a mesh-only device, run the right espnow* command on the " +
        "master (e.g. espnowrequestmeta for metadata; run 'help espnow' if unsure — don't assume espnowremote).",
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
      name: "hardwareone_get",
      label: "HardwareOne GET",
      description:
        "HTTP GET a HardwareOne API endpoint (e.g. '/api/sensors') on the default master, or on the " +
        "device named by `device`.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "API path, must start with /api/" },
          device: DEVICE_PARAM,
        },
        required: ["path"],
      },
      async execute(_toolCallId, params) {
        const apiPath = params && params.path;
        const device = params && params.device;
        if (typeof apiPath !== "string" || apiPath.length === 0 || apiPath.length > 512) {
          return errorResult("path must be a non-empty string under 512 chars");
        }
        if (!SAFE_PATH_RE.test(apiPath)) {
          return errorResult("path must start with /api/ and use URL-safe characters only");
        }
        if (!validDeviceParam(device)) return errorResult("device must be a short name (letters, digits, _ or -)");
        return runOnDevice(device, ["--get", apiPath]);
      },
    },
    {
      name: "hardwareone_devices",
      label: "HardwareOne Devices",
      description:
        "List the configured HardwareOne devices with name, role (master/worker/backup), and access " +
        "('direct' = reachable over HTTP, 'mesh' = reached only through the master's espnowremote). " +
        "Names + roles only, never addresses or credentials. Pass {\"probe\": true} to also report " +
        "which DIRECT devices are online. What each device IS lives in your memory (search 'hardwareone').",
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
        let devices = names.map((n) => ({
          name: n,
          role: registry.devices[n].role,
          access: registry.devices[n].via,
          default: n === registry.default,
        }));
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
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: payload };
      },
    },
  ];
}
