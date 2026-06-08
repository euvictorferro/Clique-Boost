import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", ".env") });

const nextConfig: NextConfig = {};

export default nextConfig;
