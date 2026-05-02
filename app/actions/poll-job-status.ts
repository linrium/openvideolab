"use server"

import { eq } from "drizzle-orm"
import { refresh, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
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
      current: { path: string | null; status: string; userId: string }
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
      path: videos.path,
      status: videos.status,
      userId: videos.userId,
    })
    .from(videos)
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

async function syncCompletedVideo(
  jobId: string,
  openrouterApiKey: string,
  userId: string
): Promise<string> {
  const response = await fetchVideoContent(openrouterApiKey, jobId)
  const contentType = response.headers.get("Content-Type") ?? "video/mp4"
  const ext = contentType.split("/").pop()?.toLowerCase() ?? "mp4"
  const key = `${userId}/videos/${jobId}.${ext}`
  const buffer = Buffer.from(await response.arrayBuffer())

  await uploadToR2(key, buffer, contentType)
  await db
    .update(videos)
    .set({ error: null, path: key, updatedAt: new Date() })
    .where(eq(videos.jobId, jobId))

  return key
}

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
      await db
        .update(videos)
        .set({
          status: data.status,
          error: data.error ?? null,
          generationId: data.generationId ?? null,
          cost: data.usage?.cost == null ? undefined : String(data.usage.cost),
          updatedAt: new Date(),
        })
        .where(eq(videos.jobId, jobId))

      if (options.refreshClient !== false) {
        revalidatePath("/videos")
        refresh()
      }
    }

    if (data.status === "completed" && current && !current.path) {
      const key = await syncCompletedVideo(jobId, openrouterApiKey, userId)
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
