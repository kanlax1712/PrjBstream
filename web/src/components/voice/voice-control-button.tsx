"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceControlContext } from "@/contexts/voice-control-context";
import { useState, useEffect } from "react";

export function VoiceControlButton() {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    toggleListening,
  } = useVoiceControlContext();

  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (transcript) {
      setShowTranscript(true);
      const timer = setTimeout(() => {
        setShowTranscript(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={`flex items-center justify-center rounded-full p-2.5 transition-all ${
          isListening
            ? "bg-red-500/20 text-red-400 animate-pulse"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        }`}
        aria-label={isListening ? "Stop voice control" : "Start voice control"}
        title={isListening ? "Stop voice control" : "Start voice control"}
      >
        {isListening ? (
          <Mic className="size-5" />
        ) : (
          <MicOff className="size-5" />
        )}
      </button>

      {/* Transcript overlay */}
      {showTranscript && transcript && (
        <div className="absolute bottom-full right-0 mb-2 max-w-xs rounded-lg bg-slate-900/95 px-4 py-2 text-sm text-white shadow-xl backdrop-blur-sm">
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 max-w-xs rounded-lg bg-red-900/95 px-4 py-2 text-sm text-red-100 shadow-xl backdrop-blur-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 size-3 rounded-full bg-red-500 animate-ping" />
      )}
    </div>
  );
}

