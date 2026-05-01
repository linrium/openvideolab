import type { NextRequest } from "next/server"
import { openrouterClient } from "@/lib/openrouter-video"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const index = Number(request.nextUrl.searchParams.get("index") ?? "0")

  const stream = await openrouterClient.videoGeneration.getVideoContent({
    jobId,
    index,
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="video-${jobId}.mp4"`,
    },
  })
}
