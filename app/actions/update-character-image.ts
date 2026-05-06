"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db"
import { stories, storyCharacters } from "@/db/schema/stories"
import { auth } from "@/lib/auth"

export async function updateCharacterImageAction(
  storyId: string,
  characterName: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const [story] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(and(eq(stories.id, storyId), eq(stories.userId, session.user.id)))
    .limit(1)

  if (!story) {
    return { ok: false, message: "Story not found" }
  }

  await db
    .insert(storyCharacters)
    .values({ imageId, name: characterName, storyId, userId: session.user.id })
    .onConflictDoUpdate({
      target: [storyCharacters.storyId, storyCharacters.name],
      set: { imageId, updatedAt: new Date() },
    })

  return { ok: true }
}
