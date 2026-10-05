import { Easing, interpolate } from "remotion";

export const E = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  outQuint: Easing.bezier(0.22, 1, 0.36, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inQuart: Easing.bezier(0.5, 0, 0.75, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: (t: number) => t,
} as const;

/** Clamped, eased tween of a value between two frames. */
export const tw = (
  frame: number,
  f0: number,
  f1: number,
  v0: number,
  v1: number,
  ease: (t: number) => number = E.outExpo,
): number =>
  interpolate(frame, [f0, Math.max(f0 + 1e-3, f1)], [v0, v1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** 0→1 progress between two frames. */
export const pr = (
  frame: number,
  f0: number,
  f1: number,
  ease: (t: number) => number = E.outExpo,
) => tw(frame, f0, f1, 0, 1, ease);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Damped oscillation for impacts / camera shake: 1 at t=0, decaying. */
export const decay = (t: number, freq = 1.6, damp = 6) =>
  t < 0 ? 0 : Math.exp(-damp * t) * Math.cos(freq * Math.PI * 2 * t);
