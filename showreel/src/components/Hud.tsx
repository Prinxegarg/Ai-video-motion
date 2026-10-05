import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { E, pr } from "../lib/ease";
import { bf, FPB, FPS, section, type SectionId } from "../lib/time";
import { C, F, axes } from "../theme";

const LABELS: Partial<Record<SectionId, [string, string]>> = {
  type: ["01", "Kinetic Type"],
  shape: ["02", "Shape Morph"],
  cube: ["03", "3D Space"],
  particles: ["04", "Generative"],
  fluid: ["05", "Fluid Sim"],
  data: ["06", "Data Viz"],
};

/** Burn-in style label: paper on an ink chip, legible over every background. */
const chip: React.CSSProperties = {
  position: "absolute",
  backgroundColor: C.ink,
  color: C.paper,
  padding: "9px 13px 8px",
  lineHeight: 1,
  fontSize: 17,
  letterSpacing: "0.08em",
};

const tc = (frame: number) => {
  const p = (n: number) => String(n).padStart(2, "0");
  const s = Math.floor(frame / FPS);
  return `00:00:${p(s)}:${p(frame % FPS)}`;
};

/** Résumé-style chrome over the montage: section index, timecode and an 8-bar meter. */
export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const ids = Object.keys(LABELS) as SectionId[];
  const current = ids.find((id) => {
    const s = section(id);
    return frame >= s.from && frame < s.to;
  });
  const wall = section("wall");
  const inWall = frame >= wall.from && frame < wall.to;
  if (!current && !inWall) return null;

  const label = (current ? LABELS[current] : undefined) ?? ["07", "Range"];
  const from = current ? section(current).from : wall.from;
  const enter = pr(frame, from, from + 12, E.outExpo);
  const beat = frame / FPB;
  const pulse = 1 - (beat % 1);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: F.mono }}>
      <div style={{ ...chip, left: 40, top: 34 }}>CLAUDE — MOTION REEL ’26</div>
      <div
        style={{
          ...chip,
          right: 40,
          top: 34,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ color: C.red }}>●</span> {tc(frame)}
      </div>
      {!inWall ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 34,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: C.ink,
              color: C.paper,
              padding: "9px 14px 8px",
              translate: `0px ${(1 - enter) * 110}%`,
            }}
          >
            <span
              style={{
                fontSize: 28,
                lineHeight: 1,
                fontVariationSettings: axes({ wght: 700, wdth: 112 }),
              }}
            >
              {label[0]}
            </span>
            <span
              style={{
                fontSize: 19,
                lineHeight: 1,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {label[1]}
            </span>
          </div>
        </div>
      ) : null}
      <div
        style={{
          ...chip,
          right: 40,
          bottom: 34,
          display: "flex",
          gap: 7,
          padding: "12px 13px",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const barStart = bf(i * 4);
          const barEnd = bf((i + 1) * 4);
          const fill = interpolate(frame, [barStart, barEnd], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isNow = frame >= barStart && frame < barEnd;
          return (
            <div
              key={i}
              style={{
                width: 24,
                height: 9,
                border: `2px solid ${C.paper}`,
                opacity: isNow ? 0.75 + 0.25 * pulse : 0.7,
                background: `linear-gradient(90deg, ${C.paper} ${fill * 100}%, transparent ${fill * 100}%)`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
