/**
 * Render settings for the CLI and Studio. (The Node.js APIs ignore this file.)
 * All options: https://www.remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setOverwriteOutput(true);

// Lossless PNG frames → H.264 in broadcast yuv420p. JPEG frames would hand the
// encoder full-range yuvj420p and soften the flat colour fields of this reel.
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(16);
Config.setX264Preset("slow");

// Offline / firewalled machines: point at an existing Chrome Headless Shell
// instead of letting Remotion download one.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
