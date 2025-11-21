import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { MockSubscriptionsButton } from "@/components/subscriptions/mock-subscriptions-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get user's subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      channel: {
        include: {
          videos: {
            where: { visibility: "PUBLIC", status: "READY" },
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
            take: 10,
          },
        },
      },
    },
  });

  // Flatten all videos from subscribed channels
  const videos = subscriptions
    .flatMap((sub) => sub.channel.videos)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 50);

  return (
    <AppShell secure>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Your Subscriptions</h1>
          <p className="mt-2 text-sm text-white/60">
            Latest videos from channels you follow
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
            <p className="mb-4">You haven&apos;t subscribed to any channels yet.</p>
            <p className="text-sm text-white/50 mb-6">
              Search for creators and subscribe to see their latest videos here.
            </p>
            <MockSubscriptionsButton />
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
            No new videos from your subscriptions.
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </AppShell>
  );
}

