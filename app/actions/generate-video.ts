"use server"

import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { getOpenrouterClientByUserId } from "@/lib/openrouter-client"

const PRICING = {
  perSecond: {
    withAudio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
    noAudio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
  },
} as const
const PRICED_RESOLUTIONS = ["480p", "720p", "1080p"] as const
type PricedResolution = (typeof PRICED_RESOLUTIONS)[number]

export interface SubmitVideoResult {
  jobId: string
  ok: true
}

export interface SubmitVideoError {
  message: string
  ok: false
}

interface ImageKeys {
  frameFirstKey?: string
  frameLastKey?: string
  inputReferenceKeys?: string[]
}

interface VideoMetadata {
  title: string
}

function getEstimatedCost(request: VideoGenerationRequest): string | null {
  const resolution = request.resolution
  const duration = request.duration

  if (
    !resolution ||
    (duration !== 5 && duration !== 10 && duration !== 15) ||
    !PRICED_RESOLUTIONS.includes(resolution as PricedResolution)
  ) {
    return null
  }

  const rate =
    request.generateAudio === false
      ? PRICING.perSecond.noAudio[resolution as PricedResolution]
      : PRICING.perSecond.withAudio[resolution as PricedResolution]

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
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/video-created`,
      },
    })
    console.log("[generate-video] job submitted:", job)

    await db.insert(videos).values({
      jobId: job.id,
      userId: session.user.id,
      title: metadata.title,
      prompt: request.prompt,
      model: request.model,
      aspectRatio: request.aspectRatio ?? null,
      resolution: request.resolution ?? null,
      estimatedCost: getEstimatedCost(request),
      generateAudio: request.generateAudio ?? true,
      inputReferences: imageKeys.inputReferenceKeys ?? [],
      frameFirst: imageKeys.frameFirstKey ?? null,
      frameLast: imageKeys.frameLastKey ?? null,
    })
    revalidatePath("/videos")

    return { ok: true, jobId: job.id }
  } catch (err) {
    console.error("[generate-video] submission failed:", err)
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Submission failed",
    }
  }
}
