import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CreatePlaylistForm } from "@/components/playlists/create-playlist-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const playlists = await prisma.playlist.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: {
          videos: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell secure>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Your Playlists</h1>
          <p className="mt-2 text-sm text-white/60">
            Organize your favorite videos into playlists
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {playlists.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
                <p>You don&apos;t have any playlists yet.</p>
                <p className="mt-2 text-sm text-white/50">
                  Create your first playlist to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition hover:border-cyan-400/40"
                  >
                    <h3 className="text-lg font-semibold">{playlist.title}</h3>
                    {playlist.description && (
                      <p className="mt-2 text-sm text-white/60 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
                      <span>{playlist._count.videos} videos</span>
                      <span>•</span>
                      <span>{playlist.isPublic ? "Public" : "Private"}</span>
                      <span>•</span>
                      <span>Updated {formatRelative(playlist.updatedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Create New Playlist</h2>
            <CreatePlaylistForm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

