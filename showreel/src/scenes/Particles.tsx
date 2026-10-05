import { noise2D } from "@remotion/noise";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, random } from "remotion";
import data from "../data/particles.json";
import { E, clamp01, lerp, pr } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;
const COLORS = [
  C.lime,
  C.lime,
  C.lime,
  C.lime,
  C.lime,
  C.lime,
  C.paper,
  C.paper,
  C.red,
];

type P = {
  tx: number;
  ty: number;
  a: number;
  r: number;
  spin: number;
  delay: number;
  color: string;
  size: number;
};

const inOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Particle position at frame f (burst → swirl through noise → assemble → blow out) and how assembled it is. */
const pos = (
  p: P,
  i: number,
  f: number,
  blowStart: number,
  blowEnd: number,
): [number, number, number] => {
  const burst = p.r * E.outExpo(clamp01(f / 26));
  const th = p.a + p.spin * (f / 60) * 2.2;
  const wob = noise2D("flow", i * 0.07, f * 0.03) * 60;
  const sx = CX + Math.cos(th) * (burst + wob);
  const sy = CY + Math.sin(th) * (burst + wob) * 0.72;
  const c = inOutCubic(clamp01((f - 16 - p.delay) / 24));
  let x = lerp(sx, p.tx, c);
  let y = lerp(sy, p.ty, c);
  if (c >= 1) {
    x += noise2D("sx", i, f * 0.09) * 1.4;
    y += noise2D("sy", i, f * 0.09) * 1.4;
  }
  const blow = E.inExpo(clamp01((f - blowStart) / (blowEnd - blowStart)));
  if (blow > 0) {
    x = CX + (x - CX) * (1 + blow * 2.6);
    y = CY + (y - CY) * (1 + blow * 2.6);
  }
  return [x, y, c];
};

/**
 * 04 — Generative. 3,666 particles burst from the centre, swirl through a noise
 * flow field, then assemble left-to-right into "MOTION" (points precomputed from
 * the actual Roboto Flex glyphs), shimmer, and blow out toward the camera.
 * Every position is a pure function of the frame — fully deterministic.
 */
export const Particles: React.FC = () => {
  const { frame, at } = useBeatClock("particles");
  const ref = useRef<HTMLCanvasElement>(null);

  const ps = useMemo<P[]>(
    () =>
      data.points.map(([tx, ty], i) => ({
        tx,
        ty,
        a: random(`a${i}`) * Math.PI * 2,
        r: 160 + Math.pow(random(`r${i}`), 0.6) * 820,
        spin: 0.6 + random(`s${i}`) * 1.6,
        delay: (tx / W) * 16 + random(`d${i}`) * 7,
        color: COLORS[Math.floor(random(`c${i}`) * COLORS.length)],
        size: 2.2 + random(`z${i}`) * 1.6,
      })),
    [],
  );

  const blowStart = at(2.55);
  const blowEnd = at(3);
  const bandFrom = at(1.6);
  const bandTo = at(2.5);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const blow = E.inExpo(clamp01((frame - blowStart) / (blowEnd - blowStart)));
    const band = lerp(-300, W + 300, pr(frame, bandFrom, bandTo, E.inOut));
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const [x, y, settled] = pos(p, i, frame, blowStart, blowEnd);
      const [px, py] = pos(p, i, frame - 1.6, blowStart, blowEnd);
      const speed = Math.hypot(x - px, y - py);
      const hot = Math.max(0, 1 - Math.abs(x - band) / 160);
      ctx.globalAlpha = (0.85 + hot * 0.15) * (1 - blow * 0.85);
      ctx.strokeStyle = hot > 0.3 ? C.paper : p.color;
      ctx.fillStyle = ctx.strokeStyle;
      const s = p.size * (1 + settled * 0.8 + blow * 3 + hot * 0.6);
      if (speed > 3) {
        ctx.lineWidth = s * 0.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
  }, [frame, ps, blowStart, blowEnd, bandFrom, bandTo]);

  const formed =
    pr(frame, at(1.75), at(2.1), E.outExpo) *
    (1 - pr(frame, at(2.55), at(2.8), E.inExpo));

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(216,255,60,${0.1 * formed}) 0%, rgba(216,255,60,0) 70%)`,
        }}
      />
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            translate: `0px ${210 + (1 - formed) * 20}px`,
            opacity: formed,
            fontFamily: F.mono,
            fontSize: 22,
            letterSpacing: "0.22em",
            color: C.paper,
            fontVariationSettings: axes({ wght: 400, wdth: 100 }),
          }}
        >
          {`${data.points.length.toLocaleString("en-US")} PARTICLES · NOISE FLOW FIELD · ZERO KEYFRAMES`}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
