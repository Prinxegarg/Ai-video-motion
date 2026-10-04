# CHIPKU — 20-second promo reel (Remotion)

A motion-graphics reel for **CHIPKU**, a brand selling posters, Polaroids and stickers. It
promotes the categories and the four bundle offers, then ends on a call to action to order from
**@chipku_shop** on Instagram.

**Deliverable:** [`deliverables/chipku-reel.mp4`](deliverables/chipku-reel.mp4)

| Spec | Value |
| --- | --- |
| Resolution / aspect | 1920 × 1080, 16:9 |
| Frame rate / length | 30 fps, **600 frames, exactly 20.000 s** (video, audio and container) |
| Video | H.264, yuv420p, BT.709 limited range, ≈4.1 Mb/s (11 MB) |
| Audio | AAC 256 kb/s, 48 kHz stereo, **−14.8 LUFS integrated, −1.4 dBTP true peak**, silent ending |

Two stills are also included: `chipku-reel-cover.png` (the end card) and `chipku-reel-offers.png` (the offers frame).

## Commands

```bash
npm install                                  # Remotion 4.0.532 + deps
pip install -r audio/requirements.txt        # numpy, scipy, pillow (+ optional pyloudnorm)

npm run assets     # rebuild logo cut-outs + paper grain from the supplied logos (brand/)
npm run audio      # synthesise music + SFX and write public/audio/chipku-soundtrack.wav
npm run dev        # Remotion Studio preview → http://localhost:3000/ChipkuReel
npm run render     # render out/chipku-reel.mp4
npm run deliver    # render + mux the exact-20.000 s deliverable (needs ffmpeg)
npm run lint       # ESLint + TypeScript
```

The reel is also registered in the **repo-root Studio**: run `npm run dev` in the repo root and
pick **Chipku → ChipkuReel** in the compositions list (`npm run render:chipku` renders it from
there). Both Studios use the same registration, `src/ChipkuReelComposition.tsx` (id, size, fps
and duration come from `src/timeline.json`). Media is imported in `src/assets.ts` rather than
loaded with `staticFile()`, so it resolves from either project.

If Remotion can't download its headless Chrome (offline or CI), set
`REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell`. `remotion.config.ts` reads it.

## Structure

```
brand/                     supplied logos (source-*.webp), clean cut-outs, palette.json
public/brand/              logo PNGs used in the video
public/audio/              chipku-soundtrack.wav: the final, frame-synced mix
public/textures/grain.png  paper grain (generated)
audio/generate_audio.py    Python music + sound-design generator
audio/sfx/  audio/stems/   every generated one-shot effect, plus music and SFX stems
audio/cue-report.json      where each effect was placed, plus loudness stats
scripts/prepare_assets.py  logo cut-outs, grain and palette extraction
scripts/deliver.sh         render + exact-length mux
src/timeline.json          ★ single source of truth for every animation and sound cue
src/offers.ts              the four offers + Instagram handle (copied verbatim from the brief)
src/theme.ts               brand palette + fonts
src/ChipkuReel.tsx         main composition (6 scenes, grain, soundtrack)
src/ChipkuReelComposition.tsx  the <Composition> registration shared by both Studios
src/assets.ts              imported media (logos, grain, soundtrack)
src/scenes/                Hook, Products, Categories, Offers, Statement, EndCard
src/components/            Avatar (mascot), ProductArt (posters, Polaroids, stickers), Type, Chrome, Transitions
src/dev/                   preview compositions for the mascot and product art
```

## Storyboard (three beats)

| Time | Scene | What happens |
| --- | --- | --- |
| 0.0–3.0 s | **Hook** (off-white) | The mascot rises in; mini Polaroid and stickers pop around it. "Make your room look like *you*." builds word by word; the mascot winks on *you*, and the dot after it grows into a yellow circle wipe. |
| 3.0–6.0 s | **Products** (yellow) | The full CHIPKU logo slaps on like a sticker, with an "aesthetic & affordable" pill. "Posters, / Polaroids / & Stickers for every *vibe*." Each word lands with its product (poster, Polaroid, die-cut sticker) while the mascot presents them. A whip-pan with motion blur leads out. |
| 6.0–9.5 s | **Categories** (black) | "Pick your *vibe*." A panel fills with SPORTS, CARS, MUSIC, MOTIVATION, TRENDING and & MORE tiles in mixed formats. A cursor clicks MUSIC ("✓ picked"), and the mascot badge reacts. An orange panel wipe leads out. |
| 9.5–14.5 s | **Bundle offers** (orange) | "Bundles that *stick*." Four cards land on the beat with price reveals: **BUY 1 GET 1 ₹69 · BUY 2 GET 3 ₹149 · BUY 3 GET 4 ₹199 · BUY 4 GET 6 ₹249**. All four hold together before a halftone dither wipe. |
| 14.5–16.0 s | **Statement** (black) | "Stick your *vibe*" / "on your walls · desk · room", with the mascot waving. The dot grows into an off-white wipe. |
| 16.0–20.0 s | **CTA end card** (off-white) | The logo slaps in and the mascot peeks from behind it. "Aesthetic, personalised & *affordable*." / **ORDER NOW ON INSTAGRAM**, then the handle **@chipku_shop** types into a pill. The cursor clicks, sparkles burst, the mascot winks, and the frame holds. |

## How the reference's motion style was adapted

The reference is a creator-tool promo. These are the techniques taken from it, re-drawn for Chipku:

| Reference technique | Chipku treatment |
| --- | --- |
| Small mono HUD: `// 01 — hook` top-left, brand and running timecode top-right | Same HUD, with section labels and a live `CHIPKU 00:00:SS:FF` timecode |
| Left-aligned grotesk headline built word by word (rise, de-blur, fade) | Bricolage Grotesque headlines, same build |
| Italic serif accent word in colour, letters cascading on a spring, hand-drawn underline | Instrument Serif Italic accents (*you*, *vibe*, *stick*, *affordable*) with spring cascade and swoosh |
| The accent word's dot grows into a full-screen colour wipe | Dot after *you* and *vibe* grows into yellow and off-white wipes |
| A colour change per section | Each section switches between brand colours: off-white → yellow → black → orange → black → off-white |
| Halftone-dithered cartoon character: large bust, then a corner badge, then peeking over the logo | Original Chipku mascot with halftone shading follows the same arc: bust, ring badge, peek |
| UI panels and cards popping in, with cursor clicks and ripples | Category panel, offer cards, cursor click ripples, "✓ picked" chip, typed Instagram handle |
| Whip-pans with motion blur, an expanding panel, a halftone dither circle into black, end card | Whip-pan (directional blur), orange panel wipe, dither wipe into the black statement, logo end card |
| Snappy expo-out and spring easing, slow camera push-ins | Same easing set (`src/lib/motion.ts`), push-ins plus punch-ins on impacts |

## Brand

* **Logos:** the two supplied files in `brand/` are used unaltered. The full logo already had
  transparency; its 253–254 alpha values (from lossy WebP) were normalised to fully opaque. The
  initial "C" logo sat on white: the white backdrop connected to the image edge was removed and the
  anti-aliased black outline was un-mixed from white. No artwork pixels were redrawn, recoloured
  or distorted, and logos are always scaled uniformly. The initial logo appears as the mascot's
  chest patch and as a die-cut sticker product.
* **Palette** (sampled from the logos, see `brand/palette.json`): yellow `#FDDC02`, orange
  `#FC9E00`, deep orange `#F87A02`, black `#000000` / `#0B0B0B`, off-white `#FAF6EC`, white
  `#FFFFFF`. No other hues are used. The mascot's skin is a warm off-white (`#FFF4DE`).
* **Type:** Bricolage Grotesque (headlines), Anton (prices and CTA), Instrument Serif Italic
  (accents) and JetBrains Mono (HUD). Bricolage and Anton load their `latin-ext` subset because
  that is where the **₹** glyph lives (checked with fontTools); prices never use the serif, which
  has no ₹.
* **Mascot:** "Chipku kid" (`src/components/Avatar.tsx`), an original SVG character drawn in the
  logo's visual language: thick black comic outlines, spiky hair echoing the logo's spikes, a
  hoodie with the logo's yellow-to-orange two-tone split, and halftone-dot shading. Blink, wink,
  grin, eye direction, brows, head tilt and the waving or presenting arm are all frame-driven.
* **Product art:** original category illustrations (basketball, car, vinyl, "DREAM BIG",
  flame) presented as wall posters with washi tape, Polaroids with handwritten captions, and
  die-cut stickers.

## Audio (generated in Python)

`audio/generate_audio.py` synthesises everything with numpy and scipy. There are no samples and
no third-party audio.

* **Music:** an original 120 BPM track in D major (I–V–vi–IV), structured around the scenes.
  A filtered pad intro rises into a drop on the logo slap at 3.0 s. The groove has kick, clap,
  hats, bass and syncopated chord stabs, with sidechain-style ducking. A drum fill leads into the
  whip, a sparkle arpeggio sits under the offers, and there's a breakdown on the black statement.
  The track returns, then a final chord on the CTA click rings out to digital silence by 19.74 s.
* **Effects:** UI ticks per word, clicks, pops (pitched upward per tile), a camera shutter for
  Polaroids, sticker slaps for logo landings, sub impacts, whooshes, bell chimes tuned to the key
  (rising notes for the four prices), sparkles and typing.
* **Sync:** every effect is placed from `src/timeline.json`, the same cue frames the scenes
  animate from. Whooshes are offset so their peak lands mid-transition. Measured on the delivered
  MP4, all 37 transient cues land within ±1 frame (≤33 ms) of their visual events.
* **Mastering:** effects sit above the music bed. Loudness is targeted to −14 LUFS, a look-ahead
  limiter is followed by a 4× oversampled true-peak check, and there's no clipping.

## Review checklist (completed)

- [x] Brand consistency: only logo-derived colours, logos unaltered and undistorted
- [x] Products and categories clear: posters, Polaroids and stickers; sports, cars, music, motivation, trending & more
- [x] Offers exact: Buy 1 Get 1 ₹69 · Buy 2 Get 3 ₹149 · Buy 3 Get 4 ₹199 · Buy 4 Get 6 ₹249 (`src/offers.ts`)
- [x] Instagram handle exact: @chipku_shop
- [x] Readability: offers on screen together for about 2 s; CTA held for about 2.5 s
- [x] Motion fidelity to the reference (table above); smooth transitions with no gaps or flashes
- [x] Mascot integrated in every scene (presenting products, reacting to clicks, waving, peeking)
- [x] Audio sync (±1 frame), no clipping, music under effects, clean silent ending
- [x] Exactly 20.000 s, 1920×1080, 30 fps
