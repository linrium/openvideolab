import { desc, eq, isNotNull } from "drizzle-orm"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { videos } from "@/db/schema/videos"
import { getPresignedUrl } from "@/lib/r2"
import { ExploreMasonry } from "./explore-masonry"

async function fetchPublishedItems() {
  const publishedImageRows = await db
    .select({
      imageId: images.id,
      publishedAt: images.publishedAt,
      path: images.path,
      sourceUrl: images.sourceUrl,
      width: images.width,
      height: images.height,
    })
    .from(images)
    .where(isNotNull(images.publishedAt))
    .orderBy(desc(images.publishedAt))

  const imageItems = await Promise.all(
    publishedImageRows.map(async (row) => {
      const url = row.path
        ? await getPresignedUrl({ key: row.path }).catch(() => "")
        : (row.sourceUrl ?? "")
      return {
        type: "image" as const,
        id: row.imageId,
        href: `/explore/images/${row.imageId}`,
        url,
        width: row.width ?? 1024,
        height: row.height ?? 1024,
        publishedAt: row.publishedAt ?? new Date(0),
      }
    })
  )

  const publishedVideos = await db
    .select({
      videoId: videos.id,
      generationId: generations.id,
      publishedAt: generations.publishedAt,
      path: videos.path,
      aspectRatio: videos.aspectRatio,
    })
    .from(generations)
    .innerJoin(videos, eq(videos.generationId, generations.id))
    .where(isNotNull(generations.publishedAt))
    .orderBy(desc(generations.publishedAt))

  const videoItems = await Promise.all(
    publishedVideos.map(async (row) => {
      const url = row.path
        ? await getPresignedUrl({ key: row.path }).catch(() => "")
        : ""
      return {
        type: "video" as const,
        id: row.videoId,
        href: `/explore/videos/${row.videoId}`,
        url,
        aspectRatio: row.aspectRatio ?? "16:9",
        publishedAt: row.publishedAt ?? new Date(0),
      }
    })
  )

  const all = [...imageItems, ...videoItems]
    .filter((item) => item.url)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

  return all
}

export default async function ExplorePage() {
  const items = await fetchPublishedItems()

  return (
    <div className="min-h-svh overflow-y-auto">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-muted-foreground">Nothing published yet.</p>
          <p className="text-muted-foreground text-sm">
            Generate an image or video and publish it to see it here.
          </p>
        </div>
      ) : (
        <ExploreMasonry items={items} />
      )}
    </div>
  )
}
