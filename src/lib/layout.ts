import { useVideoConfig } from "remotion";
import { DESIGN_RESOLUTION } from "../config/video";

/**
 * Author every size (font sizes, offsets, strokes…) in pixels at 1920×1080 and
 * wrap it in `u()`. When the composition is rendered at another resolution
 * (4K, vertical, square), everything scales proportionally to fit.
 *
 *   const u = useUnit();
 *   <h1 style={{ fontSize: u(140), padding: u(40) }} />
 */
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  const scale = Math.min(
    width / DESIGN_RESOLUTION.width,
    height / DESIGN_RESOLUTION.height,
  );
  return (px: number) => px * scale;
};
