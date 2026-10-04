import { Composition } from "remotion";
import { ChipkuReel } from "./ChipkuReel";
import timeline from "./timeline.json";

/**
 * The reel's <Composition> registration, shared by this project's Root.tsx and
 * the repo-root Studio (../src/Root.tsx), so id, size, fps and duration are
 * defined once (from timeline.json).
 */
export const ChipkuReelComposition: React.FC = () => (
  <Composition
    id="ChipkuReel"
    component={ChipkuReel}
    width={timeline.width}
    height={timeline.height}
    fps={timeline.fps}
    durationInFrames={timeline.durationInFrames}
  />
);
