import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../../../components/AnimatedText";
import { GradientBackground } from "../../../components/GradientBackground";
import { PopIn } from "../../../components/PopIn";
import { COLORS, FONTS } from "../../../config/theme";
import { CLAMP, EASE, exitProgress, progress } from "../../../lib/animation";
import { useUnit } from "../../../lib/layout";
import { beatPulse, toFrames } from "../../../lib/timing";
import { MUSIC_BPM } from "../timeline";

export type OutroSceneProps = {
  readonly tagline: string;
  readonly cta: string;
  readonly accentColor: string;
  readonly secondaryColor: string;
  readonly soundEffects?: boolean;
  /** Absolute start frame in the parent video, to keep the pulse on the beat. */
  readonly beatOffset?: number;
};

export const OutroScene: React.FC<OutroSceneProps> = ({
  tagline,
  cta,
  accentColor,
  secondaryColor,
  soundEffects = true,
  beatOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const u = useUnit();

  const logoAt = toFrames(0.2, fps);
  const impactAt = logoAt + toFrames(0.2, fps);
  const taglineAt = toFrames(0.75, fps);
  const ctaAt = toFrames(1.4, fps);
  const pulse = beatPulse(frame + beatOffset, MUSIC_BPM, fps, 3);
  const ctaP = progress(frame, ctaAt, toFrames(0.7, fps), EASE.out);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Everything fades to black over the last 0.8 s */}
      <AbsoluteFill
        style={{
          opacity: exitProgress(frame, durationInFrames, toFrames(0.8, fps)),
        }}
      >
        <GradientBackground
          accentColor={accentColor}
          secondaryColor={secondaryColor}
        />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Beat-synced halo behind the logo */}
            <div
              style={{
                position: "absolute",
                width: u(300),
                height: u(300),
                borderRadius: "50%",
                border: `${u(3)}px solid ${secondaryColor}`,
                opacity:
                  interpolate(
                    frame,
                    [logoAt, logoAt + toFrames(0.5, fps)],
                    [0, 1],
                    CLAMP,
                  ) *
                  (0.25 + 0.5 * pulse),
                scale: `${1 + 0.18 * pulse}`,
              }}
            />
            <PopIn delay={logoAt} rotateFrom={-45}>
              <Img
                src={staticFile("images/logo.svg")}
                style={{
                  width: u(200),
                  height: u(200),
                  filter: `drop-shadow(0 ${u(20)}px ${u(60)}px color-mix(in srgb, ${accentColor} 60%, transparent))`,
                }}
              />
            </PopIn>
          </div>

          <AnimatedText
            text={tagline}
            by="char"
            delay={taglineAt}
            stagger={Math.max(1, toFrames(0.03, fps))}
            duration={toFrames(0.5, fps)}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: u(96),
              letterSpacing: "-0.03em",
              color: COLORS.text,
              marginTop: u(70),
            }}
          />

          <div
            style={{
              marginTop: u(44),
              padding: `${u(18)}px ${u(34)}px`,
              borderRadius: u(999),
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `${u(1.5)}px solid color-mix(in srgb, ${accentColor} 70%, transparent)`,
              fontFamily: FONTS.mono,
              fontSize: u(32),
              color: COLORS.text,
              opacity: interpolate(ctaP, [0, 0.5], [0, 1], CLAMP),
              translate: `0px ${(1 - ctaP) * u(24)}px`,
            }}
          >
            <span style={{ color: secondaryColor }}>{"$ "}</span>
            {cta}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {soundEffects ? (
        <Audio
          name="Logo impact"
          src={staticFile("audio/impact.wav")}
          from={impactAt}
          volume={0.7}
          premountFor={fps}
        />
      ) : null}
    </AbsoluteFill>
  );
};
