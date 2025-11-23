"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";

type ThumbnailSelectorProps = {
  videoFile: File | null;
  onThumbnailSelect: (thumbnailBlob: Blob, timestamp: number) => void;
  selectedThumbnail: string | null;
};

export function ThumbnailSelector({
  videoFile,
  onThumbnailSelect,
  selectedThumbnail,
}: ThumbnailSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Array<{ url: string; time: number }>>([]);

  // Generate video URL when file changes
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
      setThumbnails([]);
    }
  }, [videoFile]);

  // Generate thumbnails at different timestamps
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      
      const generateThumbnails = async () => {
        const thumbnailTimes = [
          Math.min(1, duration / 10), // 10% of video or 1 second
          Math.min(3, duration / 3), // 33% of video or 3 seconds
          Math.min(5, duration / 2), // 50% of video or 5 seconds
          Math.min(10, duration * 0.7), // 70% of video or 10 seconds
        ].filter((time) => time > 0 && time < duration);

        const generatedThumbnails: Array<{ url: string; time: number }> = [];

        for (const time of thumbnailTimes) {
          try {
            video.currentTime = time;
            await new Promise((resolve) => {
              video.addEventListener("seeked", resolve, { once: true });
            });

            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                generatedThumbnails.push({ url: dataUrl, time });
              }
            }
          } catch (err) {
            console.error("Error generating thumbnail:", err);
          }
        }

        setThumbnails(generatedThumbnails);
      };

      video.addEventListener("loadedmetadata", () => {
        setDuration(video.duration);
        if (video.duration > 0) {
          generateThumbnails();
        }
      });

      video.addEventListener("timeupdate", () => {
        setCurrentTime(video.currentTime);
      });
    }
  }, [videoUrl, duration]);

  const captureThumbnail = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              onThumbnailSelect(blob, video.currentTime);
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  };

  const selectThumbnail = (thumbnail: { url: string; time: number }) => {
    if (videoRef.current) {
      videoRef.current.currentTime = thumbnail.time;
      captureThumbnail();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!videoFile || !videoUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
        <p>Upload a video file to select a thumbnail</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="size-full object-contain"
          playsInline
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.currentTime = time;
                    setCurrentTime(time);
                  }
                }}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <button
              onClick={captureThumbnail}
              className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
            >
              <Download className="size-4" />
              Capture
            </button>
          </div>
        </div>
      </div>

      {selectedThumbnail && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3">
          <p className="mb-2 text-xs font-semibold text-cyan-300">Selected Thumbnail</p>
          <img
            src={selectedThumbnail}
            alt="Selected thumbnail"
            className="w-full rounded-xl"
          />
        </div>
      )}

      {thumbnails.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-white/70">
            Quick Select (click to choose)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {thumbnails.map((thumbnail, index) => (
              <button
                key={index}
                onClick={() => selectThumbnail(thumbnail)}
                className={`relative aspect-video overflow-hidden rounded-xl border-2 transition ${
                  selectedThumbnail === thumbnail.url
                    ? "border-cyan-500"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={thumbnail.url}
                  alt={`Thumbnail at ${formatTime(thumbnail.time)}`}
                  className="size-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white">
                  {formatTime(thumbnail.time)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

