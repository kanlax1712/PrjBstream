import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const importSchema = z.object({
  videoId: z.string(),
  title: z.string().min(3).max(120),
  description: z.string().min(10), // Minimum 10 characters required
  thumbnailUrl: z.string().url().optional(), // Optional thumbnail URL
  videoUrl: z.string().url(),
  duration: z.string(), // Format: "MM:SS" or "HH:MM:SS"
});

// Helper to parse duration string to seconds
function parseDurationString(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

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
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      // Return detailed validation errors
      const errors = parsed.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      console.error("YouTube import validation errors:", errors);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid request data",
          errors: errors,
          received: {
            videoId: body.videoId,
            title: body.title,
            description: body.description?.substring(0, 50),
            thumbnailUrl: body.thumbnailUrl,
            videoUrl: body.videoUrl,
            duration: body.duration,
          }
        },
        { status: 400 }
      );
    }

    // Get or create channel for user
    let channel = await prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!channel) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found." },
          { status: 404 }
        );
      }

      const baseHandle = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 20);
      
      let handle = baseHandle;
      let counter = 1;
      
      while (await prisma.channel.findUnique({ where: { handle } })) {
        handle = `${baseHandle}-${counter}`;
        counter++;
      }

      channel = await prisma.channel.create({
        data: {
          name: `${user.name}'s Channel`,
          handle: handle,
          description: `Welcome to ${user.name}'s channel`,
          ownerId: session.user.id,
        },
      });
    }

    // Parse duration
    const durationInSeconds = parseDurationString(parsed.data.duration);
    if (durationInSeconds <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid video duration" },
        { status: 400 }
      );
    }

    // Create video record
    // Note: We're storing the YouTube URL directly
    // In production, you might want to download and re-encode the video
    const video = await prisma.video.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || "No description available",
        videoUrl: parsed.data.videoUrl, // YouTube URL
        thumbnailUrl: parsed.data.thumbnailUrl || "/uploads/default-thumbnail.svg",
        duration: durationInSeconds,
        tags: "youtube,imported",
        status: "READY",
        visibility: "PUBLIC",
        hasAds: false,
        channelId: channel.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Video "${video.title}" imported successfully from YouTube!`,
      videoId: video.id,
    });
  } catch (error) {
    console.error("YouTube import error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to import video",
      },
      { status: 500 }
    );
  }
}

