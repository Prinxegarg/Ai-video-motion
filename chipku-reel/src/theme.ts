import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * CHIPKU brand palette — sampled from the supplied logos (see brand/palette.json).
 * Only these colours (and transparency of them) are used anywhere in the reel.
 */
export const C = {
  yellow: "#FDDC02", // logo top face
  orange: "#FC9E00", // logo lower face
  ember: "#F87A02", // logo deepest orange shading
  black: "#000000", // logo outline
  ink: "#0B0B0B", // near-black backgrounds
  paper: "#FAF6EC", // off-white
  white: "#FFFFFF",
} as const;

// "latin-ext" carries the ₹ glyph in Bricolage Grotesque and Anton.
const bricolage = loadBricolage("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});
const anton = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});
const serif = loadInstrumentSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export const F = {
  /** Headlines (reference: tight grotesk). */
  sans: bricolage.fontFamily,
  /** Prices, labels, CTA (reference: bold condensed caps). */
  display: anton.fontFamily,
  /** Accent words (reference: italic serif accent). No ₹ glyph — never use for prices. */
  serif: serif.fontFamily,
  /** HUD and eyebrow labels (reference: "// section" mono labels). */
  mono: mono.fontFamily,
} as const;
