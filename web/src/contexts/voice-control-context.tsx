"use client";

import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useVoiceControl } from "@/hooks/use-voice-control";
import { signIn, signOut } from "next-auth/react";

type VoiceCommand = {
  action: string;
  params?: Record<string, string | number>;
};

type VoiceControlContextType = {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  executeCommand: (command: VoiceCommand) => void;
};

const VoiceControlContext = createContext<VoiceControlContextType | undefined>(undefined);

export function VoiceControlProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [lastCommand, setLastCommand] = useState<string>("");

  const handleCommand = useCallback(
    (command: VoiceCommand) => {
      console.log("Voice command received:", command);
      setLastCommand(JSON.stringify(command));

      switch (command.action) {
        case "navigate":
          if (command.params?.path) {
            router.push(command.params.path as string);
          }
          break;

        case "search":
          if (command.params?.query) {
            router.push(`/search?q=${encodeURIComponent(command.params.query as string)}`);
          }
          break;

        case "button":
          if (command.params?.button === "login" || command.params?.button === "sign in") {
            signIn();
          } else if (command.params?.button === "logout" || command.params?.button === "sign out") {
            signOut({ callbackUrl: "/" });
          } else if (command.params?.button === "register" || command.params?.button === "sign up") {
            router.push("/register");
          } else if (command.params?.button === "upload") {
            router.push("/studio");
          }
          break;

        case "video":
          // Video commands will be handled by the video player component
          // We'll dispatch a custom event that the video player can listen to
          window.dispatchEvent(
            new CustomEvent("voice-video-command", {
              detail: command.params,
            })
          );
          break;

        default:
          console.log("Unknown command:", command);
      }
    },
    [router]
  );

  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceControl({
    onCommand: handleCommand,
    continuous: true,
  });

  const executeCommand = useCallback(
    (command: VoiceCommand) => {
      handleCommand(command);
    },
    [handleCommand]
  );

  return (
    <VoiceControlContext.Provider
      value={{
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
        toggleListening,
        executeCommand,
      }}
    >
      {children}
    </VoiceControlContext.Provider>
  );
}

export function useVoiceControlContext() {
  const context = useContext(VoiceControlContext);
  if (context === undefined) {
    throw new Error("useVoiceControlContext must be used within a VoiceControlProvider");
  }
  return context;
}

