/**
 * Time helpers. Author durations in SECONDS and convert with the composition's
 * fps (`useVideoConfig().fps` inside components), so changing fps never
 * changes how long anything lasts.
 */

/** Seconds → whole frames. */
export const toFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);

/** Frames → seconds. */
export const toSeconds = (frames: number, fps: number): number => frames / fps;

/** Musical beats → frames. `beatsToFrames(4, 120, 30)` = one 4/4 bar at 120 BPM = 60 frames. */
export const beatsToFrames = (
  beats: number,
  bpm: number,
  fps: number,
): number => Math.round(((beats * 60) / bpm) * fps);

/**
 * Position inside the current beat, from 0 (on the beat) to 1 (just before the next).
 * Use it to drive anything that should pulse with the music.
 */
export const beatPhase = (frame: number, bpm: number, fps: number): number => {
  const beats = (frame / fps) * (bpm / 60);
  return beats - Math.floor(beats);
};

/**
 * A pulse that is 1 exactly on every beat and decays towards 0 until the next.
 * Higher `sharpness` = shorter, punchier pulse.
 */
export const beatPulse = (
  frame: number,
  bpm: number,
  fps: number,
  sharpness = 4,
): number => Math.pow(1 - beatPhase(frame, bpm, fps), sharpness);

export type TimelineSceneInput<Id extends string> = {
  readonly id: Id;
  readonly seconds: number;
};

export type TimelineScene<Id extends string> = {
  readonly id: Id;
  /** Absolute frame where the scene starts in the parent composition. */
  readonly from: number;
  readonly durationInFrames: number;
};

/**
 * Resolves a list of scenes (in seconds) that are joined by equal-length
 * transitions — exactly how `<TransitionSeries>` lays them out — into frames.
 *
 * Each transition overlaps the end of one scene with the start of the next,
 * so: total = sum(scenes) − (scenes − 1) × transition.
 * Use `scenes[i].from` to sync audio cues or overlays with scene changes.
 */
export const buildTimeline = <Id extends string>(
  scenes: readonly TimelineSceneInput<Id>[],
  transitionSeconds: number,
  fps: number,
) => {
  const transitionFrames = toFrames(transitionSeconds, fps);
  let cursor = 0;

  const resolved: TimelineScene<Id>[] = scenes.map((scene) => {
    const durationInFrames = toFrames(scene.seconds, fps);
    if (durationInFrames <= transitionFrames) {
      throw new Error(
        `Scene "${scene.id}" (${durationInFrames} frames) must be longer than the transition (${transitionFrames} frames).`,
      );
    }
    const from = cursor;
    cursor += durationInFrames - transitionFrames;
    return { id: scene.id, from, durationInFrames };
  });

  const last = resolved[resolved.length - 1];
  const durationInFrames = last ? last.from + last.durationInFrames : 0;

  const byId = resolved.reduce(
    (acc, scene) => {
      acc[scene.id] = scene;
      return acc;
    },
    {} as Record<Id, TimelineScene<Id>>,
  );

  return { scenes: resolved, byId, transitionFrames, durationInFrames };
};
