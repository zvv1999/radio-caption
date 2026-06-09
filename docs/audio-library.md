# Audio Library

The project supports a local music素材库 for background tracks.

## Folder

Imported proxy audio files live here:

```text
public/library/audio/
```

The actual audio files are ignored by Git. Only the manifests are committed.

## Import From An External Local Folder

```bash
npm run assets:import-audio -- --source "/path/to/your/music" --tags local,music,human,warm
npm run assets:scan-audio
```

The import writes Remotion-friendly files into:

```text
public/library/audio/local/
```

It also records source filenames, tags, duration, codec, artist, title, and conversion details in:

```text
inputs/assets/local-audio-sources.json
```

The scan command creates:

```text
inputs/assets/audio.json
```

Useful options:

- `--limit 20`
- `--tags local,music,warm`
- `--dry-run`
- `--overwrite`
- `--preserve-source-path`

MP3 files are copied as-is. Other supported audio formats are transcoded to MP3 for browser and Remotion compatibility.
