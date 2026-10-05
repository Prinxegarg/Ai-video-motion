import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import spectrum from "../data/spectrum.json";
import { useGlobalFrame } from "../components/GlobalFrame";
import { E, lerp, pr } from "../lib/ease";
import { section, useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const NAME = Array.from("CLAUDE");
const SKILLS = [
  "KINETIC TYPE",
  "SHAPE MORPH",
  "3D",
  "GENERATIVE",
  "FLUID SIM",
  "DATA VIZ",
];
const ARCS = [
  { r: 132, color: C.red, delay: 0 },
  { r: 100, color: C.paper, delay: 4 },
  { r: 68, color: C.blue, delay: 8 },
];
const SPAN = 290; // degrees; the mark opens to the right

const arcPath = (r: number) => {
  const a0 = ((35 - 90) * Math.PI) / 180 + Math.PI / 2;
  const a1 = a0 + (SPAN * Math.PI) / 180;
  return `M${Math.cos(a0) * r} ${Math.sin(a0) * r} A${r} ${r} 0 1 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r}`;
};

/**
 * Bar 8 — the end card. A monogram of three concentric arcs draws on while a lime
 * dot spirals into the opening; CLAUDE resolves through the variable axes from
 * hairline-condensed to black; role, skills and credits follow on the beat. The
 * mark breathes with the final chord (real audio energy).
 */
export const EndCard: React.FC = () => {
  const { frame, at, dur } = useBeatClock("end");
  const { fps } = useVideoConfig();
  const gf = useGlobalFrame(section("end").from);
  const bands = spectrum.frames[Math.min(spectrum.frames.length - 1, gf)] ?? [];
  const low = ((bands[0] ?? 0) + (bands[1] ?? 0) + (bands[2] ?? 0)) / 3;

  const spin = pr(frame, 0, 34, E.outExpo);
  const landAt = at(1); // the chime
  const dotT = pr(frame, 2, landAt, E.outExpo);
  const dotPop = spring({
    frame: frame - landAt,
    fps,
    config: { damping: 9, stiffness: 240 },
  });
  const dotA = lerp(-250, 0, dotT) * (Math.PI / 180);
  const dotR = lerp(210, 100, dotT);
  const role = pr(frame, at(0.75), at(1.3), E.outExpo);
  const rule = pr(frame, at(1.25), at(1.9), E.outExpo);
  const foot = pr(frame, at(2.1), at(2.6), E.outExpo);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      {/* slow camera push-in keeps the hold alive */}
      <AbsoluteFill style={{ scale: `${1 + 0.04 * (frame / dur)}` }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 31%, rgba(255,68,35,${0.16 + low * 0.18}) 0%, rgba(255,68,35,0) 38%)`,
          }}
        />
        {/* monogram */}
        <svg
          viewBox="-200 -200 400 400"
          width={400}
          height={400}
          style={{
            position: "absolute",
            left: 760,
            top: 135,
            scale: `${1 + low * 0.06}`,
            overflow: "visible",
          }}
        >
          <g transform={`rotate(${lerp(-200, 0, spin)})`}>
            {ARCS.map((a) => {
              const len = (SPAN / 360) * Math.PI * 2 * a.r;
              const d = pr(frame, a.delay, a.delay + 28, E.outExpo);
              return (
                <path
                  key={a.r}
                  d={arcPath(a.r)}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={17}
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - d)}
                />
              );
            })}
          </g>
          <circle
            cx={Math.cos(dotA) * dotR}
            cy={Math.sin(dotA) * dotR}
            r={15 * (frame >= landAt ? 0.7 + dotPop * 0.3 : 1)}
            fill={C.lime}
          />
        </svg>

        {/* name */}
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "center",
            top: 520,
          }}
        >
          <div style={{ display: "flex" }}>
            {NAME.map((ch, i) => {
              const p = pr(frame, 6 + i * 2, 32 + i * 2, E.outExpo);
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: F.flex,
                    fontSize: 196,
                    lineHeight: 1,
                    color: C.paper,
                    letterSpacing: "0.01em",
                    fontVariationSettings: axes({
                      wght: lerp(100, 920, p),
                      wdth: lerp(25, 112, p),
                      opsz: 144,
                    }),
                    opacity: Math.min(1, p * 3),
                    translate: `0px ${(1 - p) * 40}px`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>

        {/* role */}
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "center",
            top: 740,
          }}
        >
          <div style={{ overflow: "hidden", padding: "4px 12px" }}>
            <div
              style={{
                translate: `0px ${(1 - role) * 110}%`,
                fontFamily: F.serif,
                fontStyle: "italic",
                fontSize: 78,
                lineHeight: 1.05,
                fontVariationSettings: axes({
                  wght: 360,
                  SOFT: 100,
                  WONK: 1,
                  opsz: 144,
                }),
              }}
            >
              <span style={{ color: C.red }}>Motion</span>{" "}
              <span style={{ color: C.paper }}>Designer</span>
            </div>
          </div>
        </AbsoluteFill>

        {/* rule + skills */}
        <div
          style={{
            position: "absolute",
            left: 960 - 420 * rule,
            top: 862,
            width: 840 * rule,
            height: 2,
            backgroundColor: C.paper,
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 890,
            display: "flex",
            justifyContent: "center",
            gap: 0,
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: "0.16em",
            color: C.paper,
          }}
        >
          {SKILLS.map((s, i) => {
            const p = pr(
              frame,
              at(1.5 + i * 0.25),
              at(1.5 + i * 0.25) + 10,
              E.outExpo,
            );
            return (
              <span
                key={s}
                style={{
                  opacity: p,
                  translate: `0px ${(1 - p) * 14}px`,
                  whiteSpace: "pre",
                }}
              >
                {s}
                {i < SKILLS.length - 1 ? (
                  <span style={{ color: C.lime }}>{"  ·  "}</span>
                ) : null}
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 46,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: "0.2em",
            color: C.paper,
            opacity: foot * 0.5,
          }}
        >
          SHOWREEL 2026 — EVERY FRAME RENDERED FROM CODE · REMOTION + REACT ·
          AUDIO SYNTHESISED IN PYTHON
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
