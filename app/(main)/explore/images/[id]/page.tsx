import { IconArrowLeft } from "@tabler/icons-react"
import { and, eq, isNotNull } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CopyLinkButton } from "@/components/copy-link-button"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { getPresignedUrl } from "@/lib/r2"

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export default async function ExploreImageDetailPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({
      path: images.path,
      sourceUrl: images.sourceUrl,
      width: images.width,
      height: images.height,
      prompt: images.prompt,
      model: images.model,
      quality: images.quality,
      size: images.size,
      publishedAt: images.publishedAt,
      generationTitle: generations.title,
      authorName: users.name,
    })
    .from(images)
    .innerJoin(generations, eq(images.generationId, generations.id))
    .innerJoin(users, eq(generations.userId, users.id))
    .where(and(eq(images.id, id), isNotNull(images.publishedAt)))
    .limit(1)

  if (!row) {
    notFound()
  }

  const url = row.path
    ? await getPresignedUrl({ key: row.path }).catch(() => "")
    : (row.sourceUrl ?? "")

  if (!url) {
    notFound()
  }

  const width = row.width ?? 1024
  const height = row.height ?? 1024

  const sidebarRows: { label: string; value: string }[] = [
    row.model && { label: "Model", value: row.model },
    row.quality && { label: "Quality", value: row.quality },
    row.size && { label: "Size", value: row.size.replace("x", " × ") },
    row.publishedAt && {
      label: "Published",
      value: formatDate(row.publishedAt),
    },
    { label: "Author", value: row.authorName },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <Link
          className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          href="/explore"
        >
          <IconArrowLeft size={15} />
          Explore
        </Link>
        <CopyLinkButton size="sm" variant="outline" />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-[50vh] w-full justify-center bg-muted/30 p-3">
            <Image
              alt={row.generationTitle || row.prompt || "Published image"}
              className="h-full w-auto max-w-full rounded-lg object-contain shadow-md"
              height={height}
              src={url}
              unoptimized
              width={width}
            />
          </div>

          {(row.generationTitle || row.prompt) && (
            <div className="px-6 py-5">
              {row.generationTitle && (
                <h1 className="mb-3 font-semibold text-base leading-snug">
                  {row.generationTitle}
                </h1>
              )}
              {row.prompt && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {row.prompt}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l bg-background">
          <div className="space-y-4 p-5">
            {sidebarRows.map(({ label, value }) => (
              <div key={label}>
                <p className="mb-0.5 text-muted-foreground text-xs uppercase tracking-wide">
                  {label}
                </p>
                <p className="break-words text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
