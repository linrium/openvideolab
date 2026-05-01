import { OpenRouter } from "@openrouter/sdk"
import type {
  AspectRatio,
  Resolution,
  VideoGenerationResponseStatus,
} from "@openrouter/sdk/models"

export type { VideoGenerationRequest } from "@openrouter/sdk/models"

export type VideoAspectRatio = AspectRatio
export type VideoJobStatus = VideoGenerationResponseStatus
export type VideoResolution = Resolution

export interface GenerateVideoOptions extends VideoGenerationRequest {
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

export const openrouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
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
