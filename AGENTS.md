# AGENTS.md — Remotion motion graphics project

Instructions for AI coding agents (Claude Code, Codex, Cursor, …) working in this repo.
Videos are React components rendered frame-by-frame by **Remotion 4.0.532**
(React 19, TypeScript, Rspack bundler, npm).

Official Remotion Agent Skills are installed in `.agents/skills/` (Claude Code
sees them via the `.claude/skills/` symlinks). Load `remotion-best-practices` for
anything not covered here. Use `remotion-docs` to look up an API before
guessing. **Follow this file for project conventions.**

---

## Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Open Remotion Studio (preview) | `npm run dev` → http://localhost:3000 |
| Preview one composition | http://localhost:3000/<CompositionId> |
| List compositions | `npm run compositions` |
| New composition (scaffold + register) | `npm run new -- MyVideo [--seconds=8] [--format=vertical]` |
| Render the sample to MP4 | `npm run render` → `out/showcase.mp4` |
| Render any composition | `npx remotion render <CompositionId> out/<name>.mp4` |
| Render a still (visual check) | `npx remotion still <CompositionId> out/check.png --frame=90` |
| Render several frames as PNGs | `npx remotion render <CompositionId> out/frames --frames=0,45,90 --image-format=png` |
| Lint + typecheck | `npm run lint` |
| Add a Remotion package | `npx remotion add @remotion/<pkg>` (keeps versions in sync) |
| Upgrade Remotion | `npm run upgrade` |
| Update agent skills | `npm run skills:update` |

Studio is the preview. When a user asks you to *make* or *edit* a video, start
`npm run dev` (or `npx remotion studio --no-open`) and keep it running so they
can watch changes hot-reload. Only render an MP4 when they explicitly ask
("render", "export", "give me the MP4").

## Project structure

```
src/
  index.ts                 Entry point (registerRoot). Do not rename.
  Root.tsx                 Registers every <Composition>. Marker comments are used by `npm run new`.
  config/
    video.ts               VIDEO {width,height,fps} — single source of truth. FORMATS presets.
    theme.ts               COLORS and FONTS (Google Fonts loaded once here).
  lib/
    animation.ts           CLAMP, EASE curves, SPRING configs, progress(), springIn(), stagger(), exitProgress(), wave()
    timing.ts              toFrames(), beatsToFrames(), beatPulse(), buildTimeline()
    layout.ts              useUnit() → u(px): resolution-independent sizes
  components/              Reusable building blocks (see table below)
  compositions/
    Showcase/              Sample video: 4 scenes + transitions + music + SFX
      Showcase.tsx         <TransitionSeries> assembly, music bed, whoosh cues
      timeline.ts          Scene durations in SECONDS, transition length, MUSIC_BPM
      schema.ts            Zod schema → props editable in the Studio
      scenes/              IntroScene, ShapesScene, TypographyScene, OutroScene
public/                    Static assets — reference with staticFile("audio/x.mp3")
  audio/                   ambient-pad.mp3 (120 BPM), whoosh.wav, impact.wav (royalty-free, generated)
  images/logo.svg
scripts/
  new-composition.mjs      `npm run new` scaffolder
  generate-sample-audio.sh Regenerates public/audio with FFmpeg
out/                       Render output (git-ignored)
```

### Reusable components (`src/components`)

| Component | Use for |
| --- | --- |
| `<AnimatedText text by="word"/"char" delay stagger duration distance blur style>` | Staggered word/character reveals (rise + blur + fade) |
| `<Highlight color start duration>` | Marker sweep behind inline text |
| `<Counter to from start duration decimals prefix suffix>` | Count-up numbers (tabular figures) |
| `<DrawPath d viewBox stroke strokeWidth start duration>` | Pen-drawn SVG strokes: underlines, connectors, line art |
| `<PopIn delay rotateFrom config>` | Spring scale/rotate entrance for any children |
| `<GradientBackground accentColor secondaryColor showGrid>` | Animated light-blob backdrop with grid and vignette |

Read a component before reusing it. Extend a component or add a new one
rather than duplicating animation code across scenes.

---

## Non-negotiable Remotion rules

1. **Everything is driven by the frame.** Use `useCurrentFrame()` with
   `interpolate()` / `spring()`. CSS `transition`/`animation`, Tailwind animation
   classes, `setTimeout`, `requestAnimationFrame`, `Date.now()` and `Math.random()`
   all break rendering. For randomness use `random("seed")` from `remotion`.
2. **Author time in seconds.** `toFrames(seconds, fps)` with `fps` from
   `useVideoConfig()`. Never hard-code frame numbers that assume 30 fps.
3. **Author sizes at 1920×1080 and wrap them in `u()`** (`const u = useUnit()`),
   so every composition works at 4K, square or vertical.
4. **Clamp interpolations** (`...CLAMP`) unless you deliberately want
   extrapolation, and pick an easing from `EASE` (`EASE.out` for entrances,
   `EASE.in` for exits, `EASE.inOut` for moves, `EASE.spring` for physical motion).
5. **Use individual transform properties with string values**:
   `translate: \`0px ${y}px\``, `scale: \`${s}\``, `rotate: \`${r}deg\``. Use a
   `transform` string only for skew or perspective, or when order matters.
6. **Assets go in `public/`** and are referenced with `staticFile("path")`.
   Media: `<Audio>` / `<Video>` from `@remotion/media`; images: `<Img>` or
   `<CanvasImage>` from `remotion`. Remote URLs work too.
7. **Give timed items `premountFor={fps}`.** This covers `<Sequence>`,
   `<TransitionSeries.Sequence>`, `<Audio>`, `<Video>` and images, so they load
   before they appear.
8. **Fonts**: add them in `src/config/theme.ts` with `@remotion/google-fonts/<Font>`,
   loading only the weights you use. Never use a font you have not loaded.
9. **Install Remotion packages with `npx remotion add`.** All `@remotion/*` versions
   must be identical (currently 4.0.532).
10. **Composition registration**: keep `defaultProps` as an inline object literal
    on `<Composition>` in `Root.tsx` so Studio can save edits back. Type props with
    `type`, not `interface`. IDs may contain only letters, numbers and `-`.

---

## Changing resolution, frame rate and duration

- **Every composition:** edit `VIDEO` in `src/config/video.ts`. Durations are in
  seconds, so changing `fps` keeps timing identical; layout scales via `u()`.
- **One composition:** pass different `width` / `height` / `fps` on its
  `<Composition>` in `Root.tsx`, or spread a preset: `{...FORMATS.vertical}`.
- **Showcase length:** edit seconds in `src/compositions/Showcase/timeline.ts`.
  Total duration, transition positions and SFX cues are all derived from it.
- **At render time (resolution only):** `--width=3840 --height=2160` or `--scale=2`.
  Avoid `--fps`, which changes fps but not `durationInFrames`; change `VIDEO.fps`
  instead.

## Creating a new composition

1. `npm run new -- ProductLaunch --seconds=10`. This creates
   `src/compositions/ProductLaunch/ProductLaunch.tsx` and registers it in `Root.tsx`.
   Use `--format=vertical|square|portrait|landscape4k` for other aspect ratios.
2. Open http://localhost:3000/ProductLaunch while `npm run dev` runs.
3. Build it from scenes (below), then `npm run lint`.

Manual alternative: create a component, then add a `<Composition id component width
height fps durationInFrames defaultProps>` in `Root.tsx`, above the
`@new-compositions` marker.

## Building scenes and multi-scene videos

Follow the pattern in `src/compositions/Showcase/`:

- **One scene per file** in `scenes/`. Inside a scene, `useCurrentFrame()` starts
  at 0 where the scene begins, and `useVideoConfig().durationInFrames` is the
  scene's own length.
- Declare **cue points** at the top of the scene as named constants
  (`const titleAt = toFrames(0.45, fps)`). Reuse the same constant for every
  visual or audio event that should coincide.
- Assemble scenes with `<TransitionSeries>` from `@remotion/transitions`.
  Transitions overlap neighbouring scenes:
  `total = Σ scenes − Σ transitions`. Let `buildTimeline()` do this math and use
  `timeline.durationInFrames` for the composition and `timeline.byId.x.from`
  for absolute cue positions.
  - Presentations: `fade()`, `slide({direction})`, `wipe({direction})`, `flip()`,
    `clockWipe({width,height})`, `iris()`, imported from `@remotion/transitions/<name>`.
  - Timing: `linearTiming({durationInFrames, easing})` or `springTiming({config})`.
- Use `<Series>` for back-to-back scenes without transitions, and `<Sequence from
  durationInFrames>` to place layers freely.
- Register substantial scenes as their own compositions in a `<Folder>` (see
  `Showcase-Scenes` in `Root.tsx`), so each can be previewed alone.
- End the final scene cleanly, e.g. `opacity: exitProgress(frame, durationInFrames, toFrames(0.8, fps))`.

## Animating typography

- Staggered reveals: `<AnimatedText by="char" | "word" />`. Use `char` for short,
  punchy titles and `word` for sentences.
- Masked line reveal: wrap each line in `overflow: hidden` and slide the inner
  span up from `translate: 0 110%` (see `TypographyScene`).
- Emphasis: `<Highlight>`, color-swapped words, or animated `letterSpacing`
  (interpolate an `em` value).
- Numbers: `<Counter>` (uses `fontVariantNumeric: tabular-nums` so digits don't jitter).
- Fitting text to a box: `npx remotion add @remotion/layout-utils`, then use `fitText()` / `measureText()`.
- Keep display sizes large (`u(90)`–`u(170)` at 1080p), keep body text at least `u(32)`,
  and stay inside roughly 80px of safe margin.

## Animating graphics and shapes

- `@remotion/shapes`: `<Circle>`, `<Rect>`, `<Triangle>`, `<Star>`, `<Polygon>`, `<Ellipse>`,
  `<Pie>`, `<Heart>`, `<Arrow>`, plus `make*()` functions that return SVG path data.
- `@remotion/paths`: `evolvePath()` for line drawing (wrapped by `<DrawPath>`),
  plus `interpolatePath()` for morphing and `getLength()` / `getPointAtLength()`
  for motion along a path.
- Entrances: `<PopIn>` or `springIn()` with `SPRING.bouncy`; stagger groups with `stagger(i, step, base)`.
- Idle motion: `wave(frame, fps, periodSeconds, offset)` for floating and bobbing loops.
- Prefer SVG and CSS (gradients, `color-mix()`, masks, `filter`). Reach for
  shaders, Three.js (`@remotion/three`) or Lottie (`@remotion/lottie`) only when
  they are actually needed.

## Synchronizing audio

- **Music bed:** `<Audio src={staticFile("audio/x.mp3")} volume={(f) => …} />`.
  Shape volume with `interpolate()` for fades and ducking (see `Showcase.tsx`).
- **SFX on cues:** put `<Audio from={cue} …/>` in the same component as the
  animation it accompanies, using the same cue constant (see `IntroScene`, where
  the impact SFX and the glow share `impactAt`). If a sound peaks partway into the
  file, start it earlier by that offset (the whooshes start ~0.45 s early).
- **Transitions:** derive SFX positions from `timeline.scenes[i].from`, so they
  move automatically when durations change.
- **Beat sync:** set `MUSIC_BPM`, then drive motion with
  `beatPulse(frame + beatOffset, MUSIC_BPM, fps)`. Pass the scene's absolute start
  as `beatOffset` (`timeline.byId.x.from`) so the pulse stays locked to the music.
  `beatsToFrames()` converts bars and beats into durations.
- **Trimming and timing props on `<Audio>`:** `from`, `trimBefore`, `durationInFrames`,
  `playbackRate`, `loop`, `volume`. All values are in frames.
- **Voiceover or captions:** see the `remotion-markup/voiceover.md` and `remotion-captions` skills.
  To fit a composition to an audio file's length, use `calculateMetadata`.
- Verify sync by scrubbing in Studio and rendering the MP4. Mute all audio with
  the `soundEffects` / `musicVolume` props.

## Previewing

- `npm run dev` opens Studio. The left sidebar lists compositions, the timeline
  shows each named sequence, and the right panel edits props defined by the Zod
  schema (`schema.ts`).
- Studio hot-reloads on save. To check a frame without a browser, render a still:
  `npx remotion still Showcase out/check.png --frame=150`. Read the PNG to inspect it.
- Check several key frames before declaring visual work done: the start, the
  middle of each transition, a fully settled state per scene, and the last frame.

## Rendering

```bash
npm run render                                              # Showcase → out/showcase.mp4 (H.264)
npx remotion render <Id> out/<name>.mp4                     # any composition
npx remotion render <Id> out/<name>.mp4 --crf=16            # higher quality (lower = better; default 18)
npx remotion render <Id> out/<name>.mp4 --props='{"title":"Hello"}'   # override props (JSON or path to .json)
npx remotion render <Id> out/<name>.mp4 --frames=0-89       # partial range
npx remotion render <Id> out/<name>.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le  # transparent (no background)
npx remotion render <Id> out/<name>.webm --codec=vp9        # web
```

You can also render from Studio with the **Render** button. The first render
downloads Chrome Headless Shell automatically.

## Definition of done for agent tasks

1. `npm run lint` passes (ESLint + `tsc`).
2. Key frames have been checked (stills or Studio) for layout, overflow and legibility.
3. If an MP4 was requested, it rendered without errors and is in `out/`.
4. No hard-coded fps assumptions, no CSS animations, no unloaded fonts, and
   every asset loads via `staticFile()`.

## Troubleshooting

- **Chrome Headless Shell download fails** (offline, CI, firewalled): set
  `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell` (read by
  `remotion.config.ts`), or allow `remotion.media` on the network.
- **Fonts fail to load offline:** switch to local fonts. Put `.woff2` files in
  `public/fonts/` and use `loadFont()` from `@remotion/fonts` (`npx remotion add @remotion/fonts`).
- **`delayRender()` timeout:** an asset or font never finished loading. Check the URL and network.
- **Linux:** Chrome needs the shared libraries listed at
  https://www.remotion.dev/docs/miscellaneous/linux-dependencies.
- **Version mismatch warnings:** run `npx remotion versions`, then `npm run upgrade`.

## Licensing

Remotion is free for individuals and teams of up to 3. Larger companies need a
company license: https://www.remotion.dev/docs/license
