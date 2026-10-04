import { buildTimeline } from "../../lib/timing";

/**
 * The Showcase edit, in seconds. Change any value and the composition's total
 * duration, transition positions and sound-effect cues update automatically.
 */
export const SHOWCASE_SCENES = [
  { id: "intro", seconds: 4 },
  { id: "shapes", seconds: 4.5 },
  { id: "typography", seconds: 5 },
  { id: "outro", seconds: 4 },
] as const;

/** Length of each transition between scenes. Must be shorter than every scene. */
export const SHOWCASE_TRANSITION_SECONDS = 0.6;

/** Tempo of public/audio/ambient-pad.mp3, used to pulse graphics on the beat. */
export const MUSIC_BPM = 120;

export const getShowcaseTimeline = (fps: number) =>
  buildTimeline(SHOWCASE_SCENES, SHOWCASE_TRANSITION_SECONDS, fps);
