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
    ],
  },
  allowedDevOrigins: ["linhs-macbook-pro.tailba52d0.ts.net"],
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
  },
}

export default nextConfig

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev())
