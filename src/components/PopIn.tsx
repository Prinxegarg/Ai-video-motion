import type { SpringConfig } from "remotion";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, SPRING, springIn } from "../lib/animation";

type PopInProps = {
  readonly children: React.ReactNode;
  /** Frame at which the pop starts. */
  readonly delay?: number;
  /** Starting rotation in degrees. */
  readonly rotateFrom?: number;
  readonly config?: Partial<SpringConfig>;
  readonly style?: React.CSSProperties;
};

/** Springs its children in from zero scale with a slight rotation. */
export const PopIn: React.FC<PopInProps> = ({
  children,
  delay = 0,
  rotateFrom = -30,
  config = SPRING.bouncy,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = springIn(frame, fps, delay, config);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        scale: `${s}`,
        rotate: `${(1 - s) * rotateFrom}deg`,
        opacity: interpolate(s, [0, 0.3], [0, 1], CLAMP),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
