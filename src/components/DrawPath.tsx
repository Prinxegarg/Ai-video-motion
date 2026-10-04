import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { EASE, progress } from "../lib/animation";

type DrawPathProps = {
  /** SVG path data, in the coordinate space of `viewBox`. */
  readonly d: string;
  readonly viewBox: string;
  readonly stroke: string;
  readonly strokeWidth?: number;
  /** Frame at which drawing starts. */
  readonly start?: number;
  /** Frames to draw the full path. */
  readonly duration?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Draws an SVG stroke from start to end, like a pen. Great for underlines,
 * swooshes, connectors, signatures and line-art reveals.
 */
export const DrawPath: React.FC<DrawPathProps> = ({
  d,
  viewBox,
  stroke,
  strokeWidth = 6,
  start = 0,
  duration = 30,
  style,
}) => {
  const frame = useCurrentFrame();
  const { strokeDasharray, strokeDashoffset } = evolvePath(
    progress(frame, start, duration, EASE.inOut),
    d,
  );

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      style={{ overflow: "visible", ...style }}
    >
      <path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};
