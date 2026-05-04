"use server"

import { eq } from "drizzle-orm"
import { refresh, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import {
  fetchVideoContent,
  getOpenRouterApiKeyByUserId,
  getOpenrouterClientByUserId,
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

interface PollJobStatusOptions {
  refreshClient?: boolean
  userId?: string
}

async function resolvePollJobContext(
  jobId: string,
  options: PollJobStatusOptions
): Promise<
  | {
      current: {
        generationId: string
        path: string | null
        status: string
        userId: string
      }
      userId: string
    }
  | PollJobStatusError
> {
  const session = options.userId
    ? null
    : await auth.api.getSession({ headers: await headers() })

  if (!(session || options.userId)) {
    return { ok: false, message: "Unauthorized" }
  }

  const [current] = await db
    .select({
      generationId: generations.id,
      path: videos.path,
      status: generations.status,
      userId: generations.userId,
    })
    .from(videos)
    .innerJoin(generations, eq(videos.generationId, generations.id))
    .where(eq(videos.jobId, jobId))
    .limit(1)

  if (!current) {
    return { ok: false, message: "Video not found" }
  }

  const userId = options.userId ?? session?.user.id
  if (!userId || current.userId !== userId) {
    return { ok: false, message: "Unauthorized" }
  }

  return { current, userId }
}

async function syncCompletedVideoAction(
  jobId: string,
  openrouterApiKey: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetchVideoContent(openrouterApiKey, jobId)
    const contentType = response.headers.get("Content-Type") ?? "video/mp4"
    const ext = contentType.split("/").pop()?.toLowerCase() ?? "mp4"
    const key = `${userId}/videos/${jobId}.${ext}`
    const buffer = Buffer.from(await response.arrayBuffer())

    await uploadToR2(key, buffer, contentType)
    console.log("[syncCompletedVideo] uploaded", key)
    await db.update(videos).set({ path: key }).where(eq(videos.jobId, jobId))

    return key
  } catch (err) {
    console.error("[syncCompletedVideo] error", err)
    return null
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: false positive
export async function pollJobStatusAction(
  jobId: string,
  options: PollJobStatusOptions = {}
): Promise<PollJobStatusResult | PollJobStatusError> {
  try {
    const context = await resolvePollJobContext(jobId, options)
    if (!("userId" in context)) {
      return context
    }

    const { current, userId } = context
    const openrouterClient = await getOpenrouterClientByUserId(userId)
    const openrouterApiKey = await getOpenRouterApiKeyByUserId(userId)
    const data = await openrouterClient.videoGeneration.getGeneration({ jobId })
    const statusChanged = Boolean(current && current.status !== data.status)

    if (statusChanged) {
      if (data.status === "completed") {
        const generation = data.generationId
          ? await openrouterClient.generations.getGeneration({
              id: data.generationId,
            })
          : null

        await db
          .update(generations)
          .set({
            error: data.error ?? null,
            generationTime:
              generation?.data.generationTime == null
                ? null
                : String(generation.data.generationTime),
            latency:
              generation?.data.latency == null
                ? null
                : String(generation.data.latency),
            referenceId: data.generationId ?? null,
            status: data.status,
            totalCost:
              generation?.data.totalCost == null
                ? undefined
                : String(generation.data.totalCost),
            updatedAt: new Date(),
          })
          .where(eq(generations.id, current.generationId))
      } else {
        await db
          .update(generations)
          .set({
            error: data.error ?? null,
            status: data.status,
            updatedAt: new Date(),
          })
          .where(eq(generations.id, current.generationId))
      }

      if (options.refreshClient !== false) {
        revalidatePath("/videos")
        refresh()
      }
    }

    if (data.status === "completed" && current && !current.path) {
      const key = await syncCompletedVideoAction(
        jobId,
        openrouterApiKey,
        userId
      )
      if (key === null) {
        return { ok: false, message: "Failed to sync" }
      }
      const url = await getPresignedUrl({ key })
      return { ok: true, status: data.status as VideoJobStatus, url }
    }

    return { ok: true, status: data.status as VideoJobStatus }
  } catch (err) {
    console.error(err)
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to sync",
    }
  }
}
