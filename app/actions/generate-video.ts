"use server"

import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { type Model, PRICING } from "@/lib/constants"
import { getOpenrouterClientByUserId } from "@/lib/openrouter-client"
import type { PersistedVideoProvider } from "@/lib/video-provider"

export interface SubmitVideoResult {
  id: string
  ok: true
}

export interface SubmitVideoError {
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

function getEstimatedCost(request: VideoGenerationRequest): string | null {
  const { model, resolution, duration, generateAudio } = request

  if (!resolution || (duration !== 5 && duration !== 10 && duration !== 15)) {
    return null
  }

  const modelPricing = PRICING[model as keyof typeof PRICING]
  if (!modelPricing) {
    return null
  }

  const table =
    generateAudio === false
      ? modelPricing.per_second.no_audio
      : modelPricing.per_second.with_audio

  const rate = table[resolution as keyof typeof table]

  return String(rate * duration)
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
    const openrouterClient = await getOpenrouterClientByUserId(session.user.id)
    const job = await openrouterClient.videoGeneration.generate({
      videoGenerationRequest: {
        ...request,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/video-created`,
      },
    })
    console.log("[generate-video] job submitted:", job)

    const [insertedVideo] = await db
      .insert(videos)
      .values({
        jobId: job.id,
        userId: session.user.id,
        title: metadata.title,
        prompt: request.prompt,
        model: request.model as Model,
        aspectRatio: request.aspectRatio ?? null,
        resolution: request.resolution ?? null,
        duration: request.duration ?? null,
        estimatedCost: getEstimatedCost(request),
        generateAudio: request.generateAudio ?? true,
        inputReferences: imageKeys.inputReferenceKeys ?? [],
        frameFirst: imageKeys.frameFirstKey ?? null,
        frameLast: imageKeys.frameLastKey ?? null,
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
