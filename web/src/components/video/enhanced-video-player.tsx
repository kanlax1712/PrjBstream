"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Download, PictureInPicture, Play, Pause, Maximize, Minimize } from "lucide-react";
import { formatDuration, formatRelative } from "@/lib/format";
import { SubscribeButton } from "@/components/video/subscribe-button";
import type { Session } from "next-auth";

type Props = {
  video: {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    duration: number;
    tags: string;
    publishedAt: Date;
    channel: {
      id: string;
      name: string;
      handle: string;
    };
  };
  session: Session | null;
  isSubscribed: boolean;
};

const QUALITY_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "480p", label: "480p (SD)" },
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function EnhancedVideoPlayer({ video, session, isSubscribed }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [volume, setVolume] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Get video URL - use API route for better mobile compatibility
  const getVideoUrl = (useDirect = false) => {
    // If it's already an external URL, use it
    if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://")) {
      return video.videoUrl;
    }
    
    // Use direct URL as fallback or if requested
    if (useDirect) {
      if (video.videoUrl.startsWith("/")) {
        return typeof window !== "undefined" 
          ? `${window.location.origin}${video.videoUrl}`
          : video.videoUrl;
      }
      return video.videoUrl;
    }
    
    // Use API route for streaming (better for mobile with proper headers)
    return `/api/video/${video.id}/stream`;
  };

  // Initialize video source - use API route by default, fallback to direct URL
  const [videoSrc, setVideoSrc] = useState<string>(() => getVideoUrl());

  // Update video source when video changes
  useEffect(() => {
    const url = getVideoUrl();
    setVideoSrc(url);
    setRetryCount(0);
    setVideoError(null);
    setIsLoading(true);
    
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
    }
  }, [video.id, video.videoUrl]);

  // Track view when video starts playing
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    const timer = setTimeout(trackView, 5000);
    return () => clearTimeout(timer);
  }, [video.id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => setCurrentTime(videoElement.currentTime);
    const updateDuration = () => setDuration(videoElement.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    videoElement.addEventListener("timeupdate", updateTime);
    videoElement.addEventListener("loadedmetadata", updateDuration);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      videoElement.removeEventListener("timeupdate", updateTime);
      videoElement.removeEventListener("loadedmetadata", updateDuration);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handleEnded);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Close settings menu when clicking outside
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".settings-menu-container")) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    // TODO: Switch video source based on quality
    // For now, this is a placeholder - in production, you'd switch the video source
    console.log("Quality changed to:", quality);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = video.videoUrl;
    link.download = `${video.title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPictureInPicture(false);
        } else {
          await videoRef.current.requestPictureInPicture();
          setIsPictureInPicture(true);
        }
      } catch (err) {
        console.error("Picture-in-picture error:", err);
      }
    }
  };

  const handleFullscreen = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      if (document.fullscreenElement) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      } else {
        // Enter fullscreen - use video element directly for better mobile support
        if (videoElement.requestFullscreen) {
          await videoElement.requestFullscreen();
        } else if ((videoElement as any).webkitRequestFullscreen) {
          await (videoElement as any).webkitRequestFullscreen();
        } else if ((videoElement as any).mozRequestFullScreen) {
          await (videoElement as any).mozRequestFullScreen();
        } else if ((videoElement as any).msRequestFullscreen) {
          await (videoElement as any).msRequestFullscreen();
        } else if ((videoElement as any).webkitEnterFullscreen) {
          // iOS Safari
          (videoElement as any).webkitEnterFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      // Fallback for mobile - try video element's webkitEnterFullscreen
      if ((videoElement as any).webkitEnterFullscreen) {
        try {
          (videoElement as any).webkitEnterFullscreen();
        } catch (e) {
          console.error("Mobile fullscreen fallback failed:", e);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-black sm:rounded-3xl group video-player-container">
        <video
          ref={videoRef}
          src={videoSrc || undefined}
          className="size-full"
          playsInline
          preload="metadata"
          controls={false}
          muted={false}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setIsLoading(false);
              setVideoError(null);
            }
          }}
          onError={(e) => {
            const error = videoRef.current?.error;
            
            console.error("Video error:", {
              error,
              errorCode: error?.code,
              errorMessage: error?.message,
              currentSrc: videoRef.current?.currentSrc,
              videoSrc,
              networkState: videoRef.current?.networkState,
              readyState: videoRef.current?.readyState,
              retryCount,
            });
            
            // Try fallback to direct URL if API route fails (max 1 retry)
            if (retryCount === 0 && videoSrc.includes("/api/video/")) {
              console.log("API route failed, trying direct URL fallback");
              const fallbackUrl = getVideoUrl(true);
              setVideoSrc(fallbackUrl);
              setRetryCount(1);
              if (videoRef.current) {
                videoRef.current.src = fallbackUrl;
                videoRef.current.load();
              }
              return;
            }
            
            if (error) {
              let errorMessage = "Failed to load video.";
              switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                  errorMessage = "Video loading was aborted. Please try again.";
                  break;
                case error.MEDIA_ERR_NETWORK:
                  errorMessage = "Network error. Please check your connection and try again.";
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMessage = "Video format not supported or corrupted.";
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "Video format not supported on this device.";
                  break;
                default:
                  errorMessage = `Video error (code: ${error.code}). Please try refreshing.`;
              }
              setVideoError(errorMessage);
              setIsLoading(false);
            } else {
              setVideoError("Video source not found or inaccessible.");
              setIsLoading(false);
            }
          }}
          onLoadStart={() => {
            setIsLoading(true);
            setVideoError(null);
          }}
          onCanPlay={() => {
            setIsLoading(false);
            setVideoError(null);
          }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setVideoError(null);
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
            <div className="text-center">
              <p className="text-rose-400 font-semibold mb-2">⚠️ Video Error</p>
              <p className="text-white/70 text-sm mb-4">{videoError}</p>
              <button
                onClick={() => {
                  setVideoError(null);
                  setRetryCount(0);
                  // Try API route first, then fallback
                  const newUrl = retryCount === 0 ? getVideoUrl(false) : getVideoUrl(true);
                  setVideoSrc(newUrl);
                  if (videoRef.current) {
                    videoRef.current.src = newUrl;
                    videoRef.current.load();
                  }
                }}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white/70 text-sm">Loading video...</div>
          </div>
        )}

        {/* Custom Controls Overlay - Always visible on mobile, show on hover on desktop */}
        <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          !isPlaying || showSettings ? "opacity-100" : "opacity-0 md:group-hover:opacity-100 md:opacity-0"
        }`}>
          {/* Progress Bar */}
          <div className="px-4 pb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              onClick={togglePlayPause}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
              type="button"
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>

            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
              aria-label="Fullscreen"
              type="button"
            >
              {isFullscreen ? (
                <Minimize className="size-5" />
              ) : (
                <Maximize className="size-5" />
              )}
            </button>

            {/* Settings Menu */}
            <div className="relative settings-menu-container">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
                aria-label="Settings"
                type="button"
              >
                <Settings className="size-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-52 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/98 p-2.5 shadow-2xl backdrop-blur-md z-50">
                  {/* Quality Selector */}
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-semibold text-white/70">
                      Quality
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {QUALITY_OPTIONS.map((quality) => (
                        <button
                          key={quality.value}
                          onClick={() => {
                            handleQualityChange(quality.value);
                            setShowSettings(false);
                          }}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                            selectedQuality === quality.value
                              ? "bg-cyan-500 text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          }`}
                        >
                          {quality.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-semibold text-white/70">
                      Speed
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            handlePlaybackSpeedChange(speed);
                            setShowSettings(false);
                          }}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                            playbackSpeed === speed
                              ? "bg-cyan-500 text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowSettings(false);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      <Download className="size-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        handlePictureInPicture();
                        setShowSettings(false);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      <PictureInPicture className="size-3.5" />
                      Picture in Picture
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold sm:text-2xl">{video.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60 sm:gap-3 sm:text-sm">
          <span>By {video.channel.name}</span>
          <span>•</span>
          <span>{formatRelative(video.publishedAt)}</span>
          <span>•</span>
          <span>{formatDuration(duration)}</span>
          {session?.user && (
            <>
              <span>•</span>
              <SubscribeButton
                channelId={video.channel.id}
                channelHandle={video.channel.handle}
                isSubscribed={isSubscribed}
              />
            </>
          )}
        </div>
        <p className="mt-3 text-white/70">{video.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-cyan-200">
          {video.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-500/30 px-2 py-1"
              >
                #{tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

