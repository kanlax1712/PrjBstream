import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/format";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const channel = await prisma.channel.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!channel) {
    return (
      <AppShell secure>
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
          Create a channel to view analytics.
        </div>
      </AppShell>
    );
  }

  // Get all videos from this channel
  const videos = await prisma.video.findMany({
    where: { channelId: channel.id },
    include: {
      _count: {
        select: {
          views: true,
          comments: true,
        },
      },
    },
  });

  // Calculate total stats
  const totalViews = videos.reduce((sum, v) => sum + v._count.views, 0);
  const totalComments = videos.reduce((sum, v) => sum + v._count.comments, 0);
  const totalWatchTime = videos.reduce((sum, v) => sum + (v.duration * v._count.views), 0);
  const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;

  // Get view events for chart data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentViews = await prisma.viewEvent.findMany({
    where: {
      video: { channelId: channel.id },
      watchedAt: { gte: thirtyDaysAgo },
    },
    select: {
      watchedAt: true,
    },
  });

  // Group views by date
  const viewsByDate = recentViews.reduce((acc, view) => {
    const date = view.watchedAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top performing videos
  const topVideos = [...videos]
    .sort((a, b) => b._count.views - a._count.views)
    .slice(0, 5);

  return (
    <AppShell secure>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            Track your channel performance and engagement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-sm text-white/60">Total Views</p>
            <p className="mt-2 text-3xl font-semibold">{totalViews.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-sm text-white/60">Total Videos</p>
            <p className="mt-2 text-3xl font-semibold">{videos.length}</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-sm text-white/60">Total Comments</p>
            <p className="mt-2 text-3xl font-semibold">{totalComments.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-sm text-white/60">Avg Watch Time</p>
            <p className="mt-2 text-3xl font-semibold">{formatDuration(Math.round(avgWatchTime))}</p>
          </div>
        </div>

        {/* Views Chart */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold mb-4">Views (Last 30 Days)</h2>
          <div className="h-64 flex items-end gap-1">
            {Object.entries(viewsByDate).map(([date, count]) => {
              const maxViews = Math.max(...Object.values(viewsByDate));
              const height = maxViews > 0 ? (count / maxViews) * 100 : 0;
              return (
                <div
                  key={date}
                  className="flex-1 bg-cyan-400/40 rounded-t transition hover:bg-cyan-400/60"
                  style={{ height: `${height}%` }}
                  title={`${date}: ${count} views`}
                />
              );
            })}
          </div>
        </div>

        {/* Top Videos */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performing Videos</h2>
          <div className="space-y-3">
            {topVideos.map((video, index) => (
              <div
                key={video.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white/40">#{index + 1}</span>
                  <div>
                    <p className="font-semibold">{video.title}</p>
                    <div className="mt-1 flex gap-4 text-xs text-white/50">
                      <span>{video._count.views} views</span>
                      <span>{video._count.comments} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

