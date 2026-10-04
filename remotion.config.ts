/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Remotion downloads its own Chrome Headless Shell on first render.
// In locked-down environments (CI, sandboxes, air-gapped machines) where that
// download is blocked, point REMOTION_BROWSER_EXECUTABLE at an existing
// Chrome / Chromium headless shell binary instead.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
