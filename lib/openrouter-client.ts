import { OpenRouter } from "@openrouter/sdk"
import type {
  AspectRatio,
  Resolution,
  VideoGenerationRequest,
  VideoGenerationResponseStatus,
} from "@openrouter/sdk/models"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"

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

const BASE_URL = process.env.OPENROUTER_BASE_URL

export function createOpenrouterClient(apiKey: string): OpenRouter {
  console.log("BASE_URL", BASE_URL)

  return new OpenRouter({
    apiKey,
    serverURL: BASE_URL,
  })
}

export async function getOpenRouterApiKeyByUserId(
  userId: string
): Promise<string> {
  const [settings] = await db
    .select({ openrouterApiKey: userSettings.openrouterApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings?.openrouterApiKey) {
    throw new Error("OpenRouter API key is not configured for this user")
  }

  return settings.openrouterApiKey
}

export async function getOpenrouterClientByUserId(
  userId: string
): Promise<OpenRouter> {
  const apiKey = await getOpenRouterApiKeyByUserId(userId)
  return createOpenrouterClient(apiKey)
}

export async function pollJobUntilDone(
  apiKey: string,
  jobId: string,
  intervalMs = 5000,
  onStatus?: (status: VideoJobStatus) => void
): Promise<GenerateVideoResult> {
  const openrouterClient = createOpenrouterClient(apiKey)

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
  apiKey: string,
  jobId: string,
  index = 0
): Promise<Response> {
  const url = new URL(`${BASE_URL}/videos/${jobId}/content`)
  url.searchParams.set("index", String(index))

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  apiKey,
  onStatus,
  pollIntervalMs = 5000,
  ...videoGenerationRequest
}: GenerateVideoOptions & {
  apiKey: string
}): Promise<GenerateVideoResult> {
  const openrouterClient = createOpenrouterClient(apiKey)
  const job = await openrouterClient.videoGeneration.generate({
    videoGenerationRequest,
  })

  return pollJobUntilDone(apiKey, job.id, pollIntervalMs, onStatus)
}
