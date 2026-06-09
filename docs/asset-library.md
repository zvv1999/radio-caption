# Asset Library

The project supports a local video素材库 for reusable background footage.

## Folder

Put local videos here:

```text
public/library/videos/
```

The actual footage is ignored by Git. Only the manifest is committed.

## Scan

```bash
npm run assets:scan
```

This creates:

```text
inputs/assets/videos.json
```

Each asset includes:

- `path`: Remotion `staticFile()` path
- `tags`: inferred from file and folder names
- `width`, `height`, `duration`
- `orientation`: `vertical` or `horizontal`

## Use In A Brief

Use explicit videos:

```json
{
  "backgroundVideos": ["library/videos/bar/warm-bar-01.mp4"]
}
```

Or select from the manifest:

```json
{
  "videoLibrary": {
    "manifest": "inputs/assets/videos.json",
    "tags": ["bar", "warm"],
    "orientation": "vertical",
    "limit": 2
  }
}
```

If no asset matches, the generator falls back to `referenceVideo`.

## Naming Tips

File and folder names become searchable tags. Good names:

```text
public/library/videos/bar/warm-hand-pour-01.mp4
public/library/videos/cocktail/hawthorn-red-closeup-01.mp4
public/library/videos/ambient/night-table-candle-01.mp4
```

For this project, useful tags include:

- `bar`
- `cocktail`
- `pour`
- `glass`
- `menu`
- `warm`
- `night`
- `hand`
- `closeup`
- `red`
- `green`
