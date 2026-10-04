import { useId } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, EASE, prog } from "../lib/motion";
import { useAbsFrame } from "./Scene";

/**
 * Whip-pan with horizontal motion blur (reference: section-to-section whips).
 * "out" pushes the scene off to the left; "in" brings it in from the right.
 */
export const Whip: React.FC<{
  readonly mode: "out" | "in";
  readonly start: number;
  readonly end: number;
  readonly children: React.ReactNode;
}> = ({ mode, start, end, children }) => {
  const frame = useAbsFrame();
  const fid = `whip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const p = prog(frame, start, end - start, mode === "out" ? EASE.in : EASE.out);
  const x = mode === "out" ? -p * 1500 : (1 - p) * 1500;
  const blur = (mode === "out" ? p : 1 - p) * 70;
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={fid} x="-30%" y="0%" width="160%" height="100%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ translate: `${x}px 0px`, filter: blur > 0.5 ? `url(#${fid})` : undefined }}>
        {children}
      </AbsoluteFill>
    </>
  );
};

/** Rounded colour panel that grows from the left edge to fill the frame. */
export const PanelWipe: React.FC<{ readonly start: number; readonly end: number; readonly color: string }> = ({
  start,
  end,
  color,
}) => {
  const frame = useAbsFrame();
  if (frame < start) return null;
  const p = prog(frame, start, end - start, EASE.inOut);
  const inset = (1 - p) * 70;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: inset,
        bottom: inset,
        width: `${p * 100}%`,
        backgroundColor: color,
        borderTopRightRadius: (1 - p) * 60,
        borderBottomRightRadius: (1 - p) * 60,
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        zIndex: 90,
      }}
    />
  );
};

/** Halftone dither wipe: a field of dots that swell outward into solid colour. */
export const DitherWipe: React.FC<{
  readonly start: number;
  readonly end: number;
  readonly color: string;
  readonly cx?: number;
  readonly cy?: number;
}> = ({ start, end, color, cx = 1300, cy = 560 }) => {
  const frame = useAbsFrame();
  if (frame < start) return null;
  const p = prog(frame, start, end - start, EASE.in);
  const cell = 40;
  const cols = Math.ceil(1920 / cell) + 1;
  const rows = Math.ceil(1080 / cell) + 1;
  const feather = 360;
  const maxDist = Math.hypot(Math.max(cx, 1920 - cx), Math.max(cy, 1080 - cy));
  const front = p * (maxDist + feather);
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * cell;
      const y = j * cell;
      const k = interpolate(front - Math.hypot(x - cx, y - cy), [0, feather], [0, 1], CLAMP);
      if (k > 0) dots.push(<circle key={`${i}-${j}`} cx={x} cy={y} r={k * cell * 0.76} fill={color} />);
    }
  }
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 90 }}>
      {dots}
    </svg>
  );
};

/** Slow push-in plus optional punch-ins on impact frames (camera movement). */
export const Camera: React.FC<{
  readonly start: number;
  readonly end: number;
  readonly from?: number;
  readonly to?: number;
  readonly punches?: number[];
  readonly origin?: string;
  readonly children: React.ReactNode;
}> = ({ start, end, from = 1, to = 1.035, punches = [], origin = "50% 50%", children }) => {
  const frame = useAbsFrame();
  const base = interpolate(frame, [start, end], [from, to], { ...CLAMP, easing: EASE.inOut });
  const punch = punches.reduce((acc, f) => {
    const t = frame - f;
    return t < 0 || t > 12 ? acc : acc + 0.018 * Math.exp(-t / 3.5);
  }, 0);
  return (
    <AbsoluteFill style={{ scale: `${base + punch}`, transformOrigin: origin }}>{children}</AbsoluteFill>
  );
};

/** Brand-coloured paper background. */
export const Bg: React.FC<{ readonly color: string }> = ({ color }) => (
  <AbsoluteFill style={{ backgroundColor: color }} />
);

