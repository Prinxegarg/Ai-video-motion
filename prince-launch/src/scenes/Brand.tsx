import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { CameraGlyph, Sparkle, glass } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, F, label } from "../theme";

const CW = 480;
const CH = 580;
const GAP = 56;
const X0 = (1920 - (3 * CW + 2 * GAP)) / 2;
const TOP = 280;

/** Community visual: concentric rings of dots, slowly orbiting. */
const Crowd: React.FC<{ readonly frame: number }> = ({ frame }) => (
  <svg width={CW - 64} height={250} viewBox="-208 -125 416 250">
    {[38, 70, 102].map((r, ring) =>
      Array.from({ length: 8 + ring * 8 }).map((_, k, arr) => {
        const th =
          (k / arr.length) * Math.PI * 2 + frame * 0.012 * (ring % 2 ? -1 : 1);
        const on = random(`c${ring}-${k}`) > 0.82;
        return (
          <circle
            key={`${ring}-${k}`}
            cx={Math.cos(th) * r * 1.7}
            cy={Math.sin(th) * r}
            r={on ? 6 : 4.5}
            fill={on ? C.lime : "rgba(255,255,255,0.7)"}
          />
        );
      }),
    )}
    <circle r={20} fill={C.lime} />
  </svg>
);

/**
 * 15–19 s — The personal brand. Three feature cards flip up on the beats like a
 * spec sheet, a lime light runs along each border, then the camera dives into
 * the community card, which hands over to the dashboard.
 */
export const Brand: React.FC = () => {
  const { frame, at } = useScene("brand");

  const head = pr(frame, 0, 12, E.outExpo);
  const cam = lerp(-6, 6, pr(frame, at(15.4), at(18.6), E.inOut));
  const dive = pr(frame, at(18.45), at(19), E.inExpo);
  const fade = 1 - pr(frame, at(18.85), at(19) - 1, E.linear);
  const typed = Math.floor(17 * pr(frame, at(16.2), at(17.0), E.linear));

  const cards = [
    {
      t: 15.0,
      title: <>AI CREATOR</>,
      proof: "@ai.byprince",
      visual: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div
            style={{
              rotate: `${frame * 1.5}deg`,
              scale: `${1 + 0.06 * Math.sin(frame / 6)}`,
            }}
          >
            <Sparkle size={130} />
          </div>
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 22,
              color: C.dim,
              padding: "10px 18px",
              borderRadius: 12,
              background: "#141414",
              border: `1px solid ${C.line}`,
            }}
          >
            › {"creating with AI".slice(0, typed)}
            <span
              style={{
                color: C.lime,
                opacity: Math.floor(frame / 7) % 2 ? 1 : 0,
              }}
            >
              ▍
            </span>
          </div>
        </div>
      ),
    },
    {
      t: 15.5,
      title: (
        <>
          <span style={{ color: C.lime }}>100K+</span> COMMUNITY
        </>
      ),
      proof: "Followers on @ai.byprince",
      visual: <Crowd frame={frame} />,
    },
    {
      t: 16.0,
      title: <>BRAND FOUNDER</>,
      proof: "Chipku · @chipku_shop",
      visual: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Img
            src={staticFile("brand/chipku-logo-initial.png")}
            style={{
              width: 128,
              rotate: "-6deg",
              filter:
                "drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 18px 20px rgba(0,0,0,0.6))",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: F.ui,
              fontSize: 22,
              color: C.dim,
            }}
          >
            <CameraGlyph size={20} color={C.dim} /> @chipku_shop
          </div>
        </div>
      ),
    },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: fade }}>
      <AbsoluteFill
        style={{
          scale: `${lerp(1, 6, dive)}`,
          transformOrigin: `960px ${TOP + 200}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: head,
            translate: `0px ${(1 - head) * 20}px`,
          }}
        >
          <span style={{ ...label(20, 600), color: C.white }}>
            <span style={{ color: C.lime }}>■</span>&nbsp;&nbsp;The personal
            brand
          </span>
        </div>
        <AbsoluteFill style={{ perspective: 2200 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              rotate: `y ${cam}deg`,
            }}
          >
            {cards.map((c, i) => {
              const p = pr(frame, at(c.t), at(c.t) + 12, E.outExpo);
              const glow = pr(
                frame,
                at(17 + i * 0.5),
                at(17 + i * 0.5) + 14,
                E.inOut,
              );
              const float = Math.sin(frame / 20 + i * 2) * 8;
              return (
                <div
                  key={i}
                  style={{
                    ...glass(32),
                    position: "absolute",
                    left: X0 + i * (CW + GAP),
                    top: TOP,
                    width: CW,
                    height: CH,
                    transform: `translateY(${(1 - p) * 180 + float}px) rotateX(${(1 - p) * 72}deg)`,
                    transformOrigin: "50% 100%",
                    opacity: p > 0 ? Math.min(1, p * 2) : 0,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 80px rgba(0,0,0,0.55)${glow > 0 && glow < 1 ? `, 0 0 ${40 * Math.sin(glow * Math.PI)}px rgba(199,255,61,${0.35 * Math.sin(glow * Math.PI)})` : ""}`,
                  }}
                >
                  {/* running border light */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${lerp(-40, 100, glow)}%`,
                      width: "40%",
                      height: 2,
                      background: `linear-gradient(90deg, transparent, ${C.lime}, transparent)`,
                      opacity: glow > 0 && glow < 1 ? 1 : 0,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 32,
                      top: 28,
                      ...label(18, 600),
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 32,
                      right: 32,
                      top: 80,
                      height: 280,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {c.visual}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 32,
                      right: 24,
                      bottom: 92,
                      ...display(i === 1 ? 50 : 56, 800),
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 32,
                      bottom: 40,
                      ...label(17, 500),
                      letterSpacing: "0.12em",
                    }}
                  >
                    {c.proof}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
