import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    },
    dangerouslyAllowSVG: true,
  },
  // Note: serverActions config removed as it's not supported in Next.js 16.0.3
  // File upload size is handled in API routes instead
};

export default nextConfig;
