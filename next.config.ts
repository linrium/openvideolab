import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "openvideolab.2541b6be9f2bb7c70cfdec27c3dbedcd.r2.cloudflarestorage.com",
      },
    ],
  },
}

export default nextConfig
