// How long a HardwareOne command may take to produce its result, by "speed" class.
// Any command not listed in COMMAND_SPEEDS is fast. Operators can override the
// seconds per device (timeout / timeoutMedium / timeoutLong) or via HW1_TIMEOUT /
// HW1_TIMEOUT_MEDIUM / HW1_TIMEOUT_LONG for the single-device hardwareone.env.
export const SPEED_SECONDS = Object.freeze({ fast: 30, medium: 120, slow: 300 });

// Commands that can legitimately outlast the fast budget, classified from firmware
// behavior. Keys follow the firmware's dispatch rule — case-insensitive, longest
// registered prefix at a word boundary — so a subcommand key overrides its parent.
// Commands that only queue work and return (ringscan, llmask, espnowremote, openg2,
// ...) stay fast even though their results arrive later.
export const COMMAND_SPEEDS = Object.freeze({
  opencamera: "medium",         // sensor power-up blocks the command task (~60 s worst case)
  closecamera: "medium",        // waits up to 30 s for the sensor to stop
  g2scan: "medium",             // synchronous BLE scan + connect
  wait: "medium",               // wait/sleep accept up to 60 000 ms
  sleep: "medium",
  healthlogmerge: "medium",     // file work that scales with file size
  gpstrackmerge: "medium",
  "capturecrypt export": "medium",
  espnowsendfile: "slow",       // blocks until the whole file is sent over ESP-NOW
  imagesend: "slow",            // same, for images
  "sdformat confirm": "slow",   // formats the SD card in place (bare sdformat only warns)
  "certgen rsa": "slow",        // RSA-2048 keygen, ~30-60 s (default ECDSA takes ~1 s)
  llmload: "slow",              // loads a model synchronously
  llmgenerate: "slow",          // the plain form generates on the command task...
  "llmgenerate json": "fast",   // ...the structured form only starts async generation
});

// The speed class of a command line.
export function commandSpeed(command) {
  const line = String(command).trim().replace(/\s+/g, " ").toLowerCase();
  let match = "";
  for (const key of Object.keys(COMMAND_SPEEDS)) {
    if ((line === key || line.startsWith(key + " ")) && key.length > match.length) match = key;
  }
  return match ? COMMAND_SPEEDS[match] : "fast";
}
