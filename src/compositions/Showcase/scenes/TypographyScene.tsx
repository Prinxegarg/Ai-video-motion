import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Counter } from "../../../components/Counter";
import { GradientBackground } from "../../../components/GradientBackground";
import { Highlight } from "../../../components/Highlight";
import { COLORS, FONTS } from "../../../config/theme";
import { CLAMP, EASE, progress, stagger } from "../../../lib/animation";
import { useUnit } from "../../../lib/layout";
import { toFrames } from "../../../lib/timing";

export type TypographySceneProps = {
  readonly accentColor: string;
  readonly secondaryColor: string;
  readonly highlightColor: string;
};

export const TypographyScene: React.FC<TypographySceneProps> = ({
  accentColor,
  secondaryColor,
  highlightColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = useUnit();

  const lineStep = toFrames(0.14, fps);
  const firstLineAt = toFrames(0.2, fps);
  const highlightAt = toFrames(1.1, fps);
  const cardsAt = toFrames(1.5, fps);

  // Masked line reveal: each line slides up from behind an invisible edge.
  const lineStyle = (index: number): React.CSSProperties => ({
    display: "block",
    translate: `0px ${(1 - progress(frame, stagger(index, lineStep, firstLineAt), toFrames(0.8, fps), EASE.out)) * 110}%`,
  });

  const cards = [
    {
      label: "Resolution",
      value: (
        <>
          <Counter to={width} start={cardsAt} duration={toFrames(1.2, fps)} />
          {" × "}
          <Counter to={height} start={cardsAt} duration={toFrames(1.2, fps)} />
        </>
      ),
    },
    {
      label: "Frame rate",
      value: (
        <Counter
          to={fps}
          suffix=" fps"
          start={cardsAt + lineStep}
          duration={toFrames(1.2, fps)}
        />
      ),
    },
    { label: "Output", value: "H.264 MP4" },
  ];

  return (
    <AbsoluteFill>
      <GradientBackground
        accentColor={highlightColor}
        secondaryColor={accentColor}
      />

      {/* Outlined marquee drifting along the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: -u(14),
          left: 0,
          whiteSpace: "nowrap",
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: u(110),
          color: "transparent",
          WebkitTextStroke: `${u(1.5)}px rgba(255,255,255,0.12)`,
          translate: `${-frame * u(3)}px 0px`,
        }}
      >
        {"KINETIC TYPE • MOTION • CODE • KINETIC TYPE • MOTION • CODE •"}
      </div>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: u(56),
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: u(150),
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            color: COLORS.text,
            textAlign: "center",
          }}
        >
          <div style={{ overflow: "hidden", paddingBottom: u(8) }}>
            <span style={lineStyle(0)}>Animate</span>
          </div>
          <div style={{ overflow: "hidden", paddingBottom: u(8) }}>
            <span style={{ ...lineStyle(1), color: secondaryColor }}>
              every
            </span>
          </div>
          <div style={{ overflow: "hidden", paddingBottom: u(8) }}>
            <span style={lineStyle(2)}>
              <Highlight color={highlightColor} start={highlightAt}>
                frame.
              </Highlight>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: u(28) }}>
          {cards.map((card, i) => {
            const p = progress(
              frame,
              stagger(i, lineStep, cardsAt),
              toFrames(0.7, fps),
              EASE.out,
            );
            return (
              <div
                key={card.label}
                style={{
                  minWidth: u(330),
                  padding: `${u(26)}px ${u(36)}px`,
                  borderRadius: u(24),
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: `${u(1.5)}px solid rgba(255,255,255,0.1)`,
                  opacity: interpolate(p, [0, 0.5], [0, 1], CLAMP),
                  translate: `0px ${(1 - p) * u(30)}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: u(20),
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: accentColor,
                    marginBottom: u(10),
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 500,
                    fontSize: u(50),
                    color: COLORS.text,
                  }}
                >
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
