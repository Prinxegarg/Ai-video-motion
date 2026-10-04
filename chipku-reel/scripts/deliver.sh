#!/usr/bin/env bash
# Renders the reel and muxes the exact-length deliverable:
#   - video stream copied as-is (600 frames, 1920x1080, 30 fps, yuv420p, BT.709 tags)
#   - audio = the 20.000 s master WAV, AAC 256 kbps, trimmed to exactly 20 s
# Requires ffmpeg on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."
npx remotion render ChipkuReel out/chipku-reel.mp4
mkdir -p deliverables
ffmpeg -hide_banner -loglevel error -y \
  -i out/chipku-reel.mp4 -i public/audio/chipku-soundtrack.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy \
  -bsf:v "h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1" \
  -c:a aac -b:a 256k -ar 48000 -t 20 -movflags +faststart \
  deliverables/chipku-reel.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact deliverables/chipku-reel.mp4
