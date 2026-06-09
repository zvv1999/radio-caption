#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const libraryDir = process.argv[2] || "public/library/audio";
const output = process.argv[3] || "inputs/assets/audio.json";
const sidecarPaths = ["inputs/assets/local-audio-sources.json"];
const extensions = new Set([".mp3", ".m4a", ".aac", ".wav", ".flac", ".aiff"]);

const ffprobe =
  process.env.FFPROBE ||
  (fs.existsSync("/opt/homebrew/bin/ffprobe")
    ? "/opt/homebrew/bin/ffprobe"
    : "ffprobe");

const files = walk(libraryDir).filter((file) =>
  extensions.has(path.extname(file).toLowerCase()),
);
const sidecarMetadata = loadSidecarMetadata(sidecarPaths);

const assets = files.map((file) => {
  const probe = probeAudio(file);
  const relativePath = toPublicPath(file);
  const sidecar = sidecarMetadata.get(relativePath);
  const tags = Array.from(
    new Set(
      [...inferTags(path.basename(file)), ...(sidecar?.tags || [])].filter(
        Boolean,
      ),
    ),
  );

  return {
    id: slug(path.basename(file, path.extname(file))),
    path: relativePath,
    filename: path.basename(file),
    tags,
    title: sidecar?.title || probe.tags?.title,
    artist: sidecar?.artist || probe.tags?.artist,
    album: sidecar?.album || probe.tags?.album,
    duration: Number(probe.duration || 0),
    codec: probe.codec,
    sampleRate: Number(probe.sampleRate || 0),
    channels: Number(probe.channels || 0),
  };
});

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assets,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanned ${assets.length} audio files into ${output}`);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function probeAudio(file) {
  try {
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
    const stream = json.streams?.[0] || {};
    const format = json.format || {};
    return {
      codec: stream.codec_name,
      sampleRate: stream.sample_rate,
      channels: stream.channels,
      duration: format.duration || stream.duration,
      tags: format.tags || {},
    };
  } catch {
    return {};
  }
}

function toPublicPath(file) {
  const normalized = file.split(path.sep).join("/");
  return normalized.startsWith("public/")
    ? normalized.replace(/^public\//, "")
    : normalized;
}

function inferTags(file) {
  const parts = file
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function loadSidecarMetadata(paths) {
  const metadata = new Map();

  for (const manifestPath of paths) {
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const records = Array.isArray(manifest.imported) ? manifest.imported : [];

    for (const record of records) {
      const localPath = normalizePublicPath(record.localPath || record.path);
      if (!localPath) {
        continue;
      }

      const existing = metadata.get(localPath) || {};
      metadata.set(localPath, {
        ...existing,
        ...record,
        tags: Array.from(
          new Set(
            [...(existing.tags || []), ...(record.tags || [])].filter(Boolean),
          ),
        ),
      });
    }
  }

  return metadata;
}

function normalizePublicPath(value) {
  if (!value) {
    return undefined;
  }

  return String(value)
    .replace(/^public\//, "")
    .split(path.sep)
    .join("/");
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}
