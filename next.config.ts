import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@puppeteer/browsers",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from trying to bundle puppeteer and its Node.js deps.
      // They are loaded via dynamic import at runtime only when villa-calendar
      // API routes are called.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "puppeteer",
        "puppeteer-core",
        "@puppeteer/browsers",
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.devillegroups.com",
      },
      {
        protocol: "https",
        hostname:
          "d24r25u6qcb3zryipzoiqj2jxy0ilqtm.lambda-url.ap-southeast-1.on.aws",
      },
      {
        protocol: "https",
        hostname:
          "www.poolvillapattaya.co.th",
      },
    ],
  },
};

export default nextConfig;
