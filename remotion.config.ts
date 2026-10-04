/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);

// The CHIPKU reel (chipku-reel/) is a separate project that is also registered
// in this Studio. Resolve its packages from THIS project's node_modules so React
// and Remotion are never loaded twice (chipku-reel/node_modules has its own copies).
// overrideBundlerConfig applies to both Rspack and Webpack.
const rootNodeModules = path.resolve(process.cwd(), "node_modules");
Config.overrideBundlerConfig((config) => ({
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config.module?.rules ?? []),
      {
        include: path.resolve(process.cwd(), "chipku-reel", "src"),
        resolve: { modules: [rootNodeModules] },
      },
    ],
  },
}));
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Remotion downloads its own Chrome Headless Shell on first render.
// In locked-down environments (CI, sandboxes, air-gapped machines) where that
// download is blocked, point REMOTION_BROWSER_EXECUTABLE at an existing
// Chrome / Chromium headless shell binary instead.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
