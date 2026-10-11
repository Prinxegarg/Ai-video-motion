import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CameraGlyph, Mask, glass } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, F, label } from "../theme";

/** White die-cut border around a transparent PNG, plus a lifted shadow. */
const sticker = (w: number, lift: number) =>
  [
    `drop-shadow(${w}px 0 0 #fff)`,
    `drop-shadow(-${w}px 0 0 #fff)`,
    `drop-shadow(0 ${w}px 0 #fff)`,
    `drop-shadow(0 -${w}px 0 #fff)`,
    `drop-shadow(0 ${8 + lift * 30}px ${12 + lift * 30}px rgba(0,0,0,0.6))`,
  ].join(" ");

/**
 * 12–15 s — The entrepreneur, kept short: the Chipku logo slaps on like a sticker,
 * its Instagram card slides up, and the brand line lands. Chipku keeps its own
 * yellow and orange; everything around it stays in the film's palette.
 */
export const Chipku: React.FC = () => {
  const { frame, at } = useScene("chipku");

  const head = pr(frame, 0, 10, E.outExpo);
  const eyebrow = pr(frame, 2, 12, E.outExpo);
  const slap = pr(frame, at(12.5), at(12.5) + 6, E.inQuart);
  const landed = frame >= at(12.5) + 6;
  const wobble = landed
    ? Math.exp(-(frame - at(12.5) - 6) / 4) *
      Math.sin((frame - at(12.5) - 6) * 1.4)
    : 0;
  const stick = pr(frame, at(12.75), at(12.75) + 9, E.outExpo);
  const card = pr(frame, at(13.0), at(13.0) + 11, E.outExpo);
  const tag = pr(frame, at(13.5), at(13.5) + 10, E.outExpo);
  const drift = interpolate(frame, [0, at(15)], [0, -30]);
  const exit = pr(frame, at(14.55), at(15), E.inExpo);

  return (
    <AbsoluteFill
      style={{ overflow: "hidden", translate: `0px ${-1300 * exit}px` }}
    >
      {/* left column */}
      <div
        style={{
          position: "absolute",
          left: 132,
          top: 340,
          translate: `${drift * 0.5}px 0px`,
        }}
      >
        <div
          style={{
            ...label(20, 600),
            color: C.white,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: eyebrow,
          }}
        >
          <span style={{ width: 9, height: 9, background: C.lime }} /> Founder
          of
        </div>
        <Mask p={head} style={{ marginTop: 22 }}>
          <span style={display(112, 800)}>
            MEET CHIPKU<span style={{ color: C.lime }}>.</span>
          </span>
        </Mask>
        <Mask p={stick} style={{ marginTop: 18 }}>
          <span
            style={{
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 34,
              letterSpacing: "0.3em",
              color: C.dim,
            }}
          >
            BUILT TO STICK.
          </span>
        </Mask>
        <Mask p={tag} style={{ marginTop: 70 }}>
          <span style={{ ...display(64, 800), letterSpacing: "-0.02em" }}>
            “YOUR WALL NEEDS US.”
          </span>
        </Mask>
      </div>

      {/* logo sticker */}
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: 255,
          width: 610,
          translate: `${-drift}px 0px`,
          scale: `${frame < at(12.5) ? 0 : lerp(1.9, 1, slap) * (1 + wobble * 0.04)}`,
          rotate: `${lerp(-16, -5, slap) + wobble * 3}deg`,
          opacity: frame < at(12.5) ? 0 : 1,
          filter: sticker(7, 1 - slap),
        }}
      >
        <Img
          src={staticFile("brand/chipku-logo-full.png")}
          style={{ width: "100%" }}
        />
      </div>

      {/* Instagram card */}
      <div
        style={{
          ...glass(28),
          position: "absolute",
          left: 1140,
          top: 600,
          width: 590,
          padding: "26px 28px",
          opacity: card,
          translate: `${-drift * 1.4}px ${(1 - card) * 90}px`,
          fontFamily: F.ui,
          color: C.white,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "#000",
              border: `2px solid ${C.chipkuYellow}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Img
              src={staticFile("brand/chipku-logo-initial.png")}
              style={{ width: 56 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              <CameraGlyph size={24} /> @chipku_shop
            </div>
            <div style={{ fontSize: 19, color: C.dim, marginTop: 6 }}>
              Posters · Polaroids · Stickers
            </div>
          </div>
          <div
            style={{
              padding: "12px 22px",
              borderRadius: 12,
              background: C.lime,
              color: C.bg,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            Follow
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
