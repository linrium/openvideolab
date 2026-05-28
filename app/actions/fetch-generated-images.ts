"use server"

import { and, desc, eq, isNotNull } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { images } from "@/db/schema/images"
import { auth } from "@/lib/auth"
import { getPresignedUrl } from "@/lib/r2"

export interface GeneratedImageItem {
  height: number | null
  key: string
  model: string
  size: string | null
  url: string
  width: number | null
}

export async function fetchGeneratedImagesAction(): Promise<
  GeneratedImageItem[]
> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return []
  }

  const rows = await db
    .select({
      height: images.height,
      model: images.model,
      path: images.path,
      size: images.size,
      width: images.width,
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
    .limit(50)

  const results: GeneratedImageItem[] = []
  for (const row of rows) {
    if (!row.path) {
      continue
    }
    try {
      const url = await getPresignedUrl({ key: row.path })
      results.push({
        height: row.height,
        key: row.path,
        model: row.model,
        size: row.size,
        url,
        width: row.width,
      })
    } catch {
      // skip images with no accessible URL
    }
  }
  return results
}
