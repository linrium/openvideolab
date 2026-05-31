"use server"

import { and, desc, eq, isNotNull } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { getPresignedUrl } from "@/lib/r2"

export interface MentionItem {
  id: string
  label: string
  thumbnailUrl?: string
  type: "image" | "video"
  url: string
}

export async function fetchMentionItemsAction(): Promise<MentionItem[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return []
  }

  const [imageRows, videoRows] = await Promise.all([
    db
      .select({
        path: images.path,
        prompt: images.prompt,
        generationId: images.generationId,
      })
      .from(images)
      .where(
        and(
          eq(images.userId, session.user.id),
          eq(images.status, "completed"),
          isNotNull(images.path)
        )
      )
      .orderBy(desc(images.createdAt))
      .limit(30),

    db
      .select({
        path: videos.path,
        prompt: videos.prompt,
        generationId: videos.generationId,
      })
      .from(videos)
      .where(
        and(
          eq(videos.userId, session.user.id),
          eq(videos.status, "completed"),
          isNotNull(videos.path)
        )
      )
      .orderBy(desc(videos.createdAt))
      .limit(30),
  ])

  const generationIds = [
    ...imageRows.map((r) => r.generationId),
    ...videoRows.map((r) => r.generationId),
  ]

  const titleMap = new Map<string, string>()
  if (generationIds.length > 0) {
    const generationRows = await db
      .select({ id: generations.id, title: generations.title })
      .from(generations)
      .where(and(eq(generations.userId, session.user.id)))
    for (const row of generationRows) {
      titleMap.set(row.id, row.title)
    }
  }

  const items: MentionItem[] = []

  for (const row of imageRows) {
    if (!row.path) {
      continue
    }
    try {
      const url = await getPresignedUrl({ key: row.path })
      const title = titleMap.get(row.generationId)
      const label =
        title?.trim() || row.prompt?.slice(0, 40) || "Untitled image"
      items.push({
        id: row.path,
        label,
        type: "image",
        url,
        thumbnailUrl: url,
      })
    } catch {
      // skip inaccessible
    }
  }

  for (const row of videoRows) {
    if (!row.path) {
      continue
    }
    try {
      const url = await getPresignedUrl({ key: row.path })
      const title = titleMap.get(row.generationId)
      const label =
        title?.trim() || row.prompt?.slice(0, 40) || "Untitled video"
      items.push({
        id: row.path,
        label,
        type: "video",
        url,
      })
    } catch {
      // skip inaccessible
    }
  }

  return items
}
