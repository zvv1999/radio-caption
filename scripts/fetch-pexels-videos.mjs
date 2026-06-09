#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const query = args.query || args.q || process.env.PEXELS_QUERY;
const apiKey = process.env.PEXELS_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing PEXELS_API_KEY. Get a key from https://www.pexels.com/api/ and export it locally.",
  );
}

if (!query) {
  throw new Error(
    'Usage: PEXELS_API_KEY=... node scripts/fetch-pexels-videos.mjs --query "cocktail bar" [--count 3]',
  );
}

const count = Number(args.count || 3);
const orientation = args.orientation || "portrait";
const size = args.size || "medium";
const locale = args.locale || "en-US";
const outDir = args.outDir || "public/library/videos/pexels";
const manifestPath = args.manifest || "inputs/assets/online-sources.json";
const scanAfter = args.scan !== "false";
const tags = unique([
  "pexels",
  "online",
  ...query
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean),
  ...(args.tags
    ? String(args.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : []),
]);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

const searchUrl = new URL("https://api.pexels.com/v1/videos/search");
searchUrl.searchParams.set("query", query);
searchUrl.searchParams.set("orientation", orientation);
searchUrl.searchParams.set("size", size);
searchUrl.searchParams.set("locale", locale);
searchUrl.searchParams.set("per_page", String(Math.max(count, 3)));

const response = await fetch(searchUrl, {
  headers: {
    Authorization: apiKey,
  },
});

if (!response.ok) {
  throw new Error(
    `Pexels request failed: ${response.status} ${await response.text()}`,
  );
}

const json = await response.json();
const videos = Array.isArray(json.videos) ? json.videos : [];
const selected = videos
  .map((video) => ({
    video,
    file: selectVideoFile(video.video_files || [], orientation),
  }))
  .filter((entry) => entry.file?.link)
  .slice(0, count);

const sourceManifest = readJson(manifestPath, {
  version: 1,
  provider: "pexels",
  assets: [],
});

for (const entry of selected) {
  const { video, file } = entry;
  const ext = extensionFromUrl(file.link) || ".mp4";
  const filename = `${slug(query)}-${video.id}-${file.id || file.quality || "video"}${ext}`;
  const output = path.join(outDir, filename);

  if (!fs.existsSync(output)) {
    console.log(`Downloading ${video.url}`);
    await download(file.link, output);
  } else {
    console.log(`Already exists: ${output}`);
  }

  upsertSource(sourceManifest.assets, {
    id: `pexels-${video.id}-${file.id || file.quality || "video"}`,
    provider: "pexels",
    query,
    tags,
    localPath: toPublicPath(output),
    sourceUrl: video.url,
    photographer: video.user?.name || "",
    photographerUrl: video.user?.url || "",
    width: file.width || video.width || 0,
    height: file.height || video.height || 0,
    duration: video.duration || 0,
    licenseNote: "Pexels content; follow Pexels API attribution guidelines.",
  });
}

fs.writeFileSync(manifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`);
console.log(`Updated ${manifestPath}`);

if (scanAfter) {
  execFileSync(process.execPath, ["scripts/scan-video-library.mjs"], {
    stdio: "inherit",
  });
}

function parseArgs(values) {
  const parsed = {};
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      parsed[key] =
        values[i + 1] && !values[i + 1].startsWith("--") ? values[++i] : "true";
    }
  }
  return parsed;
}

function selectVideoFile(files, orientation) {
  const oriented = files.filter((file) =>
    orientation === "portrait"
      ? Number(file.height || 0) >= Number(file.width || 0)
      : Number(file.width || 0) >= Number(file.height || 0),
  );
  const candidates = oriented.length > 0 ? oriented : files;
  return candidates
    .filter(
      (file) =>
        file.file_type === "video/mp4" ||
        String(file.link || "").includes(".mp4"),
    )
    .sort(
      (a, b) =>
        Math.abs(Number(b.height || 0) - 1280) -
        Math.abs(Number(a.height || 0) - 1280),
    )
    .at(0);
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function upsertSource(assets, asset) {
  const index = assets.findIndex((item) => item.id === asset.id);
  if (index === -1) {
    assets.push(asset);
  } else {
    assets[index] = asset;
  }
}

async function download(url, output) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(output, buffer);
}

function toPublicPath(file) {
  return file
    .split(path.sep)
    .join("/")
    .replace(/^public\//, "");
}

function extensionFromUrl(url) {
  const match = new URL(url).pathname.match(/\.[a-z0-9]+$/i);
  return match?.[0];
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(values) {
  return Array.from(new Set(values));
}
