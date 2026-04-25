import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node.js module — exclude from bundling
  serverExternalPackages: ["better-sqlite3"],
  // Silence Turbopack warning (no custom webpack config needed for our setup)
  turbopack: {},
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
