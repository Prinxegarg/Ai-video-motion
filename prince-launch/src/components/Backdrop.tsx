import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

/**
 * Near-black stage with a faint dot grid that drifts slowly, and a soft overhead
 * light. `grid` fades the dots (0 for the pure-black moments).
 */
export const Backdrop: React.FC<{ readonly grid: number }> = ({ grid }) => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.35) % 48;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <svg
        width={1920 + 96}
        height={1080 + 96}
        style={{
          position: "absolute",
          left: -48,
          top: -48,
          translate: `${-drift}px ${-drift * 0.5}px`,
          opacity: grid,
        }}
      >
        <defs>
          <pattern
            id="dots"
            width={48}
            height={48}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={24} cy={24} r={1.6} fill="rgba(255,255,255,0.10)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)",
          opacity: grid,
        }}
      />
    </AbsoluteFill>
  );
};
