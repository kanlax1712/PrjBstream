import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { VideoPlayer } from "@/components/video/video-player";
import { CommentList } from "@/components/video/comment-list";
import { VideoGrid } from "@/components/video/video-grid";
import { AddToPlaylistButton } from "@/components/playlists/add-to-playlist-button";
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
    include: {
      channel: { select: { id: true, name: true, handle: true } },
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

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <VideoPlayer
            video={video}
            session={session}
            isSubscribed={isSubscribed}
          />
          {session?.user && userPlaylists.length > 0 && (
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <h3 className="mb-3 text-sm font-semibold">Add to Playlist</h3>
              <AddToPlaylistButton videoId={videoId} playlists={userPlaylists} />
            </div>
          )}
          <CommentList
            comments={video.comments}
            videoId={videoId}
            session={session}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">More like this</h2>
          <VideoGrid videos={suggestions} />
        </div>
      </div>
    </AppShell>
  );
}

