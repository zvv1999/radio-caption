# Online Asset Sources

The project can pull online stock videos into the local素材库, then render from local files.

## Pexels

Pexels video search uses:

```text
GET https://api.pexels.com/v1/videos/search
```

The API key is sent as an `Authorization` header. Keep it local:

```bash
export PEXELS_API_KEY="..."
```

Fetch and cache videos:

```bash
npm run assets:pexels -- --query "cocktail bar warm" --count 3 --orientation portrait --tags bar,warm,cocktail
```

This will:

1. Search Pexels.
2. Download MP4 files into `public/library/videos/pexels`.
3. Record attribution/source metadata in `inputs/assets/online-sources.json`.
4. Rebuild `inputs/assets/videos.json` with `npm run assets:scan`.

Actual downloaded videos are ignored by Git.

## Brief Usage

Once downloaded and scanned, use the same local素材库 selector:

```json
{
  "videoLibrary": {
    "manifest": "inputs/assets/videos.json",
    "tags": ["pexels", "cocktail", "bar"],
    "orientation": "vertical",
    "limit": 2
  }
}
```

## Attribution

Pexels asks API users to show a prominent Pexels link and credit creators when possible.
For generated social videos, keep source records in `inputs/assets/online-sources.json`; add visible credit only when the final publishing context requires it.

## Pixabay Later

Pixabay also supports video search at:

```text
GET https://pixabay.com/api/videos/
```

It is not wired yet, but the provider shape can mirror the Pexels script.
