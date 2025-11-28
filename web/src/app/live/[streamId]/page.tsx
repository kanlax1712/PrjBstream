import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Share2, Users, Lock, Globe } from "lucide-react";

type Props = {
  params: Promise<{ streamId: string }>;
};

export default async function LiveStreamPage({ params }: Props) {
  const { streamId } = await params;
  const session = await auth();

  // In production, fetch live stream from database
  // For now, we'll show a placeholder
  const isPrivate = streamId.includes("private");

  // Check if user has access (for private streams)
  if (isPrivate && session?.user) {
    // In production, check if user is subscribed to the channel
    // For now, allow access if logged in
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-300">LIVE NOW</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Live Stream</h1>
          <p className="text-sm text-white/70">
            {isPrivate ? (
              <span className="flex items-center gap-2">
                <Lock className="size-4" />
                Private stream - Only subscribers can view
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Globe className="size-4" />
                Public stream - Anyone can view
              </span>
            )}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/5 bg-black">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="size-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <div className="size-8 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <p className="text-white/70">Live stream player</p>
                  <p className="text-sm text-white/50 mt-2">
                    In production, this would show the actual live video stream
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                <Share2 className="size-4" />
                Share Stream
              </button>
              <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                <Users className="size-4" />
                Viewers: 0
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold mb-4">Stream Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/50">Stream ID</p>
                  <p className="text-white font-mono">{streamId}</p>
                </div>
                <div>
                  <p className="text-white/50">Status</p>
                  <p className="text-red-400">● LIVE</p>
                </div>
                <div>
                  <p className="text-white/50">Visibility</p>
                  <p className="text-white">
                    {isPrivate ? "Private (Subscribers only)" : "Public (Anyone can view)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold mb-4">Share Link</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  readOnly
                  value={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/live/${streamId}`}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
                <button className="w-full rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600">
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

