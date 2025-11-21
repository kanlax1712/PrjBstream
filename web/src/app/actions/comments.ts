"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  videoId: z.string(),
});

export async function addComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in to comment." };
  }

  try {
    const fields = {
      content: formData.get("content"),
      videoId: formData.get("videoId"),
    };

    const parsed = commentSchema.safeParse(fields);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid comment",
      };
    }

    const video = await prisma.video.findUnique({
      where: { id: parsed.data.videoId },
    });

    if (!video) {
      return { success: false, message: "Video not found." };
    }

    await prisma.comment.create({
      data: {
        content: parsed.data.content,
        videoId: parsed.data.videoId,
        authorId: session.user.id,
      },
    });

    revalidatePath(`/video/${parsed.data.videoId}`);

    return { success: true, message: "Comment added!" };
  } catch (error) {
    console.error("Add comment error:", error);
    return { success: false, message: "Failed to add comment." };
  }
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: true },
    });

    if (!comment) {
      return { success: false, message: "Comment not found." };
    }

    // Only allow deleting own comments
    if (comment.authorId !== session.user.id) {
      return { success: false, message: "Not authorized." };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/video/${comment.videoId}`);

    return { success: true, message: "Comment deleted." };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, message: "Failed to delete comment." };
  }
}

