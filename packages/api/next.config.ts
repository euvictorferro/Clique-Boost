import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API only — sem páginas de frontend
  async rewrites() {
    return [];
  },
};

export default nextConfig;
