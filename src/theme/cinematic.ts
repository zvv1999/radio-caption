import { Easing } from "remotion";

export const fps = 30;

export const frameSize = {
  width: 592,
  height: 1280,
};

export const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export const fonts = {
  zh: '"Songti SC", "STSong", "Noto Serif SC", "Kaiti SC", serif',
  en: '"Times New Roman", serif',
};

export const colors = {
  white: "rgba(255,255,255,0.96)",
  softWhite: "rgba(255,255,255,0.86)",
  red: "rgba(184,8,22,0.88)",
  shadow: "0 1px 3px rgba(0,0,0,0.86)",
  captionShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.75)",
};
