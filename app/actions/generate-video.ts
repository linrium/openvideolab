"use server"

import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import z from "zod/v4"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"
import {
  createAtlasCloudTask,
  getAtlasCloudApiKeyByUserId,
} from "@/lib/atlas-cloud-client"
import { auth } from "@/lib/auth"
import { type Model, PRICING } from "@/lib/constants"
import { createKieSeedanceTask, getKieApiKeyByUserId } from "@/lib/kie-client"
import { getOpenrouterClientByUserId } from "@/lib/openrouter-client"
import {
  isAtlasCloudVideoModel,
  isKieVideoModel,
  type PersistedVideoProvider,
} from "@/lib/video-provider"

export interface SubmitVideoResult {
  id: string
  ok: true
}

export interface SubmitVideoError {
  message: string
  ok: false
}

export interface UpdateVideoTitleSuccess {
  ok: true
  title: string
}

export interface UpdateVideoTitleError {
  message: string
  ok: false
}

interface ImageKeys {
  audioReferenceKey?: string
  frameFirstKey?: string
  frameLastKey?: string
  inputReferenceKeys?: string[]
}

interface VideoMetadata {
  provider?: PersistedVideoProvider | null
  title: string
}

const TITLE_MAX_LENGTH = 80
const updateVideoTitleSchema = z.object({
  title: z.string().trim(),
  videoId: z.string().min(1),
})

function getVideoTitle(metadataTitle: string, prompt: string): string {
  const trimmedTitle = metadataTitle.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  const trimmedPrompt = prompt.trim()
  return trimmedPrompt.length > TITLE_MAX_LENGTH
    ? `${trimmedPrompt.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : trimmedPrompt
}

function getKieBillableDuration(
  duration: number,
  provider: PersistedVideoProvider | null | undefined
): number {
  const videoInputCount =
    provider?.options?.kie?.reference_video_urls?.length ?? 0
  const hasVideoInput = videoInputCount > 0
  if (!hasVideoInput) {
    return duration
  }

  const videoDurations = provider?.metadata?.kieReferenceVideoDurations ?? []
  if (
    videoDurations.length !== videoInputCount ||
    videoDurations.some((value) => !(value > 0))
  ) {
    throw new Error("Kie.ai reference video duration is missing")
  }

  const inputDuration =
    videoDurations.reduce((sum, value) => sum + value, 0) ?? 0

  return duration + inputDuration
}

function getKieInputVideoDuration(
  provider: PersistedVideoProvider | null | undefined
): number | null {
  const videoInputCount =
    provider?.options?.kie?.reference_video_urls?.length ?? 0
  if (videoInputCount === 0) {
    return null
  }

  const videoDurations = provider?.metadata?.kieReferenceVideoDurations ?? []
  if (
    videoDurations.length !== videoInputCount ||
    videoDurations.some((value) => !(value > 0))
  ) {
    throw new Error("Kie.ai reference video duration is missing")
  }

  return videoDurations.reduce((sum, value) => sum + value, 0)
}

function getEstimatedCost(
  request: VideoGenerationRequest,
  provider: PersistedVideoProvider | null | undefined
): string | null {
  const { model, resolution, duration, generateAudio } = request
  if (!resolution || (duration !== 5 && duration !== 10 && duration !== 15)) {
    return null
  }

  const modelPricing = PRICING[model as keyof typeof PRICING]
  if (!modelPricing) {
    return null
  }

  if (isKieVideoModel(model)) {
    if (!("with_video_input" in modelPricing.per_second)) {
      return null
    }

    const hasVideoInput =
      (provider?.options?.kie?.reference_video_urls?.length ?? 0) > 0
    const table = hasVideoInput
      ? modelPricing.per_second.with_video_input
      : modelPricing.per_second.no_video_input
    const rate = table?.[resolution as keyof typeof table]
    return rate == null
      ? null
      : String(rate * getKieBillableDuration(duration, provider))
  }

  const table =
    generateAudio === false
      ? modelPricing.per_second.no_audio
      : modelPricing.per_second.with_audio

  const rate = table[resolution as keyof typeof table]

  return String(rate * duration)
}

export async function updateVideoGenerationTitleAction(
  input: unknown
): Promise<UpdateVideoTitleSuccess | UpdateVideoTitleError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = updateVideoTitleSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  const [video] = await db
    .select({
      generationId: videos.generationId,
      prompt: videos.prompt,
      userId: videos.userId,
    })
    .from(videos)
    .where(eq(videos.id, parsedInput.data.videoId))
    .limit(1)

  if (!video || video.userId !== session.user.id) {
    return { ok: false, message: "Unauthorized" }
  }

  const title = getVideoTitle(parsedInput.data.title, video.prompt)

  await db
    .update(generations)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(generations.id, video.generationId))

  revalidatePath("/", "layout")
  revalidatePath(`/videos/${parsedInput.data.videoId}`)
  revalidatePath("/videos")

  return { ok: true, title }
}

export async function submitVideoAction(
  request: VideoGenerationRequest,
  metadata: VideoMetadata,
  imageKeys: ImageKeys = {}
): Promise<SubmitVideoResult | SubmitVideoError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  try {
    const title = getVideoTitle(metadata.title, request.prompt)
    const callbackUrl = `${process.env.OPENROUTER_BASE_WEBHOOK_URL}/api/webhook/video-created`
    const isKieModel = isKieVideoModel(request.model)
    const isAtlasModel = isAtlasCloudVideoModel(request.model)
    console.log("[generate-video] submitting job with metadata:", {
      title,
      model: request.model,
      provider: metadata.provider,
      isAtlasModel,
    })
    let jobId: string
    if (isKieModel) {
      jobId = await createKieSeedanceTask({
        apiKey: await getKieApiKeyByUserId(session.user.id),
        callbackUrl,
        providerOptions: metadata.provider?.options?.kie,
        request,
      })
    } else if (isAtlasModel) {
      jobId = await createAtlasCloudTask({
        apiKey: await getAtlasCloudApiKeyByUserId(session.user.id),
        request,
      })
    } else {
      jobId = (
        await getOpenrouterClientByUserId(session.user.id).then(
          (openrouterClient) =>
            openrouterClient.videoGeneration.generate({
              videoGenerationRequest: {
                ...request,
                callbackUrl,
              },
            })
        )
      ).id
    }
    console.log("[generate-video] job submitted:", jobId)

    const [insertedGeneration] = await db
      .insert(generations)
      .values({
        title,
        type: "video",
        userId: session.user.id,
      })
      .returning({ id: generations.id })

    const [insertedVideo] = await db
      .insert(videos)
      .values({
        aspectRatio: request.aspectRatio ?? null,
        costType: isKieModel ? "credit" : "money",
        duration: request.duration ?? null,
        estimatedCost: getEstimatedCost(request, metadata.provider),
        frameFirst: imageKeys.frameFirstKey ?? null,
        frameLast: imageKeys.frameLastKey ?? null,
        generateAudio: request.generateAudio ?? true,
        generationId: insertedGeneration.id,
        inputVideoDuration: getKieInputVideoDuration(metadata.provider),
        inputReferences: imageKeys.inputReferenceKeys ?? [],
        jobId,
        model: request.model as Model,
        userId: session.user.id,
        provider:
          metadata.provider == null
            ? null
            : {
                ...metadata.provider,
                metadata: {
                  ...metadata.provider.metadata,
                  audioKey:
                    imageKeys.audioReferenceKey ??
                    metadata.provider.metadata?.audioKey ??
                    null,
                },
              },
        prompt: request.prompt,
        resolution: request.resolution ?? null,
        status: "pending",
      })
      .returning({ id: videos.id })
    revalidatePath("/videos")

    return { ok: true, id: insertedVideo.id }
  } catch (err) {
    console.error("[generate-video] submission failed:", err)
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Submission failed",
    }
  }
}
