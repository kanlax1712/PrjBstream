import type { ComponentProps } from "react";
import { VideoCard } from "@/components/video/video-card";

type Props = {
  videos: VideoCardProps["video"][];
};

type VideoCardProps = ComponentProps<typeof VideoCard>;

export function VideoGrid({ videos }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

