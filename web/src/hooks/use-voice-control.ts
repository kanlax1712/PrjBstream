"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type VoiceCommand = {
  action: string;
  params?: Record<string, string | number>;
};

type VoiceControlOptions = {
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string) => void;
  continuous?: boolean;
  lang?: string;
};

export function useVoiceControl(options: VoiceControlOptions = {}) {
  const {
    onCommand,
    onTranscript,
    continuous = false,
    lang = "en-US",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  // Check if browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        finalTranscriptRef.current = "";
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
          const fullTranscript = finalTranscriptRef.current.trim();
          setTranscript(fullTranscript);
          
          if (onTranscript) {
            onTranscript(fullTranscript);
          }

          // Parse and execute command
          if (onCommand) {
            const command = parseCommand(fullTranscript);
            if (command) {
              onCommand(command);
            }
          }
        } else {
          setTranscript(finalTranscriptRef.current + interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        switch (event.error) {
          case "no-speech":
            setError("No speech detected. Please try again.");
            break;
          case "audio-capture":
            setError("No microphone found. Please check your microphone.");
            break;
          case "not-allowed":
            setError("Microphone permission denied. Please enable microphone access.");
            break;
          case "network":
            setError("Network error. Please check your connection.");
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError("Speech recognition is not supported in your browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, lang, onCommand, onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setError("Failed to start voice recognition.");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

// Command parsing function
function parseCommand(transcript: string): VoiceCommand | null {
  const normalized = transcript.toLowerCase().trim();
  
  // Navigation commands - more flexible matching
  const navCommands: Record<string, string> = {
    "go to home": "/",
    "go home": "/",
    "home": "/",
    "navigate to home": "/",
    "open home": "/",
    "go to login": "/login",
    "login": "/login",
    "open login": "/login",
    "navigate to login": "/login",
    "go to live": "/live",
    "live": "/live",
    "open live": "/live",
    "navigate to live": "/live",
    "go to studio": "/studio",
    "studio": "/studio",
    "creator studio": "/studio",
    "open studio": "/studio",
    "navigate to studio": "/studio",
    "go to subscriptions": "/subscriptions",
    "subscriptions": "/subscriptions",
    "open subscriptions": "/subscriptions",
    "navigate to subscriptions": "/subscriptions",
    "go to playlists": "/playlists",
    "playlists": "/playlists",
    "open playlists": "/playlists",
    "navigate to playlists": "/playlists",
    "go to search": "/search",
    "search": "/search",
    "open search": "/search",
    "navigate to search": "/search",
    "go to analytics": "/analytics",
    "analytics": "/analytics",
    "insights": "/analytics",
    "open analytics": "/analytics",
    "navigate to analytics": "/analytics",
    "go live": "/go-live",
    "go to go live": "/go-live",
    "open go live": "/go-live",
    "navigate to go live": "/go-live",
  };

  // Check for navigation commands - use includes for flexible matching
  for (const [command, path] of Object.entries(navCommands)) {
    if (normalized.includes(command) || normalized === command) {
      return {
        action: "navigate",
        params: { path },
      };
    }
  }

  // Search commands
  if (normalized.startsWith("search for ") || normalized.startsWith("search ")) {
    const searchQuery = normalized
      .replace(/^search for /, "")
      .replace(/^search /, "")
      .trim();
    if (searchQuery) {
      return {
        action: "search",
        params: { query: searchQuery },
      };
    }
  }

  // Video player commands
  const videoCommands: Record<string, string> = {
    "play": "play",
    "pause": "pause",
    "stop": "pause",
    "mute": "mute",
    "unmute": "unmute",
    "volume up": "volumeUp",
    "volume down": "volumeDown",
    "fullscreen": "fullscreen",
    "exit fullscreen": "exitFullscreen",
    "skip forward": "skipForward",
    "skip backward": "skipBackward",
    "rewind": "skipBackward",
    "fast forward": "skipForward",
  };

  for (const [command, action] of Object.entries(videoCommands)) {
    if (normalized.includes(command)) {
      return {
        action: "video",
        params: { command: action },
      };
    }
  }

  // Button/action commands - comprehensive list
  const buttonCommands: Record<string, string> = {
    // Authentication
    "click login": "login",
    "click sign in": "login",
    "sign in": "login",
    "click sign out": "logout",
    "click logout": "logout",
    "sign out": "logout",
    "logout": "logout",
    "click sign up": "register",
    "click register": "register",
    "sign up": "register",
    "register": "register",
    // Upload/Studio
    "click upload": "upload",
    "upload": "upload",
    "upload video": "upload",
    "click upload video": "upload",
    // Navigation buttons
    "click home": "navigateHome",
    "click subscriptions": "navigateSubscriptions",
    "click playlists": "navigatePlaylists",
    "click studio": "navigateStudio",
    "click creator studio": "navigateStudio",
    "click live": "navigateLive",
    "click analytics": "navigateAnalytics",
    "click insights": "navigateAnalytics",
    "click go live": "navigateGoLive",
    // User menu actions
    "open user menu": "openUserMenu",
    "click user menu": "openUserMenu",
    "click profile": "openUserMenu",
    "close user menu": "closeUserMenu",
    // Video actions
    "click subscribe": "subscribe",
    "subscribe": "subscribe",
    "click like": "like",
    "like": "like",
    "click dislike": "dislike",
    "dislike": "dislike",
    "click watch now": "watchNow",
    "watch now": "watchNow",
    "click play video": "playVideo",
    "play video": "playVideo",
    // Search
    "click search": "focusSearch",
    "focus search": "focusSearch",
    "open search": "focusSearch",
  };

  for (const [command, action] of Object.entries(buttonCommands)) {
    if (normalized.includes(command) || normalized === command) {
      return {
        action: "button",
        params: { button: action },
      };
    }
  }

  return null;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

