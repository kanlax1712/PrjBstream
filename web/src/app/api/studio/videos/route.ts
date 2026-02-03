import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSessionFromBearerToken } from "@/lib/auth-api-token";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/studio/videos
 * Returns the current user's videos (creator's "Latest releases"). Requires Bearer token or session.
 */
export async function GET(request: NextRequest) {
  try {
    const bearerSession = await getSessionFromBearerToken(request);
    const cookieSession = await auth();
    const session = bearerSession ?? cookieSession;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const videos = await prisma.video.findMany({
      where: { channel: { ownerId: session.user.id } },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        duration: true,
        status: true,
        publishedAt: true,
        videoUrl: true,
        channel: {
          select: { id: true, name: true, handle: true },
        },
      },
    });

    const serialized = videos.map((v) => ({
      ...v,
      publishedAt: v.publishedAt?.toISOString?.() ?? v.publishedAt,
    }));

    return NextResponse.json({ success: true, videos: serialized });
  } catch (error) {
    console.error("Studio videos API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load videos" },
      { status: 500 }
    );
  }
}
