import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in to update thumbnails." },
        { status: 401 }
      );
    }

    const { videoId } = await params;
    const formData = await request.formData();
    const thumbnailFile = formData.get("thumbnailFile");
    const thumbnailUrl = formData.get("thumbnailUrl")?.toString();

    // Verify video exists and user owns it
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        channel: { ownerId: session.user.id },
      },
      select: {
        id: true,
        thumbnailUrl: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, message: "Video not found or you don't have permission to update it." },
        { status: 404 }
      );
    }

    let finalThumbnailUrl = thumbnailUrl || "";

    // Handle thumbnail file upload
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        // Delete old thumbnail if it exists and is a local file
        if (video.thumbnailUrl && !video.thumbnailUrl.startsWith("http")) {
          try {
            await deleteFile(video.thumbnailUrl);
          } catch (err) {
            console.warn("Failed to delete old thumbnail:", err);
            // Continue even if deletion fails
          }
        }

        // Upload new thumbnail
        finalThumbnailUrl = await uploadFile(thumbnailFile, "thumb");
      } catch (err) {
        console.error("Thumbnail upload failed:", err);
        return NextResponse.json(
          { success: false, message: "Failed to upload thumbnail file." },
          { status: 500 }
        );
      }
    }

    // Validate that we have a thumbnail
    if (!finalThumbnailUrl) {
      return NextResponse.json(
        { success: false, message: "Please provide a thumbnail file or URL." },
        { status: 400 }
      );
    }

    // Update video thumbnail
    await prisma.video.update({
      where: { id: videoId },
      data: { thumbnailUrl: finalThumbnailUrl },
    });

    // Revalidate relevant paths
    revalidatePath("/studio");
    revalidatePath(`/video/${videoId}`);

    return NextResponse.json({
      success: true,
      message: "Thumbnail updated successfully.",
      thumbnailUrl: finalThumbnailUrl,
    });
  } catch (error) {
    console.error("Error updating thumbnail:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while updating the thumbnail." },
      { status: 500 }
    );
  }
}

