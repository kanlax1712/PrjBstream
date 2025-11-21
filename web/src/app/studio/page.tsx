import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { VideoUploadForm } from "@/components/forms/video-upload-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <AppShell secure>
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
          Redirecting to login...
        </div>
      </AppShell>
    );
  }

  const [channel, videos] = await Promise.all([
    prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    }),
    prisma.video.findMany({
      where: { channel: { ownerId: session.user.id } },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return (
    <AppShell secure>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Creator Studio
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Welcome back, {channel?.name ?? session.user.name}
          </h1>
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
            <h2 className="text-lg font-semibold">Latest releases</h2>
            <div className="flex flex-col gap-3">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/video/${video.id}`}
                  className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-cyan-400/40"
                >
                  <p className="text-base font-semibold">{video.title}</p>
                  <p className="text-sm text-white/60 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                    <span>Status: {video.status.toLowerCase()}</span>
                    <span>•</span>
                    <span>{formatRelative(video.publishedAt)}</span>
                    <span>•</span>
                    <span>{(video.duration / 60).toFixed(0)} min</span>
                  </div>
                </Link>
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
      </div>
    </AppShell>
  );
}

