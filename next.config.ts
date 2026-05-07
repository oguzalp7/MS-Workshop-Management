import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  allowedDevOrigins: ['msws-dev.la-vittoria.uk']
};

export default nextConfig;
