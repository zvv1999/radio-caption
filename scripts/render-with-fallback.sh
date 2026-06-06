#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 6 ]; then
  echo "Usage: bash scripts/render-with-fallback.sh <composition> <output.mp4> <frames> <fps> <width> <height>" >&2
  exit 1
fi

composition="$1"
output="$2"
expected_frames="$3"
fps="$4"
width="$5"
height="$6"

node_bin="/Users/cds-dn419/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
ffmpeg_bin="$(command -v ffmpeg || true)"
if [ -x /opt/homebrew/bin/ffmpeg ]; then
  ffmpeg_bin="/opt/homebrew/bin/ffmpeg"
fi

if [ -z "$ffmpeg_bin" ]; then
  echo "ffmpeg is required." >&2
  exit 1
fi

mkdir -p "$(dirname "$output")"
rm -f "$output"
run_marker="$(mktemp "${TMPDIR:-/tmp}/sanhe-render-marker.XXXXXX")"
touch "$run_marker"

echo "Rendering with Remotion: $composition"
PATH="$node_bin:$PATH" npx remotion render "$composition" "$output" \
  --concurrency=1 \
  --muted &

render_pid="$!"
tmp_root="${TMPDIR:-/tmp}"
last_matching_dir=""

find_matching_dir() {
  find "$tmp_root" -maxdepth 1 -type d -name "react-motion-render*" -newer "$run_marker" 2>/dev/null |
    while read -r dir; do
      count="$(find "$dir" -maxdepth 1 -name "element-*.jpeg" 2>/dev/null | wc -l | tr -d " ")"
      if [ "$count" = "$expected_frames" ]; then
        echo "$dir"
      fi
    done |
    tail -1
}

while kill -0 "$render_pid" 2>/dev/null; do
  matching_dir="$(find_matching_dir || true)"
  if [ -n "$matching_dir" ]; then
    last_matching_dir="$matching_dir"
    echo "All frames rendered: $last_matching_dir"
    sleep 12
    if [ -s "$output" ]; then
      echo "Remotion produced output: $output"
      wait "$render_pid" || true
      exit 0
    fi
    echo "Stopping stalled Remotion encoder and switching to system ffmpeg."
    pkill -P "$render_pid" 2>/dev/null || true
    pkill -f "remotion render $composition $output" 2>/dev/null || true
    kill -9 "$render_pid" 2>/dev/null || true
    break
  fi
  sleep 5
done

if [ -s "$output" ]; then
  echo "Output exists: $output"
  exit 0
fi

if [ -z "$last_matching_dir" ]; then
  last_matching_dir="$(find_matching_dir || true)"
fi

if [ -z "$last_matching_dir" ]; then
  echo "Could not find a complete frame directory for $expected_frames frames." >&2
  exit 1
fi

echo "Encoding from frames with system ffmpeg:"
echo "$last_matching_dir/element-%04d.jpeg -> $output"

"$ffmpeg_bin" -y \
  -framerate "$fps" \
  -start_number 0 \
  -i "$last_matching_dir/element-%04d.jpeg" \
  -s "${width}x${height}" \
  -an \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -crf 18 \
  -movflags +faststart \
  "$output"

echo "Rendered video: $output"
