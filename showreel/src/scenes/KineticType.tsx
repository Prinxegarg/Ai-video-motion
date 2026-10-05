import { AbsoluteFill } from "remotion";
import { E, lerp, pr } from "../lib/ease";
import { FPB, useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const ROWS = ["MOTION", "DESIGN", "KINETIC", "RHYTHM", "TYPE"];
const REPEAT = 5;

/**
 * 01 — Kinetic type. Five full-bleed rows scroll in alternating directions while
 * every glyph rides a travelling sine wave through Roboto Flex's weight and width
 * axes. The wall pumps on the beat and the camera tilts and pushes into the cut.
 */
export const KineticType: React.FC = () => {
  const { frame, at, beat } = useBeatClock("type");
  const pump = 1 + 0.035 * Math.exp(-((beat % 1) * FPB) / 6);
  const push = pr(frame, at(2), at(3), E.inExpo);
  const whip = 1 - pr(frame, 0, 22, E.outExpo);

  return (
    <AbsoluteFill style={{ backgroundColor: C.red, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          rotate: `${lerp(-7, -3, pr(frame, 0, at(3), E.inOut)) - push * 6}deg`,
          scale: `${(1.18 + push * 0.55) * pump}`,
          transformOrigin: "42% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -600,
            top: -40,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {ROWS.map((word, r) => {
            const dir = r % 2 === 0 ? -1 : 1;
            const speed = 14 + r * 3.5;
            const x = dir * (frame * speed + whip * 900) - (dir > 0 ? 1600 : 0);
            const highlight = r === 2;
            const outline = r % 2 === 1;
            let li = 0;
            return (
              <div
                key={word}
                style={{
                  height: 230,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  translate: `${x}px 0px`,
                }}
              >
                {Array.from({ length: REPEAT }).map((_, k) => (
                  <span
                    key={k}
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    {Array.from(word).map((ch, i) => {
                      const idx = li++;
                      const phase =
                        (frame / 52) * Math.PI * 2 - idx * 0.42 - r * 0.9;
                      const wght = 560 + 440 * Math.sin(phase);
                      const wdth = 88 + 62 * Math.sin(phase + 1.1);
                      return (
                        <span
                          key={i}
                          style={{
                            fontFamily: F.flex,
                            fontSize: 250,
                            lineHeight: 0.9,
                            fontVariationSettings: axes({
                              wght,
                              wdth,
                              opsz: 144,
                            }),
                            color: highlight
                              ? C.paper
                              : outline
                                ? "transparent"
                                : C.ink,
                            WebkitTextStroke: outline
                              ? `3px ${C.ink}`
                              : undefined,
                          }}
                        >
                          {ch}
                        </span>
                      );
                    })}
                    <span
                      style={{
                        display: "inline-block",
                        width: 70,
                        height: 70,
                        margin: "0 46px",
                        borderRadius: "50%",
                        backgroundColor: highlight ? C.lime : C.ink,
                        scale: `${0.6 + 0.4 * Math.abs(Math.sin((frame / 26) * Math.PI + k))}`,
                      }}
                    />
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
