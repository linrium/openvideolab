import { IconArrowLeft } from "@tabler/icons-react"
import { and, eq, isNotNull } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CopyLinkButton } from "@/components/copy-link-button"
import { VideoJsPlayer } from "@/components/video-js-player"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"
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

export default async function ExploreVideoDetailPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({
      videoId: videos.id,
      path: videos.path,
      prompt: videos.prompt,
      model: videos.model,
      aspectRatio: videos.aspectRatio,
      resolution: videos.resolution,
      duration: videos.duration,
      status: videos.status,
      title: generations.title,
      publishedAt: generations.publishedAt,
      authorName: users.name,
    })
    .from(videos)
    .innerJoin(generations, eq(videos.generationId, generations.id))
    .innerJoin(users, eq(generations.userId, users.id))
    .where(and(eq(videos.id, id), isNotNull(generations.publishedAt)))
    .limit(1)

  if (!row) {
    notFound()
  }

  const url = row.path
    ? await getPresignedUrl({ key: row.path }).catch(() => "")
    : ""

  if (!url) {
    notFound()
  }

  const aspectRatio = row.aspectRatio ?? "16:9"

  const sidebarRows: { label: string; value: string }[] = [
    row.model && { label: "Model", value: row.model },
    row.aspectRatio && { label: "Aspect ratio", value: row.aspectRatio },
    row.resolution && { label: "Resolution", value: row.resolution },
    row.duration != null && { label: "Duration", value: `${row.duration}s` },
    { label: "Published", value: formatDate(row.publishedAt ?? new Date()) },
    { label: "Author", value: row.authorName },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Back bar */}
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
        {/* Main: video + prompt */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="w-full p-3">
            <VideoJsPlayer aspectRatio={aspectRatio} src={url} />
          </div>
          {row.prompt && (
            <div className="px-6 py-5">
              {row.title && (
                <h1 className="mb-3 font-semibold text-base leading-snug">
                  {row.title}
                </h1>
              )}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {row.prompt}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar: meta info */}
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
