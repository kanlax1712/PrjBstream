"use client";

import { useEffect } from "react";
import { formatDuration, formatRelative } from "@/lib/format";
import { SubscribeButton } from "@/components/video/subscribe-button";
import type { Session } from "next-auth";

type Props = {
  video: {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    duration: number;
    tags: string;
    publishedAt: Date;
    channel: {
      id: string;
      name: string;
      handle: string;
    };
  };
  session: Session | null;
  isSubscribed: boolean;
};

export function VideoPlayer({ video, session, isSubscribed }: Props) {
  // Track view when video starts playing
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    // Track view after a short delay (user is actually watching)
    const timer = setTimeout(trackView, 5000);
    return () => clearTimeout(timer);
  }, [video.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/5 bg-black">
        <video src={video.videoUrl} controls className="size-full" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{video.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
          <span>By {video.channel.name}</span>
          <span>•</span>
          <span>{formatRelative(video.publishedAt)}</span>
          <span>•</span>
          <span>{formatDuration(video.duration)}</span>
          {session?.user && (
            <>
              <span>•</span>
              <SubscribeButton
                channelId={video.channel.id}
                channelHandle={video.channel.handle}
                isSubscribed={isSubscribed}
              />
            </>
          )}
        </div>
        <p className="mt-3 text-white/70">{video.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-cyan-200">
          {video.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-500/30 px-2 py-1"
              >
                #{tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

