import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../../../components/AnimatedText";
import { DrawPath } from "../../../components/DrawPath";
import { GradientBackground } from "../../../components/GradientBackground";
import { COLORS, FONTS } from "../../../config/theme";
import { CLAMP, EASE } from "../../../lib/animation";
import { useUnit } from "../../../lib/layout";
import { toFrames } from "../../../lib/timing";

export type IntroSceneProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly accentColor: string;
  readonly secondaryColor: string;
  readonly soundEffects?: boolean;
};

export const IntroScene: React.FC<IntroSceneProps> = ({
  title,
  subtitle,
  accentColor,
  secondaryColor,
  soundEffects = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();

  // Cue points (frames, relative to the start of this scene).
  const titleAt = toFrames(0.45, fps);
  const impactAt = titleAt + toFrames(0.15, fps); // SFX and glow share this cue
  const underlineAt = toFrames(1.3, fps);
  const subtitleAt = toFrames(1.6, fps);

  return (
    <AbsoluteFill>
      <GradientBackground
        accentColor={accentColor}
        secondaryColor={secondaryColor}
      />

      {/* Orbit rings */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg
          viewBox="0 0 1000 1000"
          style={{
            position: "absolute",
            width: u(1000),
            height: u(1000),
            rotate: `${frame * 0.25}deg`,
            scale: `${interpolate(frame, [0, toFrames(1.4, fps)], [0.6, 1], { ...CLAMP, easing: EASE.out })}`,
            opacity: interpolate(frame, [0, toFrames(1, fps)], [0, 1], CLAMP),
          }}
        >
          <circle
            cx={500}
            cy={500}
            r={490}
            fill="none"
            stroke={accentColor}
            strokeOpacity={0.45}
            strokeWidth={2}
            strokeDasharray="3 16"
          />
          <circle cx={500} cy={10} r={9} fill={secondaryColor} />
        </svg>
        <svg
          viewBox="0 0 1000 1000"
          style={{
            position: "absolute",
            width: u(760),
            height: u(760),
            rotate: `${-frame * 0.4}deg`,
            scale: `${interpolate(frame, [toFrames(0.15, fps), toFrames(1.5, fps)], [0.5, 1], { ...CLAMP, easing: EASE.out })}`,
            opacity: interpolate(
              frame,
              [toFrames(0.15, fps), toFrames(1.1, fps)],
              [0, 1],
              CLAMP,
            ),
          }}
        >
          <circle
            cx={500}
            cy={500}
            r={490}
            fill="none"
            stroke={secondaryColor}
            strokeOpacity={0.3}
            strokeWidth={2}
          />
        </svg>
        {/* Glow that flashes on the impact cue — visual twin of the SFX below */}
        <div
          style={{
            position: "absolute",
            width: u(900),
            height: u(420),
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, color-mix(in srgb, ${accentColor} 55%, transparent) 0%, transparent 70%)`,
            opacity: interpolate(
              frame,
              [impactAt - 2, impactAt + 3, impactAt + toFrames(1.2, fps)],
              [0, 0.9, 0.35],
              CLAMP,
            ),
            scale: `${interpolate(frame, [impactAt - 2, impactAt + toFrames(0.6, fps)], [0.7, 1.1], { ...CLAMP, easing: EASE.out })}`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: u(80),
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: u(24),
            textTransform: "uppercase",
            color: secondaryColor,
            letterSpacing: `${interpolate(frame, [0, toFrames(1.2, fps)], [0.8, 0.35], { ...CLAMP, easing: EASE.out })}em`,
            opacity: interpolate(
              frame,
              [toFrames(0.1, fps), toFrames(0.7, fps)],
              [0, 1],
              CLAMP,
            ),
            marginBottom: u(28),
          }}
        >
          Programmatic motion graphics
        </div>

        <AnimatedText
          text={title}
          by="char"
          delay={titleAt}
          stagger={Math.max(1, toFrames(0.04, fps))}
          duration={toFrames(0.6, fps)}
          distance={60}
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: u(150),
            lineHeight: 1,
            letterSpacing: "-0.035em",
            color: COLORS.text,
          }}
        />

        <DrawPath
          d="M10 30 C 180 6, 420 6, 710 26"
          viewBox="0 0 720 40"
          stroke={accentColor}
          strokeWidth={8}
          start={underlineAt}
          duration={toFrames(0.7, fps)}
          style={{ width: u(720), height: u(40), marginTop: u(8) }}
        />

        <AnimatedText
          text={subtitle}
          by="word"
          delay={subtitleAt}
          stagger={toFrames(0.07, fps)}
          duration={toFrames(0.6, fps)}
          distance={24}
          blur={6}
          style={{
            fontFamily: FONTS.body,
            fontSize: u(40),
            color: COLORS.muted,
            marginTop: u(30),
            maxWidth: u(1200),
          }}
        />
      </AbsoluteFill>

      {soundEffects ? (
        <Audio
          name="Title impact"
          src={staticFile("audio/impact.wav")}
          from={impactAt}
          volume={0.8}
          premountFor={fps}
        />
      ) : null}
    </AbsoluteFill>
  );
};
