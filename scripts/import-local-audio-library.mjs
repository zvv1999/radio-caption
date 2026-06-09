#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const options = normalizeOptions(parseArgs(process.argv.slice(2)));

const sourceDir = options.source;
const outDir = options.out || "public/library/audio/local";
const manifestPath =
  options.manifest || "inputs/assets/local-audio-sources.json";
const tags = splitList(options.tags || "local,music");
const limit = options.limit ? Number(options.limit) : Infinity;
const dryRun = Boolean(options.dryRun);
const overwrite = Boolean(options.overwrite);
const preserveSourcePath = Boolean(options.preserveSourcePath);

const extensions = new Set([".mp3", ".m4a", ".aac", ".wav", ".flac", ".aiff"]);
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
  if (imported.length >= limit) {
    skipped.push(toSkippedRecord(file, "limit reached"));
    continue;
  }

  const probe = probeAudio(file);
  const codec = String(probe.stream.codec_name || "");
  const duration = Number(probe.format.duration || probe.stream.duration || 0);
  const sampleRate = Number(probe.stream.sample_rate || 0);
  const channels = Number(probe.stream.channels || 0);

  if (!codec || !duration) {
    skipped.push(toSkippedRecord(file, "unreadable audio stream"));
    continue;
  }

  const outputName = `${slug(path.basename(file, path.extname(file)))}-${shortHash(file)}.mp3`;
  const outputPath = path.join(outDir, outputName);
  const action =
    path.extname(file).toLowerCase() === ".mp3" ? "copy" : "transcode";
  const parsedName = parseTrackName(path.basename(file, path.extname(file)));
  const metadata = {
    title: probe.format.tags?.title || parsedName.title,
    artist: probe.format.tags?.artist || parsedName.artist,
    album: probe.format.tags?.album,
  };

  const record = {
    sourceFile: path.basename(file),
    sourcePath: preserveSourcePath ? path.resolve(file) : undefined,
    localPath: toPublicPath(outputPath),
    outputPath: outputPath.split(path.sep).join("/"),
    tags: Array.from(
      new Set(
        [...tags, codec, ...inferTags(path.basename(file))].filter(Boolean),
      ),
    ),
    action,
    codec,
    duration,
    sampleRate,
    channels,
    ...metadata,
  };

  if (!dryRun && (overwrite || !fs.existsSync(outputPath))) {
    convertAudio(file, outputPath, action);
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
  `${dryRun ? "Would import" : "Imported"} ${imported.length} audio file(s) from ${sourceDir}`,
);
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} file(s)`);
}
if (!dryRun) {
  console.log(`Wrote ${manifestPath}`);
}

function convertAudio(input, output, action) {
  if (action === "copy") {
    fs.copyFileSync(input, output);
    return;
  }

  execFileSync(
    ffmpeg,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "192k",
      output,
    ],
    { stdio: "inherit" },
  );
}

function probeAudio(file) {
  const raw = execFileSync(
    ffprobe,
    [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  const json = JSON.parse(raw);
  return {
    stream: json.streams?.[0] || {},
    format: json.format || {},
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

function inferTags(file) {
  const parts = file
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function parseTrackName(value) {
  const parts = value.split(/\s+-\s+/);
  if (parts.length < 2) {
    return { title: value };
  }

  return {
    artist: parts[0],
    title: parts.slice(1).join(" - "),
  };
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
node scripts/import-local-audio-library.mjs --source "/path/to/audio" [options]

Options:
  --limit 20                              Import at most N audio files
  --tags local,music,warm                 Tags stored in local-audio-sources.json
  --out public/library/audio/local        Output folder
  --manifest inputs/assets/local-audio-sources.json
  --dry-run                               Print what would be imported
  --overwrite                             Recreate existing proxy files
  --preserve-source-path                  Store absolute source paths in metadata
`);
}
