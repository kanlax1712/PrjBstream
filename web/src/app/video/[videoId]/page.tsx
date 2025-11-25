import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EnhancedVideoPlayer } from "@/components/video/enhanced-video-player";
import { CommentList } from "@/components/video/comment-list";
import { VideoGrid } from "@/components/video/video-grid";
import { AddToPlaylistButton } from "@/components/playlists/add-to-playlist-button";
import { DeleteVideoButton } from "@/components/video/delete-video-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoDetailPage({ params }: Props) {
  const { videoId } = await params;
  const session = await auth();

  if (!videoId) {
    notFound();
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      description: true,
      videoUrl: true,
      thumbnailUrl: true,
      duration: true,
      tags: true,
      publishedAt: true,
      hasAds: true, // Include hasAds field
      channel: { 
        select: { 
          id: true, 
          name: true, 
          handle: true,
          ownerId: true,
        } 
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      qualities: {
        select: {
          quality: true,
          videoUrl: true,
        },
        where: {
          status: "ready",
        },
      },
    },
  });

  if (!video) {
    notFound();
  }

  // Check if user is subscribed to this channel
  const isSubscribed = session?.user
    ? !!(await prisma.subscription.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId: video.channel.id,
          },
        },
      }))
    : false;

  // Get user's playlists for add to playlist feature
  const userPlaylists = session?.user
    ? await prisma.playlist.findMany({
        where: { ownerId: session.user.id },
        select: { id: true, title: true },
      })
    : [];

  const suggestions = await prisma.video.findMany({
    where: { id: { not: videoId }, visibility: "PUBLIC" },
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: {
      channel: {
        select: {
          name: true,
          handle: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Check if current user is the video owner
  const isOwner = session?.user?.id === video.channel.ownerId;

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="space-y-4 sm:space-y-6">
          <EnhancedVideoPlayer
            video={video}
            session={session}
            isSubscribed={isSubscribed}
          />
          {isOwner && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 sm:rounded-3xl sm:p-4">
              <h3 className="mb-2 text-xs font-semibold sm:mb-3 sm:text-sm">Video Management</h3>
              <DeleteVideoButton videoId={videoId} videoTitle={video.title} />
            </div>
          )}
          {session?.user && userPlaylists.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 sm:rounded-3xl sm:p-4">
              <h3 className="mb-2 text-xs font-semibold sm:mb-3 sm:text-sm">Add to Playlist</h3>
              <AddToPlaylistButton videoId={videoId} playlists={userPlaylists} />
            </div>
          )}
          <CommentList
            comments={video.comments}
            videoId={videoId}
            session={session}
          />
        </div>
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base font-semibold sm:text-lg">More like this</h2>
          <VideoGrid videos={suggestions} />
        </div>
      </div>
    </AppShell>
  );
}

