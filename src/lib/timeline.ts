import { interpolate } from "remotion";
import { clamp } from "../theme/cinematic";

export type CaptionMode = "center" | "lower" | "price";

export type CaptionBeat = {
  start: number;
  end: number;
  text: string;
  mode?: CaptionMode;
  eyebrow?: string;
  sub?: string;
};

export type CocktailVideoData = {
  id: string;
  compositionId: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  referenceVideo: string;
  backgroundVideos?: string[];
  playbackRate: number;
  title: {
    en: string;
    zh: string;
    ingredientLine: string;
  };
  beats: CaptionBeat[];
};

export const activeBeat = (beats: CaptionBeat[], seconds: number) =>
  beats.find((beat) => seconds >= beat.start && seconds < beat.end);

export const beatProgress = (frame: number, beat: CaptionBeat, fps: number) =>
  interpolate(frame, [beat.start * fps, beat.end * fps], [0, 1], clamp);
