import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { AvatarBadge, Hud, Sparkle, SparkleBurst } from "../components/Chrome";
import { useAbsFrame } from "../components/Scene";
import { Bg, Camera, DitherWipe } from "../components/Transitions";
import { Accent, Eyebrow, Word } from "../components/Type";
import { CLAMP, EASE, cue, prog, transitionRange, wave, type CueId } from "../lib/motion";
import { OFFERS } from "../offers";
import { C, F } from "../theme";

const CARD_CUES: [CueId, CueId][] = [
  ["offers.card1", "offers.price1"],
  ["offers.card2", "offers.price2"],
  ["offers.card3", "offers.price3"],
  ["offers.card4", "offers.price4"],
];

/** Beat 2b — the four exact bundle offers as animated cards. */
export const OffersScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [, wipeEnd] = transitionRange("panelToOffers");
  const [ditherStart, ditherEnd] = transitionRange("ditherToBlack");
  const panel = prog(frame, cue("offers.panel"), 16, EASE.out);
  const winkAt = cue("offers.wink");

  const panelX = 720;
  const panelY = 104;
  const cardW = 512;
  const cardH = 352;

  return (
    <AbsoluteFill>
      <Bg color={C.orange} />
      <Camera
        start={wipeEnd}
        end={ditherEnd}
        to={1.035}
        punches={CARD_CUES.map(([c]) => cue(c) + 4)}
        origin="62% 55%"
      >
        {/* Left column */}
        <div style={{ position: "absolute", left: 110, top: 270 }}>
          <Eyebrow at={cue("offers.eyebrow")} color={C.black}>
            {"// bundle offers"}
          </Eyebrow>
          <div
            style={{
              marginTop: 22,
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 124,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              color: C.black,
            }}
          >
            <div>
              <Word at={cue("offers.w1")}>Bundles</Word>
            </div>
            <div>
              <Word at={cue("offers.w2")}>that</Word>
            </div>
          </div>
          <Accent
            text="stick."
            at={cue("offers.accent")}
            color={C.black}
            size={210}
            underline={{ at: cue("offers.underline"), color: C.paper }}
            style={{ marginTop: -4 }}
          />
        </div>

        {/* Offer panel */}
        <div
          style={{
            position: "absolute",
            left: panelX,
            top: panelY,
            width: 1110,
            height: 872,
            borderRadius: 40,
            backgroundColor: C.paper,
            boxShadow: "0 40px 90px rgba(0,0,0,0.25)",
            translate: `${(1 - panel) * 900}px 0px`,
            opacity: interpolate(panel, [0, 0.2], [0, 1], CLAMP),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 34,
              right: 34,
              top: 30,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: F.mono,
              fontSize: 22,
              color: "rgba(0,0,0,0.55)",
            }}
          >
            <span>{"// chipku bundles"}</span>
            <span>4 offers</span>
          </div>
          {OFFERS.map((o, i) => {
            const [cardCue, priceCue] = CARD_CUES[i];
            const s = spring({ frame: frame - cue(cardCue), fps, config: { damping: 11, stiffness: 150 } });
            const price = prog(frame, cue(priceCue), 10, EASE.out);
            const twinkle = spring({ frame: frame - cue(priceCue), fps, config: { damping: 8, stiffness: 200 } });
            const col = i % 2;
            const row = Math.floor(i / 2);
            return (
              <div
                key={o.price}
                style={{
                  position: "absolute",
                  left: 34 + col * (cardW + 18),
                  top: 84 + row * (cardH + 18),
                  width: cardW,
                  height: cardH,
                  borderRadius: 30,
                  backgroundColor: C.ink,
                  overflow: "hidden",
                  scale: `${s}`,
                  rotate: `${(1 - s) * (col === 0 ? -12 : 12)}deg`,
                  translate: `0px ${(1 - s) * 120}px`,
                  opacity: interpolate(s, [0, 0.25], [0, 1], CLAMP),
                  boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
                }}
              >
                {/* Corner glow in brand orange */}
                <div
                  style={{
                    position: "absolute",
                    right: -120,
                    top: -120,
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${C.ember}66 0%, transparent 70%)`,
                  }}
                />
                <div style={{ position: "absolute", left: 36, top: 30, display: "flex", alignItems: "center", gap: 14 }}>
                  <Sparkle
                    size={40}
                    color={C.yellow}
                    style={{ scale: `${twinkle}`, rotate: `${(1 - twinkle) * 90 + wave(frame, 50, i) * 8}deg` }}
                  />
                  <span style={{ fontFamily: F.mono, fontSize: 21, color: "rgba(250,246,236,0.6)" }}>
                    {`bundle 0${i + 1}`}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 36,
                    top: 88,
                    fontFamily: F.display,
                    fontSize: 66,
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                    color: C.paper,
                    whiteSpace: "nowrap",
                  }}
                >
                  BUY {o.buy} <span style={{ color: C.orange }}>GET {o.get}</span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    bottom: 20,
                    height: 168,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontFamily: F.display,
                      fontSize: 160,
                      lineHeight: 1.05,
                      color: C.yellow,
                      translate: `0px ${(1 - price) * 100}%`,
                    }}
                  >
                    {o.price}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 34 + cardW + 18 + cardW - 60, top: 84 + cardH + 18 + 60 }}>
            <SparkleBurst at={cue("offers.sparkle")} seed="offers" radius={150} />
          </div>
        </div>

        <AvatarBadge
          at={cue("offers.panel")}
          ring={C.black}
          face={{
            grin: 1,
            wink: interpolate(frame, [winkAt, winkAt + 3, winkAt + 14, winkAt + 18], [0, 1, 1, 0], CLAMP),
            lookX: 1,
            brows: 0.6,
          }}
          style={{ left: 96, top: 804 }}
        />
      </Camera>
      <DitherWipe start={ditherStart} end={ditherEnd} color={C.ink} />
      <Hud label="// 04 — bundle offers" />
    </AbsoluteFill>
  );
};
