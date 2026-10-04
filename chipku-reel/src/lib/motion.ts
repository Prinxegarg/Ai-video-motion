import { Easing, interpolate, spring } from "remotion";
import timeline from "../timeline.json";

/** Easing vocabulary matching the reference: snappy expo-out entrances, smooth moves. */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.32, 0, 0.67, 0),
  backOut: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type CueId = keyof typeof timeline.cues;

/** Absolute frame of a cue from src/timeline.json (shared with the audio script). */
export const cue = (id: CueId): number => timeline.cues[id].frame;

export type SceneId = keyof typeof timeline.scenes;
export const sceneStart = (id: SceneId): number => timeline.scenes[id][0];
export const sceneEnd = (id: SceneId): number => timeline.scenes[id][1];

export type TransitionId = keyof typeof timeline.transitions;
export const transitionRange = (id: TransitionId) =>
  timeline.transitions[id] as [number, number];

/** 0→1 eased progress over [start, start+duration]. */
export const prog = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE.out,
): number =>
  interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], {
    ...CLAMP,
    easing,
  });

/** Spring 0→1 starting at `start`. */
export const pop = (
  frame: number,
  fps: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {
    damping: 12,
    stiffness: 170,
  },
): number => spring({ frame: frame - start, fps, config });

/** Seamless idle wobble between -1 and 1. */
export const wave = (frame: number, period = 60, phase = 0): number =>
  Math.sin((frame / period) * Math.PI * 2 + phase);

/** Timecode like the reference HUD: HH:MM:SS:FF. */
export const timecode = (frame: number, fps: number): string => {
  const ff = frame % fps;
  const total = Math.floor(frame / fps);
  const ss = total % 60;
  const mm = Math.floor(total / 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(mm)}:${p(ss)}:${p(ff)}`;
};
