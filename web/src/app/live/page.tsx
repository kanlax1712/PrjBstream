import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Radio } from "lucide-react";

export default async function LivePage() {
  const session = await auth();

  // Get actual live streams from database
  const liveStreams = await prisma.liveStream.findMany({
    where: {
      status: {
        in: ["STARTING", "LIVE"],
      },
      visibility: "PUBLIC",
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 50,
  });

  // Also get recent videos as fallback
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const recentVideos = await prisma.video.findMany({
    where: {
      visibility: "PUBLIC",
      status: "READY",
      publishedAt: {
        gte: twentyFourHoursAgo,
      },
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Radio className="size-6 text-red-500" />
              Live & Recent
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Watch the latest uploads and live streams
            </p>
          </div>
          {session?.user && (
            <Link
              href="/go-live"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Go Live
            </Link>
          )}
        </div>

        {liveStreams.length === 0 && recentVideos.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
            <Radio className="mx-auto size-12 text-white/20 mb-4" />
            <p>No live streams or recent uploads at the moment.</p>
            <p className="mt-2 text-sm text-white/50">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <>
            {liveStreams.length > 0 && (
              <>
                <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-semibold text-red-300">
                      Live Now ({liveStreams.length})
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    Streams are updated in real-time. Refresh to see the latest.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {liveStreams.map((stream) => (
                    <Link
                      key={stream.id}
                      href={stream.shareUrl}
                      className="group relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition hover:border-white/10"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                        <Radio className="size-12 text-red-500" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-semibold text-red-300">LIVE</span>
                          <span className="text-xs text-white/60">
                            {stream.viewerCount} viewers
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white line-clamp-2">
                          {stream.title}
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                          {stream.channel.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            
            {recentVideos.length > 0 && (
              <>
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
                  <VideoGrid videos={recentVideos} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

