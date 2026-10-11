import { useCurrentFrame } from "remotion";
import timeline from "../timeline.json";

export const FPS = timeline.fps;
/** Seconds per beat (0.5 s at 120 BPM). Bars start on odd seconds: 3, 5, 7… */
export const SPB = 60 / timeline.bpm;
/** Absolute seconds → absolute frame. */
export const sf = (seconds: number): number => Math.round(seconds * FPS);

export type SceneId = keyof typeof timeline.scenes;

export const scene = (id: SceneId) => {
  const [a, b] = timeline.scenes[id];
  return { start: a, from: sf(a), to: sf(b), dur: sf(b) - sf(a) };
};

/**
 * Clock for a scene rendered inside its own <Sequence> (local frame 0 = scene start).
 * `at(t)` gives the local frame of an *absolute* time in seconds, so every cue is
 * written with the same numbers as the soundtrack's cue sheet.
 */
export const useScene = (id: SceneId) => {
  const frame = useCurrentFrame();
  const s = scene(id);
  const at = (seconds: number) => sf(seconds) - s.from;
  return { frame, at, dur: s.dur, t: frame / FPS + s.start };
};
