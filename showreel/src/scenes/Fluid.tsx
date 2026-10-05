import { useId } from "react";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { E, lerp, pr } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

/** Surface ripples on the hit and every bloop (local beats). */
const RIPPLES = [0, 0.5, 1.25, 2, 2.5];

const EJECT = [
  { beat: 0.5, angle: -150, dist: 430, r: 62 },
  { beat: 1.25, angle: -30, dist: 470, r: 70 },
  { beat: 2, angle: 100, dist: 360, r: 58 },
  { beat: 2.5, angle: 210, dist: 420, r: 50 },
];

/**
 * 05 — Fluid. Real metaballs: blurred blobs are alpha-thresholded so they merge
 * like liquid, then lit with an SVG specular pass for a glossy surface. Two masses
 * collide, droplets eject on every "bloop" and spring back, a drip falls in, and
 * the goo floods the frame into the cut. The word morphs Fraunces' SOFT axis.
 */
export const Fluid: React.FC = () => {
  const { frame, at } = useBeatClock("fluid");
  const { fps } = useVideoConfig();
  const fid = `liquid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const collide = pr(frame, 0, 24, E.outQuint);
  const flood = pr(frame, at(2.62), at(3), E.inExpo);
  const pulse = 1 + 0.06 * Math.sin((frame / 28.125) * Math.PI * 2);
  const coreR = (215 + flood * 1500) * pulse;

  const sideX = lerp(640, 120, collide);
  const sideR = lerp(170, 110, collide);
  const drip = pr(frame, at(0.8), at(1.9), E.inOut);

  const soft = 50 + 50 * Math.sin((frame / 40) * Math.PI * 2);
  const wght = 560 + 300 * Math.sin((frame / 33) * Math.PI * 2 + 1);

  return (
    <AbsoluteFill style={{ backgroundColor: C.lime, overflow: "hidden" }}>
      <svg
        viewBox="-960 -540 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter
            id={fid}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 42 -19"
              result="mask"
            />
            <feFlood floodColor={C.ink} result="inkFill" />
            <feComposite in="inkFill" in2="mask" operator="in" result="body" />
            <feGaussianBlur in="mask" stdDeviation="8" result="mb" />
            <feSpecularLighting
              in="mb"
              surfaceScale="9"
              specularConstant="1.15"
              specularExponent="26"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="-520" y="-680" z="420" />
            </feSpecularLighting>
            <feComposite in="spec" in2="mask" operator="in" result="specIn" />
            <feComposite
              in="specIn"
              in2="body"
              operator="arithmetic"
              k1="0"
              k2="0.6"
              k3="1"
              k4="0"
            />
          </filter>
        </defs>
        {/* ripples */}
        {RIPPLES.flatMap((b, i) =>
          [0, 7].map((lagF) => {
            const t = (frame - at(b) - lagF) / 50;
            if (t < 0 || t > 1) return null;
            return (
              <circle
                key={`${i}-${lagF}`}
                r={230 + E.outQuint(t) * 620}
                fill="none"
                stroke={C.ink}
                strokeWidth={lerp(lagF ? 4 : 9, 1, t)}
                opacity={(1 - t) * (lagF ? 0.3 : 0.5)}
              />
            );
          }),
        )}
        <g filter={`url(#${fid})`}>
          {/* colliding masses */}
          <circle cx={-sideX} cy={20} r={sideR} fill="#000" />
          <circle cx={sideX} cy={-20} r={sideR} fill="#000" />
          {/* core */}
          <circle cx={0} cy={0} r={coreR} fill="#000" />
          {/* drip */}
          <ellipse
            cx={30}
            cy={lerp(-700, -160, drip)}
            rx={lerp(60, 90, drip)}
            ry={lerp(200, 120, drip)}
            fill="#000"
          />
          {/* orbiting satellites */}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 + frame * 0.05;
            const d = 285 + 40 * Math.sin(frame * 0.09 + i);
            return (
              <circle
                key={i}
                cx={Math.cos(a) * d}
                cy={Math.sin(a) * d * 0.8}
                r={46 + (i % 2) * 14}
                fill="#000"
              />
            );
          })}
          {/* ejected droplets */}
          {EJECT.map((e, i) => {
            const s = spring({
              frame: frame - at(e.beat),
              fps,
              config: { damping: 9, stiffness: 70, mass: 0.9 },
            });
            const out =
              Math.sin(Math.min(1, s) * Math.PI) *
              e.dist *
              (frame >= at(e.beat) ? 1 : 0);
            const a = (e.angle * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * out}
                cy={Math.sin(a) * out}
                r={e.r}
                fill="#000"
              />
            );
          })}
        </g>
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          mixBlendMode: "difference",
        }}
      >
        <div
          style={{
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: 330,
            lineHeight: 1,
            color: C.paper,
            fontVariationSettings: axes({
              wght,
              SOFT: soft,
              WONK: 1,
              opsz: 144,
            }),
            translate: `0px ${-10 + Math.sin(frame / 14) * 10}px`,
            rotate: `${Math.sin(frame / 20) * 3}deg`,
            opacity: 1 - flood,
          }}
        >
          fluid
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
