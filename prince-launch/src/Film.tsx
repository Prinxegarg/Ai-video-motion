import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "./components/Backdrop";
import { Grain } from "./components/Grain";
import { Hud } from "./components/Hud";
import { MotionBlur } from "./components/MotionBlur";
import { scene, sf, type SceneId } from "./lib/time";
import { AiCreator } from "./scenes/AiCreator";
import { Brand } from "./scenes/Brand";
import { Chipku } from "./scenes/Chipku";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Results } from "./scenes/Results";
import { Reveal } from "./scenes/Reveal";
import { Vision } from "./scenes/Vision";
import { C } from "./theme";

type Scene = {
  id: SceneId;
  name: string;
  component: React.FC;
  /** Absolute-second windows that get camera motion blur (the fast moves). */
  blur: [number, number][];
};

/** The eight scenes in order. Root.tsx also registers each one on its own. */
export const SCENES: Scene[] = [
  {
    id: "hook",
    name: "1-Hook",
    component: Hook,
    blur: [
      [0.45, 1.0],
      [2.45, 3],
    ],
  },
  {
    id: "reveal",
    name: "2-Reveal",
    component: Reveal,
    blur: [
      [3, 3.5],
      [4, 4.6],
      [6.5, 7],
    ],
  },
  {
    id: "ai",
    name: "3-AiCreator",
    component: AiCreator,
    blur: [
      [7, 7.4],
      [8, 8.9],
      [11.45, 12],
    ],
  },
  {
    id: "chipku",
    name: "4-Chipku",
    component: Chipku,
    blur: [
      [12.5, 12.8],
      [14.55, 15],
    ],
  },
  {
    id: "brand",
    name: "5-PersonalBrand",
    component: Brand,
    blur: [
      [15, 16.5],
      [18.45, 19],
    ],
  },
  {
    id: "results",
    name: "6-Results",
    component: Results,
    blur: [
      [19, 19.5],
      [22.4, 23],
    ],
  },
  {
    id: "vision",
    name: "7-Vision",
    component: Vision,
    blur: [
      [23, 23.25],
      [23.5, 23.75],
      [24, 24.25],
    ],
  },
  { id: "cta", name: "8-Cta", component: Cta, blur: [[26, 26.9]] },
];

export type FilmProps = { music: boolean };

/**
 * Prince Garg — personal brand launch film. 30 s, 15 bars at 120 BPM, 30 fps.
 * Scene changes sit on downbeats; every cue time in src/timeline.json is shared
 * with the soundtrack generator.
 */
export const Film: React.FC<FilmProps> = ({ music }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grid = interpolate(
    frame,
    [sf(3), sf(3.4), sf(22.5), sf(23)],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop grid={grid} />
      {SCENES.map(({ id, name, component: Scene, blur }) => {
        const s = scene(id);
        const windows = blur.map(([a, b]): [number, number] => [
          sf(a) - s.from,
          sf(b) - s.from,
        ]);
        return (
          <Sequence
            key={id}
            name={name}
            from={s.from}
            durationInFrames={s.dur}
            premountFor={fps}
          >
            <MotionBlur windows={windows} samples={6}>
              <Scene />
            </MotionBlur>
          </Sequence>
        );
      })}
      <Hud />
      <Grain />
      {music ? (
        <Audio name="Soundtrack" src={staticFile("audio/soundtrack.wav")} />
      ) : null}
    </AbsoluteFill>
  );
};
