"use client";

import { useState, useRef } from "react";
import { Image, Upload, X, Loader2 } from "lucide-react";
import { ThumbnailSelector } from "@/components/forms/thumbnail-selector";

type UpdateThumbnailButtonProps = {
  videoId: string;
  videoUrl: string;
  currentThumbnailUrl?: string | null;
};

export function UpdateThumbnailButton({
  videoId,
  videoUrl,
  currentThumbnailUrl,
}: UpdateThumbnailButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<File | null>(null);

  // Fetch video file for thumbnail extraction
  const loadVideoFile = async () => {
    if (!videoUrl) {
      return null;
    }

    try {
      // Handle both local and remote URLs
      let blob: Blob;
      
      if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
        // For remote URLs, fetch with CORS handling
        const response = await fetch(videoUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        blob = await response.blob();
      } else {
        // For local URLs (relative paths)
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        blob = await response.blob();
      }

      const file = new File([blob], "video.mp4", { type: blob.type || "video/mp4" });
      videoFileRef.current = file;
      return file;
    } catch (err) {
      console.error("Failed to load video file:", err);
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setSelectedThumbnail(url);
      setThumbnailBlob(file);
      setThumbnailUrl("");
    }
  };

  const handleThumbnailSelect = (blob: Blob, timestamp: number) => {
    setThumbnailBlob(blob);
    if (selectedThumbnail && selectedThumbnail.startsWith("blob:")) {
      URL.revokeObjectURL(selectedThumbnail);
    }
    const url = URL.createObjectURL(blob);
    setSelectedThumbnail(url);
    setThumbnailUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!thumbnailBlob && !thumbnailUrl.trim()) {
      setMessage({ type: "error", text: "Please select a thumbnail file or enter a URL." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      
      if (thumbnailBlob) {
        formData.append("thumbnailFile", thumbnailBlob, "thumbnail.jpg");
      } else if (thumbnailUrl.trim()) {
        formData.append("thumbnailUrl", thumbnailUrl.trim());
      }

      const response = await fetch(`/api/video/${videoId}/thumbnail`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update thumbnail");
      }

      setMessage({ type: "success", text: result.message || "Thumbnail updated successfully!" });
      
      // Reset form
      setSelectedThumbnail(null);
      setThumbnailBlob(null);
      setThumbnailUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Close modal after success
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
        // Reload page to show updated thumbnail
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating thumbnail:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update thumbnail. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setMessage(null);
    // Load video file for thumbnail extraction (works for both local and remote URLs)
    if (videoUrl) {
      setMessage({ type: "success", text: "Loading video for thumbnail extraction..." });
      const file = await loadVideoFile();
      if (!file) {
        setMessage({ 
          type: "error", 
          text: "Could not load video file. You can still upload an image or enter a URL." 
        });
      } else {
        setMessage(null);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage(null);
    setSelectedThumbnail(null);
    setThumbnailBlob(null);
    setThumbnailUrl("");
    if (selectedThumbnail && selectedThumbnail.startsWith("blob:")) {
      URL.revokeObjectURL(selectedThumbnail);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
        title="Update thumbnail"
      >
        <Image className="size-3.5" />
        <span className="hidden sm:inline">Thumbnail</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl overflow-y-auto my-auto">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <h2 className="mb-4 text-xl font-semibold">Update Video Thumbnail</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Thumbnail from video file */}
              {videoUrl && (
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Capture Thumbnail from Video
                  </label>
                  {videoFileRef.current ? (
                    <ThumbnailSelector
                      videoFile={videoFileRef.current}
                      onThumbnailSelect={handleThumbnailSelect}
                      selectedThumbnail={selectedThumbnail}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
                      <p>Loading video...</p>
                      <p className="mt-2 text-xs">If this takes too long, you can upload an image or enter a URL below.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              {videoUrl && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="text-xs text-white/40">OR</span>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>
              )}

              {/* Upload image file */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Upload Thumbnail Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-cyan-600"
                />
              </div>

              {/* Or enter URL */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Or Enter Thumbnail URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => {
                    setThumbnailUrl(e.target.value);
                    if (selectedThumbnail && selectedThumbnail.startsWith("blob:")) {
                      URL.revokeObjectURL(selectedThumbnail);
                    }
                    setSelectedThumbnail(null);
                    setThumbnailBlob(null);
                  }}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Preview and Current Thumbnail - Side by side if both exist */}
              {((selectedThumbnail || thumbnailUrl) || (currentThumbnailUrl && !currentThumbnailUrl.includes("default-thumbnail"))) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Preview */}
                  {(selectedThumbnail || thumbnailUrl) && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-white/70">New Thumbnail Preview</p>
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-cyan-500/30 bg-black">
                        <img
                          src={selectedThumbnail || thumbnailUrl}
                          alt="Thumbnail preview"
                          className="size-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Current thumbnail */}
                  {currentThumbnailUrl && !currentThumbnailUrl.includes("default-thumbnail") && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-white/70">Current Thumbnail</p>
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
                        <img
                          src={currentThumbnailUrl}
                          alt="Current thumbnail"
                          className="size-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`rounded-xl border p-3 text-sm ${
                    message.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Actions - Sticky at bottom */}
              <div className="sticky bottom-0 bg-slate-900 pt-4 border-t border-white/10 mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={isUploading || (!thumbnailBlob && !thumbnailUrl.trim())}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      <span>Update Thumbnail</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

