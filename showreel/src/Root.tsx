import { Composition, Folder } from "remotion";
import { section } from "./lib/time";
import { Reel, SCENES } from "./Reel";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClaudeShowreel"
        component={Reel}
        width={timeline.width}
        height={timeline.height}
        fps={timeline.fps}
        durationInFrames={timeline.durationInFrames}
        defaultProps={{ music: true }}
      />
      {/* Each section on its own, for previewing and tweaking in isolation. */}
      <Folder name="Scenes">
        {SCENES.map(({ id, name, component }) => (
          <Composition
            key={id}
            id={name}
            component={component}
            width={timeline.width}
            height={timeline.height}
            fps={timeline.fps}
            durationInFrames={section(id).dur}
          />
        ))}
      </Folder>
    </>
  );
};
