import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../config/theme";
import { wave } from "../lib/animation";
import { useUnit } from "../lib/layout";

type GradientBackgroundProps = {
  readonly accentColor?: string;
  readonly secondaryColor?: string;
  readonly baseColor?: string;
  readonly showGrid?: boolean;
};

/**
 * Dark backdrop with two slowly drifting colored light sources, a perspective
 * grid and a vignette. Fully frame-driven, so it loops smoothly at any length.
 */
export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  accentColor = COLORS.accent,
  secondaryColor = COLORS.secondary,
  baseColor = COLORS.background,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();

  const ax = 28 + wave(frame, fps, 9) * 10;
  const ay = 32 + wave(frame, fps, 11, 1) * 8;
  const bx = 74 + wave(frame, fps, 10, 2) * 8;
  const by = 70 + wave(frame, fps, 8, 3) * 10;
  const cell = u(80);

  return (
    <AbsoluteFill style={{ backgroundColor: baseColor }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at ${ax}% ${ay}%, color-mix(in srgb, ${accentColor} 38%, transparent) 0%, transparent 45%)`,
            `radial-gradient(circle at ${bx}% ${by}%, color-mix(in srgb, ${secondaryColor} 24%, transparent) 0%, transparent 42%)`,
          ].join(", "),
        }}
      />
      {showGrid ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: `${cell}px ${cell}px`,
            backgroundPosition: `0px ${(frame * u(0.6)) % cell}px`,
            maskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 70%)",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
