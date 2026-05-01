import type { NextRequest } from "next/server"
import { openrouterClient } from "@/lib/openrouter-video"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const index = Number(request.nextUrl.searchParams.get("index") ?? "0")

  const upstream = await openrouterClient.downloadContent(jobId, index)

  return new Response(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="video-${jobId}.mp4"`,
    },
  })
}
