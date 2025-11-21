"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const uploadDir = path.join(process.cwd(), "public", "uploads");

const videoSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().min(5),
  tags: z.string().optional(),
});

type ActionResult = {
  success: boolean;
  message: string;
};

async function persistFile(file: File, prefix: string) {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const normalized = file.name
    .replace(ext, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const filename = `${prefix}-${Date.now()}-${normalized}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function createVideoAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Please sign in before uploading." };
    }

    const title = formData.get("title");
    const description = formData.get("description");
    const thumbnailUrl = formData.get("thumbnailUrl");
    const duration = formData.get("duration");
    const tags = formData.get("tags");

    if (!title || !description || !duration) {
      return {
        success: false,
        message: "Title, description, and duration are required.",
      };
    }

    const fields = {
      title: String(title),
      description: String(description),
      thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : undefined,
      duration: Number(duration),
      tags: tags ? String(tags) : undefined,
    };

    const parsed = videoSchema.safeParse(fields);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        message: firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid form data",
      };
    }

    const videoFile = formData.get("videoFile");
    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return { success: false, message: "Please attach a video file." };
    }

    let finalThumbnailUrl = parsed.data.thumbnailUrl ?? "";
    const thumbnailFile = formData.get("thumbnailFile");
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        finalThumbnailUrl = await persistFile(thumbnailFile, "thumb");
      } catch (err) {
        console.error("Thumbnail upload failed:", err);
        return {
          success: false,
          message: "Failed to save thumbnail file.",
        };
      }
    }

    if (!finalThumbnailUrl) {
      return {
        success: false,
        message: "Add a thumbnail image (file upload or remote URL).",
      };
    }

    const channel = await prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!channel) {
      return { success: false, message: "Channel not found for this user." };
    }

    let storedVideoUrl: string;
    try {
      storedVideoUrl = await persistFile(videoFile, "video");
    } catch (err) {
      console.error("Video file upload failed:", err);
      return {
        success: false,
        message: "Failed to save video file. Check server logs.",
      };
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

    return {
      success: true,
      message: `Video "${video.title}" uploaded successfully!`,
    };
  } catch (error) {
    console.error("Video upload failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Upload failed: ${errorMessage}`,
    };
  }
}
