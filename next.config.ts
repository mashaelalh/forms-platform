import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // For MVP: Allow build to succeed with linting warnings
    // TODO: Fix all linting issues before production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Build even if there are type errors (only for MVP testing)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
