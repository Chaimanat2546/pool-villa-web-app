import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
