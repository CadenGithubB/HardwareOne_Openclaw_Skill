process.stderr.write("[hardwareone] index.js importing\n");
import { t as definePluginEntry } from "../../plugin-entry-Bkat4og3.js";
import { createHardwareoneTools } from "./hardwareone-tool.js";

const hardwareone_default = definePluginEntry({
  id: "hardwareone",
  name: "HardwareOne Plugin",
  description: "HardwareOne ESP32 tools exposed to the sandboxed agent",
  register(api) {
    process.stderr.write("[hardwareone] register() called\n");
    for (const tool of createHardwareoneTools()) {
      api.registerTool(tool);
      process.stderr.write("[hardwareone] registered tool " + tool.name + "\n");
    }
  }
});

process.stderr.write("[hardwareone] index.js module evaluated\n");
export default hardwareone_default;
