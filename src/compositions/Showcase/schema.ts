import { zColor } from "@remotion/zod-types";
import { z } from "zod";

/**
 * Props of the Showcase composition. Because the composition registers this
 * schema, every field is editable in the Studio's "Props" panel, and can be
 * overridden at render time with `--props='{"title":"Hi"}'`.
 */
export const showcaseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  tagline: z.string(),
  cta: z.string(),
  accentColor: zColor(),
  secondaryColor: zColor(),
  highlightColor: zColor(),
  musicVolume: z.number().min(0).max(1),
  soundEffects: z.boolean(),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;
