"use client";

import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useVoiceControl } from "@/hooks/use-voice-control";
import { signIn, signOut } from "next-auth/react";
import {
  clickButtonByText,
  clickButtonByAriaLabel,
  clickLinkByHref,
  focusAndClickSearchInput,
  clickUserMenuButton,
  clickSubscribeButton,
  clickLikeButton,
  clickDislikeButton,
} from "@/utils/voice-button-clicker";

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
          const buttonAction = command.params?.button as string;
          
          // Authentication buttons
          if (buttonAction === "login" || buttonAction === "sign in") {
            signIn();
          } else if (buttonAction === "logout" || buttonAction === "sign out") {
            signOut({ callbackUrl: "/" });
          } else if (buttonAction === "register" || buttonAction === "sign up") {
            router.push("/register");
          } 
          // Navigation buttons
          else if (buttonAction === "navigateHome") {
            router.push("/");
          } else if (buttonAction === "navigateSubscriptions") {
            router.push("/subscriptions");
          } else if (buttonAction === "navigatePlaylists") {
            router.push("/playlists");
          } else if (buttonAction === "navigateStudio" || buttonAction === "upload") {
            router.push("/studio");
          } else if (buttonAction === "navigateLive") {
            router.push("/live");
          } else if (buttonAction === "navigateAnalytics") {
            router.push("/analytics");
          } else if (buttonAction === "navigateGoLive") {
            router.push("/go-live");
          }
          // UI interactions
          else if (buttonAction === "openUserMenu" || buttonAction === "click user menu" || buttonAction === "click profile") {
            clickUserMenuButton();
          } else if (buttonAction === "closeUserMenu") {
            // Click outside to close or press Escape
            document.body.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          } else if (buttonAction === "focusSearch") {
            focusAndClickSearchInput();
          } else if (buttonAction === "subscribe") {
            clickSubscribeButton();
          } else if (buttonAction === "like") {
            clickLikeButton();
          } else if (buttonAction === "dislike") {
            clickDislikeButton();
          } else if (buttonAction === "watchNow" || buttonAction === "playVideo") {
            // Try multiple strategies to find watch/play button
            if (!clickButtonByText("watch now") && !clickButtonByText("watch")) {
              clickButtonByText("play");
            }
          }
          
          // Dispatch button click event for any button that wasn't handled above
          window.dispatchEvent(
            new CustomEvent("voice-button-click", {
              detail: { button: buttonAction },
            })
          );
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

