import { Composition, Folder } from "remotion";
import { Film, SCENES } from "./Film";
import { scene } from "./lib/time";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PrinceGargLaunch"
        component={Film}
        width={timeline.width}
        height={timeline.height}
        fps={timeline.fps}
        durationInFrames={timeline.durationInFrames}
        defaultProps={{ music: true }}
      />
      {/* Each scene on its own, for previewing in isolation. */}
      <Folder name="Scenes">
        {SCENES.map(({ id, name, component }) => (
          <Composition
            key={id}
            id={name}
            component={component}
            width={timeline.width}
            height={timeline.height}
            fps={timeline.fps}
            durationInFrames={scene(id).dur}
          />
        ))}
      </Folder>
    </>
  );
};
