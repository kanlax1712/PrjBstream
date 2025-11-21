import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ playlistId: string }>;
};

export default async function PlaylistPage({ params }: Props) {
  const { playlistId } = await params;
  const session = await auth();

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      videos: {
        orderBy: { order: "asc" },
        include: {
          video: {
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
          },
        },
      },
    },
  });

  if (!playlist) {
    notFound();
  }

  // Check if playlist is private and user is not owner
  if (!playlist.isPublic && playlist.ownerId !== session?.user?.id) {
    redirect("/");
  }

  const videos = playlist.videos.map((pv) => pv.video);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{playlist.title}</h1>
          {playlist.description && (
            <p className="mt-2 text-white/60">{playlist.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
            <span>By {playlist.owner.name}</span>
            <span>•</span>
            <span>{videos.length} videos</span>
            <span>•</span>
            <span>{playlist.isPublic ? "Public" : "Private"}</span>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
            This playlist is empty.
            {session?.user?.id === playlist.ownerId && (
              <p className="mt-2 text-sm text-white/50">
                Add videos to your playlist from any video page.
              </p>
            )}
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </AppShell>
  );
}

