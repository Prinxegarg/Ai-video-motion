import { Easing, interpolate, spring, type SpringConfig } from "remotion";

/**
 * Reusable motion vocabulary. Every animation in Remotion must be driven by
 * `useCurrentFrame()` — never CSS transitions/animations, which do not render.
 *
 * For one-off keyframes you want to tweak in Studio, write `interpolate()`
 * inline in the `style` prop (see AGENTS.md). Use these helpers for patterns
 * that repeat across components.
 */

/** Spread into `interpolate()` options to stop values overshooting the range. */
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Easing curves, as used by `interpolate(..., { easing })`. */
export const EASE = {
  /** Fast start, soft landing. The default for entrances. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Smooth acceleration and deceleration. For moves between two states. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Slow start, fast end. For exits. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** Physically based, no bounce. */
  spring: Easing.spring({ damping: 200 }),
  /** Physically based with a little overshoot. */
  springBouncy: Easing.spring({ damping: 12, stiffness: 140 }),
} as const;

/** Configs for `spring()`. */
export const SPRING = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 9, stiffness: 120 },
} as const satisfies Record<string, Partial<SpringConfig>>;

/**
 * 0 → 1 progress over `[start, start + duration]` frames, clamped and eased.
 * Map it to any property: `interpolate(p, [0, 1], [40, 0])`.
 */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE.out,
): number =>
  interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], {
    ...CLAMP,
    easing,
  });

/** 0 → 1 spring that starts at `delay` frames. Can overshoot 1 with bouncy configs. */
export const springIn = (
  frame: number,
  fps: number,
  delay = 0,
  config: Partial<SpringConfig> = SPRING.smooth,
): number => spring({ frame: frame - delay, fps, config });

/** Delay (in frames) for the n-th item of a staggered group. */
export const stagger = (index: number, step: number, base = 0): number =>
  base + index * step;

/**
 * 1 → 0 progress over the last `duration` frames of a scene.
 * Multiply opacity by it for a clean outro.
 */
export const exitProgress = (
  frame: number,
  durationInFrames: number,
  duration: number,
  easing: (t: number) => number = EASE.in,
): number =>
  interpolate(frame, [durationInFrames - duration, durationInFrames], [1, 0], {
    ...CLAMP,
    easing,
  });

/** Smooth, seamless loop between -1 and 1 for idle "floating" motion. */
export const wave = (frame: number, fps: number, seconds = 4, offset = 0) =>
  Math.sin(((frame / fps) * Math.PI * 2) / seconds + offset);
