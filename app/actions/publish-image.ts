"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { images } from "@/db/schema/images"
import { auth } from "@/lib/auth"

type PublishImageResult =
  | { ok: true; publishedAt: string | null }
  | { ok: false; message: string }

export async function publishImageAction(
  imageId: string,
  publish: boolean
): Promise<PublishImageResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const publishedAt = publish ? new Date() : null

  const [updated] = await db
    .update(images)
    .set({ publishedAt })
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .returning({ publishedAt: images.publishedAt })

  if (!updated) {
    return { ok: false, message: "Image not found" }
  }

  return {
    ok: true,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  }
}
