import { OpenRouter } from "@openrouter/sdk"
import type {
  AspectRatio,
  Resolution,
  VideoGenerationRequest,
  VideoGenerationResponseStatus,
} from "@openrouter/sdk/models"

export type VideoAspectRatio = AspectRatio
export type VideoJobStatus = VideoGenerationResponseStatus
export type VideoResolution = Resolution
export type GenerateVideoOptions = VideoGenerationRequest & {
  onStatus?: (status: VideoJobStatus) => void
  pollIntervalMs?: number
}

export interface GenerateVideoResult {
  cost: number | null
  generationId: string | undefined
  isByok: boolean
  jobId: string
  urls: string[]
}

const BASE_URL = "http://localhost:8787/api/v1"
// const BASE_URL = "https://openrouter-stub.linrium.workers.dev"

export const openrouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  serverURL: BASE_URL,
})

export async function pollJobUntilDone(
  jobId: string,
  intervalMs = 5000,
  onStatus?: (status: VideoJobStatus) => void
): Promise<GenerateVideoResult> {
  while (true) {
    const data = await openrouterClient.videoGeneration.getGeneration({ jobId })
    onStatus?.(data.status)

    if (data.status === "completed") {
      return {
        jobId: data.id,
        generationId: data.generationId,
        urls: data.unsignedUrls ?? [],
        cost: data.usage?.cost ?? null,
        isByok: data.usage?.isByok ?? false,
      }
    }

    if (
      data.status === "failed" ||
      data.status === "cancelled" ||
      data.status === "expired"
    ) {
      throw new Error(
        data.error ?? `Video job ended with status: ${data.status}`
      )
    }

    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs))
  }
}

// The SDK's stream matcher only accepts application/octet-stream, but
// OpenRouter returns video/mp4 for this endpoint, causing a content-type
// mismatch error. We fetch directly with the Bearer token instead.
export async function fetchVideoContent(
  jobId: string,
  index = 0
): Promise<Response> {
  const url = new URL(`${BASE_URL}/videos/${jobId}/content`)
  url.searchParams.set("index", String(index))

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      (body?.error?.message as string | undefined) ?? response.statusText
    throw new Error(`OpenRouter video content fetch failed: ${message}`)
  }

  return response
}

export async function generateVideo({
  onStatus,
  pollIntervalMs = 5000,
  ...videoGenerationRequest
}: GenerateVideoOptions): Promise<GenerateVideoResult> {
  const job = await openrouterClient.videoGeneration.generate({
    videoGenerationRequest,
  })

  return pollJobUntilDone(job.id, pollIntervalMs, onStatus)
}
