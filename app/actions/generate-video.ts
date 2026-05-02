"use server"

import type { VideoGenerationRequest } from "@openrouter/sdk/models"
import { openrouterClient } from "@/lib/openrouter-client"

export interface SubmitVideoResult {
  jobId: string
  ok: true
}

export interface SubmitVideoError {
  message: string
  ok: false
}

export async function submitVideoAction(
  request: VideoGenerationRequest
): Promise<SubmitVideoResult | SubmitVideoError> {
  try {
    const job = await openrouterClient.videoGeneration.generate({
      videoGenerationRequest: request,
    })
    console.log("[generate-video] job submitted:", job)
    return { ok: true, jobId: job.id }
  } catch (err) {
    console.error("[generate-video] submission failed:", err)
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Submission failed",
    }
  }
}
