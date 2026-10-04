import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { AvatarBadge, Cursor, Hud } from "../components/Chrome";
import { Polaroid, Poster, Sticker } from "../components/ProductArt";
import { useAbsFrame } from "../components/Scene";
import { Bg, Camera, PanelWipe, Whip } from "../components/Transitions";
import { Accent, Eyebrow, Word } from "../components/Type";
import { CLAMP, EASE, cue, prog, transitionRange, wave, type CueId } from "../lib/motion";
import { C, F } from "../theme";

type Tile = {
  readonly id: CueId;
  readonly label: string;
  readonly node: React.ReactNode;
};

const TILES: Tile[] = [
  { id: "categories.tile1", label: "SPORTS", node: <Poster kind="sports" width={178} tape={false} /> },
  { id: "categories.tile2", label: "CARS", node: <Polaroid kind="cars" width={196} caption="vroom" /> },
  { id: "categories.tile3", label: "MUSIC", node: <Sticker kind="music" size={200} /> },
  { id: "categories.tile4", label: "MOTIVATION", node: <Poster kind="motivation" width={178} tape={false} /> },
  { id: "categories.tile5", label: "TRENDING", node: <Sticker kind="trending" size={196} /> },
  { id: "categories.tile6", label: "& MORE", node: null },
];

/** Beat 2a — categories grid inside a rounded panel (reference: text column + UI panel). */
export const CategoriesScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [whipStart, whipEnd] = transitionRange("whipToCategories");
  const [wipeStart, wipeEnd] = transitionRange("panelToOffers");
  const click = cue("categories.click");
  const panel = prog(frame, cue("categories.panel"), 16, EASE.out);
  const added = spring({ frame: frame - cue("categories.added"), fps, config: { damping: 12, stiffness: 200 } });

  // Grid geometry inside the panel
  const panelX = 700;
  const panelY = 112;
  const tileW = 340;
  const tileH = 360;
  const gx = 34;
  const tilePos = (i: number) => ({
    x: 52 + (i % 3) * (tileW + gx),
    y: 92 + Math.floor(i / 3) * (tileH + 24),
  });
  const music = tilePos(2);
  const target = { x: panelX + music.x + tileW * 0.62, y: panelY + music.y + tileH * 0.5 };

  return (
    <AbsoluteFill>
      <Whip mode="in" start={whipStart + 7} end={whipEnd}>
        <Bg color={C.ink} />
        <Camera start={whipEnd} end={wipeEnd} to={1.03}>
          {/* Left column */}
          <div style={{ position: "absolute", left: 110, top: 300 }}>
            <Eyebrow at={cue("categories.eyebrow")} color={C.yellow}>
              {"// shop by category"}
            </Eyebrow>
            <div
              style={{
                marginTop: 22,
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 128,
                lineHeight: 1,
                letterSpacing: "-0.045em",
                color: C.paper,
              }}
            >
              <Word at={cue("categories.w1")}>Pick</Word> <Word at={cue("categories.w2")}>your</Word>
            </div>
            <Accent
              text="vibe."
              at={cue("categories.accent")}
              color={C.yellow}
              size={220}
              underline={{ at: cue("categories.underline"), color: C.orange }}
              style={{ marginTop: -6 }}
            />
          </div>

          {/* Category panel */}
          <div
            style={{
              position: "absolute",
              left: panelX,
              top: panelY,
              width: 1130,
              height: 856,
              borderRadius: 40,
              backgroundColor: C.paper,
              boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
              translate: `${(1 - panel) * 900}px 0px`,
              opacity: interpolate(panel, [0, 0.2], [0, 1], CLAMP),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 52,
                right: 52,
                top: 34,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: F.mono,
                fontSize: 22,
                color: "rgba(0,0,0,0.55)",
              }}
            >
              <span>{"// categories"}</span>
              <span>posters · polaroids · stickers</span>
            </div>
            {TILES.map((t, i) => {
              const { x, y } = tilePos(i);
              const s = spring({ frame: frame - cue(t.id), fps, config: { damping: 11, stiffness: 170 } });
              const pressed = i === 2 ? interpolate(frame, [click - 2, click + 1, click + 7], [1, 0.95, 1.03], CLAMP) : 1;
              return (
                <div
                  key={t.label}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: tileW,
                    height: tileH,
                    borderRadius: 26,
                    backgroundColor: i === 2 && frame >= click ? C.yellow : "rgba(0,0,0,0.045)",
                    outline: t.node === null ? "4px dashed rgba(0,0,0,0.35)" : "none",
                    outlineOffset: -4,
                    scale: `${s * pressed}`,
                    rotate: `${(1 - s) * (i % 2 === 0 ? -10 : 10)}deg`,
                    opacity: interpolate(s, [0, 0.3], [0, 1], CLAMP),
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 18,
                      height: 270,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      rotate: `${(i % 2 === 0 ? -3 : 3) + wave(frame, 70, i) * 1.5}deg`,
                    }}
                  >
                    {t.node ?? (
                      <div style={{ fontFamily: F.display, fontSize: 150, lineHeight: 1, color: C.black }}>+</div>
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 20,
                      textAlign: "center",
                      fontFamily: F.display,
                      fontSize: 40,
                      letterSpacing: "0.03em",
                      color: C.black,
                    }}
                  >
                    {t.label}
                  </div>
                </div>
              );
            })}
            {/* "added" chip on the clicked tile */}
            <div
              style={{
                position: "absolute",
                left: music.x + tileW / 2,
                top: music.y - 18,
                translate: "-50% 0",
                scale: `${added}`,
                backgroundColor: C.black,
                color: C.yellow,
                fontFamily: F.mono,
                fontSize: 22,
                padding: "8px 18px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              ✓ picked
            </div>
          </div>

          <Cursor
            path={[
              { frame: cue("categories.cursor"), x: 1900, y: 1000 },
              { frame: click - 1, x: target.x, y: target.y },
            ]}
            clickAt={click}
            ringColor={C.orange}
          />
        </Camera>

        <AvatarBadge
          at={cue("categories.badge")}
          ring={C.yellow}
          face={{
            grin: interpolate(frame, [click + 2, click + 6], [0, 1], CLAMP),
            lookX: 0.8,
            lookY: interpolate(frame, [cue("categories.cursor"), click], [0.6, 0], CLAMP),
            blink: interpolate(frame, [236, 238, 241], [0, 1, 0], CLAMP),
          }}
          style={{ left: 96, top: 800 }}
        />
      </Whip>
      <PanelWipe start={wipeStart} end={wipeEnd} color={C.orange} />
      <Hud label="// 03 — categories" dark />
    </AbsoluteFill>
  );
};
