#!/usr/bin/env bash
set -euo pipefail

brief="${1:-inputs/briefs/saudade.json}"
output="${2:-out/generated-video.mp4}"
node_bin="/Users/cds-dn419/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"

PATH="$node_bin:$PATH" node scripts/generate-data-from-brief.mjs "$brief" src/data/generated.ts

read -r composition frames fps width height < <(
  PATH="$node_bin:$PATH" node -e '
    const fs = require("fs");
    const brief = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const composition = brief.compositionId || "GeneratedCocktailVideo";
    const frames = Math.round(brief.durationSeconds * brief.fps);
    console.log([composition, frames, brief.fps, brief.width, brief.height].join(" "));
  ' "$brief"
)

PATH="$node_bin:$PATH" npm run lint
bash scripts/render-stills.sh "$composition" "180,780,1500" "out/checks"
bash scripts/render-with-fallback.sh "$composition" "$output" "$frames" "$fps" "$width" "$height"
bash scripts/verify-video.sh "$output"
