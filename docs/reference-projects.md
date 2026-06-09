# Reference Projects

Research date: 2026-06-09.

## Projects Checked

| Project            | Stars | Link                                              | Useful lesson                                                                                                                                                  |
| ------------------ | ----: | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remotion           | 49.5k | https://github.com/remotion-dev/remotion          | Treat videos as typed, reusable React compositions. Keep data, timing, and visual components separated.                                                        |
| MoneyPrinterTurbo  | 83.2k | https://github.com/harry0703/MoneyPrinterTurbo    | One-click flow from topic/copy to script, subtitles, music/assets, and final video. Useful pattern: Web/API style input, batch generation, render options.     |
| OpenMontage        |  4.6k | https://github.com/calesthio/OpenMontage          | Agentic production system: analyze reference video, build a plan, estimate cost/tool path, then render. Useful pattern: `AGENTS.md` plus repeatable pipelines. |
| short-video-maker  |  1.2k | https://github.com/gyoridavid/short-video-maker   | Text input becomes TTS, captions, background video, music, and Remotion render. Useful pattern: scene-based JSON and REST/MCP-style generation.                |
| react-video-editor |  1.7k | https://github.com/designcombo/react-video-editor | Timeline model, multi-track editing, preview/export separation. Useful pattern: future UI can edit beats as timeline rows.                                     |

## Capabilities Added To This Project

1. JSON brief input so a drink video can be generated without editing TypeScript by hand.
2. Generated data file at `src/data/generated.ts`.
3. One-command pipeline in `scripts/make-video.sh`.
4. Reference project notes kept in repo so future agent work has a design memory.

## Capabilities To Add Later

- Batch mode: render every JSON file in `inputs/briefs`.
- Optional voiceover and audio ducking.
- Timeline QA: detect text overlap by screenshot checks at each beat midpoint.
- Reference-video analysis: extract scene frames and build pacing notes before writing the brief.
- Simple local Web UI for editing beats and preview frames.
