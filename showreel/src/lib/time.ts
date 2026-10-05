import { useCurrentFrame } from "remotion";
import timeline from "../timeline.json";

export const FPS = timeline.fps;
/** Frames per beat (60 fps @ 128 BPM = 28.125). */
export const FPB = (60 / timeline.bpm) * timeline.fps;
/** Absolute beat → absolute frame (rounded once, the same way the audio script does). */
export const bf = (beat: number): number => Math.round(beat * FPB);

export type SectionId = keyof typeof timeline.sections;

export const section = (id: SectionId) => {
  const [a, b] = timeline.sections[id];
  return {
    startBeat: a,
    beats: b - a,
    from: bf(a),
    to: bf(b),
    dur: bf(b) - bf(a),
  };
};

/**
 * Beat clock for a scene rendered inside its own <Sequence> (local frame 0 = section start).
 * `at(localBeat)` returns the local frame of a beat, aligned to the global beat grid.
 */
export const useBeatClock = (id: SectionId) => {
  const frame = useCurrentFrame();
  const s = section(id);
  const at = (localBeat: number) => bf(s.startBeat + localBeat) - s.from;
  return { frame, beat: frame / FPB, at, dur: s.dur, beats: s.beats };
};
