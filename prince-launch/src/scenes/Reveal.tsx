import { AbsoluteFill, Img, staticFile } from "remotion";
import { Mask } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display } from "../theme";

const NAME = Array.from("PRINCE GARG");
const WORDS: [string, number][] = [
  ["CREATOR", 5.0],
  ["BUILDER", 5.5],
  ["ENTREPRENEUR", 6.0],
];

// Orbit ring around the portrait (screen space).
const RING = { cx: 1330, cy: 690, rx: 430, ry: 84, rot: -9 };

const ringPoint = (theta: number) => {
  const r = (RING.rot * Math.PI) / 180;
  const x = Math.cos(theta) * RING.rx;
  const y = Math.sin(theta) * RING.ry;
  return [
    RING.cx + x * Math.cos(r) - y * Math.sin(r),
    RING.cy + x * Math.sin(r) + y * Math.cos(r),
  ];
};

/** Half of the ring: back (upper, behind the head) or front (lower, in front). */
const Arc: React.FC<{
  readonly half: "back" | "front";
  readonly draw: number;
  readonly theta: number;
}> = ({ half, draw, theta }) => {
  const [a0, a1] = half === "back" ? [Math.PI, 2 * Math.PI] : [0, Math.PI];
  const pts = Array.from({ length: 61 }, (_, i) =>
    ringPoint(a0 + ((a1 - a0) * i) / 60),
  );
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const dotOnThisHalf =
    half === "back" ? Math.sin(theta) < 0 : Math.sin(theta) >= 0;
  const [dx, dy] = ringPoint(theta);
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <path
        d={d}
        fill="none"
        stroke={C.lime}
        strokeWidth={2}
        strokeOpacity={half === "back" ? 0.35 : 0.8}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      {dotOnThisHalf && draw > 0.98 ? (
        <circle cx={dx} cy={dy} r={7} fill={C.lime} />
      ) : null}
    </svg>
  );
};

/**
 * 3–7 s — The reveal. The drop hits, the name rises out of a mask with a lime
 * sheen, slides aside, and the portrait lifts out of the dark inside an orbit ring.
 * CREATOR. BUILDER. ENTREPRENEUR. land on the beats; then a whip pan out.
 */
export const Reveal: React.FC = () => {
  const { frame, at } = useScene("reveal");

  const streak = pr(frame, 0, 10, E.outExpo);
  const settle = pr(frame, 0, 18, E.outExpo);
  const sheen = pr(frame, at(3.25), at(4.0), E.inOut);
  const move = pr(frame, at(4.0), at(4.55), E.inOutExpo);
  const photo = pr(frame, at(4.05), at(4.75), E.outExpo);
  const ringDraw = pr(frame, at(4.35), at(5.0), E.inOut);
  const theta = Math.PI * 0.15 + (frame - at(4.35)) * 0.05;
  const sweep = pr(frame, at(4.3), at(5.1), E.inOut);
  const push = 1 + 0.045 * pr(frame, at(4.05), at(7), E.linear);
  const whip = pr(frame, at(6.55), at(7), E.inExpo);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* drop light streak */}
      <div
        style={{
          position: "absolute",
          left: 960 - 1100 * streak,
          top: 538,
          width: 2200 * streak,
          height: 4,
          background: `linear-gradient(90deg, transparent, ${C.white} 30%, ${C.lime} 50%, ${C.white} 70%, transparent)`,
          opacity: 1 - streak,
          filter: "blur(1px)",
        }}
      />

      <AbsoluteFill style={{ translate: `${-2600 * whip}px 0px` }}>
        {/* portrait + orbit */}
        <Arc half="back" draw={ringDraw} theta={theta} />
        <div
          style={{
            position: "absolute",
            left: 880,
            top: 112,
            width: 1092,
            height: 987,
            opacity: photo,
            translate: `${(1 - photo) * 40}px ${(1 - photo) * 120}px`,
            scale: `${push * lerp(1.06, 1, photo)}`,
            transformOrigin: "50% 100%",
          }}
        >
          <Img
            src={staticFile("photo/prince-cutout.png")}
            style={{ width: "100%", height: "100%" }}
          />
          {/* light sweep, clipped to the cut-out */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent ${lerp(-30, 110, sweep) - 12}%, rgba(255,255,255,0.35) ${lerp(-30, 110, sweep)}%, transparent ${lerp(-30, 110, sweep) + 12}%)`,
              mixBlendMode: "overlay",
              WebkitMaskImage: `url(${staticFile("photo/prince-cutout.png")})`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        </div>
        <Arc half="front" draw={ringDraw} theta={theta} />

        {/* name */}
        <div
          style={{
            position: "absolute",
            left: lerp(960, 130, move),
            top: lerp(400, 270, move),
            translate: `${lerp(-50, 0, move)}% 0px`,
            scale: `${lerp(1.06, 1, settle) * lerp(1, 0.7, move)}`,
            transformOrigin: "0% 0%",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{ overflow: "hidden", display: "flex", paddingBottom: 8 }}
          >
            {NAME.map((ch, i) => {
              const p = pr(frame, i * 1.2, i * 1.2 + 14, E.outExpo);
              return (
                <span
                  key={i}
                  style={{
                    ...display(200, 800),
                    display: "inline-block",
                    whiteSpace: "pre",
                    translate: `0px ${(1 - p) * 110}%`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          {/* lime sheen pass */}
          <div
            style={{
              ...display(200, 800),
              position: "absolute",
              left: 0,
              top: 0,
              color: "transparent",
              background: `linear-gradient(100deg, transparent ${lerp(-20, 120, sheen) - 8}%, ${C.lime} ${lerp(-20, 120, sheen)}%, transparent ${lerp(-20, 120, sheen) + 8}%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              opacity: sheen > 0 && sheen < 1 ? 0.95 : 0,
            }}
          >
            PRINCE GARG
          </div>
        </div>

        {/* CREATOR. BUILDER. ENTREPRENEUR. */}
        {WORDS.map(([w, t], i) => {
          const p = pr(frame, at(t), at(t) + 7, E.outExpo);
          const flash = frame >= at(t) && frame < at(t) + 7;
          return (
            <Mask
              key={w}
              p={p}
              style={{ position: "absolute", left: 134, top: 500 + i * 96 }}
            >
              <span
                style={{
                  ...display(86, 800),
                  color: flash ? C.lime : C.white,
                  letterSpacing: "-0.035em",
                }}
              >
                {w}
                <span style={{ color: C.lime }}>.</span>
              </span>
            </Mask>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
