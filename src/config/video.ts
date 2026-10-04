/**
 * Single source of truth for the video format.
 *
 * Change these values to re-target every composition that uses `VIDEO`
 * (e.g. 3840×2160 for 4K, 1080×1920 for vertical, 60 fps for smoother motion).
 * All scene timings are authored in SECONDS and converted with the fps,
 * and all layout is authored at 1920×1080 and scaled with `useUnit()`,
 * so nothing else needs to be edited.
 *
 * Resolution can also be overridden per render without touching code
 * (layout scales automatically):
 *   npx remotion render Showcase out/4k.mp4 --width=3840 --height=2160
 *
 * To change the frame rate, edit `fps` here rather than passing `--fps`:
 * the CLI flag changes fps but not `durationInFrames`, whereas editing it here
 * recomputes every duration from seconds.
 */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Ready-made formats. Use like `<Composition {...FORMATS.vertical} />`. */
export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  landscape4k: { width: 3840, height: 2160 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

/** The resolution every layout value in this project is designed against. */
export const DESIGN_RESOLUTION = { width: 1920, height: 1080 } as const;
