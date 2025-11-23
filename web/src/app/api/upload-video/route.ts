import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const uploadDir = path.join(process.cwd(), "public", "uploads");

const videoSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().min(5),
  tags: z.string().optional(),
});

async function persistFile(file: File, prefix: string) {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || ".mp4";
  const normalized = file.name
    .replace(ext, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const filename = `${prefix}-${Date.now()}-${normalized}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  // Use streaming for large files
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  
  return `/uploads/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in before uploading." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const thumbnailUrl = formData.get("thumbnailUrl");
    const duration = formData.get("duration");
    const tags = formData.get("tags");

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: "Title and description are required." },
        { status: 400 }
      );
    }

    const videoFile = formData.get("videoFile");
    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "Please attach a video file." },
        { status: 400 }
      );
    }

    // Extract duration from video file if not provided
    let videoDuration = duration ? Number(duration) : 0;
    
    // If duration is 0 or invalid, try to extract from video metadata
    // Note: Full extraction requires FFmpeg or video processing library
    // For now, we use the client-provided duration
    if (videoDuration <= 0) {
      // Fallback: Use a default or extract server-side
      // In production, use FFprobe or similar to get exact duration
      console.warn("Video duration not provided, using client-provided value");
      videoDuration = duration ? Number(duration) : 0;
    }

    if (videoDuration <= 0) {
      return NextResponse.json(
        { success: false, message: "Could not determine video duration. Please ensure the video file is valid." },
        { status: 400 }
      );
    }

    const fields = {
      title: String(title),
      description: String(description),
      thumbnailUrl: thumbnailUrl && String(thumbnailUrl).trim() ? String(thumbnailUrl).trim() : undefined,
      duration: Math.floor(videoDuration), // Ensure integer
      tags: tags ? String(tags) : undefined,
    };

    const parsed = videoSchema.safeParse(fields);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          message: firstError
            ? `${firstError.path.join(".")}: ${firstError.message}`
            : "Invalid form data",
        },
        { status: 400 }
      );
    }

    // Check file size (2GB limit)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (videoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size (${(videoFile.size / 1024 / 1024).toFixed(1)}MB) exceeds 2GB limit.`,
        },
        { status: 400 }
      );
    }

    // Get video quality preference
    const qualityPreference = formData.get("videoQuality")?.toString() || "auto";
    console.log("Video quality preference:", qualityPreference);
    
    // Note: Full video transcoding to multiple qualities requires FFmpeg server-side
    // For now, we store the original video. In production, you would:
    // 1. Use FFmpeg to transcode to multiple qualities (480p, 720p, 1080p, 4K)
    // 2. Store all quality versions
    // 3. Use adaptive streaming (HLS/DASH) for quality selection

    // Handle thumbnail - prioritize extracted thumbnail from video
    let finalThumbnailUrl = parsed.data.thumbnailUrl || "";
    const thumbnailFile = formData.get("thumbnailFile");
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        finalThumbnailUrl = await persistFile(thumbnailFile, "thumb");
      } catch (err) {
        console.error("Thumbnail upload failed:", err);
        return NextResponse.json(
          { success: false, message: "Failed to save thumbnail file." },
          { status: 500 }
        );
      }
    }

    // If no thumbnail provided, extract from video (fallback)
    // Note: In production, you might want to extract a frame server-side using FFmpeg
    if (!finalThumbnailUrl) {
      console.log("No thumbnail provided, using default placeholder");
      finalThumbnailUrl = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80";
    }

    const channel = await prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!channel) {
      return NextResponse.json(
        { success: false, message: "Channel not found for this user." },
        { status: 404 }
      );
    }

    let storedVideoUrl: string;
    try {
      // Store original video
      storedVideoUrl = await persistFile(videoFile, "video");
      
      // TODO: Video transcoding to multiple qualities
      // In production, implement:
      // - FFmpeg transcoding to 480p, 720p, 1080p, 1440p, 2160p
      // - Store all quality versions
      // - Generate HLS/DASH manifests for adaptive streaming
      // - Update database with quality URLs
      
      if (qualityPreference !== "auto") {
        console.log(`Quality preference set to ${qualityPreference}, but transcoding not yet implemented`);
        // Future: Trigger transcoding job here
      }
    } catch (err) {
      console.error("Video file upload failed:", err);
      return NextResponse.json(
        { success: false, message: "Failed to save video file. Check server logs." },
        { status: 500 }
      );
    }

    const video = await prisma.video.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        videoUrl: storedVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        duration: parsed.data.duration,
        tags: parsed.data.tags ?? "",
        status: "READY",
        channelId: channel.id,
      },
    });

    console.log("Video created successfully:", { id: video.id, title: video.title });

    revalidatePath("/");
    revalidatePath("/studio");

    return NextResponse.json({
      success: true,
      message: `Video "${video.title}" uploaded successfully!`,
      videoId: video.id,
    });
  } catch (error) {
    console.error("Video upload failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, message: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

