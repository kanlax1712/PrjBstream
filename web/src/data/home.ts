import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Optimized home feed with caching and parallel queries
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

    // Fetch all data in parallel for better performance
    const [videos, playlists, counts] = await Promise.all([
      // Optimized video query - only fetch what's needed, limit to 20 initially
      prisma.video.findMany({
        where: {
          visibility: "PUBLIC",
          status: "READY",
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          duration: true,
          publishedAt: true,
          videoUrl: true,
          tags: true,
          channel: {
            select: { id: true, name: true, handle: true, avatarUrl: true },
          },
          // Use _count instead of loading all relations
          _count: {
            select: {
              comments: true,
              views: true,
            },
          },
        },
        take: 20, // Reduced from 100 for faster loading
      }),
      // Optimized playlist query - limit and only fetch essentials
      prisma.playlist.findMany({
        take: 10, // Limit playlists
        select: {
          id: true,
          title: true, // Playlist uses 'title' not 'name'
          description: true,
          owner: { select: { name: true } },
          videos: {
            take: 4, // Only first 4 videos per playlist
            select: {
              order: true,
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
      }),
      // Get counts in parallel
      Promise.all([
        prisma.video.count({ where: { visibility: "PUBLIC", status: "READY" } }).catch(() => 0),
        prisma.channel.count().catch(() => 0),
        prisma.comment.count().catch(() => 0),
      ]),
    ]);

    const hero = videos[0] ?? null;
    const secondary = videos.slice(1) ?? [];

    return {
      hero: hero || null,
      secondary: secondary || [],
      playlists: playlists || [],
      counts: {
        videos: counts[0] ?? 0,
        channels: counts[1] ?? 0,
        communityComments: counts[2] ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching home feed:", error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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

