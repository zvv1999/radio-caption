#!/usr/bin/env bash
set -euo pipefail

composition="${1:-MenuCocktailVideo}"
frames="${2:-180,780,1500}"
out_dir="${3:-out/checks}"
node_bin="/Users/cds-dn419/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"

mkdir -p "$out_dir"

IFS=',' read -ra frame_list <<< "$frames"
port=3060

for frame in "${frame_list[@]}"; do
  output="$out_dir/${composition}-${frame}.png"
  PATH="$node_bin:$PATH" npx remotion still "$composition" "$output" \
    --frame="$frame" \
    --scale=1 \
    --port="$port"
  port=$((port + 1))
done

echo "Rendered stills in $out_dir"
