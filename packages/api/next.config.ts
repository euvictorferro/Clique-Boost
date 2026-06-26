import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

const nextConfig: NextConfig = {
  // API only — sem páginas de frontend
  async rewrites() {
    return [];
  },
};

export default nextConfig;
