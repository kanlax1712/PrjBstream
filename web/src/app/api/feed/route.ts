import { NextResponse } from "next/server";
import { getHomeFeed } from "@/data/home";

/**
 * GET /api/feed
 * Returns home feed as JSON for native Android/iOS apps.
 */
export async function GET() {
  try {
    const feed = await getHomeFeed();
    return NextResponse.json({
      hero: feed.hero
        ? {
            ...feed.hero,
            publishedAt: feed.hero.publishedAt?.toISOString?.() ?? feed.hero.publishedAt,
          }
        : null,
      secondary: (feed.secondary ?? []).map((v) => ({
        ...v,
        publishedAt: v.publishedAt?.toISOString?.() ?? v.publishedAt,
      })),
      playlists: feed.playlists ?? [],
      counts: feed.counts ?? { videos: 0, channels: 0, communityComments: 0 },
    });
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json(
      { hero: null, secondary: [], playlists: [], counts: { videos: 0, channels: 0, communityComments: 0 } },
      { status: 500 }
    );
  }
}
