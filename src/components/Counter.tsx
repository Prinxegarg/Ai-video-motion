import { interpolate, useCurrentFrame } from "remotion";
import { EASE, progress } from "../lib/animation";

type CounterProps = {
  readonly to: number;
  readonly from?: number;
  /** Frame at which counting starts. */
  readonly start?: number;
  /** Frames to reach `to`. */
  readonly duration?: number;
  readonly decimals?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly style?: React.CSSProperties;
};

/** Animated number that counts up (or down) and eases into its final value. */
export const Counter: React.FC<CounterProps> = ({
  to,
  from = 0,
  start = 0,
  duration = 45,
  decimals = 0,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const value = interpolate(
    progress(frame, start, duration, EASE.out),
    [0, 1],
    [from, to],
  );

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};
