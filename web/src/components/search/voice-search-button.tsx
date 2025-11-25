"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export function VoiceSearchButton({ onTranscript, disabled = false }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice transcript received:", transcript);
        onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          alert("Microphone permission denied. Please allow microphone access in your browser settings.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`flex items-center justify-center rounded-full p-1.5 transition ${
        isListening
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : "text-white/60 hover:text-white hover:bg-white/10"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-label={isListening ? "Stop listening" : "Start voice search"}
      title={isListening ? "Stop listening" : "Start voice search"}
    >
      {isListening ? (
        <MicOff className="size-4" />
      ) : (
        <Mic className="size-4" />
      )}
    </button>
  );
}

