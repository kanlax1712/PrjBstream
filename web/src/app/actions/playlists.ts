"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const playlistSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export async function createPlaylist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    const fields = {
      title: formData.get("title"),
      description: formData.get("description"),
      isPublic: formData.get("isPublic") === "true",
    };

    const parsed = playlistSchema.safeParse(fields);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid data",
      };
    }

    const playlist = await prisma.playlist.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        isPublic: parsed.data.isPublic,
        ownerId: session.user.id,
      },
    });

    revalidatePath("/playlists");
    revalidatePath(`/playlist/${playlist.id}`);

    return { success: true, message: "Playlist created!", playlistId: playlist.id };
  } catch (error) {
    console.error("Create playlist error:", error);
    return { success: false, message: "Failed to create playlist." };
  }
}

export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      return { success: false, message: "Playlist not found." };
    }

    if (playlist.ownerId !== session.user.id) {
      return { success: false, message: "Not authorized." };
    }

    // Get current max order
    const maxOrder = await prisma.playlistVideo.findFirst({
      where: { playlistId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    revalidatePath(`/playlist/${playlistId}`);
    return { success: true, message: "Video added to playlist!" };
  } catch (error) {
    console.error("Add video to playlist error:", error);
    return { success: false, message: "Failed to add video." };
  }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      return { success: false, message: "Playlist not found." };
    }

    if (playlist.ownerId !== session.user.id) {
      return { success: false, message: "Not authorized." };
    }

    await prisma.playlistVideo.deleteMany({
      where: {
        playlistId,
        videoId,
      },
    });

    revalidatePath(`/playlist/${playlistId}`);
    return { success: true, message: "Video removed from playlist." };
  } catch (error) {
    console.error("Remove video error:", error);
    return { success: false, message: "Failed to remove video." };
  }
}

