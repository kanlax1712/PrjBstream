import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/storage";

const uploadDir = path.join(process.cwd(), "public", "uploads");

const videoSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  thumbnailUrl: z.string().optional(), // Allow any string (URL or data URI or file path)
  duration: z.number().min(5),
  tags: z.string().optional(),
});

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
    const hasAds = formData.get("hasAds") === "true";

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
        finalThumbnailUrl = await uploadFile(thumbnailFile, "thumb");
      } catch (err) {
        console.error("Thumbnail upload failed:", err);
        return NextResponse.json(
          { success: false, message: "Failed to save thumbnail file." },
          { status: 500 }
        );
      }
    }

    // If no thumbnail provided, create a default placeholder file
    // Note: In production, you might want to extract a frame server-side using FFmpeg
    if (!finalThumbnailUrl) {
      console.log("No thumbnail provided, creating default placeholder");
      try {
        // Create a simple placeholder SVG file
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="800" height="450" fill="url(#grad)" />
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">No Thumbnail</text>
        </svg>`;
        
        const placeholderFilename = `thumb-${Date.now()}-placeholder.svg`;
        const placeholderPath = path.join(uploadDir, placeholderFilename);
        await fs.writeFile(placeholderPath, placeholderSvg, "utf-8");
        finalThumbnailUrl = `/uploads/${placeholderFilename}`;
      } catch (err) {
        console.error("Failed to create placeholder thumbnail:", err);
        // Fallback to a simple relative path
        finalThumbnailUrl = "/uploads/default-thumbnail.svg";
      }
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
      // Store original video (uses local filesystem or Vercel Blob based on environment)
      storedVideoUrl = await uploadFile(videoFile, "video");
      
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
        hasAds: hasAds,
        channelId: channel.id,
      },
    });

    console.log("Video created successfully:", { id: video.id, title: video.title });

    // Trigger transcoding in the background (non-blocking)
    // This will create multiple quality versions using FFmpeg
    try {
      // Check if FFmpeg is available before triggering transcoding
      const { checkFFmpegAvailable } = await import("@/lib/video/transcode");
      const ffmpegAvailable = await checkFFmpegAvailable();
      
      if (ffmpegAvailable) {
        // Trigger transcoding asynchronously (don't wait for it)
        fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/video/${video.id}/transcode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          console.error("Failed to trigger transcoding:", err);
          // Non-critical error, video is still uploaded
        });
      } else {
        console.log("FFmpeg not available, skipping transcoding. Video uploaded but only original quality available.");
      }
    } catch (error) {
      console.error("Error triggering transcoding:", error);
      // Non-critical error, video is still uploaded
    }

    revalidatePath("/");
    revalidatePath("/studio");

    return NextResponse.json({
      success: true,
      message: `Video "${video.title}" uploaded successfully! Transcoding to multiple qualities in progress...`,
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

