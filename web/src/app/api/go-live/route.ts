import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const goLiveSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  channelId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = goLiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channel.findFirst({
      where: {
        id: parsed.data.channelId,
        ownerId: session.user.id,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { success: false, message: "Channel not found" },
        { status: 404 }
      );
    }

    // Check if user already has an active live stream
    const existingStream = await prisma.liveStream.findFirst({
      where: {
        channelId: parsed.data.channelId,
        status: {
          in: ["STARTING", "LIVE"],
        },
      },
    });

    if (existingStream) {
      return NextResponse.json(
        { success: false, message: "You already have an active live stream" },
        { status: 400 }
      );
    }

    // Generate unique stream ID and key
    const streamId = `live-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const streamKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create live stream record in database
    const liveStream = await prisma.liveStream.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        streamKey,
        streamUrl: `/live/${streamId}`,
        shareUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/live/${streamId}`,
        status: "LIVE",
        visibility: parsed.data.visibility,
        channelId: parsed.data.channelId,
        viewerCount: 0,
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
    });

    return NextResponse.json({
      success: true,
      stream: liveStream,
      message: "Live stream started successfully",
    });
  } catch (error) {
    console.error("Go Live error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start live stream" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId");

    if (streamId) {
      // Get specific stream
      const stream = await prisma.liveStream.findUnique({
        where: { id: streamId },
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
      });

      if (!stream) {
        return NextResponse.json(
          { success: false, message: "Stream not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        stream,
      });
    }

    // Get all active live streams
    const activeStreams = await prisma.liveStream.findMany({
      where: {
        status: {
          in: ["STARTING", "LIVE"],
        },
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
      orderBy: {
        startedAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      streams: activeStreams,
    });
  } catch (error) {
    console.error("Get stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get stream" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId");

    if (!streamId) {
      return NextResponse.json(
        { success: false, message: "Stream ID required" },
        { status: 400 }
      );
    }

    // Verify stream belongs to user's channel
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        channel: true,
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, message: "Stream not found" },
        { status: 404 }
      );
    }

    if (stream.channel.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update stream status to ENDED
    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Live stream ended successfully",
    });
  } catch (error) {
    console.error("End stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to end stream" },
      { status: 500 }
    );
  }
}

