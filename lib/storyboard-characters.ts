import { eq } from "drizzle-orm"
import { db } from "@/db"
import { images } from "@/db/schema/images"
import { storyCharacters } from "@/db/schema/stories"
import { getPresignedUrl } from "@/lib/r2"
import type { StoryboardSelectableImage } from "@/lib/storyboard"

export async function getStoryCharacterImages(
  storyId: string
): Promise<Record<string, StoryboardSelectableImage>> {
  const rows = await db
    .select({
      name: storyCharacters.name,
      imageId: images.id,
      prompt: images.prompt,
      path: images.path,
      sourceUrl: images.sourceUrl,
    })
    .from(storyCharacters)
    .innerJoin(images, eq(storyCharacters.imageId, images.id))
    .where(eq(storyCharacters.storyId, storyId))

  const result: Record<string, StoryboardSelectableImage> = {}

  await Promise.all(
    rows.map(async (row) => {
      const url = row.path
        ? await getPresignedUrl({ key: row.path }).catch(() => "")
        : (row.sourceUrl ?? "")

      if (!url) {
        return
      }

      result[row.name] = {
        id: row.imageId,
        prompt: row.prompt,
        title: "",
        url,
      }
    })
  )

  return result
}
