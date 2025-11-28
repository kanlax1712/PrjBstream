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

    // Generate unique stream ID
    const streamId = `live-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const streamKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create live stream record
    // Note: In production, you'd integrate with a streaming service (RTMP, WebRTC, etc.)
    const liveStream = {
      id: streamId,
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      channelId: parsed.data.channelId,
      streamKey,
      streamUrl: `/live/${streamId}`,
      shareUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/live/${streamId}`,
      status: "LIVE",
      startedAt: new Date(),
    };

    // In production, store this in a database table for live streams
    // For now, we'll return the stream info

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

    if (!streamId) {
      return NextResponse.json(
        { success: false, message: "Stream ID required" },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      stream: {
        id: streamId,
        status: "LIVE",
      },
    });
  } catch (error) {
    console.error("Get stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get stream" },
      { status: 500 }
    );
  }
}

