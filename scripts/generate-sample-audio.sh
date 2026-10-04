#!/usr/bin/env bash
# Regenerates the royalty-free sample sounds in public/audio/ using FFmpeg.
# They are synthesized from scratch (sine waves + filtered noise), so there are
# no licensing concerns. Replace them with your own music/SFX at any time.
#
# Usage: npm run audio:generate   (requires `ffmpeg` on your PATH)
set -euo pipefail
cd "$(dirname "$0")/../public/audio"

# 1) Ambient pad — A-minor chord, 18 s, with a 2 Hz tremolo (= 120 BPM quarter notes)
#    so visuals can pulse on the beat (see BPM in src/compositions/Showcase/timeline.ts).
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=f=110:d=18" \
  -f lavfi -i "sine=f=164.81:d=18" \
  -f lavfi -i "sine=f=220:d=18" \
  -f lavfi -i "sine=f=261.63:d=18" \
  -f lavfi -i "sine=f=329.63:d=18" \
  -f lavfi -i "sine=f=493.88:d=18" \
  -filter_complex "[0]volume=0.9[a0];[1]volume=0.6[a1];[2]volume=0.5[a2];[3]volume=0.45[a3];[4]volume=0.35[a4];[5]volume=0.15[a5];\
[a0][a1][a2][a3][a4][a5]amix=inputs=6:normalize=0,tremolo=f=2:d=0.35,lowpass=f=1400,\
aecho=0.8:0.7:120|240:0.35|0.2,afade=t=in:d=1.5,afade=t=out:st=15.5:d=2.5,volume=4,alimiter=limit=0.7,\
aformat=channel_layouts=stereo" \
  -c:a libmp3lame -b:a 128k ambient-pad.mp3

# 2) Whoosh — band-limited pink noise with a swell, used on scene transitions.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "anoisesrc=color=pink:d=0.9:a=0.6" \
  -af "highpass=f=250,lowpass=f=2600,afade=t=in:curve=exp:d=0.45,afade=t=out:st=0.45:d=0.45,volume=4.5,alimiter=limit=0.6,aformat=channel_layouts=stereo" \
  whoosh.wav

# 3) Impact — short low "thump" with a click, used when a title or logo lands.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "sine=f=70:d=0.6" \
  -f lavfi -i "anoisesrc=color=white:d=0.6:a=0.4" \
  -filter_complex "[0]afade=t=out:curve=exp:d=0.6,volume=1.4[low];[1]highpass=f=3000,afade=t=out:curve=exp:d=0.05[click];\
[low][click]amix=inputs=2:normalize=0,volume=2.6,alimiter=limit=0.8,aformat=channel_layouts=stereo" \
  impact.wav

echo "Generated: $(ls)"
