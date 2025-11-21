import { prisma } from "@/lib/prisma";

export async function getHomeFeed() {
  const videos = await prisma.video.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      channel: {
        select: { id: true, name: true, handle: true, avatarUrl: true },
      },
      comments: {
        select: { id: true },
      },
      views: {
        select: { id: true },
      },
    },
  });

  const playlists = await prisma.playlist.findMany({
    include: {
      owner: { select: { name: true } },
      videos: {
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              videoUrl: true,
            },
          },
        },
      },
    },
  });

  const hero = videos[0] ?? null;
  const secondary = videos.slice(1);

  return {
    hero,
    secondary,
    playlists,
    counts: {
      videos: videos.length,
      channels: await prisma.channel.count(),
      communityComments: await prisma.comment.count(),
    },
  };
}

