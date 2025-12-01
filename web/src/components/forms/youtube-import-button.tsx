"use client";

import { useState, useEffect } from "react";
import { Youtube, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { YoutubeVideoSelector } from "./youtube-video-selector";

export function YoutubeImportButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch videos if user just authenticated via Google OAuth
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("youtube") === "true") {
        fetchVideos();
      }
    }
  }, [status, session]);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/youtube/videos");
      if (response.ok) {
        setShowSelector(true);
      } else if (response.status === 401) {
        // Need to authenticate with Google
        await signIn("google", {
          callbackUrl: "/studio?youtube=true",
        });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to fetch YouTube videos. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to YouTube. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleYoutubeClick = async () => {
    setError("");
    
    // If user is already authenticated, try to fetch videos
    if (status === "authenticated" && session?.user) {
      await fetchVideos();
      return;
    }
    
    // Check if Google OAuth is configured
    setIsLoading(true);
    try {
      const configCheck = await fetch("/api/auth/test-google");
      const config = await configCheck.json();
      
      if (!config.configured) {
        setError(`Google OAuth not configured: ${config.message}. Please check your environment variables.`);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("Config check error:", err);
    }
    
    // If not authenticated, directly initiate Google OAuth
    setIsLoading(true);
    try {
      // Use NextAuth signIn function which handles OAuth flow properly
      // When redirect: true, signIn returns void and redirects automatically
      await signIn("google", {
        callbackUrl: "/studio?youtube=true",
        redirect: true,
      });
      // If we reach here, redirect was successful (though we shouldn't reach here)
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err?.message || "Failed to connect to Google. Please check your Google OAuth configuration.");
      setIsLoading(false);
    }
  };

  if (showSelector) {
    return (
      <YoutubeVideoSelector
        onClose={() => setShowSelector(false)}
        onImport={(video) => {
          setShowSelector(false);
          // Handle video import
          window.location.href = `/studio?import=${video.id}`;
        }}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3">
        <Youtube className="size-6 text-red-500" />
        <div>
          <h3 className="font-semibold text-white">Import from YouTube</h3>
          <p className="text-xs text-white/60">
            Connect your Google account to import videos from your YouTube channel
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleYoutubeClick}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-4 text-sm font-medium text-white transition hover:border-cyan-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Connecting to YouTube...</span>
          </>
        ) : (
          <>
            <Youtube className="size-5 text-red-500" />
            <span>Connect & Select Videos</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}
    </div>
  );
}

