"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { deleteMultipleFromR2 } from "@/lib/r2"

export interface DeleteGenerationSuccess {
  ok: true
}

export interface DeleteGenerationError {
  message: string
  ok: false
}

export async function deleteGenerationAction(
  generationId: string
): Promise<DeleteGenerationSuccess | DeleteGenerationError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const [generation] = await db
    .select({
      id: generations.id,
      type: generations.type,
      userId: generations.userId,
    })
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1)

  if (!generation || generation.userId !== session.user.id) {
    return { ok: false, message: "Not found" }
  }

  const paths: string[] = []

  if (generation.type === "image") {
    const rows = await db
      .select({ path: images.path })
      .from(images)
      .where(eq(images.generationId, generationId))
    for (const row of rows) {
      if (row.path) {
        paths.push(row.path)
      }
    }
  } else if (generation.type === "video") {
    const rows = await db
      .select({ path: videos.path })
      .from(videos)
      .where(eq(videos.generationId, generationId))
    for (const row of rows) {
      if (row.path) {
        paths.push(row.path)
      }
    }
  }

  await deleteMultipleFromR2(paths)
  await db.delete(generations).where(eq(generations.id, generationId))

  revalidatePath("/", "layout")

  return { ok: true }
}
