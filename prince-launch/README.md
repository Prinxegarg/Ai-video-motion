# Prince Garg: Launch Film

A 30-second personal-brand launch film, staged like a product keynote where the
product is Prince Garg. It's built in code with [Remotion](https://www.remotion.dev)
4.0.533 (React + TypeScript). The soundtrack and every sound effect are synthesised
in Python.

**Watch:** [`deliverables/prince-garg-launch.mp4`](deliverables/prince-garg-launch.mp4).
It is 1920×1080 at 30 fps, H.264 + AAC, and exactly 30.000 s long.

| Spec | Value |
| --- | --- |
| Length | 900 frames = 30.000 s = 15 bars at 120 BPM (D minor) |
| Picture | 1920×1080, 30 fps, yuv420p BT.709, motion blur on the fast moves |
| Sound | 48 kHz stereo, about −14 LUFS, true peak below −1 dBTP, no voiceover |
| Type | Inter and Space Grotesk (variable fonts, self-hosted, SIL OFL) |
| Palette | near black `#080808` · white `#FFFFFF` · electric lime `#C7FF3D` · dark grey `#1A1A1A` |

## Storyboard

At 120 BPM every scene change falls exactly on a bar downbeat.

| Time | Scene | What happens |
| --- | --- | --- |
| 0–3 s | **The hook** | A power-on line, then a counter tears from 0 to 100,000 and snaps to **100K+** on a sub hit. "AND COUNTING." follows, then the camera punches through. |
| 3–7 s | **The reveal** | The drop. **PRINCE GARG** rises out of a mask with a lime sheen. The portrait lifts out of the dark inside an orbit ring, and CREATOR. BUILDER. ENTREPRENEUR. land on the beats before a whip pan. |
| 7–12 s | **The AI creator** | **AI.BYPRINCE** flips in, then three phones rise in 3D: the profile (100K+ followers), an AI prompt that generates a lime portrait, and a reel. Topic chips float around them. |
| 12–15 s | **The entrepreneur** | **MEET CHIPKU.** The logo slaps on like a sticker, the @chipku_shop card slides up, and "YOUR WALL NEEDS US." lands. |
| 15–19 s | **The personal brand** | Three feature cards flip up on the beats: AI CREATOR · 100K+ COMMUNITY · BRAND FOUNDER. |
| 19–23 s | **The results** | A tilted glass dashboard: 100K+ followers, 10M+ views, 250K+ likes, 300K+ shares, 450K+ saves. The three interaction totals are drawn to scale. |
| 23–26 s | **The vision** | CREATE. BUILD. REPEAT. slam in on black, then "JUST GETTING STARTED." A beat of silence follows. |
| 26–30 s | **The CTA** | 731 dots fly in and lock into a dot-matrix **PRINCE GARG** wordmark. Then CREATOR × ENTREPRENEUR, "LET'S BUILD SOMETHING." and **@ai.byprince**, and a fade to black on the last beat. |

**Facts used**
- Every number on screen comes from Prince:
  - 100K+ followers on @ai.byprince.
  - 10M+ views, 250K+ likes, 300K+ shares and 450K+ saves, as totals across his content.
- No education, collaborations, revenue or website appear.
- The phone screens in scene 3 are stylised illustrations, not real posts: abstract tiles, a sample prompt, a generic reel.

## Run it

```bash
cd prince-launch
npm install
npm run dev          # Remotion Studio → http://localhost:3000, pick "PrinceGargLaunch"
```

| Task | Command |
| --- | --- |
| Preview in Studio | `npm run dev` (each scene is also under the **Scenes** folder) |
| Render the MP4 | `npm run render` → `out/prince-garg-launch.mp4` |
| Render + exact-length delivery file | `npm run deliver` → `deliverables/prince-garg-launch.mp4` (needs `ffmpeg`) |
| Regenerate the soundtrack | `npm run audio` (Python 3 with `numpy scipy pyloudnorm`) |
| Re-cut the portrait, grain and wordmark | `npm run assets -- --model selfie_multiclass_256x256.tflite` (Python with `mediapipe fonttools brotli pillow scipy`) |
| Re-download the fonts | `npm run fonts` |
| Lint + typecheck | `npm run lint` |

On an offline machine, point Remotion at a local Chrome Headless Shell with
`REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell npm run deliver`.

## How it's built

- **One cue sheet.** `src/timeline.json` holds the scene boundaries and about 60
  sound cues, all in seconds.
  - Scenes call `useScene(id).at(seconds)`.
  - `audio/generate_audio.py` places every sound at the same times and builds the
    arrangement around the scenes: an intro riser, the drop at 3 s, groove, a lift
    at 15 s, tension at 23 s, and the final hit at 26 s.
- **The portrait.**
  - `source/prince-portrait.jpg` (side profile) and `source/prince-portrait-front.jpg` (front-facing, used in the reveal and the profile avatar) are cut out with MediaPipe's selfie segmenter and
    refined with a guided filter.
  - It's graded to deep monochrome and cropped to head and shoulders.
  - Sponsor text on the jacket, the ZARA wordmark, the rink signage and the person in the background are removed, so no
    third-party logos or other people appear on screen.
- **The wordmark.** It is sampled from Inter ExtraBold onto a 13 px grid in
  `src/data/wordmark.json`, giving the Nothing-style dot matrix.
- **Determinism.** Everything is a pure function of the frame. Randomness is seeded,
  and there are no CSS animations or timers.

```
prince-launch/
  src/            Film.tsx (assembly), Root.tsx, timeline.json, theme.ts
    scenes/       Hook, Reveal, AiCreator, Chipku, Brand, Results, Vision, Cta
    components/   Phone, Hud, Backdrop, Grain, MotionBlur, ui (glass, chips, glyphs)
    lib/          time.ts (scene clock), ease.ts
    data/         wordmark.json
  audio/          generate_audio.py
  scripts/        prepare_assets.py, fetch_fonts.py, deliver.sh
  public/         fonts/, photo/prince-cutout.png, brand/ (Chipku logos), audio/, textures/
  source/         original portrait
  deliverables/   the finished MP4
```

## Licences

- Fonts: Inter and Space Grotesk, SIL Open Font License (copies in `public/fonts/`).
- Music and sound design: original, synthesised for this film.
- Remotion: free for individuals and small teams. Larger companies need a
  [company license](https://www.remotion.dev/docs/license).
