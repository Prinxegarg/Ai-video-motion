import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { Avatar } from "../components/Avatar";
import { Hud, LogoSlap } from "../components/Chrome";
import { Polaroid, Poster, Sticker } from "../components/ProductArt";
import { useAbsFrame } from "../components/Scene";
import { Bg, Camera, Whip } from "../components/Transitions";
import { Accent, Word } from "../components/Type";
import { CLAMP, cue, prog, transitionRange, wave } from "../lib/motion";
import { C, F } from "../theme";

/** Beat 1b — brand + products: logo slap, "Posters, Polaroids & Stickers for every vibe." */
export const ProductsScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [whipStart] = transitionRange("whipToCategories");

  const enter = spring({ frame: frame - cue("products.avatar"), fps, config: { damping: 14, stiffness: 120 } });
  const card = (id: "products.posters" | "products.polaroids" | "products.stickers") =>
    spring({ frame: frame - cue(id), fps, config: { damping: 11, stiffness: 150 } });
  const pill = prog(frame, cue("products.pill"), 12);
  const grin = interpolate(frame, [cue("products.stickers") - 2, cue("products.stickers") + 4], [0, 1], CLAMP);
  const armUp = spring({ frame: frame - cue("products.posters") + 4, fps, config: { damping: 13, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <Whip mode="out" start={whipStart} end={whipStart + 9}>
        <Bg color={C.yellow} />
        <Camera start={88} end={whipStart + 9} to={1.03} punches={[cue("products.logoLand")]}>
          {/* Mascot presenting the products */}
          <Avatar
            arm={-14 - armUp * 18 + wave(frame, 40) * 3}
            grin={grin}
            lookX={-0.9}
            lookY={0.2}
            blink={interpolate(frame, [134, 136, 139], [0, 1, 0], CLAMP)}
            tilt={-4 + wave(frame, 70) * 2}
            brows={grin}
            style={{
              position: "absolute",
              left: 1330,
              top: 340,
              scale: "1.05",
              transformOrigin: "50% 100%",
              translate: `${(1 - enter) * 700}px ${wave(frame, 45) * 5}px`,
            }}
          />

          {/* Layered product cards */}
          <div
            style={{
              position: "absolute",
              left: 790,
              top: 290,
              scale: `${card("products.posters")}`,
              rotate: `${-8 + (1 - card("products.posters")) * -20 + wave(frame, 90) * 1.5}deg`,
              translate: `0px ${(1 - card("products.posters")) * 200}px`,
            }}
          >
            <Poster kind="motivation" width={300} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 1130,
              top: 480,
              scale: `${card("products.polaroids")}`,
              rotate: `${7 + (1 - card("products.polaroids")) * 25 + wave(frame, 80, 1) * 1.5}deg`,
              translate: `0px ${(1 - card("products.polaroids")) * 200}px`,
            }}
          >
            <Polaroid kind="cars" width={300} caption="dream car" />
          </div>
          <div
            style={{
              position: "absolute",
              left: 1160,
              top: 170,
              scale: `${card("products.stickers")}`,
              rotate: `${14 + (1 - card("products.stickers")) * 40 + wave(frame, 60, 2) * 3}deg`,
            }}
          >
            <Sticker kind="music" size={230} />
          </div>

          {/* Brand + headline */}
          <div style={{ position: "absolute", left: 112, top: 96, display: "flex", alignItems: "center", gap: 28 }}>
            <LogoSlap at={cue("products.logo")} land={cue("products.logoLand")} width={470} />
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 24,
                color: C.black,
                border: `3px solid ${C.black}`,
                borderRadius: 999,
                padding: "10px 22px",
                opacity: pill,
                scale: `${0.7 + pill * 0.3}`,
                whiteSpace: "nowrap",
              }}
            >
              aesthetic & affordable
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 330,
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 118,
              lineHeight: 1.0,
              letterSpacing: "-0.045em",
              color: C.black,
            }}
          >
            <div>
              <Word at={cue("products.posters")}>Posters,</Word>
            </div>
            <div>
              <Word at={cue("products.polaroids")}>Polaroids</Word>
            </div>
            <div>
              <Word at={cue("products.stickers")}>& Stickers</Word>
            </div>
            <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 22 }}>
              <Word at={cue("products.w1")} style={{ fontSize: 68, fontWeight: 700, letterSpacing: "-0.03em" }}>
                for every
              </Word>
              <Accent
                text="vibe."
                at={cue("products.accent")}
                color={C.black}
                size={150}
                underline={{ at: cue("products.underline"), color: C.ember }}
              />
            </div>
          </div>
        </Camera>
      </Whip>
      <Hud label="// 02 — what we make" />
    </AbsoluteFill>
  );
};
