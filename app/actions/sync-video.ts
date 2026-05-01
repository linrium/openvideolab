"use server"

import { fetchVideoContent } from "@/lib/openrouter-video"
import { uploadToR2 } from "@/lib/r2"

export interface SyncVideoResult {
  key: string
  ok: true
}

export interface SyncVideoError {
  message: string
  ok: false
}

export async function syncVideoToR2(
  jobId: string,
  index = 0
): Promise<SyncVideoResult | SyncVideoError> {
  try {
    const response = await fetchVideoContent(jobId, index)
    const key = `videos/${jobId}.mp4`
    const contentType = response.headers.get("Content-Type") ?? "video/mp4"
    const buffer = Buffer.from(await response.arrayBuffer())

    await uploadToR2(key, buffer, contentType)

    return { ok: true, key }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Sync failed",
    }
  }
}
