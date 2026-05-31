import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"

const ATLAS_CLOUD_BASE_URL =
  process.env.ATLAS_CLOUD_BASE_URL ?? "https://api.atlascloud.ai"

const ATLAS_CLOUD_MODEL_PREFIX = /^atlas-cloud\//

export type AtlasCloudTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"

export interface AtlasCloudTaskDetail {
  error: string | null
  resultUrl: string | null
  status: AtlasCloudTaskStatus
}

interface AtlasCloudGenerateResponse {
  data?: {
    id?: string
  }
  message?: string
}

interface AtlasCloudPredictionResponse {
  data?: {
    error?: string | null
    outputs?: string[]
    status?: string
  }
  message?: string
}

type VideoType = "text-to-video" | "image-to-video" | "reference-to-video"

function resolveVideoType(
  referenceImageCount: number,
  hasFirstFrame: boolean
): VideoType {
  if (referenceImageCount > 1) {
    return "reference-to-video"
  }
  if (referenceImageCount === 1 || hasFirstFrame) {
    return "image-to-video"
  }
  return "text-to-video"
}

function toAtlasCloudModel(model: string, videoType: VideoType): string {
  return `${model.replace(ATLAS_CLOUD_MODEL_PREFIX, "")}/${videoType}`
}

function toLocalStatus(status: string | undefined): AtlasCloudTaskStatus {
  switch (status?.toLowerCase()) {
    case "success":
    case "succeed":
    case "succeeded":
    case "completed":
      return "completed"
    case "fail":
    case "failed":
    case "error":
      return "failed"
    case "cancel":
    case "cancelled":
    case "canceled":
      return "cancelled"
    case "expired":
      return "expired"
    case "generating":
    case "processing":
    case "running":
    case "in_progress":
      return "in_progress"
    default:
      return "pending"
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null

  if (!response.ok) {
    const detail =
      body?.message ?? body?.error ?? response.statusText ?? "unknown error"
    throw new Error(
      `Atlas Cloud request failed [${response.status}]: ${detail}`
    )
  }

  if (!body) {
    throw new Error(
      `Atlas Cloud request failed [${response.status}]: empty response body`
    )
  }

  return body
}

export async function getAtlasCloudApiKeyByUserId(
  userId: string
): Promise<string> {
  const [settings] = await db
    .select({ atlasCloudApiKey: userSettings.atlasCloudApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings?.atlasCloudApiKey) {
    throw new Error("Atlas Cloud API key is not configured for this user")
  }

  return settings.atlasCloudApiKey
}

export async function createAtlasCloudTask({
  apiKey,
  request,
}: {
  apiKey: string
  request: VideoGenerationRequest
}): Promise<string> {
  const referenceImageUrls =
    request.inputReferences
      ?.map((ref) => ref.imageUrl?.url)
      .filter((url): url is string => Boolean(url)) ?? []

  const firstFrameUrl = request.frameImages?.find(
    (img) => img.frameType === "first_frame"
  )?.imageUrl.url

  const lastFrameUrl = request.frameImages?.find(
    (img) => img.frameType === "last_frame"
  )?.imageUrl.url

  const videoType = resolveVideoType(
    referenceImageUrls.length,
    Boolean(firstFrameUrl)
  )
  const atlasModel = toAtlasCloudModel(request.model, videoType)

  const body: Record<string, unknown> = {
    model: atlasModel,
    prompt: request.prompt,
    duration: request.duration,
    resolution: request.resolution,
    ratio: request.aspectRatio ?? "adaptive",
    generate_audio: request.generateAudio ?? true,
    watermark: false,
    return_last_frame: false,
  }

  if (videoType === "image-to-video") {
    // first_frame takes priority; fall back to the single reference image
    body.image = firstFrameUrl ?? referenceImageUrls[0]
    if (lastFrameUrl) {
      body.last_image = lastFrameUrl
    }
  } else if (videoType === "reference-to-video") {
    body.reference_images = referenceImageUrls
  }

  const response = await fetch(
    `${ATLAS_CLOUD_BASE_URL}/api/v1/model/generateVideo`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  const json = await readJsonResponse<AtlasCloudGenerateResponse>(response)

  if (!json.data?.id) {
    throw new Error(
      json.message ?? "Atlas Cloud did not return a prediction ID"
    )
  }

  return json.data.id
}

export async function getAtlasCloudTaskDetail({
  apiKey,
  taskId,
}: {
  apiKey: string
  taskId: string
}): Promise<AtlasCloudTaskDetail> {
  const response = await fetch(
    `${ATLAS_CLOUD_BASE_URL}/api/v1/model/prediction/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  )

  const json = await readJsonResponse<AtlasCloudPredictionResponse>(response)

  if (!json.data) {
    throw new Error(json.message ?? "Atlas Cloud prediction request failed")
  }

  return {
    error: json.data.error ?? null,
    resultUrl: json.data.outputs?.[0] ?? null,
    status: toLocalStatus(json.data.status),
  }
}
