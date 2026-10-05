import assert from "node:assert/strict";
import { after, test } from "node:test";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ORIGINAL_ENV = new Map(
  [
    "HW1_SCRIPT",
    "HW1_DEVICES_FILE",
    "HW1_ENV",
    "HW1_URL",
    "HW1_USER",
    "HW1_PASS",
    "HW1_ALLOW_HTTP",
  ].map((key) => [key, process.env[key]]),
);

after(() => {
  for (const [key, value] of ORIGINAL_ENV) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function makeFakeWrapper(dir) {
  const wrapper = join(dir, "fake-hw1-wrapper.js");
  await fs.writeFile(
    wrapper,
    "#!/bin/sh\nprintf '%s|%s' \"$HW1_URL\" \"${HW1_ALLOW_HTTP:-unset}\"\n",
    { mode: 0o700 },
  );
  await fs.chmod(wrapper, 0o700);
  return wrapper;
}

async function loadModule({ wrapper, registry, legacyEnv }) {
  process.env.HW1_SCRIPT = wrapper;
  process.env.HW1_DEVICES_FILE = registry;
  process.env.HW1_ENV = legacyEnv;
  const moduleUrl = new URL("./hardwareone-tool.js", import.meta.url);
  moduleUrl.searchParams.set("test", `${Date.now()}-${Math.random()}`);
  return import(moduleUrl.href);
}

async function loadTools(opts) {
  const { createHardwareoneTools } = await loadModule(opts);
  return createHardwareoneTools({});
}

function pingTool(tools) {
  return tools.find((tool) => tool.name === "hardwareone_ping");
}

async function pingAllowHttp(tools, device) {
  const result = await pingTool(tools).execute("test-call", device ? { device } : {});
  return result.content[0].text;
}

test("only an explicit per-device HTTP opt-in reaches the wrapper", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-http-policy-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const wrapper = await makeFakeWrapper(dir);
  const registry = join(dir, "devices.json");
  const unusedLegacyEnv = join(dir, "unused.env");

  await fs.writeFile(registry, JSON.stringify({
    default: "allowed",
    defaults: { allowHttp: true },
    devices: {
      allowed: { url: "allowed.local", user: "user", pass: "pass", allowHttp: true },
      denied: { url: "denied.local", user: "user", pass: "pass", allowHttp: false },
      absent: { url: "absent.local", user: "user", pass: "pass" },
      stringTrue: { url: "string.local", user: "user", pass: "pass", allowHttp: "true" },
      numberOne: { url: "number.local", user: "user", pass: "pass", allowHttp: 1 },
    },
  }));

  // A gateway-wide value must not leak into JSON devices that did not opt in.
  delete process.env.HW1_URL;
  delete process.env.HW1_USER;
  delete process.env.HW1_PASS;
  process.env.HW1_ALLOW_HTTP = "1";
  const jsonTools = await loadTools({ wrapper, registry, legacyEnv: unusedLegacyEnv });
  assert.equal(await pingAllowHttp(jsonTools, "allowed"), "allowed.local|1");
  assert.equal(await pingAllowHttp(jsonTools, "denied"), "denied.local|unset");
  assert.equal(await pingAllowHttp(jsonTools, "absent"), "absent.local|unset");
  assert.equal(await pingAllowHttp(jsonTools, "stringTrue"), "string.local|unset");
  assert.equal(await pingAllowHttp(jsonTools, "numberOne"), "number.local|unset");

  delete process.env.HW1_ALLOW_HTTP;
  const missingRegistry = join(dir, "missing-devices.json");
  const legacyEnv = join(dir, "hardwareone.env");
  await fs.writeFile(legacyEnv, [
    "HW1_URL=legacy.local",
    "HW1_USER=user",
    "HW1_PASS=pass",
    "HW1_ALLOW_HTTP=1",
    "",
  ].join("\n"));
  const legacyTools = await loadTools({ wrapper, registry: missingRegistry, legacyEnv });
  assert.equal(await pingAllowHttp(legacyTools), "legacy.local|1");
});

// ── exit-code contract + input cap ───────────────────────────────────────────
// hw1.sh: 0 ok; 1 transport/config error; 3 the device executed the request and
// rejected the command (stdout = the device's own diagnostic); 7 unreachable.

async function makeScript(dir, name, body) {
  const script = join(dir, name);
  await fs.writeFile(script, "#!/bin/sh\n" + body, { mode: 0o700 });
  await fs.chmod(script, 0o700);
  return script;
}

async function writeRegistry(dir, devices, def = "master") {
  const registry = join(dir, "devices.json");
  await fs.writeFile(registry, JSON.stringify({ default: def, devices }));
  return registry;
}

const DIRECT_MASTER = { master: { url: "https://master.local", user: "user", pass: "pass", role: "master" } };

function cliTool(tools) {
  return tools.find((tool) => tool.name === "hardwareone_cli");
}

async function runCli(tools, params) {
  return cliTool(tools).execute("test-call", params);
}

test("hardwareone_cli accepts a 2047-character command and rejects 2048 naming the limit", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-input-cap-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  // the fake wrapper echoes the byte length of the command it was handed
  const wrapper = await makeScript(dir, "fake-hw1-len.sh", "printf '%s' \"${#1}\"\n");
  const registry = await writeRegistry(dir, DIRECT_MASTER);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const atLimit = await runCli(tools, { command: "x".repeat(2047) });
  assert.equal(atLimit.content[0].text, "2047");
  assert.equal(atLimit.details.exitCode, 0);

  const overLimit = await runCli(tools, { command: "x".repeat(2048) });
  assert.match(overLimit.content[0].text, /^Error: /);
  assert.match(overLimit.content[0].text, /2047/);
  assert.equal(overLimit.details.error, true);

  // the control-character rule is unchanged
  const controlChar = await runCli(tools, { command: "status\n" });
  assert.match(controlChar.content[0].text, /must be printable text/);

  // non-ASCII is refused by the same gateway-side check, and the message says so
  for (const cmd of ["wifi ssid=Caf\u00e9", "motd 25\u00b0C", "motd \u{1F600}"]) {
    const nonAscii = await runCli(tools, { command: cmd });
    assert.match(nonAscii.content[0].text, /^Error: command must be printable text/);
    assert.match(nonAscii.content[0].text, /non-ASCII/);
    assert.equal(nonAscii.details.error, true);
  }
});

test("exit 3 is passed through verbatim as the device's own diagnostic", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-exit3-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const wrapper = await makeScript(dir, "fake-hw1-exit3.sh",
    "printf 'Unknown command: foo\\n'\necho 'Device rejected the command (HTTP 400); see stdout.' >&2\nexit 3\n");
  const registry = await writeRegistry(dir, DIRECT_MASTER);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const result = await runCli(tools, { command: "foo" });
  assert.equal(result.content[0].text, "Unknown command: foo\n");
  assert.ok(!result.content[0].text.includes("[exit"));
  assert.equal(result.details.exitCode, 3);
  assert.equal(result.details.rejected, true);
});

test("exit 1 still carries the [exit N] prefix", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-exit1-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const wrapper = await makeScript(dir, "fake-hw1-exit1.sh", "printf 'boom\\n'\nexit 1\n");
  const registry = await writeRegistry(dir, DIRECT_MASTER);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const result = await runCli(tools, { command: "status" });
  assert.equal(result.content[0].text, "[exit 1] boom\n");
  assert.equal(result.details.exitCode, 1);
  assert.equal(result.details.rejected, undefined);
});

test("a mesh relay rejected by the master (exit 3) surfaces the master's text, not an offline verdict", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-mesh-exit3-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const diag = "Target device 'peer' not found or not paired. Pair the device first (prefer 'espnowpairsecure').";
  const wrapper = await makeScript(dir, "fake-hw1-mesh.sh",
    `printf '%s\\n' "${diag}"\necho 'Device rejected the command (HTTP 400); see stdout.' >&2\nexit 3\n`);
  const registry = await writeRegistry(dir, {
    ...DIRECT_MASTER,
    peer: { via: "mesh", user: "peeruser", pass: "peerpass" },
  });
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const result = await runCli(tools, { command: "status", device: "peer" });
  assert.equal(result.content[0].text, `[via master → peer] ${diag}`);
  assert.ok(!result.content[0].text.includes("see stdout"));
  assert.ok(!/no reply within|offline/.test(result.content[0].text));
  assert.equal(result.details.dispatchFailed, true);
  assert.equal(result.details.exitCode, 3);
  assert.equal(result.details.rejected, true);
});

// ── slow-command spawn timeout ───────────────────────────────────────────────
// The wrapper sends llmgenerate/llmload/llmask/opencamera/certgen/c6update/otastage/
// otaupdate/stt with HW1_TIMEOUT_LONG; the plugin's kill timer must outlive that cap
// instead of cutting the call at 30 s.

test("spawnTimeoutFor mirrors the wrapper's slow-command list and the device's timeoutLong", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-timeout-table-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const { spawnTimeoutFor } = await loadModule({ wrapper: join(dir, "none.sh"), registry: join(dir, "none.json"), legacyEnv: join(dir, "none.env") });
  const DEFAULT = 30_000;
  const dev300 = { timeoutLong: 300 };
  const long = (s) => s * 1000 + DEFAULT;

  for (const cmd of ["c6update /sd/fw.bin", "otastage confirm", "otaupdate confirm", "stt record 5", "stt start", "llmask 0 1", "llmgenerate hi", "llmload cm5:x.gguf", "opencamera", "certgen rsa"]) {
    assert.equal(spawnTimeoutFor(dev300, cmd), long(300), cmd);
  }
  // spelled the way the firmware also accepts it
  for (const cmd of ["OtaUpdate confirm", "STT record 5", "  stt start", "\tc6update /sd/fw.bin"]) {
    assert.equal(spawnTimeoutFor(dev300, cmd), long(300), JSON.stringify(cmd));
  }
  for (const cmd of ["status", "sttx", "llmresult json 0", "otapin status", "camerastart", "  status"]) {
    assert.equal(spawnTimeoutFor(dev300, cmd), DEFAULT, cmd);
  }
  assert.equal(spawnTimeoutFor({ timeoutLong: 600 }, "otaupdate confirm"), long(600));
  assert.equal(spawnTimeoutFor({ timeoutLong: "45" }, "stt start"), long(45));
  // no / invalid timeoutLong falls back to the wrapper's own 300 s default
  assert.equal(spawnTimeoutFor({}, "c6update /sd/fw.bin"), long(300));
  assert.equal(spawnTimeoutFor({ timeoutLong: "soon" }, "c6update /sd/fw.bin"), long(300));
  assert.ok(spawnTimeoutFor({}, "c6update /sd/fw.bin") > DEFAULT);

  // the device's own per-request cap (hw1.sh's HW1_TIMEOUT) replaces the 30 s base,
  // for an ordinary command and as the grace on top of a slow one
  assert.equal(spawnTimeoutFor({ timeout: 60 }, "status"), 60_000);
  assert.equal(spawnTimeoutFor({ timeout: "45" }, "  Status"), 45_000);
  assert.equal(spawnTimeoutFor({ timeout: 60, timeoutLong: 300 }, "otaupdate confirm"), 300_000 + 60_000);
  assert.equal(spawnTimeoutFor({ timeout: 60 }, "c6update /sd/fw.bin"), 300_000 + 60_000);
  // no / invalid timeout keeps the wrapper's own 30 s default
  assert.equal(spawnTimeoutFor({ timeout: "soon" }, "status"), DEFAULT);
  assert.equal(spawnTimeoutFor({ timeout: 0 }, "status"), DEFAULT);
  assert.equal(spawnTimeoutFor({ timeout: "soon", timeoutLong: 300 }, "stt start"), long(300));
});

test("hardwareone_cli spawns a slow command under the device's long cap and an ordinary one under its timeout", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-timeout-env-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  // the fake wrapper reports the timeouts it was handed and the command's first word
  const wrapper = await makeScript(dir, "fake-hw1-long.sh", "printf 'long=%s req=%s first=%s' \"${HW1_TIMEOUT_LONG:-unset}\" \"${HW1_TIMEOUT:-unset}\" \"${1%% *}\"\n");
  const registry = await writeRegistry(dir, {
    master: { ...DIRECT_MASTER.master, timeoutLong: 300 },
    patient: { url: "https://patient.local", user: "user", pass: "pass", timeout: 60, timeoutLong: 300 },
  });
  const { createHardwareoneTools, spawnTimeoutFor } = await loadModule({ wrapper, registry, legacyEnv: join(dir, "unused.env") });
  const tools = createHardwareoneTools({});

  // details.timeoutMs is the kill timer the spawn actually ran under, so this fails if
  // runOnDevice stops handing spawnTimeoutFor's value to runHw1.
  const slow = await runCli(tools, { command: "c6update /sd/fw.bin" });
  assert.equal(slow.content[0].text, "long=300 req=unset first=c6update");
  assert.equal(slow.details.exitCode, 0);
  assert.equal(slow.details.timeoutMs, 300_000 + 30_000);
  assert.equal(slow.details.timeoutMs, spawnTimeoutFor({ timeoutLong: 300 }, "c6update /sd/fw.bin"));

  const plain = await runCli(tools, { command: "status" });
  assert.equal(plain.content[0].text, "long=300 req=unset first=status");
  assert.equal(plain.details.timeoutMs, 30_000);

  // a device with its own `timeout` hands it to the wrapper AND runs under it: the
  // kill timer must not fire before the curl cap the wrapper was told to use
  const patient = await runCli(tools, { command: "status", device: "patient" });
  assert.equal(patient.content[0].text, "long=300 req=60 first=status");
  assert.equal(patient.details.timeoutMs, 60_000);
  const patientSlow = await runCli(tools, { command: "otaupdate confirm", device: "patient" });
  assert.equal(patientSlow.content[0].text, "long=300 req=60 first=otaupdate");
  assert.equal(patientSlow.details.timeoutMs, 300_000 + 60_000);
});

// ── backup failover ──────────────────────────────────────────────────────────
// The wrapper exits 7 only from its pre-login probe, before anything is sent. A
// transport error after that is exit 1 with report_curl_failure's wording, and the
// command may already be running on the master, so a CLI command never re-runs on the
// backup in that case; the read-only --ping may.

const MASTER_AND_BACKUP = {
  master: { url: "https://master.local", user: "user", pass: "pass", role: "master", timeoutLong: 300 },
  backup: { url: "https://backup.local", user: "user", pass: "pass", role: "backup", timeoutLong: 600 },
};

// a fake wrapper that answers per HW1_URL and logs every call as "<url> <argv>"
async function makeFailoverWrapper(dir, masterBody) {
  const log = join(dir, "calls.log");
  const wrapper = await makeScript(dir, "fake-hw1-failover.sh", [
    `printf '%s %s\n' "$HW1_URL" "$*" >> '${log}'`,
    'case "$HW1_URL" in',
    `  https://master.local) ${masterBody} ;;`,
    "  *) printf 'OK: rebooting\n' ;;",
    "esac",
    "",
  ].join("\n"));
  return { wrapper, log };
}

test("a CLI command fails over to the backup only on exit 7", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-failover-7-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const { wrapper, log } = await makeFailoverWrapper(dir,
    "echo \"Error: could not verify a HardwareOne device at 'master.local'.\" >&2; exit 7");
  const registry = await writeRegistry(dir, MASTER_AND_BACKUP);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const result = await runCli(tools, { command: "otaupdate confirm" });
  assert.equal(result.content[0].text, "[failed over master → backup: master unreachable]\nOK: rebooting\n");
  assert.equal(result.details.device, "backup");
  assert.equal(result.details.failedOverFrom, "master");
  // the backup re-run honours the backup's own timeoutLong
  assert.equal(result.details.timeoutMs, 600_000 + 30_000);
  assert.equal(await fs.readFile(log, "utf8"), "https://master.local otaupdate confirm\nhttps://backup.local otaupdate confirm\n");
});

test("a CLI command whose transport failed after the probe is not re-run on the backup", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-failover-1-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  // curl 28 inside do_cli: the master was verified and the command was sent
  const { wrapper, log } = await makeFailoverWrapper(dir,
    "echo \"Error: timed out reaching 'https://master.local'. Device unreachable or slow (raise HW1_TIMEOUT if the command is expected to be slow).\" >&2; exit 1");
  const registry = await writeRegistry(dir, MASTER_AND_BACKUP);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  const result = await runCli(tools, { command: "otaupdate confirm" });
  assert.match(result.content[0].text, /^\[exit 1\] Error: timed out reaching/);
  assert.equal(result.details.device, "master");
  assert.equal(result.details.failedOverFrom, undefined);
  assert.equal(await fs.readFile(log, "utf8"), "https://master.local otaupdate confirm\n");

  // the read-only ping may still fail over on that wording (nothing to re-execute)
  const ping = await pingTool(tools).execute("test-call", {});
  assert.equal(ping.details.device, "backup");
  assert.equal(ping.details.failedOverFrom, "master");
  assert.equal(await fs.readFile(log, "utf8"),
    "https://master.local otaupdate confirm\nhttps://master.local --ping\nhttps://backup.local --ping\n");
});

// ── mesh relay payload cap ───────────────────────────────────────────────────

test("a mesh-relayed command that cannot fit the master's relay payload is refused before the wrapper runs", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-mesh-cap-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const marker = join(dir, "wrapper-ran");
  // dispatch answers with a reqId; the espnowmessages poll answers with that reply at once
  const wrapper = await makeScript(dir, "fake-hw1-mesh-cap.sh", [
    `: > '${marker}'`,
    'case "$1" in',
    "  espnowmessages*) printf '%s\\n' '{\"messages\":[{\"seq\":1,\"reqId\":7,\"type\":6,\"sent\":false,\"piece\":1,\"of\":1,\"msg\":\"Uptime: 1s\"}]}' ;;",
    "  *) printf 'OK reqId 7 AA:BB:CC:DD:EE:FF\\n' ;;",
    "esac",
    "",
  ].join("\n"));
  const registry = await writeRegistry(dir, {
    ...DIRECT_MASTER,
    peer: { via: "mesh", user: "admin", pass: "hunter22" },
  });
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });

  // 300 characters passes the direct-device cap but "admin:hunter22:<cmd>" is 315 bytes
  const long = "automation add name=lowbatt type=event on=battery_low commands=\"" + "ledcolor red;".repeat(18) + "\" enabled=1";
  assert.ok(long.length >= 250 && long.length <= 2047);
  const refused = await runCli(tools, { command: long, device: "peer" });
  assert.match(refused.content[0].text, /^Error: mesh relay to 'peer' is limited to the master's 217-byte relay payload/);
  assert.match(refused.content[0].text, new RegExp(`this command is ${long.length} characters`));
  // the message never carries the credential-derived total (user + pass + cmd + 2)
  assert.ok(!refused.content[0].text.includes(String("admin".length + "hunter22".length + long.length + 2)));
  assert.equal(refused.details.error, true);
  await assert.rejects(fs.access(marker), "the wrapper must not have been spawned");

  // 203..217 bytes is accepted: the master sends it as an encrypted multi-fragment message
  const fits = "motd " + "x".repeat(217 - 2 - "admin".length - "hunter22".length - "motd ".length);
  assert.equal("admin".length + "hunter22".length + fits.length + 2, 217);
  const relayed = await runCli(tools, { command: fits, device: "peer" });
  assert.equal(relayed.details.via, "mesh");
  assert.equal(relayed.content[0].text, "[via master → peer] Uptime: 1s");
  await fs.rm(marker, { force: true });
  const overByOne = await runCli(tools, { command: fits + "x", device: "peer" });
  assert.match(overByOne.content[0].text, /^Error: mesh relay to 'peer' is limited to the master's 217-byte relay payload/);
  await assert.rejects(fs.access(marker), "the wrapper must not have been spawned for 218 bytes");

  // a short command still goes out through the master and its reply comes back
  const ok = await runCli(tools, { command: "status", device: "peer" });
  await fs.access(marker);
  assert.equal(ok.details.via, "mesh");
  assert.equal(ok.content[0].text, "[via master → peer] Uptime: 1s");
});

// ── camera: opencamera's own refusal is surfaced ─────────────────────────────

test("hardwareone_camera reports the device's reason when opencamera is rejected", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-camera-exit3-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const reason = "ERROR: Camera is disabled - run 'cameraenabled 1' first";
  // --get-b64 answers 503 (camera off); opencamera is rejected by the device (exit 3)
  const wrapper = await makeScript(dir, "fake-hw1-camera.sh", [
    'case "$1" in',
    "  --get-b64) echo 'HTTP 503 text/plain' >&2; exit 1 ;;",
    `  opencamera) printf '%s\\n' "${reason}"; echo 'Device rejected the command (HTTP 400); see stdout.' >&2; exit 3 ;;`,
    "esac",
    "exit 1",
    "",
  ].join("\n"));
  const registry = await writeRegistry(dir, DIRECT_MASTER);
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "unused.env") });
  const camera = tools.find((tool) => tool.name === "hardwareone_camera");

  const result = await camera.execute("test-call", { ensureOn: true });
  assert.equal(result.content[0].text, `Error: could not start the camera on 'master': ${reason}`);
  assert.ok(!result.content[0].text.includes("retry with ensureOn"));
  assert.ok(!result.content[0].text.includes("see stdout"));
  assert.equal(result.details.error, true);
});
