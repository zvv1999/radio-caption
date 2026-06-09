# Sanhe Video Agent

This is a reusable Codex + Remotion project for making vertical, literary menu videos.

The first built-in sample is `Saudade｜萨乌达德`, based on the spring menu PDF. It preserves the current approved direction: warm blurred reference footage, white serif Chinese captions, restrained motion, and a red price accent.

## Quick Start

```bash
npm install
npm run still
npm run render:saudade
npm run verify
```

One-command generated video flow:

```bash
npm run make
```

Use the bundled Node runtime if the default system Node is too old:

```bash
PATH=/Users/cds-dn419/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run lint
```

## Project Shape

- `AGENTS.md`: the dedicated video-agent behavior and quality bar.
- `src/data`: per-drink copy and timing data.
- `inputs/briefs`: JSON briefs for one-command generation.
- `inputs/assets`: generated manifests for local素材库.
- `public/library/videos`: local background video素材库, ignored by Git.
- `public/library/audio`: local music素材库, ignored by Git.
- `src/theme`: typography, color, easing, and shared style constants.
- `src/compositions`: Remotion compositions.
- `scripts`: PDF extraction, still rendering, export fallback, verification.
- `docs`: workflow and style references.
- `public/reference`: browser-readable reference footage for Remotion.

## Adding The Next Drink

1. Duplicate `inputs/briefs/saudade.json`.
2. Replace title, beats, ingredients, duration, and price.
3. Run `bash scripts/make-video.sh inputs/briefs/your-drink.json out/your-drink.mp4`.
4. Inspect the stills in `out/checks` and the verified MP4.

Research notes from high-star Remotion and one-click video projects live in `docs/reference-projects.md`.

## Local Video Asset Library

Put footage in `public/library/videos`, then run:

```bash
npm run assets:scan
```

To connect an external folder such as your local素材库:

```bash
npm run assets:import-local -- --source "/path/to/your/videos" --orientation vertical --limit 5 --tags local,bar,warm,cocktail,original
npm run assets:scan
```

Briefs can choose clips by tags via `videoLibrary`. See `docs/asset-library.md`.

## Local Music Asset Library

To connect an external music folder:

```bash
npm run assets:import-audio -- --source "/path/to/your/music" --tags local,music,human,warm
npm run assets:scan-audio
```

The audio files are cached locally and ignored by Git. The searchable manifest is `inputs/assets/audio.json`. See `docs/audio-library.md`.

## Online Stock Videos

Pexels can be used as an online素材 source:

```bash
export PEXELS_API_KEY="..."
npm run assets:pexels -- --query "cocktail bar warm" --count 3 --orientation portrait --tags bar,warm,cocktail
```

Downloaded videos are cached into the local素材库 and ignored by Git. See `docs/online-assets.md`.
