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

    if (!title || !description || !duration) {
      return NextResponse.json(
        { success: false, message: "Title, description, and duration are required." },
        { status: 400 }
      );
    }

    const fields = {
      title: String(title),
      description: String(description),
      thumbnailUrl: thumbnailUrl && String(thumbnailUrl).trim() ? String(thumbnailUrl).trim() : undefined,
      duration: Number(duration),
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

    const videoFile = formData.get("videoFile");
    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "Please attach a video file." },
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

    // If no thumbnail provided, use a default placeholder
    if (!finalThumbnailUrl) {
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
      storedVideoUrl = await persistFile(videoFile, "video");
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

