import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Launch palette: near-black, white, one electric accent used sparingly. */
export const C = {
  bg: "#080808",
  white: "#FFFFFF",
  lime: "#C7FF3D",
  panel: "#1A1A1A",
  line: "rgba(255,255,255,0.12)",
  dim: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.32)",
  /** Chipku's own brand colours, only inside the Chipku beat. */
  chipkuYellow: "#FFD21F",
  chipkuOrange: "#FF9A1A",
} as const;

// Self-hosted variable fonts (public/fonts, SIL OFL). loadFont() holds the render until ready.
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter.woff2"),
  weight: "100 900",
});
loadFont({
  family: "Space Grotesk",
  url: staticFile("fonts/SpaceGrotesk.woff2"),
  weight: "300 700",
});

export const F = {
  /** Inter — display and body */
  display: "'Inter', sans-serif",
  /** Space Grotesk — labels, UI chrome */
  ui: "'Space Grotesk', sans-serif",
} as const;

/** Big display type: heavy, tight, optical size maxed. */
export const display = (size: number, weight = 800): React.CSSProperties => ({
  fontFamily: F.display,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 0.92,
  letterSpacing: "-0.045em",
  fontVariationSettings: '"opsz" 32',
  fontFeatureSettings: '"tnum" 1, "ss01" 1',
  color: C.white,
});

/** Small tracked label. */
export const label = (size = 18, weight = 500): React.CSSProperties => ({
  fontFamily: F.ui,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: C.dim,
});
