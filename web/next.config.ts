import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
    dangerouslyAllowSVG: true,
  },
  serverActions: {
    bodySizeLimit: "2gb",
  },
};

export default nextConfig;
