import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { SearchBar } from "@/components/search/search-bar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type VideoWithChannel = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  tags: string;
  publishedAt: Date;
  channel: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
  };
};

type ChannelWithCounts = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  _count: {
    videos: number;
    subscribers: number;
  };
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";

  let videos: VideoWithChannel[] = [];
  let channels: ChannelWithCounts[] = [];

  if (query.trim()) {
    const searchTerm = query.trim().toLowerCase();

    [videos, channels] = await Promise.all([
      prisma.video.findMany({
        where: {
          AND: [
            { visibility: "PUBLIC" },
            { status: "READY" },
            {
              OR: [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } },
                { tags: { contains: searchTerm } },
              ],
            },
          ],
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
      }),
      prisma.channel.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { handle: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          handle: true,
          description: true,
          avatarUrl: true,
          bannerUrl: true,
          _count: {
            select: {
              videos: true,
              subscribers: true,
            },
          },
        },
        take: 10,
      }),
    ]);
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Search Bar - visible on mobile */}
        <div className="sm:hidden">
          <SearchBar defaultValue={query} />
        </div>

        {query ? (
          <>
            <div>
              <h1 className="text-2xl font-semibold">
                Search results for &quot;{query}&quot;
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {videos.length} videos, {channels.length} channels
              </p>
            </div>

            {channels.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Channels</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {channels.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/channel/${channel.handle}`}
                      className="group rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition hover:border-cyan-400/40"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative size-16 overflow-hidden rounded-full border border-white/10">
                          {channel.avatarUrl ? (
                            <Image
                              src={channel.avatarUrl}
                              alt={channel.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-slate-800 text-lg font-semibold">
                              {channel.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{channel.name}</h3>
                          <p className="text-sm text-white/60">@{channel.handle}</p>
                          <div className="mt-2 flex gap-4 text-xs text-white/50">
                            <span>{channel._count.videos} videos</span>
                            <span>{channel._count.subscribers} subscribers</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Videos</h2>
                <VideoGrid videos={videos} />
              </section>
            ) : query ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/60">
                No videos found for &quot;{query}&quot;
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/60">
            Enter a search query to find videos and channels
          </div>
        )}
      </div>
    </AppShell>
  );
}

