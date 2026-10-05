import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CutFlashes, Shake } from "./components/FX";
import { GlobalFrame } from "./components/GlobalFrame";
import { Grain } from "./components/Grain";
import { Hud } from "./components/Hud";
import { MotionBlur } from "./components/MotionBlur";
import { bf, section, type SectionId } from "./lib/time";
import { Cube3D } from "./scenes/Cube3D";
import { DataViz } from "./scenes/DataViz";
import { EndCard } from "./scenes/EndCard";
import { Fluid } from "./scenes/Fluid";
import { GridWall } from "./scenes/GridWall";
import { KineticType } from "./scenes/KineticType";
import { Leader } from "./scenes/Leader";
import { NameSlam } from "./scenes/NameSlam";
import { Particles } from "./scenes/Particles";
import { ShapeMorph } from "./scenes/ShapeMorph";
import { C } from "./theme";

type Scene = {
  id: SectionId;
  name: string;
  component: React.FC;
  /** Local beat windows that get camera motion blur (the fast moves). */
  blur?: [number, number][];
  blurSamples?: number;
};

/** Every section of the reel, in order. Root.tsx also registers each one on its own. */
export const SCENES: Scene[] = [
  { id: "leader", name: "00-Leader", component: Leader, blur: [[3.4, 4]] },
  {
    id: "slam",
    name: "00-NameSlam",
    component: NameSlam,
    blur: [
      [0, 0.9],
      [3.2, 4],
    ],
  },
  {
    id: "type",
    name: "01-KineticType",
    component: KineticType,
    blur: [
      [0, 0.6],
      [2, 3],
    ],
  },
  {
    id: "shape",
    name: "02-ShapeMorph",
    component: ShapeMorph,
    blur: [
      [0.5, 0.9],
      [1, 1.4],
      [1.5, 1.9],
      [2, 2.4],
      [2.5, 3],
    ],
  },
  {
    id: "cube",
    name: "03-Cube3D",
    component: Cube3D,
    blur: [
      [0, 0.6],
      [0.95, 2],
    ],
  },
  { id: "particles", name: "04-Particles", component: Particles },
  { id: "fluid", name: "05-Fluid", component: Fluid },
  { id: "data", name: "06-DataViz", component: DataViz },
  {
    id: "wall",
    name: "07-GridWall",
    component: GridWall,
    blur: [
      [0.35, 1.15],
      [3.3, 4],
    ],
    blurSamples: 5,
  },
  { id: "end", name: "08-EndCard", component: EndCard, blur: [[0, 0.5]] },
];

/** Camera shake on the heavy hits: [absolute beat, strength]. */
const IMPACTS: [number, number][] = [
  [4, 1],
  [8, 0.35],
  [11, 0.25],
  [14, 0.35],
  [15, 0.7],
  [16, 0.25],
  [18.75, 0.35],
  [19, 0.25],
  [22, 0.25],
  [28, 0.8],
];

export type ReelProps = { music: boolean };

/**
 * CLAUDE — Motion Designer showreel. 15 s, 8 bars at 128 BPM, 60 fps. Every scene
 * cut, hit and morph lands on the beat grid in src/timeline.json, the same file the
 * soundtrack generator reads.
 */
export const Reel: React.FC<ReelProps> = ({ music }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <GlobalFrame.Provider value={frame}>
      <AbsoluteFill style={{ backgroundColor: C.ink }}>
        <Shake impacts={IMPACTS}>
          {SCENES.map(
            ({ id, name, component: Scene, blur = [], blurSamples }) => {
              const s = section(id);
              const windows = blur.map(([a, b]): [number, number] => [
                bf(s.startBeat + a) - s.from,
                bf(s.startBeat + b) - s.from,
              ]);
              return (
                <Sequence
                  key={id}
                  name={name}
                  from={s.from}
                  durationInFrames={s.dur}
                  premountFor={fps}
                >
                  <MotionBlur windows={windows} samples={blurSamples}>
                    <Scene />
                  </MotionBlur>
                </Sequence>
              );
            },
          )}
        </Shake>
        <Hud />
        <CutFlashes />
        <Grain />
        {music ? (
          <Audio name="Soundtrack" src={staticFile("audio/soundtrack.wav")} />
        ) : null}
      </AbsoluteFill>
    </GlobalFrame.Provider>
  );
};
