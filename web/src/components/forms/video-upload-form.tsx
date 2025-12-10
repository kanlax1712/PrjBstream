"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThumbnailSelector } from "./thumbnail-selector";
import { YoutubeImportButton } from "./youtube-import-button";
import { formatDuration } from "@/lib/format";
import { Upload, Pencil, FileVideo, Loader2, X } from "lucide-react";

// Helper function to extract thumbnail from video file automatically
async function extractThumbnailFromVideo(videoFile: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const url = URL.createObjectURL(videoFile);
    
    video.src = url;
    video.currentTime = 1; // Extract frame at 1 second
    
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });
    
    video.addEventListener("seeked", () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          "image/jpeg",
          0.9
        );
      } else {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    });
    
    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(null);
    }, 5000);
  });
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

type UploadState = {
  success: boolean;
  message: string;
};

type UploadProgress = {
  stage: "uploading" | "transcoding" | "complete" | "error";
  progress: number; // 0-100
  message: string;
};

export function VideoUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const videoFileRef = useRef<File | null>(null); // Preserve video file across re-renders
  const [state, setState] = useState<UploadState>({
    success: false,
    message: "",
  });
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [videoQuality, setVideoQuality] = useState<string>("auto");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [hasAds, setHasAds] = useState<boolean>(false);
  
  // Check URL parameter to auto-select YouTube import mode
  const youtubeParam = searchParams?.get("youtube");
  const [uploadMethod, setUploadMethod] = useState<"local" | "youtube">(
    youtubeParam === "true" ? "youtube" : "local"
  );
  
  // Auto-switch to YouTube mode if parameter exists
  useEffect(() => {
    if (youtubeParam === "true" && uploadMethod !== "youtube") {
      console.log("🎬 Auto-switching to YouTube import mode");
      setUploadMethod("youtube");
    }
  }, [youtubeParam, uploadMethod]);

  // Sync videoFile state with ref
  useEffect(() => {
    if (videoFile) {
      videoFileRef.current = videoFile;
    }
  }, [videoFile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (fileError) {
      return;
    }

    setIsUploading(true);
    setState({ success: false, message: "" });
    setFileError("");
    setUploadProgress({ stage: "uploading", progress: 0, message: "Preparing upload..." });

    const formData = new FormData(e.currentTarget);
    
    // Ensure video file is in formData (use ref as fallback if state was cleared)
    const currentVideoFile = videoFile || videoFileRef.current;
    if (!currentVideoFile) {
      setState({ 
        success: false, 
        message: "Please select a video file to upload." 
      });
      setIsUploading(false);
      setUploadProgress(null);
      return;
    }
    
    // Ensure video file is in formData
    const existingFile = formData.get("videoFile");
    if (!(existingFile instanceof File) || existingFile.size === 0) {
      // Add video file from state/ref if not in formData
      formData.set("videoFile", currentVideoFile);
      // Also restore state if it was cleared
      if (!videoFile && videoFileRef.current) {
        setVideoFile(videoFileRef.current);
      }
    }
    
    // Ensure duration is set (use extracted or form value)
    const durationValue = videoDuration > 0 ? videoDuration : parseInt(formData.get("duration")?.toString() || "0");
    if (durationValue <= 0) {
      setState({ 
        success: false, 
        message: "Please ensure video duration is set (minimum 5 seconds). The duration should be automatically detected from the video file." 
      });
      setIsUploading(false);
      setUploadProgress(null);
      return;
    }
    formData.set("duration", durationValue.toString());
    
    // Add selected thumbnail if available, or auto-extract from video
    if (thumbnailBlob) {
      formData.append("thumbnailFile", thumbnailBlob, "thumbnail.jpg");
    } else if (videoFile) {
      // Auto-extract thumbnail from video if none selected
      try {
        const autoThumbnail = await extractThumbnailFromVideo(videoFile);
        if (autoThumbnail) {
          formData.append("thumbnailFile", autoThumbnail, "thumbnail.jpg");
        }
      } catch (err) {
        console.warn("Failed to auto-extract thumbnail:", err);
        // Continue without thumbnail - server will create placeholder
      }
    }
    
    // Add video quality preference
    formData.append("videoQuality", videoQuality);
    
    // Add hasAds preference
    formData.append("hasAds", hasAds ? "true" : "false");

    try {
      setUploadProgress({ stage: "uploading", progress: 10, message: "Uploading video file..." });

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState({ 
          success: false, 
          message: result.message || `Upload failed with status ${response.status}` 
        });
        setUploadProgress(null);
        setIsUploading(false);
        return;
      }

      // SDLC: Show success immediately after upload completes
      // Transcoding happens in background and doesn't block the user
      setUploadProgress({ stage: "complete", progress: 100, message: "Upload Successfully!" });
      setState({ success: true, message: `Video "${result.videoId ? 'uploaded' : 'uploaded'}" uploaded successfully!` });
      
      // Reset form using ref
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Close modal and reset state after showing success message
      setTimeout(() => {
        setVideoFile(null);
        setSelectedThumbnail(null);
        setThumbnailBlob(null);
        setVideoQuality("auto");
        setVideoDuration(0);
        setHasAds(false);
        setUploadProgress(null);
        setIsUploading(false);
        
        // Refresh the page to show the new video
        router.refresh();
      }, 2000); // Show success message for 2 seconds, then close
    } catch (error) {
      console.error("Upload error:", error);
      setState({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
      setUploadProgress({ stage: "error", progress: 0, message: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.03] p-6"
    >
      {/* Upload Method Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70">Upload Method</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setUploadMethod("local")}
            className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-4 transition ${
              uploadMethod === "local"
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
            }`}
          >
            <Pencil className="size-5" />
            <span className="font-medium">Upload from Device</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod("youtube")}
            className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-4 transition ${
              uploadMethod === "youtube"
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
            }`}
          >
            {/* YouTube Icon - Free SVG from web */}
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="font-medium">Import from YouTube</span>
          </button>
        </div>
      </div>

      {uploadMethod === "youtube" ? (
        <YoutubeImportButton />
      ) : (
        <>
      <div>
        <label className="text-sm text-white/70">Title</label>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Name your story"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Tell your audience what to expect"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/70">Video file</label>
          <input
            name="videoFile"
            type="file"
            accept="video/*"
            required
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > MAX_FILE_SIZE) {
                  setFileError(
                    `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 2GB limit`,
                  );
                  e.target.value = "";
                  setVideoFile(null);
                  setVideoDuration(0);
                } else {
                  setFileError("");
                  // Preserve video file - don't clear it when selecting thumbnail
                  videoFileRef.current = file; // Store in ref first
                  setVideoFile(file);
                  // Only clear thumbnail if this is a new file selection
                  if (!videoFileRef.current || videoFileRef.current.name !== file.name) {
                    // Revoke old thumbnail URL if exists
                    if (selectedThumbnail && selectedThumbnail.startsWith('blob:')) {
                      URL.revokeObjectURL(selectedThumbnail);
                    }
                    setSelectedThumbnail(null);
                    setThumbnailBlob(null);
                  }
                  
                  // Extract duration from video file
                  try {
                    const video = document.createElement("video");
                    video.preload = "metadata";
                    const objectUrl = URL.createObjectURL(file);
                    video.src = objectUrl;
                    
                    const handleLoadedMetadata = () => {
                      if (video.duration && isFinite(video.duration)) {
                        const duration = Math.floor(video.duration);
                        setVideoDuration(duration);
                        console.log("Video duration extracted:", duration, "seconds");
                      } else {
                        console.warn("Invalid video duration, setting to 0");
                        setVideoDuration(0);
                      }
                      window.URL.revokeObjectURL(objectUrl);
                      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                      video.removeEventListener("error", handleError);
                    };
                    
                    const handleError = () => {
                      console.error("Error loading video metadata");
                      setVideoDuration(0);
                      window.URL.revokeObjectURL(objectUrl);
                      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                      video.removeEventListener("error", handleError);
                    };
                    
                    video.addEventListener("loadedmetadata", handleLoadedMetadata);
                    video.addEventListener("error", handleError);
                    
                    // Fallback timeout in case metadata doesn't load
                    setTimeout(() => {
                      if (video.duration && isFinite(video.duration)) {
                        const duration = Math.floor(video.duration);
                        setVideoDuration(duration);
                      }
                      window.URL.revokeObjectURL(objectUrl);
                    }, 5000);
                  } catch (err) {
                    console.error("Error extracting video duration:", err);
                    setVideoDuration(0);
                  }
                }
              }
            }}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm file:mr-3 file:rounded-xl file:border-none file:bg-white/10 file:px-3 file:py-1 file:text-white focus:border-cyan-400 focus:outline-none"
          />
          <p className="mt-1 text-xs text-white/40">
            Upload MP4/MOV clips up to 2GB. Large files may take longer to upload.
          </p>
          {fileError && (
            <p className="mt-1 text-xs text-rose-300">{fileError}</p>
          )}
        </div>
      </div>

      {/* Thumbnail Selector */}
      {videoFile && (
        <div>
          <label className="text-sm text-white/70 mb-2 block">
            Select Thumbnail from Video
          </label>
          <ThumbnailSelector
            key={videoFile.name} // Force re-render when video file changes
            videoFile={videoFileRef.current || videoFile} // Use ref as fallback
            onThumbnailSelect={(blob, timestamp) => {
              // Preserve video file - don't clear it when capturing thumbnail
              setThumbnailBlob(blob);
              // Revoke old URL if exists
              if (selectedThumbnail && selectedThumbnail.startsWith('blob:')) {
                URL.revokeObjectURL(selectedThumbnail);
              }
              const url = URL.createObjectURL(blob);
              setSelectedThumbnail(url);
              // Restore video file from ref if it was somehow cleared
              if (!videoFile && videoFileRef.current) {
                console.warn("Video file was cleared during thumbnail capture - restoring from ref");
                setVideoFile(videoFileRef.current);
              }
            }}
            selectedThumbnail={selectedThumbnail}
          />
          <p className="mt-2 text-xs text-white/40">
            Choose a frame from your video or use the quick select thumbnails below.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-white/70">
            Thumbnail URL (optional - alternative to video frame)
          </label>
          <input
            name="thumbnailUrl"
            type="url"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            placeholder="https://"
          />
        </div>
        <div>
          <label className="text-sm text-white/70">Duration (seconds)</label>
          <input
            name="duration"
            type="number"
            min="5"
            step="1"
            value={videoDuration || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setVideoDuration(value);
            }}
            required
            className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            placeholder="Auto-detected from video"
          />
          <p className="mt-1 text-xs text-white/40">
            {videoDuration > 0 
              ? `Auto-detected: ${formatDuration(videoDuration)} (editable)` 
              : "Duration will be extracted from video file, or enter manually"}
          </p>
        </div>
        <div>
          <label className="text-sm text-white/70">Tags</label>
          <input
            name="tags"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            placeholder="streaming, creator"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          type="checkbox"
          id="hasAds"
          checked={hasAds}
          onChange={(e) => setHasAds(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0"
        />
        <label htmlFor="hasAds" className="flex-1 cursor-pointer text-sm text-white/80">
          <span className="font-medium">Include 10-second ad before video</span>
          <span className="ml-2 text-xs text-white/50">
            (Monetize your content with pre-roll advertising)
          </span>
        </label>
      </div>

      {/* Upload Progress Overlay */}
      {isUploading && uploadProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {uploadProgress.stage === "uploading" && "Uploading Video"}
                {uploadProgress.stage === "transcoding" && "Processing Video"}
                {uploadProgress.stage === "complete" && "Upload Successfully!"}
                {uploadProgress.stage === "error" && "Error"}
              </h3>
              {uploadProgress.stage !== "complete" && uploadProgress.stage !== "error" && (
                <Loader2 className="size-5 animate-spin text-cyan-400" />
              )}
              {uploadProgress.stage === "complete" && (
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg className="size-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-white/70">{uploadProgress.message}</p>
            </div>

            {uploadProgress.stage === "error" && (
              <button
                onClick={() => {
                  setIsUploading(false);
                  setUploadProgress(null);
                }}
                className="w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                Close
              </button>
            )}

            {uploadProgress.stage === "complete" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-300">{state.message || "Upload Successfully!"}</p>
                <p className="text-xs text-white/50">Transcoding will continue in the background...</p>
              </div>
            )}

            {uploadProgress.stage !== "complete" && uploadProgress.stage !== "error" && (
              <p className="text-xs text-white/50">
                Please wait... Do not close this page or navigate away.
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || !!fileError}
        className="channel-button-ripple w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Processing..." : "Publish video"}
      </button>

      {!isUploading && (state.message || fileError) && (
        <p
          className={`text-sm ${
            state.success ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {fileError || state.message}
        </p>
      )}
        </>
      )}
    </form>
  );
}

