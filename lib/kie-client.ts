import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"
import type { KieProviderOptions } from "@/lib/video-provider"
import { toKieModel } from "@/lib/video-provider"

const KIE_BASE_URL = process.env.KIE_BASE_URL ?? "https://api.kie.ai"

export type KieTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"

export interface KieTaskDetail {
  error: string | null
  resultUrl: string | null
  status: KieTaskStatus
}

interface KieCreateTaskResponse {
  code: number
  data?: {
    taskId?: string
  }
  msg?: string
}

interface KieRecordInfoResponse {
  code: number
  data?: {
    errorCode?: string | null
    errorMessage?: string | null
    failCode?: string | null
    failMsg?: string | null
    resultJson?: string | null
    state?: string
    status?: string
    taskId?: string
  }
  msg?: string
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getFirstString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function parseKieResultUrl(
  resultJson: string | null | undefined
): string | null {
  if (!resultJson) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(resultJson)
  } catch {
    return resultJson.trim().length > 0 ? resultJson : null
  }
  if (Array.isArray(parsed)) {
    return getFirstString(parsed[0])
  }

  if (!isRecord(parsed)) {
    return getFirstString(parsed)
  }

  const candidates = [
    parsed.videoUrl,
    parsed.video_url,
    parsed.url,
    parsed.resultUrl,
    parsed.result_url,
  ]
  for (const candidate of candidates) {
    const url = getFirstString(candidate)
    if (url) {
      return url
    }
  }

  const resultUrls = parsed.resultUrls ?? parsed.result_urls ?? parsed.urls
  return Array.isArray(resultUrls) ? getFirstString(resultUrls[0]) : null
}

function toLocalStatus(status: string | undefined): KieTaskStatus {
  switch (status?.toLowerCase()) {
    case "success":
    case "succeed":
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
      return "in_progress"
    default:
      return "pending"
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | null
  if (!(response.ok && body)) {
    throw new Error(`Kie.ai request failed: ${response.statusText}`)
  }
  return body
}

export async function getKieApiKeyByUserId(userId: string): Promise<string> {
  const [settings] = await db
    .select({ kieApiKey: userSettings.kieApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings?.kieApiKey) {
    throw new Error("Kie.ai API key is not configured for this user")
  }

  return settings.kieApiKey
}

export async function createKieSeedanceTask({
  apiKey,
  callbackUrl,
  providerOptions,
  request,
}: {
  apiKey: string
  callbackUrl: string
  providerOptions?: KieProviderOptions
  request: VideoGenerationRequest
}): Promise<string> {
  const referenceImageUrls =
    request.inputReferences
      ?.map((reference) => reference.imageUrl?.url)
      .filter((url): url is string => Boolean(url)) ?? []
  const firstFrameUrl = request.frameImages?.find(
    (image) => image.frameType === "first_frame"
  )?.imageUrl.url
  const lastFrameUrl = request.frameImages?.find(
    (image) => image.frameType === "last_frame"
  )?.imageUrl.url

  const body = {
    callBackUrl: callbackUrl,
    input: {
      aspect_ratio: request.aspectRatio,
      duration: request.duration,
      first_frame_url: firstFrameUrl,
      generate_audio: request.generateAudio ?? true,
      last_frame_url: lastFrameUrl,
      nsfw_checker: providerOptions?.nsfw_checker ?? false,
      prompt: request.prompt,
      reference_audio_urls: providerOptions?.reference_audio_urls,
      reference_image_urls:
        referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
      reference_video_urls: providerOptions?.reference_video_urls,
      resolution: request.resolution,
    },
    model: toKieModel(request.model),
  }

  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  })
  const json = await readJsonResponse<KieCreateTaskResponse>(response)

  if (!json.data?.taskId) {
    throw new Error(json.msg ?? "Kie.ai did not return a task ID")
  }

  return json.data.taskId
}

export async function getKieTaskDetail({
  apiKey,
  taskId,
}: {
  apiKey: string
  taskId: string
}): Promise<KieTaskDetail> {
  const url = new URL(`${KIE_BASE_URL}/api/v1/jobs/recordInfo`)
  url.searchParams.set("taskId", taskId)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  const json = await readJsonResponse<KieRecordInfoResponse>(response)

  if (!json.data) {
    throw new Error(json.msg ?? "Kie.ai task detail request failed")
  }

  const error =
    json.data.errorMessage ??
    json.data.failMsg ??
    json.data.errorCode ??
    json.data.failCode ??
    null

  return {
    error,
    resultUrl: parseKieResultUrl(json.data.resultJson),
    status: toLocalStatus(json.data.state ?? json.data.status),
  }
}
