"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, Sparkles } from "lucide-react";

type Props = {
  onComplete: () => void;
  onSkip?: () => void;
  duration?: number; // Duration in seconds (default: 5)
};

export function VideoAd({ onComplete, onSkip, duration = 5 }: Props) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Start countdown
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      // Allow skip after 3 seconds (for 5 second ad)
      if (elapsed >= 3 && !canSkip) {
        setCanSkip(true);
      }

      // Complete when time is up
      if (remaining === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onComplete();
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, canSkip, onComplete]);

  const handleSkip = () => {
    if (canSkip && onSkip) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onSkip();
    }
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black overflow-hidden pointer-events-auto">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 to-blue-900 animate-gradient-shift" />

      {/* Particle Effect */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Sparkles
          key={i}
          className="absolute text-white/50 animate-sparkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}

      {/* Ad Content */}
      <div className="relative z-10 text-center p-8 max-w-md w-full">
        <div className="mb-6 animate-fade-in-up delay-100">
          <div className="inline-block rounded-full bg-white/10 p-6 mb-4 animate-pulse-once">
            <Play className="w-16 h-16 text-white" />
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 animate-fade-in-up delay-200">
          Premium Content
        </h2>
        <p className="text-white/70 text-base sm:text-lg mb-4 animate-fade-in-up delay-300">
          This video is brought to you by Bstream Premium.
        </p>
        <div className="text-cyan-400 font-semibold text-xl sm:text-2xl animate-fade-in-up delay-400">
          {timeRemaining}s
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip Button */}
      {canSkip && onSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 backdrop-blur-sm border border-white/20 pointer-events-auto z-50"
          aria-label="Skip ad"
        >
          <X className="size-4" />
          Skip Ad
        </button>
      )}

      {/* Skip countdown (only if skip is not available) */}
      {!canSkip && (
        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white/50 backdrop-blur-sm border border-white/10 pointer-events-auto z-50">
          <X className="size-4" />
          <span>Skip in {Math.max(0, 3 - Math.floor((duration - timeRemaining)))}s</span>
        </div>
      )}
    </div>
  );
}

