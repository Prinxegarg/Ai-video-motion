import { interpolate, spring, useVideoConfig } from "remotion";
import { CLAMP, EASE, prog } from "../lib/motion";
import { useAbsFrame } from "./Scene";
import { F } from "../theme";

/** One headline word: rises, sharpens and fades in (reference word-by-word build). */
export const Word: React.FC<{
  readonly at: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ at, children, style }) => {
  const frame = useAbsFrame();
  const p = prog(frame, at, 11, EASE.out);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: interpolate(p, [0, 0.5], [0, 1], CLAMP),
        translate: `0px ${(1 - p) * 0.38}em`,
        filter: `blur(${(1 - p) * 10}px)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Hand-drawn swoosh under an accent word, revealed left → right. */
export const Swoosh: React.FC<{
  readonly at: number;
  readonly color: string;
  readonly duration?: number;
  readonly thickness?: number;
  readonly style?: React.CSSProperties;
}> = ({ at, color, duration = 12, thickness = 9, style }) => {
  const frame = useAbsFrame();
  const p = prog(frame, at, duration, EASE.inOut);
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: "-2%",
        width: "104%",
        height: "0.16em",
        bottom: "-0.02em",
        overflow: "visible",
        clipPath: `inset(-50% ${(1 - p) * 100}% -50% 0)`,
        ...style,
      }}
    >
      <path
        d="M4 28 C 70 10, 170 6, 260 12 S 370 20, 396 14"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/**
 * Accent word in italic serif: letters cascade in on a spring with a wave
 * (reference: "everything?", "yours.", "one page."). Optional swoosh and a
 * trailing dot that can grow into a full-screen colour wipe.
 */
export const Accent: React.FC<{
  readonly text: string;
  readonly at: number;
  readonly color: string;
  readonly size: number;
  readonly underline?: { at: number; color: string };
  readonly dot?: { color: string; wipe?: { start: number; end: number; to: string } };
  readonly style?: React.CSSProperties;
}> = ({ text, at, color, size, underline, dot, style }) => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const letters = Array.from(text);
  const dotIn = at + letters.length * 2 + 2;
  const dotPop = spring({ frame: frame - dotIn, fps, config: { damping: 11, stiffness: 180 } });
  const wipe = dot?.wipe;
  const wipeP = wipe ? prog(frame, wipe.start, wipe.end - wipe.start, EASE.in) : 0;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: F.serif,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color,
        ...style,
      }}
    >
      <span style={{ position: "relative", display: "inline-block" }}>
        {letters.map((ch, i) => {
          const s = spring({
            frame: frame - (at + i * 2),
            fps,
            config: { damping: 10, stiffness: 160 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: interpolate(s, [0, 0.4], [0, 1], CLAMP),
                translate: `0px ${(1 - s) * 0.45}em`,
                rotate: `${(1 - s) * -14}deg`,
              }}
            >
              {ch}
            </span>
          );
        })}
        {underline ? <Swoosh at={underline.at} color={underline.color} /> : null}
      </span>
      {dot ? (
        <span
          style={{
            display: "inline-block",
            width: "0.15em",
            height: "0.15em",
            marginLeft: "0.04em",
            borderRadius: "50%",
            position: "relative",
            zIndex: 50,
            backgroundColor: wipe && wipeP > 0.05 ? wipe.to : dot.color,
            scale: `${dotPop * (1 + wipeP * wipeP * 150)}`,
          }}
        />
      ) : null}
    </span>
  );
};

/** Small mono label, e.g. "// bundle offers". */
export const Eyebrow: React.FC<{
  readonly at: number;
  readonly color: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ at, color, children, style }) => {
  const frame = useAbsFrame();
  const p = prog(frame, at, 12);
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 26,
        letterSpacing: "0.02em",
        color,
        opacity: p,
        translate: `${(1 - p) * -16}px 0px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
