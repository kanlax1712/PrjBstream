"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteVideo } from "@/app/actions/videos";

type Props = {
  videoId: string;
  videoTitle: string;
};

export function DeleteVideoButton({ videoId, videoTitle }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      setError(null);
      return;
    }

    startTransition(async () => {
      try {
        console.log("Attempting to delete video:", videoId);
        const result = await deleteVideo(videoId);
        console.log("Delete result:", result);
        
        if (result.success) {
          // Use window.location for a full page reload to ensure clean state
          window.location.href = "/studio";
        } else {
          const errorMsg = result.message || "Failed to delete video. Please try again.";
          setError(errorMsg);
          alert(errorMsg);
          setShowConfirm(false);
        }
      } catch (error: any) {
        console.error("Delete error:", error);
        const errorMsg = error?.message || "An error occurred while deleting the video. Please try again.";
        setError(errorMsg);
        alert(errorMsg);
        setShowConfirm(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {showConfirm ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
            <span className="text-xs text-rose-300">Delete &quot;{videoTitle}&quot;?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              type="button"
              className="rounded px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Confirm"}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={isPending}
              type="button"
              className="rounded px-2 py-1 text-xs font-medium text-white/60 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            disabled={isPending}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
            title="Delete video"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-300">{error}</p>
      )}
    </div>
  );
}

