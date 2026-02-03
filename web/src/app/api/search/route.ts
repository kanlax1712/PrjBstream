import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!query.trim()) {
    return NextResponse.json({ videos: [], channels: [] });
  }

  try {
    const searchTerm = query.trim().toLowerCase();
    const insensitive = { mode: "insensitive" as const };

    // Search videos by title, description, or tags (substring match, any position, case-insensitive)
    const videos = await prisma.video.findMany({
      where: {
        AND: [
          { visibility: "PUBLIC" },
          { status: "READY" },
          {
            OR: [
              { title: { contains: searchTerm, ...insensitive } },
              { description: { contains: searchTerm, ...insensitive } },
              { tags: { contains: searchTerm, ...insensitive } },
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
      take: limit,
    });

    // Search channels by name, handle, or description (substring match, any position, case-insensitive)
    const channels = await prisma.channel.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, ...insensitive } },
            { handle: { contains: searchTerm, ...insensitive } },
            { description: { contains: searchTerm, ...insensitive } },
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
    });

    return NextResponse.json({ videos, channels, query });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

