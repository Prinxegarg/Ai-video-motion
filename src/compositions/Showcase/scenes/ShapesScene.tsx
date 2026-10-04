import { Circle, Polygon, Rect, Star, Triangle } from "@remotion/shapes";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../../../components/AnimatedText";
import { DrawPath } from "../../../components/DrawPath";
import { GradientBackground } from "../../../components/GradientBackground";
import { PopIn } from "../../../components/PopIn";
import { COLORS, FONTS } from "../../../config/theme";
import { CLAMP, stagger, wave } from "../../../lib/animation";
import { useUnit } from "../../../lib/layout";
import { beatPulse, toFrames } from "../../../lib/timing";
import { MUSIC_BPM } from "../timeline";

export type ShapesSceneProps = {
  readonly heading: string;
  readonly accentColor: string;
  readonly secondaryColor: string;
  readonly highlightColor: string;
  /**
   * Absolute frame at which this scene starts in the parent video.
   * Added to the local frame so the beat pulse stays locked to the music.
   */
  readonly beatOffset?: number;
};

export const ShapesScene: React.FC<ShapesSceneProps> = ({
  heading,
  accentColor,
  secondaryColor,
  highlightColor,
  beatOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();

  const firstShapeAt = toFrames(0.5, fps);
  const shapeStep = toFrames(0.12, fps);
  const pulse = beatPulse(frame + beatOffset, MUSIC_BPM, fps);

  const shapes = [
    {
      label: "Circle",
      node: <Circle radius={u(90)} fill={accentColor} />,
    },
    {
      label: "Triangle",
      node: (
        <Triangle
          length={u(205)}
          direction="up"
          cornerRadius={u(18)}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={u(10)}
        />
      ),
    },
    {
      label: "Star",
      node: (
        <Star
          points={5}
          innerRadius={u(46)}
          outerRadius={u(100)}
          cornerRadius={u(8)}
          fill={highlightColor}
          style={{ rotate: `${frame * 0.8}deg` }}
        />
      ),
    },
    {
      label: "Rect",
      node: (
        <Rect
          width={u(165)}
          height={u(165)}
          cornerRadius={u(36)}
          fill={COLORS.warm}
        />
      ),
    },
    {
      label: "Polygon",
      node: (
        <Polygon
          points={6}
          radius={u(96)}
          cornerRadius={u(14)}
          fill="none"
          stroke={COLORS.text}
          strokeWidth={u(10)}
          style={{ rotate: `${-frame * 0.6}deg` }}
        />
      ),
    },
  ];

  return (
    <AbsoluteFill>
      <GradientBackground
        accentColor={secondaryColor}
        secondaryColor={accentColor}
      />

      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: u(90),
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: u(24),
              color: secondaryColor,
              opacity: interpolate(
                frame,
                [0, toFrames(0.5, fps)],
                [0, 1],
                CLAMP,
              ),
              marginBottom: u(16),
            }}
          >
            {"02 / graphics"}
          </div>
          <AnimatedText
            text={heading}
            by="word"
            delay={toFrames(0.1, fps)}
            stagger={toFrames(0.1, fps)}
            duration={toFrames(0.6, fps)}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: u(96),
              letterSpacing: "-0.03em",
              color: COLORS.text,
            }}
          />
        </div>

        <div style={{ position: "relative", display: "flex", gap: u(70) }}>
          {/* Connector line drawn behind the shapes */}
          <DrawPath
            d="M0 60 C 200 -20, 400 140, 600 60 S 1000 -20, 1200 60"
            viewBox="0 0 1200 120"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={3}
            start={toFrames(0.3, fps)}
            duration={toFrames(1.4, fps)}
            style={{
              position: "absolute",
              left: -u(60),
              right: -u(60),
              top: u(40),
              width: `calc(100% + ${u(120)}px)`,
              height: u(120),
            }}
          />
          {shapes.map((shape, i) => {
            const delay = stagger(i, shapeStep, firstShapeAt);
            return (
              <div
                key={shape.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: u(28),
                }}
              >
                <PopIn delay={delay} style={{ width: u(210), height: u(210) }}>
                  <div
                    style={{
                      translate: `0px ${wave(frame, fps, 3, i) * u(12)}px`,
                      scale: `${1 + 0.07 * pulse}`,
                    }}
                  >
                    {shape.node}
                  </div>
                </PopIn>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: u(22),
                    color: COLORS.muted,
                    opacity: interpolate(
                      frame,
                      [delay + toFrames(0.3, fps), delay + toFrames(0.7, fps)],
                      [0, 1],
                      CLAMP,
                    ),
                  }}
                >
                  {`<${shape.label} />`}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
