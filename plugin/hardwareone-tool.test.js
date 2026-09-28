import assert from "node:assert/strict";
import { after, test } from "node:test";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { COMMAND_SPEEDS, SPEED_SECONDS, commandSpeed } from "./command-speeds.js";
import { commandTiming, relayWaitMs } from "./hardwareone-tool.js";

const ORIGINAL_ENV = new Map(
  [
    "HW1_SCRIPT",
    "HW1_DEVICES_FILE",
    "HW1_ENV",
    "HW1_URL",
    "HW1_USER",
    "HW1_PASS",
    "HW1_ALLOW_HTTP",
    "HW1_TIMEOUT",
    "HW1_TIMEOUT_MEDIUM",
    "HW1_TIMEOUT_LONG",
    "HW1_CONNECT_TIMEOUT",
    "HW1_CMD_TIMEOUT",
  ].map((key) => [key, process.env[key]]),
);

// The expectations assume no HardwareOne tuning in the shell running the tests.
for (const key of ["HW1_TIMEOUT", "HW1_TIMEOUT_MEDIUM", "HW1_TIMEOUT_LONG", "HW1_CONNECT_TIMEOUT", "HW1_CMD_TIMEOUT"]) {
  delete process.env[key];
}

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

async function loadTools({ wrapper, registry, legacyEnv }) {
  process.env.HW1_SCRIPT = wrapper;
  process.env.HW1_DEVICES_FILE = registry;
  process.env.HW1_ENV = legacyEnv;
  const moduleUrl = new URL("./hardwareone-tool.js", import.meta.url);
  moduleUrl.searchParams.set("test", `${Date.now()}-${Math.random()}`);
  const { createHardwareoneTools } = await import(moduleUrl.href);
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

test("registry diagnostics never quote the registry's contents", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-registry-diagnostics-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const wrapper = await makeFakeWrapper(dir);
  const registry = join(dir, "devices.json");
  const missingLegacyEnv = join(dir, "missing.env");
  delete process.env.HW1_URL;
  delete process.env.HW1_USER;
  delete process.env.HW1_PASS;
  const devicesText = async (tools) =>
    (await tools.find((tool) => tool.name === "hardwareone_devices").execute("test-call", {})).content[0].text;

  // An unquoted value is a common hand-editing mistake, and Node's JSON.parse
  // message for it quotes the surrounding text — password included.
  await fs.writeFile(registry,
    '{"devices":{"node-a":{"url":"https://192.0.2.42","user":"admin","pass":hunter2-SECRET}}}');
  let tools = await loadTools({ wrapper, registry, legacyEnv: missingLegacyEnv });
  for (const text of [await devicesText(tools), (await pingTool(tools).execute("test-call", {})).content[0].text]) {
    assert.match(text, /invalid JSON/);
    assert.doesNotMatch(text, /hunter2|SECRET|192\.0\.2\.42/);
  }

  // Positional syntax errors still report where to look.
  await fs.writeFile(registry, '{"devices":{"node-a":{"user":"admin",}}}');
  tools = await loadTools({ wrapper, registry, legacyEnv: missingLegacyEnv });
  assert.match(await devicesText(tools), /invalid JSON in .* at line 1, column \d+/);

  // A key or "default" that fails name validation may be a misplaced address or
  // secret, so it is counted rather than echoed.
  await fs.writeFile(registry, JSON.stringify({
    default: "https://192.0.2.99",
    devices: {
      "https://192.0.2.77": { url: "https://192.0.2.77", user: "admin", pass: "pw" },
      "node-a": { url: "https://192.0.2.42", user: "admin", pass: "pw", role: "master" },
    },
  }));
  tools = await loadTools({ wrapper, registry, legacyEnv: missingLegacyEnv });
  const text = await devicesText(tools);
  assert.match(text, /ignored 1 device whose name is not/);
  assert.match(text, /default\\" is not a valid device name/);
  assert.doesNotMatch(text, /192\.0\.2\.(42|77|99)/);
});

test("failover happens only when the command was never sent", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-failover-"));
  const callLog = join(dir, "calls.log");
  process.env.FAKE_HW1_LOG = callLog;
  t.after(async () => {
    delete process.env.FAKE_HW1_LOG;
    await fs.rm(dir, { recursive: true, force: true });
  });
  const wrapper = join(dir, "fake-hw1-failover.sh");
  await fs.writeFile(wrapper, [
    "#!/bin/sh",
    'printf "%s %s\\n" "$HW1_URL" "$*" >> "$FAKE_HW1_LOG"',
    'case "$HW1_URL" in',
    '  *not-sent*) echo "Error: could not verify a HardwareOne device" >&2; exit 7 ;;',
    '  *sent-timeout*) echo "Error: no response within 30s after the command was sent." >&2; exit 1 ;;',
    "esac",
    'echo "ran: $*"',
    "",
  ].join("\n"), { mode: 0o700 });
  const registry = join(dir, "devices.json");
  const missingLegacyEnv = join(dir, "missing.env");
  const withMaster = (url) => fs.writeFile(registry, JSON.stringify({
    default: "master",
    devices: {
      master: { url, user: "user", pass: "pass", role: "master" },
      spare: { url: "https://spare.test", user: "user", pass: "pass", role: "backup" },
    },
  }));
  const run = async (params) => {
    await fs.writeFile(callLog, "");
    const tools = await loadTools({ wrapper, registry, legacyEnv: missingLegacyEnv });
    const result = await tools.find((tool) => tool.name === "hardwareone_cli").execute("test-call", params);
    const calls = (await fs.readFile(callLog, "utf8")).trim().split("\n");
    return { text: result.content[0].text, calls };
  };

  // Not sent to the master (exit 7): safe to run on the backup instead.
  await withMaster("https://not-sent.test");
  let outcome = await run({ command: "reboot" });
  assert.deepEqual(outcome.calls, ["https://not-sent.test reboot", "https://spare.test reboot"]);
  assert.match(outcome.text, /^\[failed over master → spare: 'master' was unreachable, so the command was not sent to it\]\nran: reboot/);

  // Sent, then timed out: the master may have rebooted, so it must not run twice.
  await withMaster("https://sent-timeout.test");
  outcome = await run({ command: "reboot" });
  assert.deepEqual(outcome.calls, ["https://sent-timeout.test reboot"]);
  assert.match(outcome.text, /after the command was sent/);

  // An explicitly named device never fails over.
  await withMaster("https://not-sent.test");
  outcome = await run({ command: "reboot", device: "master" });
  assert.deepEqual(outcome.calls, ["https://not-sent.test reboot"]);
});

test("only configured devices resolve, even for Object.prototype names", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-device-lookup-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const wrapper = await makeFakeWrapper(dir);
  const registry = join(dir, "devices.json");
  await fs.writeFile(registry, JSON.stringify({
    devices: { "node-a": { url: "https://node-a.test", user: "user", pass: "pass", role: "master" } },
  }));
  const legacyEnv = join(dir, "hardwareone.env");
  await fs.writeFile(legacyEnv, "HW1_URL=legacy.test\nHW1_USER=user\nHW1_PASS=pass\n");
  delete process.env.HW1_URL;
  delete process.env.HW1_USER;
  delete process.env.HW1_PASS;

  // Both the JSON registry and the legacy single-device fallback.
  for (const registryPath of [registry, join(dir, "missing-devices.json")]) {
    const tools = await loadTools({ wrapper, registry: registryPath, legacyEnv });
    const cli = tools.find((tool) => tool.name === "hardwareone_cli");
    const camera = tools.find((tool) => tool.name === "hardwareone_camera");
    for (const device of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      const viaCli = await cli.execute("test-call", { command: "status", device });
      assert.match(viaCli.content[0].text, /^Error: unknown device/, `cli ${device}`);
      const viaCamera = await camera.execute("test-call", { device, describe: false });
      assert.match(viaCamera.content[0].text, /^Error: unknown device/, `camera ${device}`);
    }
  }
});

test("commands are classified the way the firmware dispatches them", () => {
  const cases = {
    status: "fast",
    "automation list": "fast",
    ringscan: "fast",                        // only queues a scan
    "llmask 1 2": "fast",                    // async; result via llmresult
    "LLMLoad model.bin": "slow",             // case-insensitive
    "llmgenerate what is 2+2": "slow",       // plain form generates synchronously
    "llmgenerate json {\"q\":1}": "fast",    // subcommand overrides its parent
    certgen: "fast",                         // default ECDSA takes ~1 s
    "certgen   RSA": "slow",                 // whitespace and case normalized
    sdformat: "fast",                        // bare form only warns
    "sdformat confirm": "slow",
    "wait 60000": "medium",
    waitx: "fast",                           // prefixes match at word boundaries only
    opencamera: "medium",
    'espnowsendfile peer "/log.csv"': "slow",
  };
  for (const [command, speed] of Object.entries(cases)) {
    assert.equal(commandSpeed(command), speed, command);
  }
  for (const [key, speed] of Object.entries(COMMAND_SPEEDS)) {
    assert.ok(speed in SPEED_SECONDS, `${key} has a known speed`);
    assert.equal(key, key.toLowerCase().trim(), `${key} is normalized`);
  }
});

test("direct-device budgets stop at the firmware's synchronous wait unless set explicitly", () => {
  const plain = { name: "a" };
  assert.deepEqual(commandTiming(plain, ["status"]), { speed: "fast", commandS: 30, killAfterMs: 95_000 });
  assert.equal(commandTiming(plain, ["opencamera"]).commandS, 75);   // medium, capped
  assert.equal(commandTiming(plain, ["llmload m.bin"]).commandS, 75); // slow, capped
  assert.equal(commandTiming(plain, ["--ping"]).commandS, null);      // not a CLI command
  const tuned = { name: "b", timeout: 20, timeoutMedium: 90, timeoutLong: "200" };
  assert.equal(commandTiming(tuned, ["status"]).commandS, 20);
  assert.equal(commandTiming(tuned, ["opencamera"]).commandS, 90);
  assert.equal(commandTiming(tuned, ["llmload m.bin"]).commandS, 200); // explicit wins over the cap
  assert.equal(commandTiming(tuned, ["llmload m.bin"]).killAfterMs, (200 + 2 * 20 + 5) * 1000);
  assert.equal(commandTiming({ name: "c", timeoutLong: "nonsense" }, ["llmload"]).commandS, 75);
  // The gateway's own HW1_TIMEOUT* variables, which hw1.sh always inherited, still
  // apply when the device does not set its own value.
  const savedEnv = ["HW1_TIMEOUT", "HW1_TIMEOUT_LONG"].map((k) => [k, process.env[k]]);
  try {
    process.env.HW1_TIMEOUT = "45";
    process.env.HW1_TIMEOUT_LONG = "240";
    assert.equal(commandTiming(plain, ["status"]).commandS, 45);
    assert.equal(commandTiming(plain, ["llmload m.bin"]).commandS, 240);
    assert.equal(commandTiming(tuned, ["llmload m.bin"]).commandS, 200); // the device still wins
  } finally {
    for (const [k, v] of savedEnv) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  // Relayed commands run asynchronously on the peer, so they get the full budget.
  assert.equal(relayWaitMs("status"), 15_000);
  assert.equal(relayWaitMs("opencamera"), 120_000);
  assert.equal(relayWaitMs("llmload m.bin"), 300_000);
});

async function makeTimingWrapper(dir) {
  const wrapper = join(dir, "fake-hw1-timing.sh");
  await fs.writeFile(wrapper, [
    "#!/bin/sh",
    'printf "%s|%s|cmd=%s|req=%s\\n" "$HW1_URL" "$*" "${HW1_CMD_TIMEOUT-unset}" "${HW1_TIMEOUT-unset}" >> "$FAKE_HW1_LOG"',
    'case "$*" in',
    '  hang) exec sleep 30 ;;',
    '  "llmload stuck") echo "[ERROR] Command timed out"; echo "Error: bad request (400)." >&2; exit 1 ;;',
    '  espnowremote*) echo "OK: sent to peer-b (AA:BB:CC:DD:EE:FF) reqId 42"; exit 0 ;;',
    "  \"espnowmessages json\"*) echo '{\"messages\":[{\"seq\":1,\"reqId\":42,\"type\":6,\"sent\":false,\"piece\":1,\"of\":1,\"msg\":\"hello from peer\"}]}'; exit 0 ;;",
    "esac",
    'echo "ran: $*"',
    "",
  ].join("\n"), { mode: 0o700 });
  return wrapper;
}

test("each command's budget reaches the wrapper, and slow outcomes are explained", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-timing-"));
  const callLog = join(dir, "calls.log");
  process.env.FAKE_HW1_LOG = callLog;
  t.after(async () => {
    delete process.env.FAKE_HW1_LOG;
    await fs.rm(dir, { recursive: true, force: true });
  });
  const wrapper = await makeTimingWrapper(dir);
  const registry = join(dir, "devices.json");
  await fs.writeFile(registry, JSON.stringify({
    default: "node-a",
    devices: {
      "node-a": { url: "https://node-a.test", user: "user", pass: "pass", role: "master" },
      "node-b": { url: "https://node-b.test", user: "user", pass: "pass", timeout: 20, timeoutMedium: 90, timeoutLong: 200 },
      "peer-b": { via: "mesh", user: "peer-user", pass: "peer-pass" },
    },
  }));
  delete process.env.HW1_URL;
  delete process.env.HW1_USER;
  delete process.env.HW1_PASS;
  const tools = await loadTools({ wrapper, registry, legacyEnv: join(dir, "missing.env") });
  const cli = tools.find((tool) => tool.name === "hardwareone_cli");
  const lastCall = async () => (await fs.readFile(callLog, "utf8")).trim().split("\n").pop();

  for (const [params, expected] of [
    [{ command: "status" }, "https://node-a.test|status|cmd=30|req=unset"],
    [{ command: "certgen rsa" }, "https://node-a.test|certgen rsa|cmd=75|req=unset"],
    [{ command: "status", device: "node-b" }, "https://node-b.test|status|cmd=20|req=20"],
    [{ command: "opencamera", device: "node-b" }, "https://node-b.test|opencamera|cmd=90|req=20"],
    [{ command: "llmload m.bin", device: "node-b" }, "https://node-b.test|llmload m.bin|cmd=200|req=20"],
  ]) {
    await cli.execute("test-call", params);
    assert.equal(await lastCall(), expected);
  }
  await pingTool(tools).execute("test-call", {});
  assert.equal(await lastCall(), "https://node-a.test|--ping|cmd=unset|req=unset");

  // The firmware's own 60 s reply means the command is still running on the device.
  const stuck = await cli.execute("test-call", { command: "llmload stuck" });
  assert.match(stuck.content[0].text, /\[ERROR\] Command timed out/);
  assert.match(stuck.content[0].text, /keeps running it in the background\. Don't run it again/);

  // Mesh relay: dispatch, then poll for the peer's reply.
  const relayed = await cli.execute("test-call", { command: "status", device: "peer-b" });
  assert.equal(relayed.content[0].text, "[via node-a → peer-b] hello from peer");

  // Cancellation stops the wrapper instead of waiting out its budget.
  const controller = new AbortController();
  const started = Date.now();
  const pending = cli.execute("test-call", { command: "hang" }, controller.signal);
  setTimeout(() => controller.abort(), 100);
  assert.match((await pending).content[0].text, /^Error: cancelled/);
  assert.ok(Date.now() - started < 5_000, "cancelled promptly");
});

test("legacy hardwareone.env timing settings reach the wrapper", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), "hardwareone-plugin-legacy-timing-"));
  const callLog = join(dir, "calls.log");
  process.env.FAKE_HW1_LOG = callLog;
  t.after(async () => {
    delete process.env.FAKE_HW1_LOG;
    await fs.rm(dir, { recursive: true, force: true });
  });
  const wrapper = await makeTimingWrapper(dir);
  const legacyEnv = join(dir, "hardwareone.env");
  await fs.writeFile(legacyEnv,
    "HW1_URL=legacy.test\nHW1_USER=user\nHW1_PASS=pass\nHW1_TIMEOUT=12\nHW1_TIMEOUT_LONG=150\n");
  delete process.env.HW1_URL;
  delete process.env.HW1_USER;
  delete process.env.HW1_PASS;
  const tools = await loadTools({ wrapper, registry: join(dir, "missing.json"), legacyEnv });
  const cli = tools.find((tool) => tool.name === "hardwareone_cli");
  await cli.execute("test-call", { command: "status" });
  await cli.execute("test-call", { command: "llmload m.bin" });
  assert.deepEqual((await fs.readFile(callLog, "utf8")).trim().split("\n"), [
    "legacy.test|status|cmd=12|req=12",
    "legacy.test|llmload m.bin|cmd=150|req=12",
  ]);
});
