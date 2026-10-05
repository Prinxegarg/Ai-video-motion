import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { E, pr } from "../lib/ease";
import { morph, SHAPES, toPath, type Pts, type ShapeName } from "../lib/morph";
import { useBeatClock } from "../lib/time";
import { C } from "../theme";

const SEQ: ShapeName[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "hexagon",
  "plus",
  "square",
];
const MORPH_BEATS = [0.5, 1, 1.5, 2, 2.5, 2.75];
const SAT_COLORS = [C.blue, C.red, C.lime, C.blue, C.red, C.lime];

/** Shape index + morph progress at a frame, with springy overshoot on each 8th-note morph. */
const shapeState = (frame: number, at: (b: number) => number, offset = 0) => {
  let k = 0;
  let t = 1;
  for (let i = 0; i < MORPH_BEATS.length; i++) {
    const f = at(MORPH_BEATS[i]) + offset;
    if (frame >= f) {
      k = i;
      t = pr(frame, f, f + 11, E.outBack);
    }
  }
  const started = frame >= at(MORPH_BEATS[0]) + offset;
  return {
    from: started ? SEQ[k] : SEQ[0],
    to: started ? SEQ[k + 1] : SEQ[0],
    t: started ? t : 1,
    step: started ? k + 1 : 0,
  };
};

/**
 * 02 — Shape morph. A constructivist composition assembles on the beat while the
 * hero form morphs circle → square → triangle → star → hexagon → plus on 8th notes
 * (radially-sampled paths, springy overshoot, echo ripples), orbited by satellites
 * that morph out of phase.
 */
export const ShapeMorph: React.FC = () => {
  const { frame, at } = useBeatClock("shape");
  const shapes = useMemo(() => {
    const m = {} as Record<ShapeName, Pts>;
    (Object.keys(SHAPES) as ShapeName[]).forEach((n) => {
      m[n] = SHAPES[n](1);
    });
    return m;
  }, []);

  const hero = shapeState(frame, at);
  const heroPts = morph(shapes[hero.from], shapes[hero.to], hero.t);
  const heroRot = hero.step * 45 + (hero.t - 1) * 45;

  const disc = pr(frame, 0, 18, E.outExpo);
  const bar = pr(frame, at(1), at(1) + 16, E.outExpo);
  const quarter = pr(frame, at(2), at(2) + 18, E.outExpo);
  const exit = pr(frame, at(2.75), at(3), E.inExpo);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, overflow: "hidden" }}>
      {/* Swiss dot grid */}
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, opacity: 0.18 }}
      >
        {Array.from({ length: 24 * 14 }).map((_, i) => (
          <circle
            key={i}
            cx={40 + (i % 24) * 80}
            cy={40 + Math.floor(i / 24) * 80}
            r={2.4}
            fill={C.ink}
          />
        ))}
      </svg>

      <AbsoluteFill
        style={{ scale: `${1 + exit * 0.35}`, rotate: `${exit * -20}deg` }}
      >
        {/* constructivist blocks */}
        <div
          style={{
            position: "absolute",
            left: 1180,
            top: -260,
            width: 1100,
            height: 1100,
            borderRadius: "50%",
            backgroundColor: C.blue,
            translate: `${(1 - disc) * 900}px ${(1 - disc) * -200}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -40,
            top: 770,
            width: 1150,
            height: 120,
            backgroundColor: C.red,
            transformOrigin: "0% 50%",
            scale: `${bar} 1`,
            rotate: "-8deg",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -220,
            top: -220,
            width: 520,
            height: 520,
            borderBottomRightRadius: 520,
            backgroundColor: C.lime,
            rotate: `${(1 - quarter) * -90}deg`,
            transformOrigin: "0 0",
          }}
        />

        <svg
          viewBox="-960 -540 1920 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* orbit path */}
          <circle
            r={370}
            fill="none"
            stroke={C.ink}
            strokeWidth={2}
            strokeDasharray="4 14"
            opacity={0.6}
          />
          {/* echo ripples on each morph */}
          {MORPH_BEATS.map((b, i) => {
            const f = at(b);
            const p = pr(frame, f, f + 24, E.outExpo);
            if (frame < f || p >= 1) return null;
            return (
              <path
                key={i}
                d={toPath(shapes[SEQ[i + 1]], 230 * (1 + p * 0.9))}
                transform={`rotate(${(i + 1) * 45})`}
                fill="none"
                stroke={C.ink}
                strokeWidth={4 * (1 - p) + 0.5}
                opacity={1 - p}
              />
            );
          })}
          {/* hero */}
          <g transform={`rotate(${heroRot})`}>
            <path
              d={toPath(heroPts, 236)}
              transform="translate(14 14)"
              fill={C.ink}
              opacity={0.18}
            />
            <path d={toPath(heroPts, 236)} fill={C.ink} />
          </g>
          {/* satellites */}
          {SAT_COLORS.map((col, i) => {
            const st = shapeState(frame, at, (i + 1) * 3);
            const pts = morph(shapes[st.from], shapes[st.to], st.t);
            const a = (i / SAT_COLORS.length) * Math.PI * 2 + frame * 0.035;
            const pulse =
              1 + 0.25 * Math.exp(-(frame % Math.round(at(0.5) || 14)) / 5);
            return (
              <g
                key={i}
                transform={`translate(${Math.cos(a) * 370} ${Math.sin(a) * 370}) rotate(${frame * 2 + i * 30})`}
              >
                <path
                  d={toPath(pts, 48 * pulse)}
                  fill={col}
                  stroke={C.ink}
                  strokeWidth={4}
                />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
