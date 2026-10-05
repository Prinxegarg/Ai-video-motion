import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { decay } from "../lib/ease";
import { bf } from "../lib/time";
import timeline from "../timeline.json";

/** Camera shake driven by impact beats (strength per impact). */
export const Shake: React.FC<{
  readonly impacts: [number, number][];
  readonly children: React.ReactNode;
}> = ({ impacts, children }) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  let r = 0;
  for (const [beat, strength] of impacts) {
    const t = (frame - bf(beat)) / 60;
    if (t < 0 || t > 0.6) continue;
    const d = decay(t, 0, 7) * strength;
    x += (random(`sx${beat}${frame}`) - 0.5) * 36 * d;
    y += (random(`sy${beat}${frame}`) - 0.5) * 26 * d;
    r += (random(`sr${beat}${frame}`) - 0.5) * 1.6 * d;
  }
  return (
    <AbsoluteFill
      style={{
        translate: `${x}px ${y}px`,
        rotate: `${r}deg`,
        scale: `${1 + Math.abs(x) * 0.0006}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Short flash frames on the montage cuts. */
export const CutFlashes: React.FC = () => {
  const frame = useCurrentFrame();
  const hit = timeline.cuts.find((b) => frame >= bf(b) && frame < bf(b) + 6);
  if (hit === undefined || hit === 24) return null; // the wall pull-back is a match cut
  const t = frame - bf(hit);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        opacity: interpolate(t, [0, 1, 6], [0.9, 0.55, 0], {
          extrapolateRight: "clamp",
        }),
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};
