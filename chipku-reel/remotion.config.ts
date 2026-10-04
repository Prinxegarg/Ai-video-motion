import { Config } from "@remotion/cli/config";

Config.setRspack(true);
// PNG frames → standard limited-range yuv420p output (JPEG frames give yuvj420p).
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCrf(18);
Config.setOverwriteOutput(true);

// Remotion downloads Chrome Headless Shell automatically. Where that download
// is blocked (CI, sandboxes), point this at an existing headless Chrome.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
