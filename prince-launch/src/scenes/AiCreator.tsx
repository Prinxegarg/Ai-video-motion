import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { Phone, PHONE_H, PHONE_W } from "../components/Phone";
import { CameraGlyph, Chip, Mask, Sparkle } from "../components/ui";
import { E, clamp01, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, F } from "../theme";

const TITLE = Array.from("AI.BYPRINCE");
const PROMPT = "cinematic portrait, electric lime light";

/** Abstract generative tiles for the profile grid (illustrative, no fake posts). */
const tile = (i: number, frame: number): string => {
  const a = (i * 47 + frame * 0.8) % 360;
  const lime = i % 5 === 1 || i === 7;
  const ink = lime ? C.lime : "rgba(255,255,255,0.75)";
  switch (i % 4) {
    case 0:
      return `radial-gradient(circle at ${30 + ((i * 13) % 40)}% ${40 + ((i * 7) % 30)}%, ${ink} 0 18%, transparent 19%), linear-gradient(${a}deg, #1d1d1d, #0d0d0d)`;
    case 1:
      return `conic-gradient(from ${a}deg at 50% 50%, ${ink}, #111 25%, #222 50%, ${ink} 75%, #111)`;
    case 2:
      return `repeating-linear-gradient(${a}deg, #151515 0 10px, ${lime ? "rgba(199,255,61,0.55)" : "#2b2b2b"} 10px 12px)`;
    default:
      return `radial-gradient(circle at 50% 120%, ${ink} 0 30%, #1a1a1a 31% 46%, #0c0c0c 47%)`;
  }
};

const ProfileScreen: React.FC<{
  readonly frame: number;
  readonly scroll: number;
}> = ({ frame, scroll }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: "62px 18px 0",
      fontFamily: F.ui,
      color: C.white,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#000",
          border: `2px solid ${C.lime}`,
          flexShrink: 0,
        }}
      >
        <Img
          src={staticFile("photo/prince-cutout.png")}
          style={{ width: 170, marginLeft: -36, marginTop: -6 }}
        />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 21 }}>ai.byprince</div>
        <div style={{ fontSize: 17, color: C.dim, marginTop: 4 }}>
          <span style={{ color: C.lime, fontWeight: 700 }}>100K+</span>{" "}
          followers
        </div>
      </div>
    </div>
    <div style={{ fontSize: 15, color: C.dim, marginTop: 14 }}>
      AI · Tools · Tech · Digital creativity
    </div>
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "9px 0",
          borderRadius: 10,
          background: C.lime,
          color: C.bg,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Follow
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "9px 0",
          borderRadius: 10,
          background: "#222",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        Message
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 262,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          translate: `0px ${-scroll}px`,
        }}
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            style={{ aspectRatio: "3 / 4", background: tile(i, frame) }}
          />
        ))}
      </div>
    </div>
  </div>
);

const PromptScreen: React.FC<{
  readonly frame: number;
  readonly at: (t: number) => number;
}> = ({ frame, at }) => {
  const typed = Math.floor(
    PROMPT.length * clamp01((frame - at(9.0)) / (at(9.95) - at(9.0))),
  );
  const pressed = frame >= at(10.0);
  const press = pr(frame, at(10.0), at(10.0) + 6, E.outBack);
  const reveal = pr(frame, at(10.05), at(10.85), E.inOut);
  const cols = 10;
  const rows = 12;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "62px 16px 0",
        fontFamily: F.ui,
        color: C.white,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
          fontSize: 20,
        }}
      >
        <Sparkle size={22} /> Create
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 14,
          height: 380,
          borderRadius: 22,
          overflow: "hidden",
          background: C.lime,
        }}
      >
        <Img
          src={staticFile("photo/prince-cutout.png")}
          style={{
            position: "absolute",
            width: 470,
            left: -88,
            top: 14,
            mixBlendMode: "multiply",
            filter: "contrast(1.25) brightness(1.08)",
          }}
        />
        {/* pixel resolve from noise */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => {
            const r = random(`cell${i}`);
            const shimmer = 0.5 + 0.5 * Math.sin(frame * 0.35 + i * 0.7);
            const off = r < reveal;
            return (
              <div
                key={i}
                style={{
                  background: off
                    ? "transparent"
                    : r > 0.93
                      ? C.lime
                      : `rgba(${20 + shimmer * 22},${20 + shimmer * 22},${20 + shimmer * 22},1)`,
                }}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "14px 16px",
          borderRadius: 18,
          background: "#161616",
          border: `1px solid ${C.line}`,
          fontSize: 16,
          lineHeight: 1.35,
          minHeight: 70,
        }}
      >
        {PROMPT.slice(0, typed)}
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 18,
            marginLeft: 2,
            background: C.lime,
            opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2,
            verticalAlign: "middle",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          padding: "13px 0",
          borderRadius: 999,
          background: pressed ? C.lime : "#222",
          color: pressed ? C.bg : C.white,
          fontWeight: 700,
          fontSize: 17,
          scale: `${pressed ? lerp(0.92, 1, press) : 1}`,
        }}
      >
        <Sparkle size={16} color={pressed ? C.bg : C.lime} /> Generate
      </div>
    </div>
  );
};

const ReelScreen: React.FC<{
  readonly frame: number;
  readonly progress: number;
}> = ({ frame, progress }) => {
  const dots = [];
  for (let ring = 0; ring < 3; ring++) {
    for (let k = 0; k < 22; k++) {
      const th = (k / 22) * Math.PI * 2 + frame * 0.04 * (ring % 2 ? -1 : 1);
      const tilt = 0.35 + ring * 0.25;
      const r = 70 + ring * 34;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r * tilt;
      const z = Math.sin(th);
      dots.push(
        <circle
          key={`${ring}-${k}`}
          cx={160 + x}
          cy={300 + y}
          r={2.5 + (z + 1) * 1.6}
          fill={ring === 1 ? C.lime : C.white}
          opacity={0.35 + (z + 1) * 0.3}
        />,
      );
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: F.ui,
        color: C.white,
        background: "radial-gradient(circle at 50% 42%, #1e1e1e, #050505 70%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 58,
          fontWeight: 700,
          fontSize: 20,
        }}
      >
        Reels
      </div>
      <svg
        width={PHONE_W - 20}
        height={PHONE_H - 20}
        style={{ position: "absolute", inset: 0 }}
      >
        {dots}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 160 - 36,
          top: 300 - 36,
          rotate: `${frame * 2}deg`,
        }}
      >
        <Sparkle size={72} color={C.white} />
      </div>
      {/* action column (no counts) */}
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 400,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {[
          "M24 40 C10 30 4 22 4 14 a10 10 0 0 1 20 -2 a10 10 0 0 1 20 2 c0 8 -6 16 -20 26 Z",
          "M6 8 h36 v24 h-22 l-10 8 v-8 h-4 Z",
          "M6 24 L42 6 L32 42 L22 28 Z",
        ].map((d, i) => (
          <svg key={i} width={30} height={30} viewBox="0 0 48 48">
            <path
              d={d}
              fill="none"
              stroke={C.white}
              strokeWidth={3.5}
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 40, right: 70 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>@ai.byprince</div>
        <div
          style={{
            height: 8,
            width: "90%",
            borderRadius: 4,
            background: "#2a2a2a",
            marginTop: 10,
          }}
        />
        <div
          style={{
            height: 8,
            width: "60%",
            borderRadius: 4,
            background: "#2a2a2a",
            marginTop: 7,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 14,
          height: 3,
          background: "#2a2a2a",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: C.lime,
          }}
        />
      </div>
    </div>
  );
};

/**
 * 7–12 s — The AI creator. AI.BYPRINCE flips in letter by letter, then three
 * phones rise in 3D: the profile, an AI prompt that generates a lime portrait,
 * and a reel. Topic chips float around them; the camera dives into the centre phone.
 */
export const AiCreator: React.FC = () => {
  const { frame, at } = useScene("ai");

  const enter = pr(frame, 0, 9, E.outExpo);
  const up = pr(frame, at(8.0), at(8.45), E.inOutExpo);
  const sub = pr(frame, at(7.5), at(7.5) + 9, E.outExpo);
  const orbit = lerp(-7, 7, pr(frame, at(8.2), at(11.6), E.inOut));
  const dive = pr(frame, at(11.45), at(12), E.inExpo);
  const fade = 1 - pr(frame, at(11.85), at(12) - 1, E.linear);

  const phones = [
    { x: -430, z: -140, ry: 24, t: 8.15 },
    { x: 0, z: 60, ry: 0, t: 8.3 },
    { x: 430, z: -140, ry: -24, t: 8.45 },
  ];
  const chips: [React.ReactNode, number, number, number, boolean][] = [
    [
      <>
        <CameraGlyph size={22} color={C.bg} /> @ai.byprince
      </>,
      8.6,
      150,
      300,
      true,
    ],
    ["AI Tools", 9.5, 120, 790, false],
    ["Technology", 10.5, 1560, 300, false],
    ["Digital Creativity", 11.0, 1430, 830, false],
  ];

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        translate: `${(1 - enter) * 2600}px 0px`,
        opacity: fade,
      }}
    >
      <AbsoluteFill
        style={{ scale: `${lerp(1, 7, dive)}`, transformOrigin: "960px 640px" }}
      >
        {/* title */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: lerp(330, 70, up),
            display: "flex",
            justifyContent: "center",
            perspective: 900,
            scale: `${lerp(1, 0.4, up)}`,
            transformOrigin: "50% 0%",
          }}
        >
          {TITLE.map((ch, i) => {
            const p = pr(frame, i * 1.1, i * 1.1 + 12, E.outExpo);
            return (
              <span
                key={i}
                style={{
                  ...display(230, 900),
                  display: "inline-block",
                  color: ch === "." ? C.lime : C.white,
                  rotate: `x ${(1 - p) * -95}deg`,
                  opacity: p,
                  transformOrigin: "50% 100%",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: lerp(600, 172, up),
            display: "flex",
            justifyContent: "center",
            scale: `${lerp(1, 0.7, up)}`,
          }}
        >
          <Mask p={sub}>
            <span
              style={{
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 34,
                letterSpacing: "0.32em",
                color: C.white,
              }}
            >
              CREATING WITH AI<span style={{ color: C.lime }}>.</span>
            </span>
          </Mask>
        </div>

        {/* phones */}
        <AbsoluteFill style={{ perspective: 1800 }}>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 640,
              transformStyle: "preserve-3d",
              rotate: `y ${orbit}deg`,
            }}
          >
            {phones.map((ph, i) => {
              const p = pr(frame, at(ph.t), at(ph.t) + 14, E.outExpo);
              const float = Math.sin(frame / 22 + i * 1.7) * 10;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: ph.x - PHONE_W / 2,
                    top: -PHONE_H / 2,
                    width: PHONE_W,
                    height: PHONE_H,
                    transform: `translate3d(0px, ${(1 - p) * 950 + float}px, ${ph.z}px) rotateY(${ph.ry}deg) rotateX(${(1 - p) * 50}deg)`,
                    opacity: p > 0 ? 1 : 0,
                  }}
                >
                  <Phone style={{ left: 0, top: 0 }}>
                    {i === 0 ? (
                      <ProfileScreen
                        frame={frame}
                        scroll={Math.max(0, frame - at(9.2)) * 3.2}
                      />
                    ) : null}
                    {i === 1 ? <PromptScreen frame={frame} at={at} /> : null}
                    {i === 2 ? (
                      <ReelScreen
                        frame={frame}
                        progress={pr(frame, at(8.45), at(12), E.linear)}
                      />
                    ) : null}
                  </Phone>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>

        {/* floating topic chips */}
        {chips.map(([content, t, x, y, accent], i) => {
          const p = pr(frame, at(t), at(t) + 9, E.outBack);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y + Math.sin(frame / 18 + i) * 8,
                scale: `${p}`,
                opacity: p > 0.01 ? 1 : 0,
                translate: `${-orbit * (6 + i * 2)}px 0px`,
              }}
            >
              <Chip accent={accent}>
                {accent ? null : <Sparkle size={16} />}
                {content}
              </Chip>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
