"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ThumbnailSelector } from "./thumbnail-selector";
import { formatDuration } from "@/lib/format";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

type UploadState = {
  success: boolean;
  message: string;
};

export function VideoUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<UploadState>({
    success: false,
    message: "",
  });
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [videoQuality, setVideoQuality] = useState<string>("auto");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [hasAds, setHasAds] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (fileError) {
      return;
    }

    setIsUploading(true);
    setState({ success: false, message: "" });
    setFileError("");

    const formData = new FormData(e.currentTarget);
    
    // Ensure duration is set (use extracted or form value)
    const durationValue = videoDuration > 0 ? videoDuration : parseInt(formData.get("duration")?.toString() || "0");
    if (durationValue <= 0) {
      setState({ 
        success: false, 
        message: "Please ensure video duration is set (minimum 5 seconds). The duration should be automatically detected from the video file." 
      });
      setIsUploading(false);
      return;
    }
    formData.set("duration", durationValue.toString());
    
    // Add selected thumbnail if available
    if (thumbnailBlob) {
      formData.append("thumbnailFile", thumbnailBlob, "thumbnail.jpg");
    }
    
    // Add video quality preference
    formData.append("videoQuality", videoQuality);
    
    // Add hasAds preference
    formData.append("hasAds", hasAds ? "true" : "false");

    try {
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
        return;
      }

      setState({ success: true, message: result.message });
      
      // Reset form using ref
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Reset state
      setVideoFile(null);
      setSelectedThumbnail(null);
      setThumbnailBlob(null);
      setVideoQuality("auto");
      setVideoDuration(0);
      setHasAds(false);
      
      // Refresh the page to show the new video
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setState({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
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
                  setVideoFile(file);
                  setSelectedThumbnail(null);
                  setThumbnailBlob(null);
                  
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
            videoFile={videoFile}
            onThumbnailSelect={(blob, timestamp) => {
              setThumbnailBlob(blob);
              const url = URL.createObjectURL(blob);
              setSelectedThumbnail(url);
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

      <button
        type="submit"
        disabled={isUploading || !!fileError}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Uploading..." : "Publish video"}
      </button>

      {(state.message || fileError) && (
        <p
          className={`text-sm ${
            state.success ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {fileError || state.message}
        </p>
      )}
    </form>
  );
}

