import { and, desc, eq, isNotNull, or } from "drizzle-orm"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { getPresignedUrl } from "@/lib/r2"
import type { StoryboardSelectableImage } from "@/lib/storyboard"

export async function getStoryboardSelectableImages(
  userId: string
): Promise<StoryboardSelectableImage[]> {
  const rows = await db
    .select({
      id: images.id,
      path: images.path,
      prompt: images.prompt,
      sourceUrl: images.sourceUrl,
      title: generations.title,
    })
    .from(images)
    .innerJoin(generations, eq(images.generationId, generations.id))
    .where(
      and(
        eq(generations.userId, userId),
        eq(generations.type, "image"),
        eq(images.status, "completed"),
        or(isNotNull(images.path), isNotNull(images.sourceUrl))
      )
    )
    .orderBy(desc(images.createdAt), desc(images.position))
    .limit(48)

  const resolvedImages = await Promise.all(
    rows.map(async (row) => {
      const url = row.path
        ? await getPresignedUrl({ key: row.path }).catch(() => "")
        : (row.sourceUrl ?? "")

      if (!url) {
        return null
      }

      return {
        id: row.id,
        prompt: row.prompt,
        title: row.title,
        url,
      } satisfies StoryboardSelectableImage
    })
  )

  return resolvedImages.filter((image) => image !== null)
}
