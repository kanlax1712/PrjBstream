"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt || sessionStorage.getItem("pwa-prompt-dismissed")) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-cyan-500/20 bg-slate-900/95 p-4 shadow-lg backdrop-blur-md md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
          <Download className="size-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Install Bstream</h3>
          <p className="mt-1 text-xs text-white/70">
            Install our app for a better experience on your device
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 rounded-full bg-cyan-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-cyan-600"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

