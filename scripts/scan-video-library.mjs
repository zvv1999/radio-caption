#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const libraryDir = process.argv[2] || "public/library/videos";
const output = process.argv[3] || "inputs/assets/videos.json";
const sidecarPaths = [
  "inputs/assets/local-sources.json",
  "inputs/assets/online-sources.json",
];
const extensions = new Set([".mp4", ".mov", ".m4v", ".webm"]);

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
  const probe = probeVideo(file);
  const width = Number(probe.width || 0);
  const height = Number(probe.height || 0);
  const relativePath = toPublicPath(file);
  const sidecar = sidecarMetadata.get(relativePath);
  const tags = Array.from(
    new Set([...inferTags(file), ...(sidecar?.tags || [])].filter(Boolean)),
  );

  return {
    id: slug(path.basename(file, path.extname(file))),
    path: relativePath,
    filename: path.basename(file),
    tags,
    width,
    height,
    duration: Number(probe.duration || 0),
    orientation: height >= width ? "vertical" : "horizontal",
    sourcePath: sidecar?.sourcePath,
    sourceUrl: sidecar?.sourceUrl,
    provider: sidecar?.provider,
  };
});

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assets,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanned ${assets.length} videos into ${output}`);

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

function probeVideo(file) {
  try {
    const raw = execFileSync(
      ffprobe,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    );
    const json = JSON.parse(raw);
    return json.streams?.[0] || {};
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
    const records = Array.isArray(manifest.assets)
      ? manifest.assets
      : Array.isArray(manifest.imported)
        ? manifest.imported
        : [];

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
