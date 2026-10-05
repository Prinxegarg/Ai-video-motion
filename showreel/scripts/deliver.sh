#!/usr/bin/env bash
# Render the reel, then mux the mastered WAV back in so the delivery file is
# exactly 15.000 s with the untouched master audio and BT.709 colour tags.
# Extra arguments go to `remotion render` (e.g. --concurrency=4).
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p out deliverables
npx remotion render ClaudeShowreel out/claude-showreel.mp4 "$@"

duration=$(node -e 'const t=require("./src/timeline.json");console.log(t.durationInFrames/t.fps)')
ffmpeg -y -v error \
  -i out/claude-showreel.mp4 -i public/audio/soundtrack.wav \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -bsf:v h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
  -c:a aac -b:a 256k -ar 48000 -t "$duration" \
  -movflags +faststart \
  deliverables/claude-showreel.mp4

ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt \
  -of compact deliverables/claude-showreel.mp4
