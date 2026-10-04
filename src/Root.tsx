import { Composition, Folder } from "remotion";
import { OutroScene } from "./compositions/Showcase/scenes/OutroScene";
import { IntroScene } from "./compositions/Showcase/scenes/IntroScene";
import { ShapesScene } from "./compositions/Showcase/scenes/ShapesScene";
import { TypographyScene } from "./compositions/Showcase/scenes/TypographyScene";
import { showcaseSchema } from "./compositions/Showcase/schema";
import { Showcase } from "./compositions/Showcase/Showcase";
import { getShowcaseTimeline } from "./compositions/Showcase/timeline";
import { VIDEO } from "./config/video";
// @new-composition-imports — `npm run new` adds imports above this line.

const showcase = getShowcaseTimeline(VIDEO.fps);

/**
 * Every <Composition> registered here shows up in Remotion Studio's sidebar
 * and can be rendered by its `id`:  npx remotion render <id> out/<id>.mp4
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Showcase"
        component={Showcase}
        schema={showcaseSchema}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={showcase.durationInFrames}
        defaultProps={{
          title: "Motion, by code.",
          subtitle:
            "Polished motion graphics written in React and rendered to MP4 with Remotion.",
          tagline: "Make something that moves.",
          cta: "npm run render",
          accentColor: "#7c5cff",
          secondaryColor: "#22d3ee",
          highlightColor: "#ff4d8d",
          musicVolume: 0.6,
          soundEffects: true,
        }}
      />

      {/* Each scene is also registered on its own, so it can be previewed
          and iterated on in isolation. */}
      <Folder name="Showcase-Scenes">
        <Composition
          id="Showcase-Intro"
          component={IntroScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={showcase.byId.intro.durationInFrames}
          defaultProps={{
            title: "Motion, by code.",
            subtitle:
              "Polished motion graphics written in React and rendered to MP4 with Remotion.",
            accentColor: "#7c5cff",
            secondaryColor: "#22d3ee",
          }}
        />
        <Composition
          id="Showcase-Shapes"
          component={ShapesScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={showcase.byId.shapes.durationInFrames}
          defaultProps={{
            heading: "Shapes & graphics",
            accentColor: "#7c5cff",
            secondaryColor: "#22d3ee",
            highlightColor: "#ff4d8d",
          }}
        />
        <Composition
          id="Showcase-Typography"
          component={TypographyScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={showcase.byId.typography.durationInFrames}
          defaultProps={{
            accentColor: "#7c5cff",
            secondaryColor: "#22d3ee",
            highlightColor: "#ff4d8d",
          }}
        />
        <Composition
          id="Showcase-Outro"
          component={OutroScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={showcase.byId.outro.durationInFrames}
          defaultProps={{
            tagline: "Make something that moves.",
            cta: "npm run render",
            accentColor: "#7c5cff",
            secondaryColor: "#22d3ee",
          }}
        />
      </Folder>

      {/* Example of the same video in another format — layout scales automatically. */}
      <Folder name="Formats">
        <Composition
          id="Showcase-Square"
          component={Showcase}
          schema={showcaseSchema}
          width={1080}
          height={1080}
          fps={VIDEO.fps}
          durationInFrames={showcase.durationInFrames}
          defaultProps={{
            title: "Motion, by code.",
            subtitle: "Same code, any aspect ratio.",
            tagline: "Make something that moves.",
            cta: "npm run render",
            accentColor: "#7c5cff",
            secondaryColor: "#22d3ee",
            highlightColor: "#ff4d8d",
            musicVolume: 0.6,
            soundEffects: true,
          }}
        />
      </Folder>

      {/* @new-compositions — `npm run new` adds compositions above this line. */}
    </>
  );
};
