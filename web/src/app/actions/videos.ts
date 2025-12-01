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

    // SDLC: Delete related records first to avoid foreign key constraints
    // Delete in order: qualities -> views -> comments -> playlist items -> video
    
    // Delete quality records (using proper Prisma methods)
    try {
      await prisma.videoQuality.deleteMany({
        where: { videoId },
      });
    } catch (error: any) {
      console.error("Error deleting video qualities:", error);
      // Continue even if this fails
    }

    // Delete view events (using proper Prisma methods)
    try {
      await prisma.viewEvent.deleteMany({
        where: { videoId },
      });
    } catch (error: any) {
      console.error("Error deleting view events:", error);
      // Continue even if this fails
    }

    // Delete comments (using proper Prisma methods)
    try {
      await prisma.comment.deleteMany({
        where: { videoId },
      });
    } catch (error: any) {
      console.error("Error deleting comments:", error);
      // Continue even if this fails
    }

    // Delete playlist items (using proper Prisma methods)
    try {
      await prisma.playlistVideo.deleteMany({
        where: { videoId },
      });
    } catch (error: any) {
      console.error("Error deleting playlist videos:", error);
      // Continue even if this fails
    }

    // SDLC: Finally delete the video record
    await prisma.video.delete({
      where: { id: videoId },
    });

    // SDLC: Channel stats are automatically updated via Prisma relations
    // The channel.videos count decreases automatically when video is deleted
    // No manual update needed as Prisma handles this through relations

    // SDLC: Revalidate all affected pages
    revalidatePath("/studio");
    revalidatePath("/");
    revalidatePath(`/video/${videoId}`);
    revalidatePath(`/channel/${video.channel.id}`); // Revalidate channel page if it exists
    // Note: Playlist pages are revalidated when playlist items are accessed

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
