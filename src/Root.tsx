import { Composition } from "remotion";
import { MenuCocktailVideo } from "./compositions/MenuCocktailVideo";
import { saudadeVideo } from "./data/saudade";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={saudadeVideo.compositionId}
      component={MenuCocktailVideo}
      durationInFrames={saudadeVideo.durationInFrames}
      fps={saudadeVideo.fps}
      width={saudadeVideo.width}
      height={saudadeVideo.height}
      defaultProps={{
        data: saudadeVideo,
      }}
    />
  );
};
