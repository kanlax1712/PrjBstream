import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const execAsync = promisify(exec);

export type QualityConfig = {
  quality: string;
  height: number;
  bitrate: string; // in kbps
  maxBitrate: string; // max bitrate for variable bitrate
  bufsize: string; // buffer size
};

export const QUALITY_CONFIGS: Record<string, QualityConfig> = {
  "480p": {
    quality: "480p",
    height: 480,
    bitrate: "1000k",
    maxBitrate: "1200k",
    bufsize: "2000k",
  },
  "720p": {
    quality: "720p",
    height: 720,
    bitrate: "2500k",
    maxBitrate: "3000k",
    bufsize: "5000k",
  },
  "1080p": {
    quality: "1080p",
    height: 1080,
    bitrate: "5000k",
    maxBitrate: "6000k",
    bufsize: "10000k",
  },
  "1440p": {
    quality: "1440p",
    height: 1440,
    bitrate: "10000k",
    maxBitrate: "12000k",
    bufsize: "20000k",
  },
  "2160p": {
    quality: "2160p",
    height: 2160,
    bitrate: "20000k",
    maxBitrate: "25000k",
    bufsize: "40000k",
  },
};

/**
 * Transcode video to a specific quality using FFmpeg
 * This performs video compression and bitrate adjustment
 */
export async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  config: QualityConfig
): Promise<{
  success: boolean;
  fileSize?: number;
  width?: number;
  height?: number;
  error?: string;
}> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Calculate width maintaining aspect ratio (assuming 16:9)
    const width = Math.round((config.height * 16) / 9);
    // Ensure width is even (required by H.264)
    const evenWidth = width % 2 === 0 ? width : width + 1;

    // FFmpeg command for transcoding with compression and bitrate adjustment
    // Using H.264 codec with variable bitrate (VBR) for better quality/size ratio
    const ffmpegCommand = [
      "ffmpeg",
      "-i", inputPath,
      "-c:v", "libx264", // Video codec: H.264
      "-preset", "medium", // Encoding speed vs compression tradeoff
      "-crf", "23", // Constant Rate Factor (lower = higher quality, 18-28 is typical)
      "-vf", `scale=${evenWidth}:${config.height}`, // Scale to target resolution
      "-b:v", config.bitrate, // Target bitrate
      "-maxrate", config.maxBitrate, // Maximum bitrate for VBR
      "-bufsize", config.bufsize, // Buffer size for rate control
      "-c:a", "aac", // Audio codec
      "-b:a", "128k", // Audio bitrate
      "-movflags", "+faststart", // Enable fast start for web playback
      "-y", // Overwrite output file
      outputPath,
    ].join(" ");

    console.log(`Transcoding to ${config.quality}: ${ffmpegCommand}`);

    // Execute FFmpeg command
    const { stdout, stderr } = await execAsync(ffmpegCommand);

    // Check if output file exists and get its size
    const stats = await fs.stat(outputPath);
    const fileSize = stats.size;

    // Try to get actual video dimensions from output
    // (FFmpeg might adjust dimensions slightly)
    let actualWidth = evenWidth;
    let actualHeight = config.height;

    // Parse FFmpeg output to get actual dimensions if available
    const dimensionMatch = stderr.match(/(\d+)x(\d+)/);
    if (dimensionMatch) {
      actualWidth = parseInt(dimensionMatch[1]);
      actualHeight = parseInt(dimensionMatch[2]);
    }

    return {
      success: true,
      fileSize,
      width: actualWidth,
      height: actualHeight,
    };
  } catch (error: any) {
    console.error(`Transcoding error for ${config.quality}:`, error);
    return {
      success: false,
      error: error.message || "Unknown transcoding error",
    };
  }
}

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(
  videoPath: string
): Promise<{
  width: number;
  height: number;
  duration: number;
  bitrate: number;
  fileSize: number;
} | null> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries stream=width,height,duration,bit_rate -show_entries format=size,duration -of json "${videoPath}"`
    );

    const metadata = JSON.parse(stdout);
    const videoStream = metadata.streams?.find(
      (s: any) => s.codec_type === "video"
    );
    const format = metadata.format;

    if (!videoStream || !format) {
      return null;
    }

    const stats = await fs.stat(videoPath);

    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      duration: parseFloat(format.duration || videoStream.duration || 0),
      bitrate: parseInt(format.bit_rate || videoStream.bit_rate || "0"),
      fileSize: stats.size,
    };
  } catch (error) {
    console.error("Error getting video metadata:", error);
    return null;
  }
}

