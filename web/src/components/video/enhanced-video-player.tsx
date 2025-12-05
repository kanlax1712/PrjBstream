"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Download, PictureInPicture, Play, Pause, Maximize, Minimize, Volume2, VolumeX, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDuration, formatRelative } from "@/lib/format";
import { SubscribeButton } from "@/components/video/subscribe-button";
import { VideoAd } from "@/components/video/video-ad";
import type { Session } from "next-auth";

type Props = {
  video: {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string | null;
    duration: number;
    tags: string;
    publishedAt: Date;
    hasAds?: boolean;
    channel: {
      id: string;
      name: string;
      handle: string;
    };
    qualities?: {
      quality: string;
      videoUrl: string;
    }[];
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
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showThumbnail, setShowThumbnail] = useState(true); // Show thumbnail until video plays
  // Initialize ad state based on video.hasAds to avoid hydration mismatch
  const [showAd, setShowAd] = useState(() => {
    // Only show ad on client side to avoid hydration mismatch
    if (typeof window === "undefined") return false;
    return video.hasAds === true;
  });
  const [adCompleted, setAdCompleted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // Relative time - client-side only to avoid hydration mismatch
  // Start with null, will be set after client-side hydration
  const [relativeTime, setRelativeTime] = useState<string | null>(null);
  // Likes/Dislikes state
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [isReacting, setIsReacting] = useState(false);

  // Mark as client-side after mount and calculate relative time
  useEffect(() => {
    setIsClient(true);
    // Calculate relative time on client side only (after hydration)
    setRelativeTime(formatRelative(video.publishedAt));
    
    // Update relative time every minute
    const interval = setInterval(() => {
      setRelativeTime(formatRelative(video.publishedAt));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [video.publishedAt]);

  // Fetch reaction counts and user's reaction
  useEffect(() => {
    if (!isClient) return;
    
    const fetchReactions = async () => {
      try {
        const response = await fetch(`/api/video/${video.id}/reaction`);
        if (response.ok) {
          const data = await response.json();
          setLikeCount(data.likeCount || 0);
          setDislikeCount(data.dislikeCount || 0);
          setUserReaction(data.userReaction || null);
        } else {
          // Log error but don't break the video player
          const errorData = await response.json().catch(() => ({}));
          console.warn("Failed to fetch reactions:", response.status, errorData);
          // Set defaults so UI still works
          setLikeCount(0);
          setDislikeCount(0);
          setUserReaction(null);
        }
      } catch (error) {
        // Network error or other issue - don't break video playback
        console.warn("Error fetching reactions:", error);
        // Set defaults so UI still works
        setLikeCount(0);
        setDislikeCount(0);
        setUserReaction(null);
      }
    };

    fetchReactions();
  }, [video.id, isClient]);

  // Handle like/dislike toggle
  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!session?.user) {
      // Could show a login prompt here
      return;
    }

    if (isReacting) return;

    setIsReacting(true);
    try {
      const response = await fetch(`/api/video/${video.id}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount || 0);
        setDislikeCount(data.dislikeCount || 0);
        setUserReaction(data.userReaction || null);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    } finally {
      setIsReacting(false);
    }
  };

  // Show ad when video has ads enabled (only on client)
  useEffect(() => {
    if (!isClient) return;
    
    if (video.hasAds && !adCompleted) {
      setShowAd(true);
      // Pause video while ad is showing and prevent loading
      if (videoRef.current) {
        videoRef.current.pause();
        // Prevent video from trying to load while ad is showing
        videoRef.current.load();
      }
    } else {
      setShowAd(false);
    }
  }, [video.hasAds, adCompleted, isClient]);

  // Check if video is from YouTube
  const isYouTubeVideo = () => {
    try {
      if (!video.videoUrl) return false;
      const url = video.videoUrl.trim();
      return url.includes("youtube.com") || url.includes("youtu.be");
    } catch (error) {
      console.error("Error checking if YouTube video:", error);
      return false;
    }
  };

  // Extract YouTube video ID with error handling
  const getYouTubeVideoId = () => {
    try {
      if (!video.videoUrl) return null;
      const url = video.videoUrl.trim();
      
      // Handle youtube.com/watch?v=VIDEO_ID
      const watchMatch = url.match(/[?&]v=([^&]+)/);
      if (watchMatch && watchMatch[1]) return watchMatch[1];
      
      // Handle youtu.be/VIDEO_ID
      const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
      if (shortMatch && shortMatch[1]) return shortMatch[1];
      
      // Handle youtube.com/embed/VIDEO_ID
      const embedMatch = url.match(/\/embed\/([^?&]+)/);
      if (embedMatch && embedMatch[1]) return embedMatch[1];
      
      return null;
    } catch (error) {
      console.error("Error extracting YouTube video ID:", error);
      return null;
    }
  };

  // Get YouTube embed URL with error handling (client-side only to avoid hydration mismatch)
  const getYouTubeEmbedUrl = (autoplay = false) => {
    try {
      // Only generate URL on client side to avoid hydration mismatch
      if (typeof window === "undefined") {
        return null;
      }
      
      const videoId = getYouTubeVideoId();
      if (!videoId) {
        console.error("Could not extract YouTube video ID from URL:", video.videoUrl);
        return null;
      }
      
      // Validate video ID format (should be 11 characters, alphanumeric, hyphens, underscores)
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        console.error("Invalid YouTube video ID format:", videoId);
        return null;
      }
      
      const params = new URLSearchParams({
        enablejsapi: "1",
        origin: window.location.origin, // Always use client-side origin
        rel: "0", // Don't show related videos
        modestbranding: "1", // Hide YouTube logo
        playsinline: "1", // Play inline on mobile
      });
      if (autoplay) {
        params.set("autoplay", "1");
      }
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    } catch (error) {
      console.error("Error creating YouTube embed URL:", error);
      return null;
    }
  };

  // Get video URL - handle both external and local videos
  const getVideoUrl = (useDirect = false) => {
    // Validate video URL
    if (!video.videoUrl || video.videoUrl.trim() === "") {
      console.error("Video URL is empty or invalid");
      return `/api/video/${video.id}/stream`;
    }

    const url = video.videoUrl.trim();
    
    // YouTube videos are handled separately with iframe
    if (isYouTubeVideo()) {
      return null; // Will use iframe instead
    }
    
    // If it's already an external URL (http/https), use it directly
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // For local files, use direct URL
    if (url.startsWith("/")) {
      return typeof window !== "undefined" 
        ? `${window.location.origin}${url}`
        : url;
    }
    
    // Fallback: try API route for local files only
    if (!useDirect) {
      return `/api/video/${video.id}/stream`;
    }
    
    // If URL doesn't start with /, it might be a relative path - make it absolute
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${url.startsWith("/") ? url.slice(1) : url}`;
    }
    
    return url;
  };

  // Initialize video source - use API route for non-YouTube videos
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    // YouTube videos use iframe, not video element - don't set videoSrc
    if (isYouTubeVideo()) {
      return ""; // Empty string - will use iframe instead
    }
    // Always use API route which handles both external and local videos
    // This avoids CORS issues and URL safety checks
    return `/api/video/${video.id}/stream`;
  });

  // Update video source when video changes with error handling
  useEffect(() => {
    try {
      // Don't load video if ad is showing - wait until ad completes
      if (showAd && !adCompleted) {
        return;
      }
      
      // YouTube videos use iframe, skip video element setup
      if (isYouTubeVideo()) {
        // Validate YouTube URL before setting up
        const videoId = getYouTubeVideoId();
        if (!videoId) {
          setVideoError("Invalid YouTube video URL. Please check the video link.");
          setIsLoading(false);
          return;
        }
        
        // Check if embed URL can be created
        const embedUrl = getYouTubeEmbedUrl(false);
        if (!embedUrl) {
          setVideoError("Unable to create YouTube embed URL. The video may be invalid.");
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true); // Will be set to false when iframe loads
        setVideoError(null);
        return;
      }
      
      // Always use API route which proxies external URLs to avoid CORS and security issues
      const finalUrl = `/api/video/${video.id}/stream`;
      
      console.log("Setting video source:", { 
        originalUrl: video.videoUrl, 
        finalUrl, 
        videoId: video.id 
      });
      
      setVideoSrc(finalUrl);
      setRetryCount(0);
      setVideoError(null);
      setIsLoading(true);
      
      if (videoRef.current) {
        try {
          // Set crossOrigin for API route
          videoRef.current.crossOrigin = "anonymous";
          // Set src attribute
          videoRef.current.src = finalUrl;
          videoRef.current.load();
        } catch (error) {
          console.error("Error setting video source:", error);
          setVideoError("Failed to load video source. Please try again.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Unexpected error in video source update:", error);
      setVideoError("An unexpected error occurred while loading the video.");
      setIsLoading(false);
    }
  }, [video.id, video.videoUrl, showAd, adCompleted]);

  // Track view when video starts playing
  useEffect(() => {
    const trackView = async () => {
      try {
        const response = await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });
        
        // Silently handle 404 (video might be deleted) and other errors
        if (!response.ok && response.status !== 404) {
          console.error("Failed to track view:", response.status, response.statusText);
        }
      } catch (error) {
        // Silently handle network errors (video might be deleted or network issue)
        // Don't log to console to avoid noise
      }
    };

    const timer = setTimeout(trackView, 5000);
    return () => clearTimeout(timer);
  }, [video.id]);

  // Listen for YouTube iframe events with comprehensive error handling
  useEffect(() => {
    if (!isYouTubeVideo()) return;

    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        // Only accept messages from YouTube
        if (event.origin !== "https://www.youtube.com") return;

        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          
          if (data.event === "onStateChange") {
            // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (data.info === 1) {
              setIsPlaying(true);
              setVideoError(null); // Clear any previous errors
              setShowThumbnail(false); // Hide thumbnail when YouTube video starts playing
            } else if (data.info === 2 || data.info === 0) {
              setIsPlaying(false);
              if (data.info === 0) {
                // Video ended
                setShowThumbnail(true); // Show thumbnail again when video ends
              }
            } else if (data.info === -1) {
              // Video unstarted - might be loading or error
              setIsLoading(true);
            } else if (data.info === 3) {
              // Buffering
              setIsLoading(true);
            }
          } else if (data.event === "onReady") {
            setIsLoading(false);
            setVideoError(null);
          } else if (data.event === "onError") {
            // YouTube player error
            console.error("YouTube player error:", data);
            setVideoError("YouTube video failed to load. The video may be private, deleted, or unavailable.");
            setIsLoading(false);
          }
        } catch (parseError) {
          // Ignore parse errors for non-JSON messages
          // YouTube sends various message types, not all are JSON
        }
      } catch (error) {
        console.error("Error handling YouTube message:", error);
      }
    };

    try {
      window.addEventListener("message", handleYouTubeMessage);
      return () => {
        try {
          window.removeEventListener("message", handleYouTubeMessage);
        } catch (error) {
          console.error("Error removing YouTube message listener:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up YouTube message listener:", error);
    }
  }, [video.id, video.videoUrl]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || isYouTubeVideo()) return; // Skip for YouTube videos

    const updateTime = () => setCurrentTime(videoElement.currentTime);
    const updateDuration = () => setDuration(videoElement.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      setShowThumbnail(false); // Hide thumbnail when video starts playing
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setShowThumbnail(true); // Show thumbnail again when video ends
    };

    videoElement.addEventListener("timeupdate", updateTime);
    videoElement.addEventListener("loadedmetadata", updateDuration);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);

    // Fullscreen change listener - check multiple ways for Safari compatibility
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement ||
        (videoElement as any).webkitDisplayingFullscreen
      );
      setIsFullscreen(isFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    // Safari-specific fullscreen events
    videoElement.addEventListener("webkitbeginfullscreen", handleFullscreenChange);
    videoElement.addEventListener("webkitendfullscreen", handleFullscreenChange);

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
      videoElement.removeEventListener("webkitbeginfullscreen", handleFullscreenChange);
      videoElement.removeEventListener("webkitendfullscreen", handleFullscreenChange);
    };
  }, [isYouTubeVideo]);

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
    try {
      // Don't allow playback if ad is showing
      if (showAd && !adCompleted) {
        return;
      }
      
      // Handle YouTube iframe
      if (isYouTubeVideo() && typeof window !== "undefined") {
        // Only send postMessage if iframe is ready
        if (!youtubeIframeReady) {
          console.debug("YouTube iframe not ready yet, waiting for load...");
          return;
        }
        
        try {
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (!iframe) {
            console.warn("YouTube iframe not found for video:", video.id);
            return;
          }
          
          // Double-check iframe is ready
          if (!iframe.contentWindow) {
            console.warn("YouTube iframe contentWindow not available");
            setYoutubeIframeReady(false);
            return;
          }
          
          const iframeSrc = iframe.src;
          if (!iframeSrc || !iframeSrc.includes("youtube.com")) {
            console.warn("YouTube iframe src not valid");
            setYoutubeIframeReady(false);
            return;
          }
          
          const command = isPlaying ? "pauseVideo" : "playVideo";
          // Use try-catch for postMessage in case of CORS or security errors
          try {
            // Only send postMessage if iframe is from YouTube origin
            const iframeUrl = new URL(iframeSrc);
            if (iframeUrl.origin !== "https://www.youtube.com") {
              console.warn("Iframe origin mismatch, cannot send postMessage");
              return;
            }
            
            // Ensure we're sending to the correct origin
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: command, args: "" }),
              "https://www.youtube.com"
            );
            setIsPlaying(!isPlaying);
          } catch (postError) {
            // Silently fail - postMessage errors are common and don't break functionality
            // The user can still control the video using YouTube's native controls
            console.debug("YouTube postMessage failed:", postError);
            // Don't update state if postMessage fails - let YouTube handle it
          }
        } catch (error) {
          console.error("Error controlling YouTube video:", error);
          // Don't set error state - YouTube videos can still be controlled manually
        }
        return;
      }
      
      // Handle regular video element
      if (videoRef.current) {
        try {
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            videoRef.current.play().catch((playError) => {
              console.error("Error playing video:", playError);
              setVideoError("Failed to play video. Please try again.");
            });
          }
        } catch (error) {
          console.error("Error toggling video playback:", error);
          setVideoError("Unable to control video playback.");
        }
      }
    } catch (error) {
      console.error("Unexpected error in togglePlayPause:", error);
      setVideoError("An unexpected error occurred. Please refresh the page.");
    }
  };

  // Handle click on video player to play/pause (YouTube-style)
  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on controls or iframe (YouTube handles its own clicks)
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest(".settings-menu-container") ||
      target.closest("iframe") ||
      target.tagName === "IFRAME"
    ) {
      return;
    }
    
    // Handle YouTube videos - trigger play via postMessage
    if (isYouTubeVideo() && typeof window !== "undefined") {
      // Only play if iframe is ready and video is not playing
      if (youtubeIframeReady && !isPlaying) {
        try {
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            const iframeSrc = iframe.src;
            if (iframeSrc && iframeSrc.includes("youtube.com")) {
              // Send play command to YouTube iframe
              iframe.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: "playVideo", args: "" }),
                "https://www.youtube.com"
              );
              setIsPlaying(true);
              setShowThumbnail(false); // Hide thumbnail when playing
            }
          }
        } catch (error) {
          console.error("Error playing YouTube video:", error);
          // Fallback: click on iframe directly (if it's visible)
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (iframe) {
            // Try to click the iframe (YouTube will handle it)
            iframe.click();
          }
        }
      }
      return;
    }
    
    // Handle regular videos
    if (!isYouTubeVideo()) {
      togglePlayPause();
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    setAdCompleted(true);
    
    // Handle YouTube videos differently
    if (isYouTubeVideo()) {
      // For YouTube, just show the iframe (no autoplay)
      // User can click to play
      return;
    }
    
    // Load video after ad completes
    if (videoRef.current) {
      const finalUrl = `/api/video/${video.id}/stream`;
      videoRef.current.crossOrigin = "anonymous";
      videoRef.current.src = finalUrl;
      videoRef.current.load();
      // Don't auto-play - browser blocks autoplay without user interaction
      // The play button will be visible for user to click
      // This is expected behavior - user must interact to play
    }
  };

  const handleAdSkip = () => {
    setShowAd(false);
    setAdCompleted(true);
    
    // Handle YouTube videos differently
    if (isYouTubeVideo()) {
      // For YouTube, update embed URL with autoplay (skip button = user interaction)
      const autoplayUrl = getYouTubeEmbedUrl(true);
      if (autoplayUrl) {
        setYoutubeEmbedUrl(autoplayUrl);
        setYoutubeIframeReady(false); // Reset ready state when URL changes
      }
      return;
    }
    
    // Load and play video after ad is skipped (skip button click = user interaction)
    if (videoRef.current) {
      const finalUrl = `/api/video/${video.id}/stream`;
      videoRef.current.crossOrigin = "anonymous";
      videoRef.current.src = finalUrl;
      videoRef.current.load();
      // Skip button click counts as user interaction, so we can play
      videoRef.current.addEventListener("canplay", () => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.error("Error playing video after ad skip:", err);
            // If play fails, user can click play button
          });
        }
      }, { once: true });
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
    e.stopPropagation(); // Prevent video click handler
    const vol = parseFloat(e.target.value);
    
    // Handle YouTube videos
    if (isYouTubeVideo() && typeof window !== "undefined" && youtubeIframeReady) {
      try {
        const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          // YouTube volume is 0-100, our slider is 0-1
          const youtubeVolume = Math.round(vol * 100);
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "setVolume", args: [youtubeVolume] }),
              "https://www.youtube.com"
            );
            setVolume(vol);
            setIsMuted(vol === 0);
          } catch (postError) {
            console.debug("YouTube volume postMessage failed:", postError);
          }
        }
      } catch (error) {
        console.error("Error setting YouTube volume:", error);
      }
      return;
    }
    
    // Handle regular videos
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent video click handler
    }
    
    if (isMuted) {
      // Unmute - restore previous volume or set to 0.5 if was 0
      const newVolume = volume === 0 ? 0.5 : volume;
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = false;
        setVolume(newVolume);
      }
      setIsMuted(false);
      
      // Handle YouTube videos
      if (isYouTubeVideo() && typeof window !== "undefined" && youtubeIframeReady) {
        try {
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            const youtubeVolume = Math.round(newVolume * 100);
            try {
              iframe.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: "setVolume", args: [youtubeVolume] }),
                "https://www.youtube.com"
              );
            } catch (postError) {
              console.debug("YouTube unmute postMessage failed:", postError);
            }
          }
        } catch (error) {
          console.error("Error unmuting YouTube video:", error);
        }
      }
    } else {
      // Mute
      if (videoRef.current) {
        videoRef.current.muted = true;
        // Keep volume value but mute the audio
      }
      setIsMuted(true);
      
      // Handle YouTube videos
      if (isYouTubeVideo() && typeof window !== "undefined" && youtubeIframeReady) {
        try {
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: "setVolume", args: [0] }),
                "https://www.youtube.com"
              );
            } catch (postError) {
              console.debug("YouTube mute postMessage failed:", postError);
            }
          }
        } catch (error) {
          console.error("Error muting YouTube video:", error);
        }
      }
    }
  };

  const handleQualityChange = async (quality: string) => {
    setSelectedQuality(quality);
    
    // Switch video source based on quality
    if (quality === "auto") {
      // Use original video URL or API route
      const url = getVideoUrl();
      if (url) {
        setVideoSrc(url);
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
        }
      }
    } else {
      // Use quality-specific API route
      const qualityUrl = `/api/video/${video.id}/quality/${quality}`;
      setVideoSrc(qualityUrl);
      if (videoRef.current) {
        videoRef.current.src = qualityUrl;
        videoRef.current.load();
      }
    }
    
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

  const handleFullscreen = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent video click handler
    }
    
    // Handle YouTube videos - YouTube iframe handles fullscreen via allowFullScreen attribute
    if (isYouTubeVideo()) {
      try {
        const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
        if (iframe) {
          // For YouTube, we can request fullscreen on the container or let YouTube handle it
          // YouTube's native fullscreen button in the iframe will work
          // But we can also request fullscreen on the container
          const container = iframe.closest(".video-player-container") as HTMLElement;
          if (container) {
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
              // Enter fullscreen on container
              if (container.requestFullscreen) {
                await container.requestFullscreen();
              } else if ((container as any).webkitRequestFullscreen) {
                await (container as any).webkitRequestFullscreen();
              } else if ((container as any).mozRequestFullScreen) {
                await (container as any).mozRequestFullScreen();
              } else if ((container as any).msRequestFullscreen) {
                await (container as any).msRequestFullscreen();
              }
              setIsFullscreen(true);
            }
          }
        }
      } catch (err) {
        console.error("YouTube fullscreen error:", err);
      }
      return;
    }
    
    // Handle regular videos
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

  // YouTube embed URL - only generate on client to avoid hydration mismatch
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);
  const [youtubeIframeReady, setYoutubeIframeReady] = useState(false);
  
  // Generate YouTube embed URL only on client side
  useEffect(() => {
    if (isClient && isYouTubeVideo()) {
      const embedUrl = getYouTubeEmbedUrl(false);
      setYoutubeEmbedUrl(embedUrl);
      setYoutubeIframeReady(false); // Reset ready state when URL changes
    }
  }, [isClient, video.videoUrl, video.id]);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 -mx-4 sm:mx-0">
      <div 
        className="relative aspect-video overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-white/0 sm:border-white/5 bg-black group video-player-container cursor-pointer"
        onClick={handleVideoClick}
      >
        {/* Ad Overlay - Only show on client to avoid hydration mismatch */}
        {isClient && showAd && !adCompleted && video.hasAds && (
          <VideoAd
            onComplete={handleAdComplete}
            onSkip={handleAdSkip}
            duration={5}
          />
        )}
        
        {/* YouTube iframe embed with error handling - only render on client to avoid hydration mismatch */}
        {isClient && youtubeEmbedUrl && (
          <>
            <iframe
              data-video-id={video.id}
              src={youtubeEmbedUrl}
              className="absolute inset-0 size-full pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ 
                display: showAd && !adCompleted ? "none" : showThumbnail ? "none" : "block",
                zIndex: showThumbnail ? 5 : 10
              }}
              onLoad={() => {
                try {
                  setIsLoading(false);
                  setVideoError(null);
                  // Keep thumbnail visible until user clicks play (YouTube handles its own thumbnail)
                  // Mark iframe as ready for postMessage after a short delay
                  // This ensures the iframe is fully initialized
                  setTimeout(() => {
                    setYoutubeIframeReady(true);
                  }, 500);
                } catch (error) {
                  console.error("Error in YouTube iframe onLoad:", error);
                  setYoutubeIframeReady(false);
                }
              }}
              onError={(e) => {
                console.error("YouTube iframe load error:", e);
                setVideoError("Failed to load YouTube video. The video may be unavailable or restricted.");
                setIsLoading(false);
              }}
              title={video.title}
            />
            
            {/* Error message overlay for YouTube videos */}
            {videoError && isYouTubeVideo() && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 z-10">
                <div className="text-center max-w-md">
                  <p className="text-rose-400 font-semibold mb-2">⚠️ Video Error</p>
                  <p className="text-white/70 text-sm mb-4">{videoError}</p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
                    >
                      Watch on YouTube
                    </a>
                    <button
                      onClick={() => {
                        setVideoError(null);
                        setIsLoading(true);
                        // Force iframe reload
                        const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
                        if (iframe) {
                          iframe.src = iframe.src; // Reload iframe
                        }
                      }}
                      className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Thumbnail overlay (YouTube-style) - shows before video plays */}
        {isClient && showThumbnail && !isLoading && !videoError && (
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center bg-black cursor-pointer"
            style={{ display: showAd && !adCompleted ? "none" : "block" }}
            onClick={handleVideoClick}
          >
            {(() => {
              // Get thumbnail URL - handle YouTube, regular videos, and defaults
              let thumbnailUrl: string | null = null;
              
              if (isYouTubeVideo()) {
                // For YouTube, use YouTube thumbnail API
                const videoId = getYouTubeVideoId();
                if (videoId) {
                  thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                }
              } else if (video.thumbnailUrl && !video.thumbnailUrl.includes("placeholder") && !video.thumbnailUrl.startsWith("data:")) {
                // Use provided thumbnail
                thumbnailUrl = video.thumbnailUrl;
              } else {
                // Default thumbnail
                thumbnailUrl = "/uploads/default-thumbnail.svg";
              }
              
              return thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={video.title}
                  className="size-full object-cover pointer-events-none"
                />
              ) : null;
            })()}
            {/* Play button overlay - always show when thumbnail is visible */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex size-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition hover:bg-black/80 pointer-events-auto">
                  <Play className="size-10 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Regular video element (for non-YouTube videos only) */}
        {!isYouTubeVideo() && videoSrc && !videoSrc.includes("youtube.com") && !videoSrc.includes("youtu.be") && (
          <video
          ref={videoRef}
          src={videoSrc}
          poster={video.thumbnailUrl && !video.thumbnailUrl.includes("placeholder") && !video.thumbnailUrl.startsWith("data:")
            ? video.thumbnailUrl
            : undefined}
          className="size-full"
          playsInline
          preload="metadata"
          controls={false}
          muted={false}
          style={{ display: isClient && showAd && !adCompleted ? "none" : "block" }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setIsLoading(false);
              setVideoError(null);
              // Sync volume state with video element
              setVolume(videoRef.current.volume);
              setIsMuted(videoRef.current.volume === 0 || videoRef.current.muted);
              // Don't auto-play if ad is showing
              if (showAd && !adCompleted) {
                videoRef.current.pause();
              }
            }
          }}
          onError={(e) => {
            // Ignore errors while ad is showing - video will load after ad completes
            if (showAd && !adCompleted) {
              console.log("Video error during ad playback - will retry after ad completes");
              return;
            }
            
            // Skip error handling for YouTube videos - they use iframe, not video element
            if (isYouTubeVideo()) {
              console.log("Video error for YouTube video - this should not happen as YouTube uses iframe");
              return;
            }
            
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
            
            // Try fallback strategies (only for non-YouTube videos)
            if (retryCount === 0) {
              let fallbackUrl: string;
              
              // Never use YouTube URLs as fallback - they must use iframe
              if (video.videoUrl.includes("youtube.com") || video.videoUrl.includes("youtu.be")) {
                console.error("Cannot use YouTube URL as video source - must use iframe");
                setVideoError("YouTube videos must be played via iframe. Please refresh the page.");
                setIsLoading(false);
                return;
              }
              
              // If API route failed, try direct external URL as fallback (only for non-YouTube)
              if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://")) {
                console.log("API route failed, trying direct external URL fallback");
                fallbackUrl = video.videoUrl;
                // Remove crossOrigin for direct external URLs
                if (videoRef.current) {
                  videoRef.current.removeAttribute("crossorigin");
                  videoRef.current.crossOrigin = null;
                }
              } else {
                // For local files, retry API route
                console.log("API route failed, retrying");
                fallbackUrl = `/api/video/${video.id}/stream`;
                if (videoRef.current) {
                  videoRef.current.crossOrigin = "anonymous";
                }
              }
              
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
            // Don't allow playback if ad is showing
            if (showAd && !adCompleted) {
              if (videoRef.current) {
                videoRef.current.pause();
              }
              return;
            }
            setIsLoading(false);
            setVideoError(null);
            setShowThumbnail(false); // Hide thumbnail when video starts playing
          }}
        >
          {/* Fallback source tags for maximum browser compatibility */}
          {videoSrc && videoSrc !== "/video" && (
            <>
              <source src={videoSrc} type="video/mp4" />
              <source src={videoSrc} />
            </>
          )}
          {/* Original URL as additional fallback (only if different and valid, and NOT YouTube) */}
          {video.videoUrl && 
           video.videoUrl !== videoSrc && 
           video.videoUrl !== "/video" &&
           !video.videoUrl.includes("youtube.com") &&
           !video.videoUrl.includes("youtu.be") &&
           (video.videoUrl.startsWith("http") || video.videoUrl.startsWith("/")) && (
            <>
              <source src={video.videoUrl} type="video/mp4" />
              <source src={video.videoUrl} />
            </>
          )}
          Your browser does not support the video tag.
        </video>
        )}
        
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
                  if (newUrl) {
                    setVideoSrc(newUrl);
                    if (videoRef.current) {
                      videoRef.current.src = newUrl;
                      videoRef.current.load();
                    }
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
          {/* Progress Bar - Only show for non-YouTube videos (YouTube has its own controls) */}
          {!isYouTubeVideo() && (
            <div className="px-4 pb-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          )}

          {/* Control Bar */}
          <div className="relative flex items-center gap-2 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
              type="button"
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
                aria-label={isMuted ? "Unmute" : "Mute"}
                type="button"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
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
            <div className="relative settings-menu-container z-50 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:bg-white/40 touch-manipulation"
                aria-label="Settings"
                type="button"
              >
                <Settings className="size-5" />
              </button>
            </div>
          </div>

          {/* Settings Panel - Positioned relative to control bar, not button */}
          {showSettings && (
            <>
              {/* Backdrop to close on outside click */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowSettings(false)}
                style={{ pointerEvents: 'auto' }}
              />
              {/* Settings Panel - Positioned above the control bar */}
              <div 
                className={`absolute right-4 w-56 overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-slate-900/98 p-2.5 shadow-2xl backdrop-blur-md settings-panel-scroll ${
                  isFullscreen ? 'z-[9999]' : 'z-50'
                }`}
                style={{
                  position: 'absolute', // Overlay - doesn't push content
                  bottom: '72px', // Position above control bar (40px button + 16px padding + 16px gap)
                  maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '280px', // Reduced height to ensure scrolling is needed
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.2)',
                  WebkitOverflowScrolling: 'touch',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  // Ensure it appears above content without affecting layout
                  pointerEvents: 'auto',
                  // Force scrollbar to be visible when content overflows
                  overscrollBehavior: 'contain',
                }}
                onScroll={(e) => e.stopPropagation()}
                onWheel={(e) => {
                  e.stopPropagation();
                  // Allow scrolling within the settings panel
                }}
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Quality Selector */}
                  <div className="mb-2.5">
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
                  <div className="mb-2.5">
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

                  {/* Additional Options - More visible */}
                  <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2 mt-2">
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowSettings(false);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 active:bg-white/30"
                    >
                      <Download className="size-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePictureInPicture();
                        setShowSettings(false);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 active:bg-white/30"
                    >
                      <PictureInPicture className="size-4" />
                      <span>Picture in Picture</span>
                    </button>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold sm:text-2xl">{video.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60 sm:gap-3 sm:text-sm">
          <span>By {video.channel.name}</span>
          <span>•</span>
          <span suppressHydrationWarning>
            {relativeTime || ""}
          </span>
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
        
        {/* Like/Dislike Buttons */}
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => handleReaction("LIKE")}
            disabled={isReacting || !session?.user}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              userReaction === "LIKE"
                ? "bg-cyan-500 text-white hover:bg-cyan-600"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            } ${!session?.user ? "opacity-50 cursor-not-allowed" : ""}`}
            type="button"
          >
            <ThumbsUp className="size-4" />
            <span>{likeCount}</span>
          </button>
          <button
            onClick={() => handleReaction("DISLIKE")}
            disabled={isReacting || !session?.user}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              userReaction === "DISLIKE"
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            } ${!session?.user ? "opacity-50 cursor-not-allowed" : ""}`}
            type="button"
          >
            <ThumbsDown className="size-4" />
            <span>{dislikeCount}</span>
          </button>
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

