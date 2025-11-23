import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID required" },
        { status: 400 }
      );
    }

    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { videoUrl: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Get the file path
    let filePath: string;
    if (video.videoUrl.startsWith("/uploads/")) {
      filePath = path.join(process.cwd(), "public", video.videoUrl);
    } else if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://")) {
      // External URL - redirect to it
      return NextResponse.redirect(video.videoUrl);
    } else {
      filePath = path.join(process.cwd(), "public", "uploads", video.videoUrl);
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    const range = request.headers.get("range");

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".mp4"
        ? "video/mp4"
        : ext === ".webm"
          ? "video/webm"
          : ext === ".mov"
            ? "video/quicktime"
            : "video/mp4";

    // Handle range requests for video seeking
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = await fs.open(filePath, "r");
      const buffer = Buffer.alloc(chunksize);
      await file.read(buffer, 0, chunksize, start);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Full file request
    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Video stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 }
    );
  }
}

