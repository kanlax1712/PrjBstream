import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transcodeVideo, QUALITY_CONFIGS, checkFFmpegAvailable } from "@/lib/video/transcode";
import { promises as fs } from "fs";
import path from "path";

/**
 * POST /api/video/[videoId]/transcode
 * Triggers transcoding of a video to multiple quality levels
 * This endpoint processes the video using FFmpeg with compression and bitrate adjustment
 */
export async function POST(
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
        { error: "Unauthorized to transcode this video" },
        { status: 403 }
      );
    }

    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        {
          error: "FFmpeg is not installed. Please install FFmpeg to enable video transcoding.",
          ffmpegRequired: true,
        },
        { status: 503 }
      );
    }

    // Get original video path
    const originalVideoPath = path.join(process.cwd(), "public", video.videoUrl);
    const videoExists = await fs.access(originalVideoPath).then(() => true).catch(() => false);

    if (!videoExists) {
      return NextResponse.json(
        { error: "Original video file not found" },
        { status: 404 }
      );
    }

    // Update video status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "PROCESSING" },
    });

    // Transcode to all quality levels
    const qualities = ["480p", "720p", "1080p", "1440p", "2160p"];
    const results: Array<{
      quality: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const quality of qualities) {
      try {
        const config = QUALITY_CONFIGS[quality];
        if (!config) continue;

        // Create output path for this quality
        const outputDir = path.join(process.cwd(), "public", "uploads", "qualities", videoId);
        await fs.mkdir(outputDir, { recursive: true });
        const outputFilename = `${quality}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);
        const outputUrl = `/uploads/qualities/${videoId}/${outputFilename}`;

        // Create quality record in database (status: processing)
        await prisma.videoQuality.upsert({
          where: {
            videoId_quality: {
              videoId,
              quality,
            },
          },
          create: {
            videoId,
            quality,
            videoUrl: outputUrl,
            status: "processing",
          },
          update: {
            status: "processing",
          },
        });

        // Perform transcoding (compression + bitrate adjustment)
        const transcodeResult = await transcodeVideo(
          originalVideoPath,
          outputPath,
          config
        );

        if (transcodeResult.success) {
          // Update quality record with metadata
          await prisma.videoQuality.update({
            where: {
              videoId_quality: {
                videoId,
                quality,
              },
            },
            data: {
              status: "ready",
              bitrate: parseInt(config.bitrate),
              width: transcodeResult.width,
              height: transcodeResult.height,
              fileSize: transcodeResult.fileSize,
            },
          });

          results.push({ quality, success: true });
        } else {
          await prisma.videoQuality.update({
            where: {
              videoId_quality: {
                videoId,
                quality,
              },
            },
            data: {
              status: "failed",
            },
          });

          results.push({
            quality,
            success: false,
            error: transcodeResult.error,
          });
        }
      } catch (error: any) {
        console.error(`Error transcoding ${quality}:`, error);
        results.push({
          quality,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    // Update video status back to ready
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "READY" },
    });

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Transcoding completed: ${successCount}/${qualities.length} qualities processed`,
      results,
    });
  } catch (error: any) {
    console.error("Transcoding error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcode video",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

