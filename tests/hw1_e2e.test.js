// End-to-end: the real hw1.sh and the real curl against a local HTTP server that
// mimics the firmware's routes and form decoding. Complements the fake-curl transport
// tests by proving what actually goes over the wire. Run: node --test tests/
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const WRAPPER = join(REPO_ROOT, "scripts", "hw1.sh");
const USER = "ad min";
const PASS = 'p&ss+w%41rd "x" !@#$';

let hasCurl = true;
try { execFileSync("curl", ["--version"], { stdio: "ignore" }); } catch { hasCurl = false; }

// Mirrors of the firmware's form handling (System_Utils.cpp).
function urlDecode(s) {
  const bytes = s.replace(/\+/g, " ").replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return Buffer.from(bytes, "latin1").toString("utf8");
}
function extractFormField(body, key) {
  for (const pair of body.split("&")) {
    const eq = pair.indexOf("=");
    if (eq > 0 && pair.slice(0, eq) === key) return pair.slice(eq + 1);
  }
  return "";
}

const seen = { logins: [], commands: [] };
let server;
let baseUrl;
let dir;

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (c) => { body += c; });
    req.on("end", () => resolve(body));
  });
}

before(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), "hw1-e2e-"));
  server = createServer(async (req, res) => {
    const authed = /(?:^|;\s*)session=e2e(?:;|$)/.test(req.headers.cookie || "");
    if (req.method === "GET" && req.url === "/api/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true,"hostname":"hw-e2e","mac":"AA:BB:CC:DD:EE:FF","fingerprint":"' + "a".repeat(64) +
        '","firmwareVersion":"0.99.7","acceptingRestore":false,"pendingConfirm":false}');
      return;
    }
    if (req.method === "POST" && req.url === "/login") {
      const body = await readBody(req);
      const login = { user: urlDecode(extractFormField(body, "username")), pass: urlDecode(extractFormField(body, "password")) };
      seen.logins.push(login);
      const ok = login.user === USER && login.pass === PASS;
      res.writeHead(ok ? 303 : 200, ok ? { "Set-Cookie": "session=e2e; Path=/; HttpOnly", Location: "/dashboard" } : {});
      res.end();
      return;
    }
    if (req.method === "GET" && req.url === "/api/system") {
      res.writeHead(authed ? 200 : 401);
      res.end(authed ? "{}" : "unauthorized");
      return;
    }
    if (req.method === "POST" && req.url === "/api/cli") {
      if (!authed) { res.writeHead(401); res.end("unauthorized"); return; }
      const cmd = urlDecode(extractFormField(await readBody(req), "cmd"));
      seen.commands.push(cmd);
      if (cmd === "slow-reply") { setTimeout(() => { res.writeHead(200); res.end("late"); }, 3_000); return; }
      if (cmd === "device-timeout") { res.writeHead(400, { "Content-Type": "text/plain" }); res.end("[ERROR] Command timed out"); return; }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`OK: ${cmd}`);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(dir, { recursive: true, force: true });
});

function runWrapper(args, env = {}) {
  return new Promise((resolve) => {
    execFile(WRAPPER, args, {
      env: {
        PATH: process.env.PATH, HOME: dir,
        HW1_URL: baseUrl, HW1_USER: USER, HW1_PASS: PASS,
        HW1_COOKIE_DIR: join(dir, `cookies-${Math.random().toString(36).slice(2)}`),
        ...env,
      },
    }, (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr }));
  });
}

test("credentials and commands arrive exactly as sent", { skip: !hasCurl && "curl not installed" }, async () => {
  const res = await runWrapper(["status json"]);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.stdout.trim(), "OK: status json");
  assert.deepEqual(seen.logins.at(-1), { user: USER, pass: PASS });
  assert.equal(seen.commands.at(-1), "status json");
});

test("exit status 7 means the command was never sent", { skip: !hasCurl && "curl not installed" }, async () => {
  const closed = createServer();
  await new Promise((resolve) => closed.listen(0, "127.0.0.1", resolve));
  const port = closed.address().port;
  await new Promise((resolve) => closed.close(resolve));
  const before = seen.commands.length;
  const res = await runWrapper(["status"], { HW1_URL: `http://127.0.0.1:${port}` });
  assert.equal(res.code, 7, res.stderr);
  assert.equal(seen.commands.length, before);
});

test("a timeout after sending exits 1 and says the command may have run", { skip: !hasCurl && "curl not installed" }, async () => {
  const res = await runWrapper(["slow-reply"], { HW1_CMD_TIMEOUT: "1" });
  assert.equal(res.code, 1);
  assert.match(res.stderr, /no response within 1s after the command was sent/);
  assert.equal(seen.commands.at(-1), "slow-reply");
});

test("the plugin drives the real wrapper end to end", { skip: !hasCurl && "curl not installed" }, async (t) => {
  const name = `e2e-${process.pid}`;
  const registry = join(dir, "devices.json");
  await fs.writeFile(registry, JSON.stringify({
    devices: { [name]: { url: baseUrl, user: USER, pass: PASS, role: "master" } },
  }));
  const saved = ["HW1_SCRIPT", "HW1_DEVICES_FILE", "HW1_ENV"].map((k) => [k, process.env[k]]);
  process.env.HW1_SCRIPT = WRAPPER;
  process.env.HW1_DEVICES_FILE = registry;
  process.env.HW1_ENV = join(dir, "missing.env");
  t.after(async () => {
    for (const [k, v] of saved) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    await fs.rm(`/tmp/hw1/${name}`, { recursive: true, force: true });
  });
  const moduleUrl = new URL("../plugin/hardwareone-tool.js", import.meta.url);
  moduleUrl.searchParams.set("e2e", String(Date.now()));
  const { createHardwareoneTools } = await import(moduleUrl.href);
  const cli = createHardwareoneTools({}).find((tool) => tool.name === "hardwareone_cli");

  const ok = await cli.execute("e2e", { command: "certgen rsa" });
  assert.equal(ok.content[0].text.trim(), "OK: certgen rsa");
  assert.deepEqual(seen.logins.at(-1), { user: USER, pass: PASS });

  const stuck = await cli.execute("e2e", { command: "device-timeout" });
  assert.match(stuck.content[0].text, /^\[exit 1\] \[ERROR\] Command timed out/);
  assert.match(stuck.content[0].text, /Don't run it again/);
});
