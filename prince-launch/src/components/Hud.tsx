import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, pr } from "../lib/ease";
import { scene, sf, type SceneId } from "../lib/time";
import { C, F } from "../theme";

const CHAPTERS: Partial<Record<SceneId, [string, string]>> = {
  reveal: ["02", "The Reveal"],
  ai: ["03", "The AI Creator"],
  chipku: ["04", "The Entrepreneur"],
  brand: ["05", "The Personal Brand"],
  results: ["06", "The Results"],
};

const text: React.CSSProperties = {
  position: "absolute",
  fontFamily: F.ui,
  fontWeight: 500,
  fontSize: 16,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: C.faint,
};

/** Keynote-style chrome: wordmark, chapter counter, chapter name, handle. */
export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const ids = Object.keys(CHAPTERS) as SceneId[];
  const current = ids.find(
    (id) => frame >= scene(id).from && frame < scene(id).to,
  );
  if (!current) return null;
  const [num, name] = CHAPTERS[current] ?? ["", ""];
  const first = sf(4);
  const last = scene("results").to;
  const on =
    pr(frame, first, first + 12, E.outExpo) *
    (1 - pr(frame, last - 14, last - 4, E.inExpo));
  const enter = pr(
    frame,
    scene(current).from,
    scene(current).from + 10,
    E.outExpo,
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: on }}>
      <div
        style={{
          ...text,
          left: 56,
          top: 44,
          color: C.white,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            background: C.lime,
            display: "inline-block",
          }}
        />
        Prince Garg
      </div>
      <div
        style={{
          ...text,
          right: 56,
          top: 44,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ color: C.white }}>{num}</span> / 08
      </div>
      <div
        style={{
          ...text,
          left: 56,
          bottom: 42,
          overflow: "hidden",
          height: 22,
        }}
      >
        <div style={{ translate: `0px ${(1 - enter) * 100}%` }}>{name}</div>
      </div>
      <div
        style={{
          ...text,
          right: 56,
          bottom: 42,
          letterSpacing: "0.12em",
          textTransform: "none",
        }}
      >
        @ai.byprince
      </div>
    </AbsoluteFill>
  );
};
