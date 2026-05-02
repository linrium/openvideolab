"use server"

import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { fetchVideoContent } from "@/lib/openrouter-client"
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  try {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.jobId, jobId))
      .limit(1)

    if (!video || video.userId !== session.user.id) {
      return { ok: false, message: "Video not found" }
    }

    const response = await fetchVideoContent(jobId, index)
    const contentType = response.headers.get("Content-Type") ?? "video/mp4"
    const ext = contentType.split("/").pop()?.toLowerCase() ?? "mp4"
    const key = `${session.user.id}/videos/${jobId}.${ext}`
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
