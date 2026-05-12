import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
  },
  allowedDevOrigins: ['msws-dev.la-vittoria.uk'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.sglam.co',
      },
    ],
  },
};

export default nextConfig;
