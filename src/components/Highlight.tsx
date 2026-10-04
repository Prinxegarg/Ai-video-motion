import { useCurrentFrame } from "remotion";
import { EASE, progress } from "../lib/animation";
import { useUnit } from "../lib/layout";

type HighlightProps = {
  readonly children: React.ReactNode;
  readonly color: string;
  /** Frame at which the marker starts sweeping in. */
  readonly start?: number;
  readonly duration?: number;
};

/** A highlighter-marker stroke that sweeps in behind inline text. */
export const Highlight: React.FC<HighlightProps> = ({
  children,
  color,
  start = 0,
  duration = 18,
}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const p = progress(frame, start, duration, EASE.inOut);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: -u(12),
          right: -u(12),
          top: "52%",
          bottom: "4%",
          backgroundColor: color,
          borderRadius: u(8),
          scale: `${p} 1`,
          transformOrigin: "left center",
        }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};
