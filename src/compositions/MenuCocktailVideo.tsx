import {
  AbsoluteFill,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { CaptionBeat, CocktailVideoData } from "../lib/timeline";
import { activeBeat, beatProgress } from "../lib/timeline";
import { clamp, colors, easeOut, fonts } from "../theme/cinematic";

type CardProps = {
  beat: CaptionBeat;
  progress: number;
};

const BackgroundVideo: React.FC<{ data: CocktailVideoData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const videos =
    data.backgroundVideos && data.backgroundVideos.length > 0
      ? data.backgroundVideos
      : [data.referenceVideo];
  const videoIndex = Math.floor(
    (frame / data.durationInFrames) * videos.length,
  );
  const activeVideo = videos[Math.min(videoIndex, videos.length - 1)];
  const drift = interpolate(
    frame,
    [0, data.durationInFrames],
    [1.035, 1.08],
    clamp,
  );

  return (
    <>
      <Video
        src={staticFile(activeVideo)}
        muted
        playbackRate={data.playbackRate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${drift})`,
          filter: "blur(10px) brightness(0.52) saturate(0.78)",
          opacity: 0.9,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.055), transparent 34%), linear-gradient(180deg, rgba(14,8,6,0.05), rgba(0,0,0,0.48))",
        }}
      />
    </>
  );
};

const CenterCard: React.FC<CardProps> = ({ beat, progress }) => {
  const opacity = interpolate(progress, [0, 0.18, 0.84, 1], [0, 1, 1, 0], {
    ...clamp,
    easing: easeOut,
  });
  const y = interpolate(progress, [0, 0.22, 1], [12, 0, -5], {
    ...clamp,
    easing: easeOut,
  });
  const isLong = beat.text.length > 18;

  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        top: 430,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
        color: colors.white,
        fontFamily: fonts.zh,
        textShadow: colors.shadow,
      }}
    >
      {beat.eyebrow ? (
        <div
          style={{
            fontFamily: fonts.en,
            fontSize: 14,
            letterSpacing: "1.1px",
            marginBottom: 12,
            opacity: 0.88,
          }}
        >
          {beat.eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontSize: isLong ? 24 : 31,
          fontWeight: 300,
          letterSpacing: isLong ? "3.8px" : "5px",
          lineHeight: 1.52,
          whiteSpace: "pre-line",
        }}
      >
        {beat.text}
      </div>
      {beat.sub ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 16,
            fontWeight: 300,
            letterSpacing: "2px",
            lineHeight: 1.35,
            opacity: 0.94,
          }}
        >
          {beat.sub}
        </div>
      ) : null}
    </div>
  );
};

const LowerLine: React.FC<CardProps> = ({ beat, progress }) => {
  const opacity = interpolate(progress, [0, 0.16, 0.82, 1], [0, 1, 1, 0], {
    ...clamp,
    easing: easeOut,
  });
  const y = interpolate(progress, [0, 0.18, 1], [9, 0, -4], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        right: 36,
        top: 650,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
      }}
    >
      <span
        style={{
          color: colors.white,
          fontFamily: fonts.zh,
          fontSize: 21,
          fontWeight: 300,
          letterSpacing: "4.2px",
          lineHeight: 1.72,
          textShadow: colors.captionShadow,
          whiteSpace: "pre-line",
        }}
      >
        {beat.text}
      </span>
    </div>
  );
};

const PriceCard: React.FC<CardProps> = ({ beat, progress }) => {
  const opacity = interpolate(progress, [0, 0.18, 0.9, 1], [0, 1, 1, 0], {
    ...clamp,
    easing: easeOut,
  });
  const y = interpolate(progress, [0, 0.2, 1], [10, 0, -3], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 500,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
        color: colors.white,
        textShadow: colors.shadow,
      }}
    >
      <div
        style={{
          fontFamily: fonts.en,
          fontSize: 15,
          letterSpacing: "0.7px",
          marginBottom: 12,
        }}
      >
        {beat.eyebrow}
      </div>
      <div
        style={{
          fontFamily: fonts.zh,
          fontSize: 20,
          fontWeight: 300,
          letterSpacing: "4px",
        }}
      >
        {beat.text}
      </div>
      <div
        style={{
          marginTop: 22,
          color: colors.red,
          fontFamily: fonts.en,
          fontSize: 72,
          fontStyle: "italic",
          lineHeight: 1,
        }}
      >
        {beat.sub}
      </div>
    </div>
  );
};

const CaptionLayer: React.FC<{ data: CocktailVideoData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const seconds = frame / data.fps;
  const beat = activeBeat(data.beats, seconds);

  if (!beat) {
    return null;
  }

  const progress = beatProgress(frame, beat, data.fps);

  if (beat.mode === "price") {
    return <PriceCard beat={beat} progress={progress} />;
  }

  if (beat.mode === "center") {
    return <CenterCard beat={beat} progress={progress} />;
  }

  return <LowerLine beat={beat} progress={progress} />;
};

export const MenuCocktailVideo: React.FC<{
  data: CocktailVideoData;
}> = ({ data }) => {
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <BackgroundVideo data={data} />
      <CaptionLayer data={data} />
    </AbsoluteFill>
  );
};
