import { AbsoluteFill, Easing } from "remotion";
import { compact, glass } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, label } from "../theme";

const countCurve = Easing.bezier(0.3, 0, 0.15, 1);

/** Interaction totals, drawn to scale against each other (real figures only). */
const SMALL = [
  { value: 250_000, name: "Likes", t: 20.0 },
  { value: 300_000, name: "Shares", t: 20.5 },
  { value: 450_000, name: "Saves", t: 21.0 },
];
const MAX = 450_000;

const Panel: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly p: number;
  readonly children: React.ReactNode;
}> = ({ x, y, w, h, p, children }) => (
  <div
    style={{
      ...glass(26),
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      opacity: p,
      translate: `0px ${(1 - p) * 60}px`,
      scale: `${lerp(0.94, 1, p)}`,
    }}
  >
    {children}
  </div>
);

/**
 * 19–23 s — The results. A tilted glass dashboard: the 100K+ follower count as
 * the hero, then views, likes, shares and saves counting up on the beats, with
 * the three interaction totals drawn to scale. Every number is one Prince gave.
 */
export const Results: React.FC = () => {
  const { frame, at } = useScene("results");

  const enter = pr(frame, 0, 11, E.outExpo);
  const rx = lerp(16, 7, pr(frame, 0, at(23), E.inOut));
  const ry = lerp(-14, -3, pr(frame, 0, at(23), E.inOut));
  const exit = pr(frame, at(22.4), at(23), E.inExpo);
  const hero = pr(frame, at(19.1), at(19.6), countCurve);
  const views = pr(frame, at(19.55), at(20.1), countCurve);
  const vp = pr(frame, at(19.5), at(19.5) + 9, E.outExpo);
  const head = pr(frame, 3, 14, E.outExpo);
  const scan = pr(frame, at(21.5), at(22.3), E.inOut);

  const W = 1640;
  return (
    <AbsoluteFill style={{ overflow: "hidden", perspective: 2200 }}>
      <div
        style={{
          position: "absolute",
          left: (1920 - W) / 2,
          top: 150,
          width: W,
          height: 800,
          transform: `translateZ(${-260 * exit}px) rotateX(${rx + exit * 30}deg) rotateY(${ry}deg) scale(${lerp(1.5, 1, enter) * lerp(1, 0.75, exit)})`,
          opacity: 1 - exit,
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: 4,
            top: 0,
            right: 4,
            display: "flex",
            justifyContent: "space-between",
            opacity: head,
          }}
        >
          <span style={{ ...label(20, 600), color: C.white }}>
            <span style={{ color: C.lime }}>■</span>&nbsp;&nbsp;Results
          </span>
          <span style={label(18, 500)}>Instagram · Totals across content</span>
        </div>

        {/* hero: followers */}
        <Panel x={0} y={56} w={640} h={700} p={enter}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 36,
              ...label(18, 600),
            }}
          >
            Instagram followers
          </div>
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 250,
              ...display(176, 900),
              color: C.lime,
              textShadow: "0 0 40px rgba(199,255,61,0.35)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {compact(100_000 * hero)}+
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: 120,
              ...display(42, 700),
              letterSpacing: "-0.01em",
            }}
          >
            @ai.byprince
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: 76,
              ...label(16, 500),
            }}
          >
            AI content brand
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              bottom: 40,
              height: 4,
              background: "#222",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width: `${hero * 100}%`,
                height: "100%",
                background: C.lime,
                borderRadius: 2,
              }}
            />
          </div>
        </Panel>

        {/* views */}
        <Panel x={676} y={56} w={964} h={330} p={vp}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 36,
              ...label(18, 600),
            }}
          >
            Views
          </div>
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 110,
              ...display(170, 900),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {compact(10_000_000 * views)}
            <span style={{ color: C.lime }}>+</span>
          </div>
          <div
            style={{
              position: "absolute",
              right: 40,
              top: 36,
              ...label(16, 500),
            }}
          >
            Total
          </div>
        </Panel>

        {/* likes / shares / saves */}
        {SMALL.map((s, i) => {
          const p = pr(frame, at(s.t), at(s.t) + 9, E.outExpo);
          const c = pr(frame, at(s.t), at(s.t) + 14, countCurve);
          const bar = pr(frame, at(21.0), at(21.6), E.outExpo);
          const x = 676 + i * 333;
          return (
            <Panel key={s.name} x={x} y={422} w={298} h={334} p={p}>
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: 30,
                  ...label(18, 600),
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 26,
                  top: 110,
                  ...display(74, 900),
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {compact(s.value * c)}
                <span style={{ color: C.lime }}>+</span>
              </div>
              {/* bar to scale: likes 250K, shares 300K, saves 450K */}
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  right: 30,
                  bottom: 44,
                  height: 10,
                  background: "#202020",
                  borderRadius: 5,
                }}
              >
                <div
                  style={{
                    width: `${(s.value / MAX) * 100 * bar}%`,
                    height: "100%",
                    background: i === 2 ? C.lime : C.white,
                    borderRadius: 5,
                  }}
                />
              </div>
            </Panel>
          );
        })}

        {/* scanning light */}
        <div
          style={{
            position: "absolute",
            top: 56,
            bottom: 44,
            left: `${lerp(-5, 102, scan)}%`,
            width: 3,
            background: `linear-gradient(180deg, transparent, ${C.lime}, transparent)`,
            boxShadow: `0 0 24px ${C.lime}`,
            opacity: scan > 0 && scan < 1 ? 0.8 : 0,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
