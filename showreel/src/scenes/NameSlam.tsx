import { AbsoluteFill, interpolate, random } from "remotion";
import { E, lerp, pr } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const NAME = Array.from("CLAUDE");

type Fill = "solid" | "outline" | "red" | "stripes" | "lime";
const STYLES: Fill[] = ["solid", "outline", "red", "stripes", "lime"];

const fillStyle = (f: Fill): React.CSSProperties => {
  switch (f) {
    case "outline":
      return { color: "transparent", WebkitTextStroke: `4px ${C.paper}` };
    case "red":
      return { color: C.red };
    case "lime":
      return { color: C.lime };
    case "stripes":
      return {
        color: "transparent",
        background: `repeating-linear-gradient(-45deg, ${C.paper} 0 10px, transparent 10px 20px)`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      };
    default:
      return { color: C.paper };
  }
};

/**
 * Bar 2 — the drop. CLAUDE slams in letter by letter, flexes through the
 * variable-font design space (extended black → condensed hairline → back),
 * cycles fill styles in a diagonal cascade on 8th notes, then explodes.
 */
export const NameSlam: React.FC = () => {
  const { frame, at } = useBeatClock("slam");

  // Variable-font journey per letter (lagged): extended black → condensed hairline → black.
  const flexAt = (lag: number) => {
    const f1 = pr(frame, at(1) + lag, at(1.75) + lag, E.inOutExpo);
    const f2 = pr(frame, at(1.75) + lag, at(2.25) + lag, E.outExpo);
    return {
      f1,
      f2,
      wght: lerp(lerp(1000, 110, f1), 900, f2),
      wdth: lerp(lerp(151, 25, f1), 100, f2),
    };
  };
  const lead = flexAt(0);

  const shock = pr(frame, 0, 26, E.outExpo);
  const explode = pr(frame, at(3.25), at(4), E.inExpo);
  const glitch = frame >= at(3.75) ? 1 : 0;
  const styleStep =
    frame >= at(2) && frame < at(3.25)
      ? Math.floor((frame - at(2)) / (at(0.5) - at(0))) + 1
      : 0;

  const sub =
    pr(frame, at(1), at(1.6), E.outExpo) *
    (1 - pr(frame, at(3.2), at(3.6), E.inExpo));
  const tag = pr(frame, 4, 18, E.outExpo) * (1 - explode);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      {/* impact flash + shockwave */}
      <AbsoluteFill
        style={{
          backgroundColor: C.red,
          opacity: interpolate(frame, [0, 3, 8], [1, 0.9, 0], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `${lerp(40, 2, shock)}px solid ${C.red}`,
            scale: `${lerp(0.2, 5.5, shock)}`,
            opacity: 1 - shock,
          }}
        />
      </AbsoluteFill>

      {/* name */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          translate: "0px -40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {NAME.map((ch, i) => {
            const land = pr(frame, i * 2, i * 2 + 13, E.outExpo);
            const squash = interpolate(
              frame - i * 2,
              [11, 14, 18, 24],
              [1, 0.86, 1.05, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const { f1, f2, wght, wdth } = flexAt(i * 1.2);
            const style =
              styleStep > 0 ? STYLES[(styleStep + i) % STYLES.length] : "solid";
            const dir = i - 2.5;
            const rx = random(`ex${i}`) - 0.5;
            const ry = random(`ey${i}`) - 0.5;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: F.flex,
                  fontSize: 300,
                  lineHeight: 1,
                  letterSpacing: `${lerp(0, 0.06, f1 * (1 - f2))}em`,
                  fontVariationSettings: axes({ wght, wdth, opsz: 144 }),
                  ...fillStyle(style),
                  opacity:
                    interpolate(land, [0, 0.25], [0, 1], {
                      extrapolateRight: "clamp",
                    }) *
                    (1 - explode * 0.9),
                  scale: `${lerp(3.2, 1, land) * (1 + explode * 1.8)} ${lerp(3.2, 1, land) * squash * (1 + explode * 1.8)}`,
                  filter: `blur(${(1 - land) * 18 + explode * 14}px)`,
                  translate: `${dir * explode * 520 + rx * explode * 300}px ${ry * explode * 700}px`,
                  rotate: `${rx * explode * 120}deg`,
                  textShadow: glitch
                    ? `-${8 + (frame % 3) * 6}px 0 ${C.red}, ${8 + (frame % 2) * 8}px 0 ${C.blue}`
                    : undefined,
                  transformOrigin: "50% 60%",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* subtitle */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          translate: "0px 170px",
        }}
      >
        <div style={{ overflow: "hidden", padding: "6px 10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 26,
              translate: `0px ${(1 - sub) * 120}%`,
            }}
          >
            <span
              style={{
                fontFamily: F.serif,
                fontStyle: "italic",
                fontSize: 88,
                color: C.red,
                fontVariationSettings: axes({
                  wght: 380,
                  SOFT: 100,
                  WONK: 1,
                  opsz: 144,
                }),
              }}
            >
              Motion
            </span>
            <span
              style={{
                fontFamily: F.flex,
                fontSize: 62,
                letterSpacing: "0.28em",
                color: C.paper,
                fontVariationSettings: axes({ wght: 640, wdth: 151 }),
              }}
            >
              DESIGNER
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* tag line */}
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 40,
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: "0.1em",
          color: C.paper,
          opacity: tag * 0.8,
          translate: `${(1 - tag) * -30}px 0px`,
        }}
      >
        SHOWREEL ’26 / PORTFOLIO
      </div>
      <div
        style={{
          position: "absolute",
          right: 48,
          top: 40,
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: "0.1em",
          color: C.paper,
          opacity: tag * 0.8,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "pre",
        }}
      >
        {`WGHT ${String(Math.round(lead.wght)).padStart(4, " ")} · WDTH ${String(Math.round(lead.wdth)).padStart(3, " ")}`}
      </div>
    </AbsoluteFill>
  );
};
