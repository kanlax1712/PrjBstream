import { prisma } from "@/lib/prisma";

export async function getHomeFeed() {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.warn("Prisma client not available");
      return {
        hero: null,
        secondary: [],
        playlists: [],
        counts: {
          videos: 0,
          channels: 0,
          communityComments: 0,
        },
      };
    }

    const videos = await prisma.video.findMany({
      where: {
        visibility: "PUBLIC",
        status: "READY",
      },
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
      take: 20, // Limit to prevent large queries
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
        channels: await prisma.channel.count().catch(() => 0),
        communityComments: await prisma.comment.count().catch(() => 0),
      },
    };
  } catch (error) {
    console.error("Error fetching home feed:", error);
    // Return empty data if database query fails
    return {
      hero: null,
      secondary: [],
      playlists: [],
      counts: {
        videos: 0,
        channels: 0,
        communityComments: 0,
      },
    };
  }
}

