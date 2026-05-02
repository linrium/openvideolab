"use server"

import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { openrouterClient } from "@/lib/openrouter-client"

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

export async function submitVideoAction(
  request: VideoGenerationRequest,
  imageKeys: ImageKeys = {}
): Promise<SubmitVideoResult | SubmitVideoError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  try {
    const job = await openrouterClient.videoGeneration.generate({
      videoGenerationRequest: request,
    })
    console.log("[generate-video] job submitted:", job)

    await db.insert(videos).values({
      jobId: job.id,
      userId: session.user.id,
      prompt: request.prompt,
      model: request.model,
      aspectRatio: request.aspectRatio ?? null,
      resolution: request.resolution ?? null,
      duration: request.duration ?? null,
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
