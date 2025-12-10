import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EnhancedVideoPlayer } from "@/components/video/enhanced-video-player";
import { CommentList } from "@/components/video/comment-list";
import { VideoGrid } from "@/components/video/video-grid";
import { AddToPlaylistButton } from "@/components/playlists/add-to-playlist-button";
import { DeleteVideoButton } from "@/components/video/delete-video-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debugLog } from "@/lib/debug-log";

type Props = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoDetailPage({ params }: Props) {
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:15',message:'VideoDetailPage entry',data:{timestamp:Date.now()},hypothesisId:'A'});
  // #endregion
  const { videoId } = await params;
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:18',message:'VideoId extracted',data:{videoId:videoId||'null'},hypothesisId:'A'});
  // #endregion
  const session = await auth();
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:21',message:'Session fetched',data:{hasSession:!!session,userId:session?.user?.id||'null'},hypothesisId:'B'});
  // #endregion

  if (!videoId) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:23',message:'VideoId missing - calling notFound',data:{},hypothesisId:'A'});
    // #endregion
    notFound();
  }

  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:27',message:'Before Prisma video query',data:{videoId},hypothesisId:'A'});
  // #endregion
  let video;
  try {
    video = await prisma.video.findUnique({
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
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:68',message:'Prisma query completed',data:{videoFound:!!video,hasChannel:!!video?.channel,channelId:video?.channel?.id||'null'},hypothesisId:'A'});
  // #endregion
  } catch (error) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:71',message:'Prisma query error',data:{error:error instanceof Error?error.message:'unknown',errorName:error instanceof Error?error.name:'unknown'},hypothesisId:'A'});
    // #endregion
    throw error;
  }

  if (!video) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:78',message:'Video not found - calling notFound',data:{videoId},hypothesisId:'A'});
    // #endregion
    notFound();
  }

  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:82',message:'Before subscription check',data:{hasSession:!!session,hasUser:!!session?.user,channelId:video.channel?.id||'null'},hypothesisId:'A'});
  // #endregion
  // Check if user is subscribed to this channel
  let isSubscribed = false;
  try {
    isSubscribed = session?.user
      ? !!(await prisma.subscription.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId: video.channel.id,
          },
        },
      }))
      : false;
  } catch (error) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:90',message:'Subscription check error',data:{error:error instanceof Error?error.message:'unknown'},hypothesisId:'A'});
    // #endregion
    isSubscribed = false;
  }
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:95',message:'Before playlist query',data:{hasSession:!!session,hasUser:!!session?.user},hypothesisId:'A'});
  // #endregion
  // Get user's playlists for add to playlist feature
  let userPlaylists: Array<{ id: string; title: string }> = [];
  try {
    userPlaylists = session?.user
    ? await prisma.playlist.findMany({
        where: { ownerId: session.user.id },
        select: { id: true, title: true },
      })
      : [];
  } catch (error) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:102',message:'Playlist query error',data:{error:error instanceof Error?error.message:'unknown'},hypothesisId:'A'});
    // #endregion
    userPlaylists = [];
  }
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:107',message:'Before suggestions query',data:{videoId},hypothesisId:'A'});
  // #endregion
  let suggestions: any[] = [];
  try {
    suggestions = await prisma.video.findMany({
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
  } catch (error) {
    // #region agent log
    await debugLog({location:'video/[videoId]/page.tsx:120',message:'Suggestions query error',data:{error:error instanceof Error?error.message:'unknown'},hypothesisId:'A'});
    // #endregion
    suggestions = [];
  }
  // #region agent log
  await debugLog({location:'video/[videoId]/page.tsx:125',message:'Before render',data:{hasVideo:!!video,hasChannel:!!video?.channel,isOwner:session?.user?.id===video?.channel?.ownerId},hypothesisId:'C'});
  // #endregion
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

