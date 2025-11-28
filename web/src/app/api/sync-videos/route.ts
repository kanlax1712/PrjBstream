import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to synchronize video data
 * This ensures all videos have valid videoUrl and thumbnailUrl,
 * and that VideoQuality records are properly linked.
 * 
 * Only accessible to authenticated users (admin check can be added later)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Starting video synchronization via API...");

    // Get all videos
    const videos = await prisma.video.findMany({
      include: {
        channel: true,
        qualities: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    let fixedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Default placeholder thumbnail URL
    const DEFAULT_THUMBNAIL = "https://via.placeholder.com/800x450/06b6d4/ffffff?text=No+Thumbnail";

    function generatePlaceholderThumbnail(title: string): string {
      const encodedTitle = encodeURIComponent(title.substring(0, 30));
      return `https://via.placeholder.com/800x450/06b6d4/ffffff?text=${encodedTitle}`;
    }

    function isValidVideoUrl(url: string | null | undefined): boolean {
      if (!url || typeof url !== "string" || url.trim() === "") {
        return false;
      }
      return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/uploads/") ||
        url.startsWith("blob:")
      );
    }

    function isValidThumbnailUrl(url: string | null | undefined): boolean {
      if (!url || typeof url !== "string" || url.trim() === "") {
        return false;
      }
      return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/uploads/") ||
        url.startsWith("data:image/") ||
        url.startsWith("blob:")
      );
    }

    // Process each video
    for (const video of videos) {
      const updates: {
        thumbnailUrl?: string;
        videoUrl?: string;
        channelId?: string;
      } = {};
      let needsUpdate = false;

      // Fix thumbnailUrl if invalid or missing
      if (!isValidThumbnailUrl(video.thumbnailUrl)) {
        updates.thumbnailUrl = generatePlaceholderThumbnail(video.title);
        needsUpdate = true;
      }

      // Convert data URI thumbnails to placeholder URLs
      if (video.thumbnailUrl.startsWith("data:image/")) {
        updates.thumbnailUrl = generatePlaceholderThumbnail(video.title);
        needsUpdate = true;
      }

      // Ensure channelId is valid
      if (video.channelId) {
        const channel = await prisma.channel.findUnique({
          where: { id: video.channelId },
        });

        if (!channel) {
          errors.push(`Video ${video.id} has invalid channelId: ${video.channelId}`);
          const defaultChannel = await prisma.channel.findFirst();
          if (defaultChannel) {
            updates.channelId = defaultChannel.id;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        try {
          await prisma.video.update({
            where: { id: video.id },
            data: updates,
          });
          fixedCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Failed to fix video ${video.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Ensure at least one quality record exists (original)
      const originalQuality = video.qualities.find(
        (q) => q.quality === "original" || q.quality === "Original"
      );
      if (!originalQuality && video.videoUrl) {
        try {
          await prisma.videoQuality.create({
            data: {
              videoId: video.id,
              quality: "original",
              videoUrl: video.videoUrl,
              status: "ready",
            },
          });
        } catch (error) {
          // Ignore if already exists
          if (!(error instanceof Error && error.message.includes("Unique constraint"))) {
            errors.push(`Failed to create VideoQuality for video ${video.id}`);
          }
        }
      }

      // Check for errors
      if (!video.videoUrl || !isValidVideoUrl(video.videoUrl)) {
        errorCount++;
        errors.push(`Video ${video.id} has invalid videoUrl`);
      }
    }

    // Clean up orphaned records
    const allVideoIds = new Set(videos.map((v) => v.id));

    // Clean up orphaned comments
    const allComments = await prisma.comment.findMany({
      select: { id: true, videoId: true },
    });
    const orphanedComments = allComments.filter((c) => !allVideoIds.has(c.videoId));
    for (const comment of orphanedComments) {
      try {
        await prisma.comment.delete({ where: { id: comment.id } });
      } catch (error) {
        // Ignore errors
      }
    }

    // Clean up orphaned view events
    const allViews = await prisma.viewEvent.findMany({
      select: { id: true, videoId: true },
    });
    const orphanedViews = allViews.filter((v) => !allVideoIds.has(v.videoId));
    for (const view of orphanedViews) {
      try {
        await prisma.viewEvent.delete({ where: { id: view.id } });
      } catch (error) {
        // Ignore errors
      }
    }

    // Clean up orphaned playlist videos
    const allPlaylistVideos = await prisma.playlistVideo.findMany({
      select: { id: true, videoId: true },
    });
    const orphanedPlaylistVideos = allPlaylistVideos.filter((pv) => !allVideoIds.has(pv.videoId));
    for (const pv of orphanedPlaylistVideos) {
      try {
        await prisma.playlistVideo.delete({ where: { id: pv.id } });
      } catch (error) {
        // Ignore errors
      }
    }

    // Clean up orphaned video qualities
    const allQualities = await prisma.videoQuality.findMany({
      select: { id: true, videoId: true },
    });
    const orphanedQualities = allQualities.filter((q) => !allVideoIds.has(q.videoId));
    for (const quality of orphanedQualities) {
      try {
        await prisma.videoQuality.delete({ where: { id: quality.id } });
      } catch (error) {
        // Ignore errors
      }
    }

    return NextResponse.json({
      success: true,
      message: "Video synchronization completed",
      summary: {
        totalVideos: videos.length,
        fixedCount,
        errorCount,
        errors: errors.slice(0, 10), // Limit errors in response
      },
    });
  } catch (error) {
    console.error("Video synchronization failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Synchronization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

