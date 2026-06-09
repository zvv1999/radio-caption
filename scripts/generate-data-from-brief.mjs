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
  playbackRate: brief.playbackRate ?? 1,
  title: brief.title || {
    en: brief.id,
    zh: brief.id,
    ingredientLine: "",
  },
  beats: brief.beats,
};

const contents = `import type { CocktailVideoData } from "../lib/timeline";

export const generatedVideo: CocktailVideoData = ${JSON.stringify(generated, null, 2)};
`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, contents);
console.log(`Generated ${output} from ${input}`);
console.log(
  `${generated.compositionId} ${generated.durationInFrames} ${generated.fps} ${generated.width} ${generated.height}`,
);
