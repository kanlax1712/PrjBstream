import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/live
 * Returns live streams (STARTING/LIVE) and recent videos for native apps (same data as /live page).
 */
export async function GET() {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [liveStreams, recentVideos] = await Promise.all([
      prisma.liveStream
        .findMany({
          where: {
            status: { in: ["STARTING", "LIVE"] },
            visibility: "PUBLIC",
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
          orderBy: { startedAt: "desc" },
          take: 50,
        })
        .catch(() => []),
      prisma.video.findMany({
        where: {
          visibility: "PUBLIC",
          status: "READY",
          publishedAt: { gte: twentyFourHoursAgo },
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
    ]);

    return NextResponse.json({
      liveStreams: liveStreams.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        streamKey: s.streamKey,
        streamUrl: s.streamUrl,
        shareUrl: s.shareUrl,
        status: s.status,
        visibility: s.visibility,
        channelId: s.channelId,
        startedAt: s.startedAt?.toISOString?.() ?? null,
        endedAt: s.endedAt?.toISOString?.() ?? null,
        viewerCount: s.viewerCount ?? 0,
        channel: s.channel,
      })),
      recentVideos: recentVideos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        publishedAt: v.publishedAt?.toISOString?.() ?? null,
        channel: v.channel,
      })),
    });
  } catch (error) {
    console.error("Live API error:", error);
    return NextResponse.json(
      { liveStreams: [], recentVideos: [] },
      { status: 500 }
    );
  }
}
