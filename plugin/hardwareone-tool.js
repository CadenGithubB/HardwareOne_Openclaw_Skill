import { spawn } from "node:child_process";

const HW1_SCRIPT = "/Users/openclaw/.openclaw/workspace/skills/hardwareone/scripts/hw1.sh";
const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 64 * 1024;

// Permissive on purpose: allow any printable ASCII so EVERY device CLI syntax works
// (key=value for automations, ';'-separated command lists, JSON, passwords with
// symbols, etc.). Safe to be this open — runHw1() spawns hw1.sh with an argv array
// (never a shell) and hw1.sh hands the command to curl via --data-urlencode, so no
// character is ever shell-interpreted. The 512-char cap below is the real guardrail.
const SAFE_CLI_RE = /^[\x20-\x7E]+$/;
const SAFE_PATH_RE = /^\/api\/[A-Za-z0-9_\-\/.?=&%]*$/;

function runHw1(argv) {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(HW1_SCRIPT, argv, { stdio: ["ignore", "pipe", "pipe"] });
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

function formatResult(res) {
  const body = res.stdout && res.stdout.length > 0 ? res.stdout : (res.stderr || "(no output)");
  const suffix = res.truncated ? "\n\n[output truncated]" : "";
  const prefix = res.exitCode !== 0 ? `[exit ${res.exitCode}] ` : "";
  return {
    content: [{ type: "text", text: prefix + body + suffix }],
    details: {
      exitCode: res.exitCode,
      truncated: res.truncated,
      stderr: res.stderr || undefined
    }
  };
}

function errorResult(message) {
  return {
    content: [{ type: "text", text: "Error: " + message }],
    details: { error: true }
  };
}

export function createHardwareoneTools() {
  return [
    {
      name: "hardwareone_ping",
      label: "HardwareOne Ping",
      description: "Health-check the HardwareOne ESP32 device. No arguments.",
      parameters: { type: "object", properties: {}, required: [] },
      async execute(_toolCallId, _params) {
        try {
          return formatResult(await runHw1(["--ping"]));
        } catch (err) {
          return errorResult(String(err && err.message ? err.message : err));
        }
      }
    },
    {
      name: "hardwareone_cli",
      label: "HardwareOne CLI",
      description:
        "Run a HardwareOne CLI command (e.g. 'status', 'uptime', 'features', 'temperature'). " +
        "Run 'features' first on an unfamiliar device — only [ON] or [OFF] features accept their CLI commands.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The CLI command, e.g. 'status' or 'features'."
          }
        },
        required: ["command"]
      },
      async execute(_toolCallId, params) {
        const command = params && params.command;
        if (typeof command !== "string" || command.length === 0 || command.length > 512) {
          return errorResult("command must be a non-empty string under 512 chars");
        }
        if (!SAFE_CLI_RE.test(command)) {
          return errorResult("command must be printable text (no control characters)");
        }
        try {
          return formatResult(await runHw1([command]));
        } catch (err) {
          return errorResult(String(err && err.message ? err.message : err));
        }
      }
    },
    {
      name: "hardwareone_get",
      label: "HardwareOne GET",
      description: "HTTP GET a HardwareOne API endpoint, e.g. '/api/sensors' or '/api/files/list?path=/'.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "API path, must start with /api/"
          }
        },
        required: ["path"]
      },
      async execute(_toolCallId, params) {
        const path = params && params.path;
        if (typeof path !== "string" || path.length === 0 || path.length > 512) {
          return errorResult("path must be a non-empty string under 512 chars");
        }
        if (!SAFE_PATH_RE.test(path)) {
          return errorResult("path must start with /api/ and use URL-safe characters only");
        }
        try {
          return formatResult(await runHw1(["--get", path]));
        } catch (err) {
          return errorResult(String(err && err.message ? err.message : err));
        }
      }
    }
  ];
}
