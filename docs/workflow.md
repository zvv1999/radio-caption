# Workflow

## 1. Gather Inputs

Put files here:

- Menu PDFs: `inputs/menu`
- Reference recordings: `inputs/reference`
- Browser-readable Remotion assets: `public/reference`

Extract a PDF:

```bash
bash scripts/extract-pdf-text.sh "inputs/menu/menu.pdf" "out/menu.txt"
```

Check a reference video:

```bash
/opt/homebrew/bin/ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of default=noprint_wrappers=1 "public/reference/original-reference.mp4"
```

## 2. Build The Beat Sheet

For each drink, make:

- Opening menu card.
- Drink title card.
- 6-10 literary copy beats.
- One flavor or emotional hinge as a center card.
- Closing ingredient + price card.

Keep each caption beat short enough to read in 2.5-4 seconds.

## 3. Implement

Edit or duplicate:

- `src/data/saudade.ts`
- `src/compositions/MenuCocktailVideo.tsx`
- `src/Root.tsx`

Shared typography and motion live in:

- `src/theme/cinematic.ts`
- `src/lib/timeline.ts`

## 4. Check Stills

```bash
bash scripts/render-stills.sh MenuCocktailVideo
```

Open the generated PNG files in `out/checks`.

## 5. Export

```bash
bash scripts/render-with-fallback.sh MenuCocktailVideo out/final.mp4 1620 30 592 1280
```

If Remotion's bundled ffmpeg hangs after rendering all frames, use the newest matching `react-motion-render*` directory and system ffmpeg:

```bash
/opt/homebrew/bin/ffmpeg -y -framerate 30 -start_number 0 -i "/tmp/react-motion-renderXXXX/element-%04d.jpeg" -an -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart out/final.mp4
```

## 6. Verify

```bash
bash scripts/verify-video.sh out/final.mp4
```

The final answer should include the video path and the verified specs.
