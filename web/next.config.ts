import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output for Vercel deployment
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "commondatastorage.googleapis.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "i.ytimg.com" }, // YouTube thumbnails
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false, // Keep optimization but allow unoptimized for specific images
  },
  // Increase body size limit for video uploads (2GB = 2147483648 bytes)
  experimental: {
    serverActions: {
      bodySizeLimit: '2gb',
    },
  },
};

export default nextConfig;
