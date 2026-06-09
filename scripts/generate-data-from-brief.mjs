#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || "inputs/briefs/saudade.json";
const output = process.argv[3] || "src/data/generated.ts";

const brief = JSON.parse(fs.readFileSync(input, "utf8"));

const required = [
  "id",
  "durationSeconds",
  "fps",
  "width",
  "height",
  "referenceVideo",
  "beats",
];
for (const key of required) {
  if (brief[key] === undefined) {
    throw new Error(`Missing required brief field: ${key}`);
  }
}

if (!Array.isArray(brief.beats) || brief.beats.length === 0) {
  throw new Error("Brief must contain at least one beat.");
}

for (const [index, beat] of brief.beats.entries()) {
  if (
    typeof beat.start !== "number" ||
    typeof beat.end !== "number" ||
    !beat.text
  ) {
    throw new Error(`Beat ${index} needs numeric start/end and text.`);
  }
  if (beat.end <= beat.start) {
    throw new Error(`Beat ${index} end must be greater than start.`);
  }
}

const generated = {
  id: brief.id,
  compositionId: brief.compositionId || "GeneratedCocktailVideo",
  durationInFrames: Math.round(brief.durationSeconds * brief.fps),
  fps: brief.fps,
  width: brief.width,
  height: brief.height,
  referenceVideo: brief.referenceVideo,
  backgroundVideos: resolveBackgroundVideos(brief),
  playbackRate: brief.playbackRate ?? 1,
  title: brief.title || {
    en: brief.id,
    zh: brief.id,
    ingredientLine: "",
  },
  beats: brief.beats,
};

function resolveBackgroundVideos(brief) {
  if (
    Array.isArray(brief.backgroundVideos) &&
    brief.backgroundVideos.length > 0
  ) {
    return brief.backgroundVideos;
  }

  const libraryConfig = brief.videoLibrary;
  if (!libraryConfig) {
    return undefined;
  }

  const manifestPath = libraryConfig.manifest || "inputs/assets/videos.json";
  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const requestedTags = new Set(libraryConfig.tags || []);
  const limit = libraryConfig.limit || 1;

  const scored = assets
    .map((asset) => {
      const tags = new Set(asset.tags || []);
      let score = 0;
      for (const tag of requestedTags) {
        if (tags.has(tag)) {
          score += 1;
        }
      }
      if (
        libraryConfig.orientation &&
        asset.orientation === libraryConfig.orientation
      ) {
        score += 1;
      }
      return { asset, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.asset.path).localeCompare(String(b.asset.path)),
    );

  return scored.slice(0, limit).map((entry) => entry.asset.path);
}

const contents = `import type { CocktailVideoData } from "../lib/timeline";

export const generatedVideo: CocktailVideoData = ${JSON.stringify(generated, null, 2)};
`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, contents);
console.log(`Generated ${output} from ${input}`);
console.log(
  `${generated.compositionId} ${generated.durationInFrames} ${generated.fps} ${generated.width} ${generated.height}`,
);
