import { createContext, useContext } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

const SceneStart = createContext(0);

/**
 * Mounts a scene for [start, end) but keeps ABSOLUTE frame numbers available
 * through useAbsFrame(), so every cue in timeline.json can be used directly.
 */
export const Scene: React.FC<{
  readonly name: string;
  readonly start: number;
  readonly end: number;
  readonly children: React.ReactNode;
}> = ({ name, start, end, children }) => (
  <Sequence name={name} from={start} durationInFrames={end - start} premountFor={30}>
    <SceneStart.Provider value={start}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </SceneStart.Provider>
  </Sequence>
);

/** Absolute composition frame, even inside a <Scene>. */
export const useAbsFrame = (): number => useCurrentFrame() + useContext(SceneStart);
