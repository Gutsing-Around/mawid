import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Build every page in one worker. Each worker has its own in-memory cache, so with many
    // workers the AniList schedule was fetched once per worker and hit AniList's rate limit.
    staticGenerationMinPagesPerWorker: 1000,
  },
  cacheComponents: true,
  // Lets a phone on the same Wi-Fi use the dev server (the "Network" address from `npm run dev`).
  // Update this if your computer's local IP changes.
  allowedDevOrigins: ["192.168.1.18"],
  partialPrefetching: true,
  images: {
    // AniList cover images
    remotePatterns: [{ protocol: "https", hostname: "s4.anilist.co" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
