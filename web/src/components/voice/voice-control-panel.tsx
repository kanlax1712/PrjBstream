"use client";

import { useVoiceControlContext } from "@/contexts/voice-control-context";
import { X, Mic, MicOff } from "lucide-react";
import { useState } from "react";

type VoiceControlPanelProps = {
  onClose?: () => void;
};

export function VoiceControlPanel({ onClose }: VoiceControlPanelProps) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceControlContext();

  const [showCommands, setShowCommands] = useState(false);

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">Voice Control</h3>
        <p className="text-sm text-white/70">
          Voice control is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  const commands = [
    { category: "Navigation", commands: ["Go to home", "Go to login", "Go to live", "Go to studio", "Go to subscriptions", "Go to playlists", "Go to search", "Go to analytics"] },
    { category: "Search", commands: ["Search for [query]", "Search [query]"] },
    { category: "Video Player", commands: ["Play", "Pause", "Mute", "Unmute", "Volume up", "Volume down", "Fullscreen", "Exit fullscreen", "Skip forward", "Skip backward"] },
    { category: "Actions", commands: ["Login", "Sign in", "Sign out", "Logout", "Upload", "Upload video"] },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Voice Control</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {isListening ? (
            <>
              <Mic className="size-4" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <MicOff className="size-4" />
              <span>Start Listening</span>
            </>
          )}
        </button>
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="mb-4 rounded-lg bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-white/40 mb-1">You said:</p>
          <p className="text-sm text-white">{transcript}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-500/30 p-3">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Commands list */}
      <div className="mt-4">
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="text-sm text-white/60 hover:text-white"
        >
          {showCommands ? "Hide" : "Show"} Available Commands
        </button>
        {showCommands && (
          <div className="mt-3 space-y-4">
            {commands.map((category) => (
              <div key={category.category}>
                <h4 className="mb-2 text-sm font-semibold text-white/80">
                  {category.category}
                </h4>
                <ul className="space-y-1 text-xs text-white/60">
                  {category.commands.map((cmd) => (
                    <li key={cmd} className="pl-2">
                      • {cmd}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

