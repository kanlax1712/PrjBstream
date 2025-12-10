import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const QUALITIES = ["480p", "720p", "1080p", "1440p", "2160p", "original"];

// Handle HEAD requests for quality availability checks
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string; quality: string }> }
) {
  try {
    const { videoId, quality } = await params;

    if (!QUALITIES.includes(quality)) {
      return new NextResponse(null, { status: 400 });
    }

    // Get video with quality versions
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        qualities: true,
      },
    });

    if (!video) {
      return new NextResponse(null, { status: 404 });
    }

    // Find the requested quality version
    let videoQuality = video.qualities.find((q) => q.quality === quality);

    // If quality not found, try to find original or fallback
    if (!videoQuality) {
      if (quality === "original") {
        // Use original video URL
        const videoPath = path.join(process.cwd(), "public", video.videoUrl);
        const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);
        
        if (fileExists) {
          const stats = await fs.stat(videoPath);
          return new NextResponse(null, {
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": stats.size.toString(),
              "Accept-Ranges": "bytes",
            },
          });
        }
      }
      
      // Fallback to closest available quality
      const qualityOrder = ["2160p", "1440p", "1080p", "720p", "480p", "original"];
      const qualityIndex = qualityOrder.indexOf(quality);
      
      for (let i = qualityIndex; i < qualityOrder.length; i++) {
        const fallbackQuality = video.qualities.find(
          (q) => q.quality === qualityOrder[i]
        );
        if (fallbackQuality) {
          videoQuality = fallbackQuality;
          break;
        }
      }
      
      // If still no quality found, use original
      if (!videoQuality) {
        const videoPath = path.join(process.cwd(), "public", video.videoUrl);
        const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);
        
        if (fileExists) {
          const stats = await fs.stat(videoPath);
          return new NextResponse(null, {
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": stats.size.toString(),
              "Accept-Ranges": "bytes",
            },
          });
        }
      }
    }

    if (!videoQuality) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if quality is ready
    if (videoQuality.status !== "ready") {
      return new NextResponse(null, { status: 202 }); // Accepted but processing
    }

    // Check if file exists
    const videoPath = path.join(process.cwd(), "public", videoQuality.videoUrl);
    const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);

    if (!fileExists) {
      return new NextResponse(null, { status: 404 });
    }

    const stats = await fs.stat(videoPath);

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": stats.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error checking video quality:", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string; quality: string }> }
) {
  try {
    const { videoId, quality } = await params;

    if (!QUALITIES.includes(quality)) {
      return NextResponse.json(
        { error: "Invalid quality. Use: 480p, 720p, 1080p, 1440p, 2160p, or original" },
        { status: 400 }
      );
    }

    // Get video with quality versions
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        qualities: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Find the requested quality version
    let videoQuality = video.qualities.find((q) => q.quality === quality);

    // If quality not found, try to find original or fallback
    if (!videoQuality) {
      if (quality === "original") {
        // Use original video URL
        const videoPath = path.join(process.cwd(), "public", video.videoUrl);
        const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);
        
        if (fileExists) {
          const file = await fs.readFile(videoPath);
          const stats = await fs.stat(videoPath);
          
          return new NextResponse(file, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": stats.size.toString(),
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
      
      // Fallback to closest available quality
      const qualityOrder = ["2160p", "1440p", "1080p", "720p", "480p", "original"];
      const qualityIndex = qualityOrder.indexOf(quality);
      
      for (let i = qualityIndex; i < qualityOrder.length; i++) {
        const fallbackQuality = video.qualities.find(
          (q) => q.quality === qualityOrder[i]
        );
        if (fallbackQuality) {
          videoQuality = fallbackQuality;
          break;
        }
      }
      
      // If still no quality found, use original
      if (!videoQuality) {
        const videoPath = path.join(process.cwd(), "public", video.videoUrl);
        const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);
        
        if (fileExists) {
          const file = await fs.readFile(videoPath);
          const stats = await fs.stat(videoPath);
          
          return new NextResponse(file, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": stats.size.toString(),
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    if (!videoQuality) {
      return NextResponse.json(
        { error: "Video quality not available" },
        { status: 404 }
      );
    }

    // Check if quality is ready
    if (videoQuality.status !== "ready") {
      return NextResponse.json(
        { error: `Video quality is ${videoQuality.status}. Please try again later.` },
        { status: 202 } // Accepted but processing
      );
    }

    // Serve the video file
    const videoPath = path.join(process.cwd(), "public", videoQuality.videoUrl);
    const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);

    if (!fileExists) {
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }

    const file = await fs.readFile(videoPath);
    const stats = await fs.stat(videoPath);

    // Handle range requests for video seeking
    const range = request.headers.get("range");
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;
      const chunk = file.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    }

    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": stats.size.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving video quality:", error);
    return NextResponse.json(
      { error: "Failed to serve video" },
      { status: 500 }
    );
  }
}

