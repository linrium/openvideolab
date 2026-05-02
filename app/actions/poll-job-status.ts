"use server"

import { eq } from "drizzle-orm"
import { refresh, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import {
  fetchVideoContent,
  openrouterClient,
  type VideoJobStatus,
} from "@/lib/openrouter-client"
import { getPresignedUrl, uploadToR2 } from "@/lib/r2"

export interface PollJobStatusResult {
  ok: true
  status: VideoJobStatus
  url?: string
}

export interface PollJobStatusError {
  message: string
  ok: false
}

export async function pollJobStatusAction(
  jobId: string
): Promise<PollJobStatusResult | PollJobStatusError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  try {
    const data = await openrouterClient.videoGeneration.getGeneration({ jobId })

    const [current] = await db
      .select({ path: videos.path, status: videos.status })
      .from(videos)
      .where(eq(videos.jobId, jobId))
      .limit(1)
    const statusChanged = Boolean(current && current.status !== data.status)

    if (statusChanged) {
      await db
        .update(videos)
        .set({
          status: data.status,
          generationId: data.generationId ?? null,
          cost: data.usage?.cost == null ? undefined : String(data.usage.cost),
          updatedAt: new Date(),
        })
        .where(eq(videos.jobId, jobId))

      revalidatePath("/videos")
      refresh()
    }

    if (data.status === "completed" && current && !current.path) {
      const response = await fetchVideoContent(jobId)
      const key = `videos/${jobId}.mp4`
      const contentType = response.headers.get("Content-Type") ?? "video/mp4"
      const buffer = Buffer.from(await response.arrayBuffer())
      await uploadToR2(key, buffer, contentType)
      await db
        .update(videos)
        .set({ path: key, updatedAt: new Date() })
        .where(eq(videos.jobId, jobId))
      const url = await getPresignedUrl({ key })
      return { ok: true, status: data.status as VideoJobStatus, url }
    }

    return { ok: true, status: data.status as VideoJobStatus }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to sync",
    }
  }
}
