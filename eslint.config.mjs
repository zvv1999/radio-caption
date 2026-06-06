import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    rules: {
      "@remotion/no-object-fit-on-media-video": "off",
    },
  },
];
