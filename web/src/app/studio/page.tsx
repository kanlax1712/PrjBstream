import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { VideoUploadForm } from "@/components/forms/video-upload-form";
import { DeleteVideoButton } from "@/components/video/delete-video-button";
import { UpdateThumbnailButton } from "@/components/video/update-thumbnail-button";
import { CreateChannelForm } from "@/components/channels/create-channel-form";
import { getSession } from "@/lib/auth-wrapper";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

// Enable caching for faster page loads
export const revalidate = 30; // Revalidate every 30 seconds

export default async function StudioPage() {
  const session = await getSession();
  // Note: Studio page is accessible even without login
  // This allows users to click "Import from YouTube" which will
  // initiate Google OAuth and automatically create a Bstream account

  // Only fetch channels/videos if user is logged in
  // Optimized queries - only select needed fields and limit results
  const [channels, videos] = session?.user?.id
    ? await Promise.all([
        prisma.channel.findMany({
          where: { ownerId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            handle: true,
            description: true,
            avatarUrl: true,
            bannerUrl: true,
            createdAt: true,
          },
        }),
        prisma.video.findMany({
          where: { channel: { ownerId: session.user.id } },
          orderBy: { publishedAt: "desc" },
          take: 50, // Limit to 50 most recent videos
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            duration: true,
            status: true,
            publishedAt: true,
            videoUrl: true,
          },
        }),
      ])
    : [[], []];

  const defaultChannel = channels[0] ?? null;

  return (
    <AppShell secure={!!session?.user}>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Creator Studio
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Welcome back, {defaultChannel?.name ?? session?.user?.name ?? "Creator"}
          </h1>
          {channels.length > 0 && (
            <div className="mt-2 text-sm text-white/60">
              {channels.length} {channels.length === 1 ? "channel" : "channels"}
            </div>
          )}
          <p className="mt-2 text-white/70">
            Plan uploads, schedule premieres, and track watch time from one
            place.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
            <span>
              {videos.length} published {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Channels</h2>
            </div>
            {channels.length > 0 ? (
              <div className="flex flex-col gap-3">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-cyan-400/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-sm text-white/60">@{channel.handle}</p>
                        {channel.description && (
                          <p className="mt-1 text-sm text-white/50">{channel.description}</p>
                        )}
                      </div>
                      <Link
                        href={`/channel/${channel.handle}`}
                        className="channel-button-ripple relative overflow-hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        <span className="relative z-10">View</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
                No channels yet. Create your first channel to get started.
              </div>
            )}
            <div className="mt-4">
              <CreateChannelForm />
            </div>
          </div>
        </div>

        {defaultChannel ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Latest releases</h2>
              <div className="flex flex-col gap-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex gap-4 rounded-3xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-cyan-400/40"
                  >
                    <Link
                      href={`/video/${video.id}`}
                      className="flex flex-1 gap-4 min-w-0"
                    >
                      <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded-xl bg-black sm:w-40">
                        <img
                          src={video.thumbnailUrl && 
                            !video.thumbnailUrl.includes("placeholder") && 
                            !video.thumbnailUrl.includes("No Thumbnail") &&
                            !video.thumbnailUrl.startsWith("data:") 
                            ? video.thumbnailUrl 
                            : "/uploads/default-thumbnail.svg"}
                          alt={video.title}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold">{video.title}</p>
                        <p className="mt-1 text-sm text-white/60 line-clamp-2">
                          {video.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                          <span>Status: {video.status.toLowerCase()}</span>
                          <span>•</span>
                          <span>{formatRelative(video.publishedAt)}</span>
                          <span>•</span>
                          <span>{(video.duration / 60).toFixed(0)} min</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-start gap-2 pt-1">
                      <UpdateThumbnailButton 
                        videoId={video.id} 
                        videoUrl={video.videoUrl}
                        currentThumbnailUrl={video.thumbnailUrl}
                      />
                      <DeleteVideoButton videoId={video.id} videoTitle={video.title} />
                    </div>
                  </div>
                ))}
                {!videos.length && (
                  <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
                    No uploads yet. Publish your first video today.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload new video</h2>
              <VideoUploadForm />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
            <div className="mx-auto max-w-md">
              <h2 className="mb-2 text-xl font-semibold">Create Your First Channel</h2>
              <p className="mb-6 text-sm text-white/70">
                You need to create a channel before you can upload videos. Your channel is your identity on Bstream.
              </p>
              <CreateChannelForm />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

