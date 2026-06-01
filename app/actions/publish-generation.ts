"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { auth } from "@/lib/auth"

type PublishResult =
  | { ok: true; publishedAt: string | null }
  | { ok: false; message: string }

export async function publishGenerationAction(
  generationId: string,
  publish: boolean
): Promise<PublishResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const publishedAt = publish ? new Date() : null

  const [updated] = await db
    .update(generations)
    .set({ publishedAt })
    .where(
      and(
        eq(generations.id, generationId),
        eq(generations.userId, session.user.id)
      )
    )
    .returning({ publishedAt: generations.publishedAt })

  if (!updated) {
    return { ok: false, message: "Generation not found" }
  }

  return {
    ok: true,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  }
}
