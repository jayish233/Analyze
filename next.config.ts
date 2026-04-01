import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["img.youtube.com", "i.ytimg.com"],
  },
  // Allow longer serverless function timeout for search operations
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
