# Style Guide

## Approved Look

The approved direction is close to the original recording's subtitle language:

- Thin white Chinese serif text.
- Small English serif labels.
- Centered title cards.
- Bottom or mid-lower literary caption lines.
- Very slow fades and subtle vertical movement.
- Background is the reference video, softened into atmosphere.
- Price may use deep red italic serif.

## Typography

Chinese stack:

```text
"Songti SC", "STSong", "Noto Serif SC", "Kaiti SC", serif
```

English stack:

```text
"Times New Roman", serif
```

Use generous line-height and small tracking. Avoid huge hero type unless it is the drink name or price.

## Layout

- Title card: around 430-600px from top in a 592x1280 frame.
- Caption line: around 650px from top.
- Price card: around 500px from top.
- Keep text centered and narrow.
- Prefer one or two lines per beat.

## Motion

All motion must be frame-driven in Remotion:

- Use `useCurrentFrame()`.
- Use `interpolate()` with clamp.
- Use `Easing.bezier(0.16, 1, 0.3, 1)`.
- No CSS transitions.
- No CSS keyframes.

## Things To Avoid

- Tech grids, HUDs, neon strokes, scanning lines.
- Interface panels, dashboards, cards inside cards.
- Overly sharp background video.
- Dense paragraphs on screen.
- Any text overlap.
