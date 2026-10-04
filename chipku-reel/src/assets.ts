/**
 * All media used by the reel, imported (not loaded via staticFile()) so the
 * bundler resolves them relative to this file. That lets the reel be previewed
 * from this project's Studio AND from the repo-root Studio, whose public/
 * folder is different.
 */
import logoFull from "../public/brand/chipku-logo-full.png";
import logoInitial from "../public/brand/chipku-logo-initial.png";
import soundtrack from "../public/audio/chipku-soundtrack.wav";
import grain from "../public/textures/grain.png";

export const ASSETS = { logoFull, logoInitial, soundtrack, grain } as const;
