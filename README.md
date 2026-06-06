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

Use the bundled Node runtime if the default system Node is too old:

```bash
PATH=/Users/cds-dn419/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run lint
```

## Project Shape

- `AGENTS.md`: the dedicated video-agent behavior and quality bar.
- `src/data`: per-drink copy and timing data.
- `src/theme`: typography, color, easing, and shared style constants.
- `src/compositions`: Remotion compositions.
- `scripts`: PDF extraction, still rendering, export fallback, verification.
- `docs`: workflow and style references.
- `public/reference`: browser-readable reference footage for Remotion.

## Adding The Next Drink

1. Extract or paste the next menu copy into `src/data`.
2. Duplicate `src/data/saudade.ts` and replace title, beats, ingredients, and price.
3. Register a new composition in `src/Root.tsx`, or reuse `MenuCocktailVideo` with swapped data.
4. Render three stills, inspect them, then export the MP4.
