import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "openvideolab.2541b6be9f2bb7c70cfdec27c3dbedcd.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-9bff4c0d6330472ca6187f9d74658c54.r2.dev",
      },
    ],
  },
  allowedDevOrigins: ["linhs-macbook-pro.tailba52d0.ts.net"],
}

export default nextConfig

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev())
