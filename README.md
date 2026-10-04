# AI Video Motion

Programmatic motion graphics with **[Remotion](https://www.remotion.dev) 4.0.532**:
videos written as React components, previewed live in Remotion Studio, and rendered to MP4.
The project is set up for AI coding agents: see [`AGENTS.md`](./AGENTS.md)
(`CLAUDE.md` imports it), plus the official Remotion Agent Skills in `.agents/skills/`.

The included **Showcase** composition (1920×1080, 30 fps, 15.7 s) demonstrates
animated typography, SVG shapes and line drawing, slide/wipe/fade transitions, a
music bed, and sound effects synced to scene changes and to the beat.

## Requirements

- Node.js (verified with Node 22) and npm
- Linux only: [Chrome's shared libraries](https://www.remotion.dev/docs/miscellaneous/linux-dependencies)
- FFmpeg is **not** required for rendering (Remotion bundles its own). It is
  only used by `npm run audio:generate`.

## Quick start

```bash
npm install          # install dependencies
npm run dev          # open Remotion Studio at http://localhost:3000
npm run render       # export the sample → out/showcase.mp4
```

## Commands

| What | Command |
| --- | --- |
| Preview all compositions (Studio) | `npm run dev` |
| Preview one composition | open `http://localhost:3000/<CompositionId>` |
| List compositions | `npm run compositions` |
| Create a new composition | `npm run new -- MyVideo` (`--seconds=10`, `--format=vertical\|square\|portrait\|landscape4k`) |
| Export the sample MP4 | `npm run render` |
| Export any composition | `npx remotion render <CompositionId> out/<name>.mp4` |
| Export a poster frame | `npm run still` |
| Higher quality / 4K | `npx remotion render Showcase out/4k.mp4 --width=3840 --height=2160 --crf=16` |
| Override props | `npx remotion render Showcase out/custom.mp4 --props='{"title":"Hello"}'` |
| Lint + typecheck | `npm run lint` |
| Add a Remotion package | `npx remotion add @remotion/<package>` |
| Upgrade Remotion | `npm run upgrade` |
| Update agent skills | `npm run skills:update` |

## Changing resolution, frame rate and duration

- **Every video:** edit `VIDEO` in [`src/config/video.ts`](./src/config/video.ts)
  (`width`, `height`, `fps`). Durations are authored in seconds and sizes are
  scaled with `useUnit()`, so nothing else needs to change.
- **One video:** set `width` / `height` / `fps` on its `<Composition>` in
  [`src/Root.tsx`](./src/Root.tsx), or spread a preset: `{...FORMATS.vertical}`.
- **Sample length:** edit the scene seconds in
  [`src/compositions/Showcase/timeline.ts`](./src/compositions/Showcase/timeline.ts).
  Total duration, transitions and SFX cues follow automatically.

## Project layout

```
src/
  index.ts / Root.tsx      entry point + composition registry
  config/                  video format (VIDEO, FORMATS) and theme (COLORS, FONTS)
  lib/                     animation (easings, springs, stagger), timing (seconds↔frames, beats), layout (useUnit)
  components/              AnimatedText, Highlight, Counter, DrawPath, PopIn, GradientBackground
  compositions/Showcase/   sample video: scenes/, timeline.ts, schema.ts, Showcase.tsx
public/                    assets for staticFile(): audio/, images/
scripts/                   new-composition.mjs, generate-sample-audio.sh
.agents/skills/            official Remotion Agent Skills (symlinked into .claude/skills/)
```

## Working with an AI agent

Start Studio in one terminal (`npm run dev`) and your agent in another (`claude`,
`codex`, …), then prompt it, for example:

- "Create a new 8-second vertical composition called LaunchTeaser with a kinetic title and a logo reveal."
- "Add a stats scene to the Showcase between Typography and Outro, with three counters and a wipe transition."
- "Sync a pulse on the shapes to the beat of a new music track in public/audio/track.mp3 at 128 BPM."
- "Render the Showcase as a 4K MP4."

## Notes

- **No Chrome download possible?** (offline or CI) Set
  `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell`. `remotion.config.ts` reads it.
- The sample sounds in `public/audio/` are synthesized by
  `scripts/generate-sample-audio.sh`, so they are royalty-free. Replace them with your own.
- Remotion licensing: free for individuals and teams of up to 3. Larger
  companies need a [company license](https://www.remotion.dev/docs/license).

## Docs

- [Remotion docs](https://www.remotion.dev/docs/) · [Fundamentals](https://www.remotion.dev/docs/the-fundamentals)
- [Agent Skills](https://www.remotion.dev/docs/ai/skills) · [Prompting videos with coding agents](https://www.remotion.dev/docs/ai/coding-agents)
- [`<TransitionSeries>`](https://www.remotion.dev/docs/transitions/transitionseries) · [Audio](https://www.remotion.dev/docs/using-audio) · [Google Fonts](https://www.remotion.dev/docs/google-fonts) · [Schemas](https://www.remotion.dev/docs/schemas)
- [CLI: render](https://www.remotion.dev/docs/cli/render) · [CLI: add](https://www.remotion.dev/docs/cli/add) · [Config file](https://www.remotion.dev/docs/config)
