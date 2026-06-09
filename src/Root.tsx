import { Composition } from "remotion";
import { MenuCocktailVideo } from "./compositions/MenuCocktailVideo";
import { generatedVideo } from "./data/generated";
import { saudadeVideo } from "./data/saudade";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
      <Composition
        id={generatedVideo.compositionId}
        component={MenuCocktailVideo}
        durationInFrames={generatedVideo.durationInFrames}
        fps={generatedVideo.fps}
        width={generatedVideo.width}
        height={generatedVideo.height}
        defaultProps={{
          data: generatedVideo,
        }}
      />
    </>
  );
};
