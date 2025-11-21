import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Radio } from "lucide-react";

export default async function LivePage() {
  const session = await auth();

  // Get live videos (videos with status that could indicate live, or recent videos)
  // For now, we'll show recent videos as "live" content
  // In a real implementation, you'd have a live status field
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const liveVideos = await prisma.video.findMany({
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

        {liveVideos.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
            <Radio className="mx-auto size-12 text-white/20 mb-4" />
            <p>No live streams or recent uploads at the moment.</p>
            <p className="mt-2 text-sm text-white/50">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-300">
                  Live Now
                </span>
              </div>
              <p className="text-sm text-white/70">
                Streams are updated in real-time. Refresh to see the latest.
              </p>
            </div>
            <VideoGrid videos={liveVideos} />
          </>
        )}
      </div>
    </AppShell>
  );
}

