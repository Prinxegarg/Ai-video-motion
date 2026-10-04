import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../config/theme";
import { CLAMP, EASE } from "../../lib/animation";
import { useUnit } from "../../lib/layout";
import { toFrames } from "../../lib/timing";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { ShapesScene } from "./scenes/ShapesScene";
import { TypographyScene } from "./scenes/TypographyScene";
import type { ShowcaseProps } from "./schema";
import { getShowcaseTimeline } from "./timeline";

/**
 * Sample video: 4 scenes joined by slide / wipe / fade transitions, with a
 * music bed and whoosh SFX that are positioned from the same timeline that
 * lays out the scenes — so audio stays in sync when you change durations.
 */
export const Showcase: React.FC<ShowcaseProps> = ({
  title,
  subtitle,
  tagline,
  cta,
  accentColor,
  secondaryColor,
  highlightColor,
  musicVolume,
  soundEffects,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const timeline = getShowcaseTimeline(fps);
  const { intro, shapes, typography, outro } = timeline.byId;

  const transition = linearTiming({
    durationInFrames: timeline.transitionFrames,
    easing: EASE.inOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <TransitionSeries name="Scenes">
        <TransitionSeries.Sequence
          name="Intro"
          durationInFrames={intro.durationInFrames}
          premountFor={fps}
        >
          <IntroScene
            title={title}
            subtitle={subtitle}
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            soundEffects={soundEffects}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={transition}
        />
        <TransitionSeries.Sequence
          name="Shapes"
          durationInFrames={shapes.durationInFrames}
          premountFor={fps}
        >
          <ShapesScene
            heading="Shapes & graphics"
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            highlightColor={highlightColor}
            beatOffset={shapes.from}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom-left" })}
          timing={transition}
        />
        <TransitionSeries.Sequence
          name="Typography"
          durationInFrames={typography.durationInFrames}
          premountFor={fps}
        >
          <TypographyScene
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            highlightColor={highlightColor}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />
        <TransitionSeries.Sequence
          name="Outro"
          durationInFrames={outro.durationInFrames}
          premountFor={fps}
        >
          <OutroScene
            tagline={tagline}
            cta={cta}
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            soundEffects={soundEffects}
            beatOffset={outro.from}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Music bed: fades in over 1 s and out over the last 1.5 s */}
      <Audio
        name="Music"
        src={staticFile("audio/ambient-pad.mp3")}
        premountFor={fps}
        volume={(f) =>
          musicVolume *
          interpolate(
            f,
            [0, fps, durationInFrames - toFrames(1.5, fps), durationInFrames],
            [0, 1, 1, 0],
            CLAMP,
          )
        }
      />

      {/* One whoosh per transition. The file peaks ~0.45 s in, so it starts
          slightly early to peak in the middle of the transition. */}
      {soundEffects
        ? timeline.scenes
            .slice(1)
            .map((scene) => (
              <Audio
                key={scene.id}
                name={`Whoosh → ${scene.id}`}
                src={staticFile("audio/whoosh.wav")}
                from={Math.max(
                  0,
                  scene.from +
                    Math.round(timeline.transitionFrames / 2) -
                    toFrames(0.45, fps),
                )}
                volume={0.5}
                premountFor={fps}
              />
            ))
        : null}

      {/* Thin progress bar along the bottom edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: u(6),
          width: `${interpolate(frame, [0, durationInFrames - 1], [0, 100], CLAMP)}%`,
          background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
        }}
      />
    </AbsoluteFill>
  );
};
