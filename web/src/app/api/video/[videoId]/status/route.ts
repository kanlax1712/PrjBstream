import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/video/[videoId]/status
 * Check the transcoding status of a video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Get video and verify ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: { ownerId: true },
        },
        qualities: {
          select: {
            quality: true,
            status: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    if (video.channel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to check this video status" },
        { status: 403 }
      );
    }

    // Count quality statuses
    const qualityStatuses = {
      ready: video.qualities.filter((q) => q.status === "ready").length,
      processing: video.qualities.filter((q) => q.status === "processing").length,
      failed: video.qualities.filter((q) => q.status === "failed").length,
      total: video.qualities.length,
    };

    // Determine overall status
    const isProcessing = video.status === "PROCESSING" || qualityStatuses.processing > 0;
    const isComplete = video.status === "READY" && qualityStatuses.processing === 0 && qualityStatuses.ready > 0;
    const hasFailed = qualityStatuses.failed === qualityStatuses.total && qualityStatuses.total > 0;

    return NextResponse.json({
      videoId,
      videoStatus: video.status,
      isProcessing,
      isComplete,
      hasFailed,
      qualityStatuses,
      message: isProcessing
        ? `Processing: ${qualityStatuses.ready}/${qualityStatuses.total} qualities ready`
        : isComplete
        ? `Complete: ${qualityStatuses.ready} qualities ready`
        : hasFailed
        ? "Transcoding failed"
        : "Ready",
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check video status",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

