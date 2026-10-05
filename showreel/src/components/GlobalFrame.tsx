import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";

/**
 * The reel's true frame, published by the top-level composition. Scenes that are
 * time-remapped (e.g. tiles in the grid wall, rendered through <Freeze>) still
 * read the real frame here, so audio-reactive visuals stay locked to the soundtrack.
 */
export const GlobalFrame = createContext<number | null>(null);

export const useGlobalFrame = (fallbackOffset = 0): number => {
  const local = useCurrentFrame();
  const global = useContext(GlobalFrame);
  return global ?? local + fallbackOffset;
};
