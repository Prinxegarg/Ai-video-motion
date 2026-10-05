import { AbsoluteFill, Freeze, interpolate } from "remotion";
import { E, lerp, pr } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F } from "../theme";
import { Cube3D } from "./Cube3D";
import { DataViz } from "./DataViz";
import { Fluid } from "./Fluid";
import { KineticType } from "./KineticType";
import { Particles } from "./Particles";
import { ShapeMorph } from "./ShapeMorph";

const TW = 576;
const TH = 324;
const GAP = 36;
const LABEL = 46;
const X0 = (1920 - (3 * TW + 2 * GAP)) / 2;
const Y0 = (1080 - (2 * (TH + LABEL) + GAP)) / 2;

type Tile = { label: string; Comp: React.FC; map: (w: number) => number };

/** Each tile replays its vignette's best moment, time-remapped through <Freeze>. */
const TILES: Tile[] = [
  { label: "01  KINETIC TYPE", Comp: KineticType, map: (w) => (18 + w) % 56 },
  {
    label: "02  SHAPE MORPH",
    Comp: ShapeMorph,
    map: (w) => 12 + ((w * 0.9) % 66),
  },
  { label: "03  3D SPACE", Comp: Cube3D, map: (w) => (6 + w) % 46 },
  {
    label: "04  GENERATIVE",
    Comp: Particles,
    map: (w) => 28 + Math.min(42, w * 0.55),
  },
  { label: "05  FLUID SIM", Comp: Fluid, map: (w) => (10 + w) % 72 },
  { label: "06  DATA VIZ", Comp: DataViz, map: (w) => 56 + w },
];

const tilePos = (i: number) => ({
  x: X0 + (i % 3) * (TW + GAP),
  y: Y0 + Math.floor(i / 3) * (TH + LABEL + GAP),
});

/**
 * Bar 7 — the range wall. Opens zoomed into the live Data Viz tile (a seamless
 * continuation of the previous shot), pulls back to reveal all six vignettes still
 * animating, tilts in 3D, flashes each tile on the snare roll, then dives in.
 */
export const GridWall: React.FC = () => {
  const { frame, at } = useBeatClock("wall");

  const data = tilePos(5);
  const pull = pr(frame, 0, at(1.5), E.inOutExpo);
  const dive = pr(frame, at(3.3), at(4), E.inExpo);
  const s = lerp(1920 / TW, 1, pull) * lerp(1, 7, dive);
  const cx = lerp(data.x + TW / 2, 960, pull);
  const cy = lerp(data.y + TH / 2, 540, pull);
  const tilt = pr(frame, at(1.2), at(3.3), E.inOut);
  const ry = lerp(0, -11, tilt) + dive * 8;
  const rx = lerp(0, 7, tilt);
  const chrome = pr(frame, at(1.2), at(1.8), E.outExpo) * (1 - dive);

  return (
    <AbsoluteFill
      style={{ backgroundColor: C.ink, overflow: "hidden", perspective: 2400 }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(960px, 540px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) translate(${-cx}px, ${-cy}px)`,
          filter: dive > 0.05 ? `blur(${dive * 10}px)` : undefined,
        }}
      >
        {TILES.map((t, i) => {
          const { x, y } = tilePos(i);
          const hiStart = at(2 + i * 0.25);
          const hi =
            frame >= hiStart && frame < hiStart + 8
              ? 1 - (frame - hiStart) / 8
              : 0;
          const Comp = t.Comp;
          return (
            <div
              key={t.label}
              style={{ position: "absolute", left: x, top: y, width: TW }}
            >
              <div
                style={{
                  width: TW,
                  height: TH,
                  overflow: "hidden",
                  position: "relative",
                  outline: `${interpolate(hi, [0, 1], [0, 8])}px solid ${C.lime}`,
                  scale: `${1 + hi * 0.05}`,
                  boxShadow: `0 30px 60px rgba(0,0,0,${0.5 * chrome})`,
                }}
              >
                <div
                  style={{
                    width: 1920,
                    height: 1080,
                    transformOrigin: "0 0",
                    scale: `${TW / 1920}`,
                  }}
                >
                  <Freeze frame={Math.floor(t.map(frame))}>
                    <Comp />
                  </Freeze>
                </div>
              </div>
              <div
                style={{
                  height: LABEL,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: F.mono,
                  fontSize: 17,
                  letterSpacing: "0.14em",
                  color: hi > 0 ? C.lime : C.paper,
                  opacity: chrome * 0.85 + hi * 0.15,
                }}
              >
                <span>{t.label}</span>
                <span style={{ opacity: 0.5 }}>●</span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 68,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: "0.3em",
          color: C.paper,
          opacity: chrome,
        }}
      >
        SIX DISCIPLINES · ONE CODEBASE
      </div>
    </AbsoluteFill>
  );
};
