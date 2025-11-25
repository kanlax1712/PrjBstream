"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

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

export async function deleteVideo(videoId: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, message: "You must be logged in to delete videos." };
    }

    // Get the video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!video) {
      return { success: false, message: "Video not found." };
    }

    // Check if the current user owns the video (through channel ownership)
    if (video.channel.ownerId !== session.user.id) {
      return { success: false, message: "You don't have permission to delete this video." };
    }

    // Delete all quality versions first
    try {
      const qualities = await prisma.videoQuality.findMany({
        where: { videoId },
      });

      for (const quality of qualities) {
        try {
          await deleteFile(quality.videoUrl);
        } catch (fileError) {
          console.error(`Error deleting quality file ${quality.quality}:`, fileError);
        }
      }
    } catch (error) {
      console.error("Error deleting quality files:", error);
      // Continue with deletion even if quality files fail
    }

    // Delete video file from storage (works with both local and Vercel Blob)
    try {
      await deleteFile(video.videoUrl);
    } catch (fileError) {
      console.error("Error deleting video file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete thumbnail file from storage
    try {
      if (video.thumbnailUrl && !video.thumbnailUrl.startsWith("http")) {
        await deleteFile(video.thumbnailUrl);
      }
    } catch (fileError) {
      console.error("Error deleting thumbnail file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete related records first to avoid foreign key constraints
    // Delete in order: qualities -> views -> comments -> playlist items -> video
    
    // Delete quality records
    try {
      const videoQualityModel = (prisma as any).videoQuality;
      if (videoQualityModel && typeof videoQualityModel.deleteMany === 'function') {
        await videoQualityModel.deleteMany({
          where: { videoId },
        });
      }
    } catch (error: any) {
      console.error("Error deleting video qualities:", error);
      // Continue even if this fails
    }

    // Delete view events
    try {
      const viewEventModel = (prisma as any).viewEvent;
      if (viewEventModel && typeof viewEventModel.deleteMany === 'function') {
        await viewEventModel.deleteMany({
          where: { videoId },
        });
      }
    } catch (error: any) {
      console.error("Error deleting view events:", error);
      // Continue even if this fails
    }

    // Delete comments
    try {
      const commentModel = (prisma as any).comment;
      if (commentModel && typeof commentModel.deleteMany === 'function') {
        await commentModel.deleteMany({
          where: { videoId },
        });
      }
    } catch (error: any) {
      console.error("Error deleting comments:", error);
      // Continue even if this fails
    }

    // Delete playlist items
    try {
      const playlistVideoModel = (prisma as any).playlistVideo;
      if (playlistVideoModel && typeof playlistVideoModel.deleteMany === 'function') {
        await playlistVideoModel.deleteMany({
          where: { videoId },
        });
      }
    } catch (error: any) {
      console.error("Error deleting playlist videos:", error);
      // Continue even if this fails
    }

    // Finally delete the video
    await prisma.video.delete({
      where: { id: videoId },
    });

    // Revalidate relevant paths
    revalidatePath("/studio");
    revalidatePath("/");
    revalidatePath(`/video/${videoId}`);

    return { success: true, message: "Video deleted successfully." };
  } catch (error: any) {
    console.error("Delete video error:", error);
    const errorMessage = error?.message || "Failed to delete video.";
    return { 
      success: false, 
      message: errorMessage.includes("Foreign key") 
        ? "Cannot delete video: It may be referenced by playlists or other records."
        : errorMessage 
    };
  }
}
