import { loadFont as loadDisplayFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBodyFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Fonts are loaded once here. `loadFont()` blocks rendering until the font is
 * ready, so text never renders in a fallback font. Only load the weights you use.
 * Browse fonts: https://www.remotion.dev/docs/google-fonts
 */
const display = loadDisplayFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const body = loadBodyFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

const mono = loadMonoFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const FONTS = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
} as const;

export const COLORS = {
  background: "#07070f",
  surface: "#11121f",
  text: "#f5f5fa",
  muted: "#9a9cb8",
  accent: "#7c5cff",
  secondary: "#22d3ee",
  highlight: "#ff4d8d",
  warm: "#ffb547",
} as const;
