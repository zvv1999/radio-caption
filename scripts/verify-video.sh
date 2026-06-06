#!/usr/bin/env bash
set -euo pipefail

video="${1:-out/saudade-first-video.mp4}"

if [ ! -f "$video" ]; then
  echo "Missing video: $video" >&2
  exit 1
fi

ffprobe_bin="$(command -v ffprobe || true)"
if [ -z "$ffprobe_bin" ] && [ -x /opt/homebrew/bin/ffprobe ]; then
  ffprobe_bin="/opt/homebrew/bin/ffprobe"
fi

if [ -z "$ffprobe_bin" ]; then
  echo "ffprobe is required." >&2
  exit 1
fi

"$ffprobe_bin" -v error \
  -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,duration \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 \
  "$video"
