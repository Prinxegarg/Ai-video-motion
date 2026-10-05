import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Reel palette: two neutrals + three loud accents. */
export const C = {
  ink: "#0C0C0E",
  paper: "#F1EEE6",
  red: "#FF4423",
  blue: "#2E3BFF",
  lime: "#D8FF3C",
} as const;

// Self-hosted variable fonts (public/fonts, SIL OFL). loadFont() holds the render until ready.
loadFont({
  family: "Roboto Flex",
  url: staticFile("fonts/RobotoFlex.woff2"),
  weight: "100 1000",
  stretch: "25% 151%",
});
loadFont({
  family: "Fraunces",
  url: staticFile("fonts/Fraunces.woff2"),
  weight: "100 900",
});
loadFont({
  family: "Fraunces",
  url: staticFile("fonts/Fraunces-Italic.woff2"),
  weight: "100 900",
  style: "italic",
});
loadFont({
  family: "Martian Mono",
  url: staticFile("fonts/MartianMono.woff2"),
  weight: "100 800",
  stretch: "75% 112.5%",
});

export const F = {
  /** Roboto Flex — animate with axes() */
  flex: "'Roboto Flex', sans-serif",
  /** Fraunces — expressive serif, SOFT/WONK axes */
  serif: "'Fraunces', serif",
  /** Martian Mono — labels */
  mono: "'Martian Mono', monospace",
} as const;

/** CSS font-variation-settings from axis values. */
export const axes = (a: Record<string, number>): string =>
  Object.entries(a)
    .map(([k, v]) => `"${k}" ${v.toFixed(1)}`)
    .join(", ");
