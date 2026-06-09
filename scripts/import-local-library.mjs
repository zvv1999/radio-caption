#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const options = normalizeOptions(parseArgs(process.argv.slice(2)));

const sourceDir = options.source;
const outDir = options.out || "public/library/videos/local";
const manifestPath = options.manifest || "inputs/assets/local-sources.json";
const tags = splitList(options.tags || "local,original");
const orientation = options.orientation || "all";
const limit = options.limit ? Number(options.limit) : Infinity;
const dryRun = Boolean(options.dryRun);
const overwrite = Boolean(options.overwrite);
const preserveSourcePath = Boolean(options.preserveSourcePath);

const extensions = new Set([".mp4", ".mov", ".m4v", ".webm"]);
const ffmpeg = findBinary("FFMPEG", "ffmpeg");
const ffprobe = findBinary("FFPROBE", "ffprobe");

if (!sourceDir) {
  printHelp();
  process.exit(1);
}

if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
  throw new Error(`Source directory does not exist: ${sourceDir}`);
}

if (!dryRun) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
}

const files = walk(sourceDir).filter((file) =>
  extensions.has(path.extname(file).toLowerCase()),
);

const imported = [];
const skipped = [];

for (const file of files) {
  const probe = probeVideo(file);
  const width = Number(probe.width || 0);
  const height = Number(probe.height || 0);
  const duration = Number(probe.duration || probe.formatDuration || 0);
  const codec = String(probe.codec_name || "");
  const fileOrientation = height >= width ? "vertical" : "horizontal";

  if (!width || !height) {
    skipped.push(toSkippedRecord(file, "unreadable video stream"));
    continue;
  }

  if (orientation !== "all" && fileOrientation !== orientation) {
    skipped.push(toSkippedRecord(file, `orientation is ${fileOrientation}`));
    continue;
  }

  if (imported.length >= limit) {
    skipped.push(toSkippedRecord(file, "limit reached"));
    continue;
  }

  const outputName = `${slug(path.basename(file, path.extname(file)))}-${shortHash(file)}.mp4`;
  const outputPath = path.join(outDir, outputName);
  const action = codec === "h264" ? "remux" : "transcode";

  const record = {
    sourceFile: path.basename(file),
    sourcePath: preserveSourcePath ? path.resolve(file) : undefined,
    localPath: toPublicPath(outputPath),
    outputPath: outputPath.split(path.sep).join("/"),
    tags: Array.from(
      new Set([...tags, fileOrientation, codec].filter(Boolean)),
    ),
    action,
    codec,
    width,
    height,
    duration,
    orientation: fileOrientation,
  };

  if (!dryRun && (overwrite || !fs.existsSync(outputPath))) {
    convertVideo(file, outputPath, action);
  }

  imported.push(record);
}

const manifest = {
  version: 1,
  sourceName: path.basename(path.resolve(sourceDir)),
  sourcePath: preserveSourcePath ? path.resolve(sourceDir) : undefined,
  generatedAt: new Date().toISOString(),
  dryRun,
  imported,
  skipped,
};

if (!dryRun) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(
  `${dryRun ? "Would import" : "Imported"} ${imported.length} video(s) from ${sourceDir}`,
);
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} video(s)`);
}
if (!dryRun) {
  console.log(`Wrote ${manifestPath}`);
}

function convertVideo(input, output, action) {
  const common = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input,
    "-map",
    "0:v:0",
    "-an",
  ];
  const args =
    action === "remux"
      ? [...common, "-c:v", "copy", "-movflags", "+faststart", output]
      : [
          ...common,
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-crf",
          "20",
          "-preset",
          "medium",
          "-movflags",
          "+faststart",
          output,
        ];

  execFileSync(ffmpeg, args, { stdio: "inherit" });
}

function probeVideo(file) {
  const raw = execFileSync(
    ffprobe,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name,width,height,duration:format=duration",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  const json = JSON.parse(raw);
  const stream = json.streams?.[0] || {};
  return {
    ...stream,
    formatDuration: json.format?.duration,
  };
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === ".DS_Store") {
      return [];
    }
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [key, inlineValue] = arg.slice(2).split("=");
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function normalizeOptions(options) {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
      value,
    ]),
  );
}

function toSkippedRecord(file, reason) {
  return {
    sourceFile: path.basename(file),
    sourcePath: preserveSourcePath ? path.resolve(file) : undefined,
    reason,
  };
}

function splitList(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function findBinary(envName, command) {
  if (process.env[envName]) {
    return process.env[envName];
  }

  const homebrewPath = `/opt/homebrew/bin/${command}`;
  return fs.existsSync(homebrewPath) ? homebrewPath : command;
}

function toPublicPath(file) {
  const normalized = file.split(path.sep).join("/");
  return normalized.startsWith("public/")
    ? normalized.replace(/^public\//, "")
    : normalized;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

function shortHash(value) {
  return crypto
    .createHash("sha1")
    .update(path.resolve(value))
    .digest("hex")
    .slice(0, 8);
}

function printHelp() {
  console.log(`Usage:
node scripts/import-local-library.mjs --source "/path/to/videos" [options]

Options:
  --orientation all|vertical|horizontal   Default: all
  --limit 5                               Import at most N matching videos
  --tags local,bar,warm,cocktail          Tags stored in local-sources.json
  --out public/library/videos/local       Output folder
  --manifest inputs/assets/local-sources.json
  --dry-run                               Print what would be imported
  --overwrite                             Recreate existing proxy files
  --preserve-source-path                  Store absolute source paths in metadata
`);
}
