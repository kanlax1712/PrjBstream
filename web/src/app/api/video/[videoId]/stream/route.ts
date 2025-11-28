import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

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

    // Skip YouTube videos - they should use iframe embed, not stream API
    if (video.videoUrl.includes("youtube.com") || video.videoUrl.includes("youtu.be")) {
      return NextResponse.json(
        { error: "YouTube videos must be played via iframe embed, not stream API" },
        { status: 400 }
      );
    }

    // Handle external URLs - proxy through our API to avoid CORS and security issues
    if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://")) {
      const range = request.headers.get("range");
      
      try {
        // Fetch the external video with range support
        const fetchOptions: RequestInit = {
          method: "GET",
          headers: range ? { Range: range } : {},
        };
        
        const externalResponse = await fetch(video.videoUrl, fetchOptions);
        
        if (!externalResponse.ok) {
          console.error("External video fetch failed:", externalResponse.status, externalResponse.statusText);
          return NextResponse.json(
            { error: "Failed to fetch external video" },
            { status: externalResponse.status }
          );
        }
        
        // Get headers from external response
        const contentType = externalResponse.headers.get("content-type") || "video/mp4";
        const contentLength = externalResponse.headers.get("content-length");
        const contentRange = externalResponse.headers.get("content-range");
        const acceptRanges = externalResponse.headers.get("accept-ranges") || "bytes";
        
        // Stream the response instead of loading into memory
        const stream = externalResponse.body;
        
        if (!stream) {
          return NextResponse.json(
            { error: "No video stream available" },
            { status: 500 }
          );
        }
        
        // Handle range requests (partial content)
        if (range && externalResponse.status === 206) {
          const headers = new Headers();
          if (contentRange) headers.set("Content-Range", contentRange);
          if (contentLength) headers.set("Content-Length", contentLength);
          headers.set("Accept-Ranges", acceptRanges);
          headers.set("Content-Type", contentType);
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
          headers.set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
          
          return new NextResponse(stream, {
            status: 206,
            headers,
          });
        }
        
        // Full file response
        const headers = new Headers();
        if (contentLength) headers.set("Content-Length", contentLength);
        headers.set("Accept-Ranges", acceptRanges);
        headers.set("Content-Type", contentType);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        headers.set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        
        return new NextResponse(stream, {
          headers,
        });
      } catch (error) {
        console.error("Error proxying external video:", error);
        return NextResponse.json(
          { error: "Failed to proxy external video", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }

    // Get the file path for local files
    let filePath: string;
    if (video.videoUrl.startsWith("/uploads/")) {
      filePath = path.join(process.cwd(), "public", video.videoUrl);
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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
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
        "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
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

