import { AbsoluteFill, interpolate } from "remotion";
import { Mask } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display } from "../theme";

const WORDS: [string, number][] = [
  ["CREATE", 23.0],
  ["BUILD", 23.5],
  ["REPEAT", 24.0],
];

/**
 * 23–26 s — The vision. Pure black. CREATE. BUILD. REPEAT. slam in on the beats,
 * line up as a mantra, and "JUST GETTING STARTED." pulls its tracking tight
 * under a riser. A hard blackout leaves a breath before the final hit.
 */
export const Vision: React.FC = () => {
  const { frame, at } = useScene("vision");

  const row = pr(frame, at(24.5), at(24.5) + 9, E.outExpo);
  const start = pr(frame, at(24.75), at(25.65), E.outExpo);
  const rule = pr(frame, at(25.0), at(25.6), E.inOut);
  const black = pr(frame, at(25.78), at(25.88), E.linear);
  const push = interpolate(frame, [0, at(26)], [1, 1.05]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: `${push}`, opacity: 1 - black }}>
        {/* one word at a time, slammed */}
        {WORDS.map(([w, t], i) => {
          const s = at(t);
          const e = i < WORDS.length - 1 ? at(WORDS[i + 1][1]) : at(24.5) + 5;
          if (frame < s || frame >= e) return null;
          const p = pr(frame, s, s + 6, E.outExpo);
          const out =
            i === WORDS.length - 1 ? pr(frame, at(24.5), e, E.inExpo) : 0;
          return (
            <AbsoluteFill
              key={w}
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <div
                style={{
                  ...display(270, 900),
                  scale: `${lerp(1.55, 1, p) * lerp(1, 0.4, out)}`,
                  filter: `blur(${(1 - p) * 12}px)`,
                  opacity: 1 - out,
                }}
              >
                {w}
                <span style={{ color: C.lime }}>.</span>
              </div>
            </AbsoluteFill>
          );
        })}

        {/* the mantra + the promise */}
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 34,
          }}
        >
          {WORDS.map(([w], i) => (
            <Mask
              key={w}
              p={pr(frame, at(24.5) + i * 2, at(24.5) + i * 2 + 9, E.outExpo)}
            >
              <span
                style={{
                  ...display(92, 800),
                  color: row > 0 ? C.white : "transparent",
                }}
              >
                {w}
                <span style={{ color: C.lime }}>.</span>
              </span>
            </Mask>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 0,
            right: 0,
            textAlign: "center",
            ...display(100, 800),
            letterSpacing: `${lerp(0.55, -0.02, start)}em`,
            opacity: start,
            whiteSpace: "nowrap",
          }}
        >
          JUST GETTING STARTED.
        </div>
        <div
          style={{
            position: "absolute",
            top: 700,
            left: 960 - 380 * rule,
            width: 760 * rule,
            height: 3,
            background: C.lime,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
