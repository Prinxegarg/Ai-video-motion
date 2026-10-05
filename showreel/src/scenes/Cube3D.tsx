import { AbsoluteFill, random } from "remotion";
import { E, lerp, pr } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const S = 112; // cubie size
const G = 10; // gap

type Face = {
  key: string;
  transform: string;
  normal: [number, number, number];
  shade: number;
};
const FACES: Face[] = [
  {
    key: "front",
    transform: `translateZ(${S / 2}px)`,
    normal: [0, 0, 1],
    shade: 0,
  },
  {
    key: "back",
    transform: `rotateY(180deg) translateZ(${S / 2}px)`,
    normal: [0, 0, -1],
    shade: 0.35,
  },
  {
    key: "right",
    transform: `rotateY(90deg) translateZ(${S / 2}px)`,
    normal: [1, 0, 0],
    shade: 0.16,
  },
  {
    key: "left",
    transform: `rotateY(-90deg) translateZ(${S / 2}px)`,
    normal: [-1, 0, 0],
    shade: 0.22,
  },
  {
    key: "top",
    transform: `rotateX(90deg) translateZ(${S / 2}px)`,
    normal: [0, -1, 0],
    shade: 0.05,
  },
  {
    key: "bottom",
    transform: `rotateX(-90deg) translateZ(${S / 2}px)`,
    normal: [0, 1, 0],
    shade: 0.4,
  },
];

const CUBIES: [number, number, number][] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++) CUBIES.push([x, y, z]);

const faceColor = (
  c: [number, number, number],
  n: [number, number, number],
): string => {
  const outer =
    (n[0] !== 0 && c[0] === n[0]) ||
    (n[1] !== 0 && c[1] === n[1]) ||
    (n[2] !== 0 && c[2] === n[2]);
  if (!outer) return C.ink; // inner faces are revealed by the explode
  const centre = c.filter((v, i) => n[i] === 0 && v === 0).length === 2;
  if (centre && n[2] === 1) return C.red;
  if (centre && n[1] === -1) return C.lime;
  if (centre && n[0] === 1) return C.ink;
  if (
    Math.abs(c[0]) + Math.abs(c[1]) + Math.abs(c[2]) === 3 &&
    random(`k${c.join()}${n.join()}`) > 0.6
  )
    return C.lime;
  return C.paper;
};

/**
 * 03 — 3D space. A 27-piece cube built from real CSS 3D transforms with per-face
 * lighting swoops in spinning, then explodes on the beat: every cubie tumbles on
 * its own axis and reveals its ink inner faces.
 */
export const Cube3D: React.FC = () => {
  const { frame, at } = useBeatClock("cube");
  const arrive = pr(frame, 0, at(1), E.outExpo);
  const explode = pr(frame, at(1), at(1) + 20, E.outExpo);
  const exit = pr(frame, at(1.6), at(2), E.inExpo);

  const ry = lerp(-150, 28, arrive) + explode * 46 + frame * 0.4;
  const rx = lerp(-48, -24, arrive) - explode * 10;
  const k = 1 + explode * 1.9;

  return (
    <AbsoluteFill style={{ backgroundColor: C.blue, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)`,
        }}
      />
      {/* backdrop type */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: F.flex,
            fontSize: 980,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `3px ${C.paper}`,
            opacity: 0.38,
            fontVariationSettings: axes({ wght: 900, wdth: 151, opsz: 144 }),
            translate: `${lerp(160, -120, pr(frame, 0, at(2), E.linear))}px 30px`,
          }}
        >
          3D
        </div>
      </AbsoluteFill>
      {/* floor shadow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 520 * k,
            height: 90 * k,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0,0,30,0.45), rgba(0,0,30,0) 70%)",
            translate: "0px 330px",
            opacity: 1 - explode * 0.6,
          }}
        />
      </AbsoluteFill>
      {/* cube */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          perspective: 1500,
          scale: `${lerp(0.35, 1.15, arrive) + exit * 1.4}`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
          }}
        >
          {CUBIES.map((c) => {
            const id = c.join(",");
            const spinX = (random(`rx${id}`) - 0.5) * 300 * explode;
            const spinY = (random(`ry${id}`) - 0.5) * 300 * explode;
            const d = S + G;
            return (
              <div
                key={id}
                style={{
                  position: "absolute",
                  left: -S / 2,
                  top: -S / 2,
                  width: S,
                  height: S,
                  transformStyle: "preserve-3d",
                  transform: `translate3d(${c[0] * d * k}px, ${c[1] * d * k}px, ${c[2] * d * k}px) rotateX(${spinX}deg) rotateY(${spinY}deg)`,
                }}
              >
                {FACES.map((f) => {
                  const col = faceColor(c, f.normal);
                  const isHero = col === C.red;
                  return (
                    <div
                      key={f.key}
                      style={{
                        position: "absolute",
                        inset: 0,
                        transform: f.transform,
                        backgroundColor: col,
                        border: `4px solid ${C.ink}`,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isHero ? (
                        <span
                          style={{
                            fontFamily: F.flex,
                            fontSize: 44,
                            color: C.paper,
                            fontVariationSettings: axes({
                              wght: 900,
                              wdth: 120,
                            }),
                          }}
                        >
                          3D
                        </span>
                      ) : null}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "#000",
                          opacity: f.shade,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
