import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const importSchema = z.object({
  videoId: z.string(),
  title: z.string().min(3).max(120),
  description: z.string().min(10), // Minimum 10 characters required
  thumbnailUrl: z.string().url().optional(), // Optional thumbnail URL
  videoUrl: z.string().url(),
  duration: z.string(), // Format: "MM:SS" or "HH:MM:SS"
});

// Helper to parse duration string to seconds (format: "MM:SS" or "HH:MM:SS")
function parseDurationString(duration: string): number {
  if (!duration || duration.trim() === "") {
    console.warn("Empty duration string");
    return 0;
  }
  
  const parts = duration.split(":").map(Number);
  
  // Validate all parts are valid numbers
  if (parts.some(isNaN)) {
    console.warn("Invalid duration format:", duration);
    return 0;
  }
  
  if (parts.length === 2) {
    // MM:SS format
    const minutes = parts[0];
    const seconds = parts[1];
    if (minutes < 0 || seconds < 0 || seconds >= 60) {
      console.warn("Invalid duration values:", duration);
      return 0;
    }
    const totalSeconds = minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : 0;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parts[0];
    const minutes = parts[1];
    const seconds = parts[2];
    if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
      console.warn("Invalid duration values:", duration);
      return 0;
    }
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : 0;
  }
  
  console.warn("Unsupported duration format:", duration);
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
      console.error("Invalid duration received:", {
        duration: parsed.data.duration,
        parsed: durationInSeconds,
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid video duration: ${parsed.data.duration}. Please ensure the video has a valid duration.` 
        },
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
        tags: "", // No YouTube-related tags - videos are just regular Bstream videos
        status: "READY",
        visibility: "PUBLIC",
        hasAds: false,
        channelId: channel.id,
      },
    });

    // Revalidate pages to show new video immediately
    revalidatePath("/");
    revalidatePath("/studio");
    revalidatePath(`/channel/${channel.handle}`);

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

