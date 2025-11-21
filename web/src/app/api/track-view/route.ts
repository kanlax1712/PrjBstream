import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID required" },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Create view event
    await prisma.viewEvent.create({
      data: {
        videoId,
        viewerId: session?.user?.id || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track view error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

