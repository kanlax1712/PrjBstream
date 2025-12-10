import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { Chatbot } from "@/components/chatbot/chatbot";
import { getSession } from "@/lib/auth-wrapper";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bstream Studio",
  description:
    "Creator-first video streaming platform for publishing, discovery, and live experiences.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bstream",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  userScalable: true,
  themeColor: "#06b6d4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="bg-slate-950 text-white">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bstream" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-white antialiased`}
      >
        <AppSessionProvider session={session}>
          {children}
          <PWAInstallPrompt />
          <Chatbot />
        </AppSessionProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            // Only register service worker in production (not in development)
            // This prevents issues with Next.js dev server and hot module replacement
            if ('serviceWorker' in navigator) {
              const isDevelopment = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname.includes('localhost');
              
              if (isDevelopment) {
                // Unregister any existing service workers in development
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => {
                    registration.unregister().then(() => {
                      console.log('Service Worker unregistered for development');
                    });
                  });
                });
              } else {
                // Register service worker in production only
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => {
                      console.log('Service Worker registered successfully', reg);
                    })
                    .catch((err) => {
                      console.error('Service Worker registration failed:', err);
                    });
                });
              }
            }
          `}
        </Script>
        <Script id="fix-zoom-scroll" strategy="afterInteractive">
          {`
            // Fix zoom and scroll position issues
            (function() {
              let lastZoom = window.devicePixelRatio || 1;
              let scrollPosition = { x: 0, y: 0 };
              
              // Save scroll position before zoom
              function saveScrollPosition() {
                scrollPosition = {
                  x: window.scrollX || window.pageXOffset || 0,
                  y: window.scrollY || window.pageYOffset || 0
                };
              }
              
              // Restore scroll position after zoom
              function restoreScrollPosition() {
                requestAnimationFrame(() => {
                  window.scrollTo(scrollPosition.x, scrollPosition.y);
                });
              }
              
              // Monitor zoom changes
              function checkZoom() {
                const currentZoom = window.devicePixelRatio || 1;
                if (Math.abs(currentZoom - lastZoom) > 0.1) {
                  saveScrollPosition();
                  setTimeout(() => {
                    restoreScrollPosition();
                    lastZoom = currentZoom;
                  }, 100);
                }
              }
              
              // Listen for zoom events
              window.addEventListener('resize', checkZoom);
              window.addEventListener('orientationchange', () => {
                saveScrollPosition();
                setTimeout(restoreScrollPosition, 500);
              });
              
              // Save scroll position on scroll
              let scrollTimeout;
              window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(saveScrollPosition, 100);
              }, { passive: true });
              
              // Restore scroll position on page load
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', restoreScrollPosition);
              } else {
                restoreScrollPosition();
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
