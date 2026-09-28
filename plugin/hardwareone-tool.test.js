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
