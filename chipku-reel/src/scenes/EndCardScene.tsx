import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { Avatar } from "../components/Avatar";
import { Cursor, Hud, InstaGlyph, LogoSlap, SparkleBurst } from "../components/Chrome";
import { useAbsFrame } from "../components/Scene";
import { Bg, Camera } from "../components/Transitions";
import { Accent, Word } from "../components/Type";
import { CLAMP, EASE, cue, prog, transitionRange } from "../lib/motion";
import { INSTAGRAM_HANDLE } from "../offers";
import { C, F } from "../theme";
import timeline from "../timeline.json";

const LOGO_W = 880;
const LOGO_H = (LOGO_W * 651) / 1847;
const LOGO_TOP = 232;

/** Beat 3b — end card: logo + peeking mascot + "Order now on Instagram @chipku_shop". */
export const EndCardScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [, wipeEnd] = transitionRange("circleToPaper");
  const click = cue("endcard.click");
  const winkAt = cue("endcard.wink");

  const peek = spring({ frame: frame - cue("endcard.avatar"), fps, config: { damping: 12, stiffness: 130 } });
  const pill = spring({ frame: frame - cue("endcard.pill"), fps, config: { damping: 12, stiffness: 170 } });
  const press = interpolate(frame, [click - 2, click + 1, click + 7], [1, 0.94, 1], CLAMP);

  const typing = timeline.cues["endcard.typing"];
  const typed = Math.max(0, Math.min(INSTAGRAM_HANDLE.length, Math.floor((frame - typing.frame) / typing.framesPerChar) + 1));
  const caretOn = typed < INSTAGRAM_HANDLE.length || Math.floor(frame / 8) % 2 === 0;

  const ctaWords = ["ORDER", "NOW", "ON"];
  const ctaAt = cue("endcard.cta");

  return (
    <AbsoluteFill>
      <Bg color={C.paper} />
      <Camera start={wipeEnd} end={600} from={1.05} to={1.0}>
        {/* Mascot peeking from behind the logo (reference end card) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: LOGO_TOP + LOGO_H * 0.45,
            overflow: "hidden",
            opacity: frame >= cue("endcard.avatar") ? 1 : 0,
          }}
        >
          <Avatar
            body={false}
            grin={interpolate(frame, [click, click + 4], [0, 1], CLAMP)}
            wink={interpolate(frame, [winkAt, winkAt + 3, winkAt + 16, winkAt + 20], [0, 1, 1, 0], CLAMP)}
            lookY={interpolate(frame, [cue("endcard.cta"), cue("endcard.pill")], [0, 1], CLAMP)}
            lookX={interpolate(frame, [click - 20, click], [0, -0.4], CLAMP)}
            brows={interpolate(frame, [click, click + 4], [0, 1], CLAMP)}
            blink={interpolate(frame, [522, 524, 527], [0, 1, 0], CLAMP)}
            style={{
              position: "absolute",
              left: 960 - 300 * 0.62,
              top: 26,
              scale: "0.62",
              transformOrigin: "0 0",
              translate: `0px ${(1 - peek) * 420}px`,
            }}
          />
        </div>

        <div style={{ position: "absolute", left: 960 - LOGO_W / 2, top: LOGO_TOP }}>
          <LogoSlap at={cue("endcard.logo")} land={cue("endcard.logoLand")} width={LOGO_W} />
        </div>

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            top: LOGO_TOP + LOGO_H + 22,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 16,
            fontFamily: F.sans,
            fontWeight: 700,
            fontSize: 58,
            letterSpacing: "-0.03em",
            color: C.black,
          }}
        >
          <Word at={cue("endcard.t1")}>Aesthetic,</Word>
          <Word at={cue("endcard.t2")}>personalised</Word>
          <Word at={cue("endcard.t3")}>&</Word>
          <Accent text="affordable." at={cue("endcard.accent")} color={C.ember} size={92} />
        </div>

        {/* CTA headline */}
        <div
          style={{
            position: "absolute",
            top: LOGO_TOP + LOGO_H + 122,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 22,
            fontFamily: F.display,
            fontSize: 100,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: C.black,
          }}
        >
          {ctaWords.map((w, i) => (
            <Word key={w} at={ctaAt + i * 3}>
              {w}
            </Word>
          ))}
          <Word at={ctaAt + 9} style={{ color: C.ember }}>
            INSTAGRAM
          </Word>
        </div>

        {/* Handle pill */}
        <div
          style={{
            position: "absolute",
            top: LOGO_TOP + LOGO_H + 252,
            left: 960,
            translate: "-50% 0",
            scale: `${pill * press}`,
            display: "flex",
            alignItems: "center",
            gap: 22,
            height: 120,
            padding: "0 50px 0 38px",
            borderRadius: 999,
            backgroundColor: C.black,
            boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
          }}
        >
          <InstaGlyph size={64} color={C.yellow} />
          <div
            style={{
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: "-0.02em",
              color: C.yellow,
              minWidth: 440,
              whiteSpace: "pre",
            }}
          >
            {INSTAGRAM_HANDLE.slice(0, typed)}
            <span style={{ opacity: caretOn && frame < click + 10 ? 1 : 0, color: C.orange }}>|</span>
          </div>
          <div style={{ position: "absolute", left: "50%", top: "50%" }}>
            <SparkleBurst at={cue("endcard.sparkle")} seed="cta" radius={260} count={12} />
          </div>
        </div>

        <Cursor
          path={[
            { frame: click - 16, x: 1500, y: 1060 },
            { frame: click - 1, x: 1238, y: LOGO_TOP + LOGO_H + 318 },
            { frame: click + 8, x: 1262, y: LOGO_TOP + LOGO_H + 336 },
            { frame: click + 22, x: 1560, y: 1120 },
          ]}
          clickAt={click}
          ringColor={C.ember}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 40,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 22,
            color: "rgba(0,0,0,0.5)",
            opacity: prog(frame, click + 4, 12, EASE.out),
          }}
        >
          posters · polaroids · stickers
        </div>
      </Camera>
      <Hud label="// 06 — order now" />
    </AbsoluteFill>
  );
};
