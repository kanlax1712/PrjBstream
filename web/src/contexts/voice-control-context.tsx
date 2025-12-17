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
            const path = command.params.path as string;
            console.log("Navigating to:", path);
            router.push(path);
            // Force navigation if router.push doesn't work immediately
            setTimeout(() => {
              if (window.location.pathname !== path) {
                window.location.href = path;
              }
            }, 100);
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
            console.log("Navigating to home");
            router.push("/");
            setTimeout(() => {
              if (window.location.pathname !== "/") {
                window.location.href = "/";
              }
            }, 100);
          } else if (buttonAction === "navigateSubscriptions") {
            console.log("Navigating to subscriptions");
            router.push("/subscriptions");
            setTimeout(() => {
              if (window.location.pathname !== "/subscriptions") {
                window.location.href = "/subscriptions";
              }
            }, 100);
          } else if (buttonAction === "navigatePlaylists") {
            console.log("Navigating to playlists");
            router.push("/playlists");
            setTimeout(() => {
              if (window.location.pathname !== "/playlists") {
                window.location.href = "/playlists";
              }
            }, 100);
          } else if (buttonAction === "navigateStudio" || buttonAction === "upload") {
            console.log("Navigating to studio");
            router.push("/studio");
            setTimeout(() => {
              if (window.location.pathname !== "/studio") {
                window.location.href = "/studio";
              }
            }, 100);
          } else if (buttonAction === "navigateLive") {
            console.log("Navigating to live");
            router.push("/live");
            setTimeout(() => {
              if (window.location.pathname !== "/live") {
                window.location.href = "/live";
              }
            }, 100);
          } else if (buttonAction === "navigateAnalytics") {
            console.log("Navigating to analytics");
            router.push("/analytics");
            setTimeout(() => {
              if (window.location.pathname !== "/analytics") {
                window.location.href = "/analytics";
              }
            }, 100);
          } else if (buttonAction === "navigateGoLive") {
            console.log("Navigating to go-live");
            router.push("/go-live");
            setTimeout(() => {
              if (window.location.pathname !== "/go-live") {
                window.location.href = "/go-live";
              }
            }, 100);
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

