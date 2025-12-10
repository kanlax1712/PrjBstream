"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Youtube, Check, Loader2, CheckSquare, Square } from "lucide-react";
import Image from "next/image";

type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  url: string;
};

type Props = {
  onClose: () => void;
  onImport: (video: YouTubeVideo) => void; // Called for each successfully imported video
};

const MAX_IMPORT_LIMIT = 15; // Maximum videos that can be imported at once

export function YoutubeVideoSelector({ onClose, onImport }: Props) {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Wait for session to be ready before fetching videos
    if (status === "loading") {
      return; // Still loading session
    }
    
    if (status === "unauthenticated") {
      setError("Please sign in with Google to import videos.");
      setIsLoading(false);
      return;
    }
    
    // Session is authenticated, fetch videos
    fetchVideos();
  }, [status]);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/youtube/videos", {
        cache: "no-store", // Ensure fresh data
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in with Google again.");
        }
        throw new Error(data.message || "Failed to fetch videos");
      }

      if (data.success && data.videos) {
        setVideos(data.videos || []);
      } else {
        setVideos([]);
        if (data.message) {
          setError(data.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load YouTube videos";
      setError(errorMessage);
      console.error("YouTube fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        // Check limit
        if (newSet.size >= MAX_IMPORT_LIMIT) {
          setError(`Maximum ${MAX_IMPORT_LIMIT} videos can be imported at once.`);
          return prev;
        }
        newSet.add(videoId);
      }
      setError(""); // Clear error when selection changes
      return newSet;
    });
  };

  const selectAll = () => {
    const maxSelect = Math.min(MAX_IMPORT_LIMIT, videos.length);
    setSelectedVideos(new Set(videos.slice(0, maxSelect).map((v) => v.id)));
    if (videos.length > MAX_IMPORT_LIMIT) {
      setError(`Only ${MAX_IMPORT_LIMIT} videos can be selected at once.`);
    } else {
      setError("");
    }
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
    setError("");
  };

  const handleBatchImport = async () => {
    if (selectedVideos.size === 0) {
      setError("Please select at least one video to import.");
      return;
    }

    if (selectedVideos.size > MAX_IMPORT_LIMIT) {
      setError(`Maximum ${MAX_IMPORT_LIMIT} videos can be imported at once.`);
      return;
    }

    setIsImporting(true);
    setError("");
    setImportProgress({ current: 0, total: selectedVideos.size });

    const videosToImport = videos.filter((v) => selectedVideos.has(v.id));
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      // Import videos one by one with progress tracking
      for (let i = 0; i < videosToImport.length; i++) {
        const video = videosToImport[i];
        setImportProgress({ current: i + 1, total: videosToImport.length });

        try {
          // Ensure description is at least 10 characters (required by API)
          const description =
            video.description && video.description.length >= 10
              ? video.description
              : video.description ||
                "No description available. This video was imported from YouTube.";

          // Use YouTube thumbnail if available, otherwise omit (API will use default)
          const thumbnailUrl =
            video.thumbnailUrl && video.thumbnailUrl.startsWith("http")
              ? video.thumbnailUrl
              : undefined;

          const response = await fetch("/api/youtube/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: video.id,
              title: video.title,
              description: description,
              ...(thumbnailUrl && { thumbnailUrl }), // Only include if valid URL
              videoUrl: video.url,
              duration: video.duration,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            successCount++;
            onImport(video);
          } else {
            failCount++;
            errors.push(`${video.title}: ${data.message || "Import failed"}`);
          }
        } catch (err) {
          failCount++;
          errors.push(`${video.title}: Failed to import`);
        }

        // Small delay to prevent overwhelming the server
        if (i < videosToImport.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Show results
      if (successCount > 0) {
        setError("");
        // Close selector and refresh page to show imported videos
        onClose();
        // Use router to refresh and navigate to studio
        setTimeout(() => {
          window.location.href = "/studio";
        }, 500);
      } else {
        setError(
          `Failed to import all videos. ${errors.slice(0, 3).join("; ")}`
        );
      }
    } catch (err) {
      setError("Failed to import videos. Please try again.");
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <Youtube className="size-6 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold">Import from YouTube</h2>
              <p className="text-xs text-white/50 mt-1">
                Select up to {MAX_IMPORT_LIMIT} videos to import at once
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-cyan-400 mb-4" />
              <p className="text-white/70">Loading your YouTube videos...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
              <p className="text-rose-300 mb-4">{error}</p>
              <button
                onClick={fetchVideos}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                Try Again
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <Youtube className="size-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">No videos found</p>
              <p className="text-sm text-white/50">
                You don't have any videos uploaded to your YouTube channel yet.
              </p>
            </div>
          ) : (
            <>
              {/* Selection Controls */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">
                    {selectedVideos.size} of {Math.min(MAX_IMPORT_LIMIT, videos.length)} selected
                  </span>
                  {selectedVideos.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {videos.length > 0 && selectedVideos.size < Math.min(MAX_IMPORT_LIMIT, videos.length) && (
                  <button
                    onClick={selectAll}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Select All ({Math.min(MAX_IMPORT_LIMIT, videos.length)})
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((video) => {
                  const isSelected = selectedVideos.has(video.id);
                  const isDisabled = !isSelected && selectedVideos.size >= MAX_IMPORT_LIMIT;
                  
                  return (
                    <button
                      key={video.id}
                      onClick={() => toggleVideoSelection(video.id)}
                      disabled={isDisabled}
                      className={`group relative overflow-hidden rounded-2xl border-2 transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/10"
                          : isDisabled
                          ? "border-white/5 bg-white/2 opacity-50 cursor-not-allowed"
                          : "border-white/10 bg-white/5 hover:border-cyan-400/40"
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/20">
                            <div className="rounded-full bg-cyan-500 p-2">
                              <Check className="size-5 text-white" />
                            </div>
                          </div>
                        )}
                        {/* Checkbox indicator */}
                        <div className="absolute top-2 right-2">
                          {isSelected ? (
                            <div className="rounded-full bg-cyan-500 p-1.5">
                              <CheckSquare className="size-4 text-white" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-black/50 p-1.5">
                              <Square className="size-4 text-white/70" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 text-left">
                        <h3 className="line-clamp-2 text-sm font-semibold text-white">
                          {video.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/50">
                          {video.duration} • {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {selectedVideos.size > 0 && !isLoading && videos.length > 0 && (
          <div className="border-t border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">
                  {isImporting
                    ? `Importing ${importProgress.current} of ${importProgress.total}...`
                    : `${selectedVideos.size} video${selectedVideos.size > 1 ? "s" : ""} selected`}
                </p>
                {isImporting && (
                  <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{
                        width: `${(importProgress.current / importProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleBatchImport}
                disabled={isImporting || selectedVideos.size === 0}
                className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </span>
                ) : (
                  `Import ${selectedVideos.size} Video${selectedVideos.size > 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

