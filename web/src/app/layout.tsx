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
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((reg) => console.log('SW registered', reg))
                  .catch((err) => console.log('SW registration failed', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
