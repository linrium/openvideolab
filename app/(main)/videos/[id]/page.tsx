import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { VideoForm, type VideoFormValues } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { db } from "@/db"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { getPresignedUrl } from "@/lib/r2"

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"]

const RESOLUTIONS = ["480p", "720p", "1080p"]
const DURATIONS = [5, 10, 15]

function normalizeAspectRatio(
  value: string | null
): VideoFormValues["aspectRatio"] {
  return value &&
    ASPECT_RATIOS.includes(value as NonNullable<VideoFormValues["aspectRatio"]>)
    ? (value as NonNullable<VideoFormValues["aspectRatio"]>)
    : undefined
}

function normalizeResolution(
  value: string | null
): VideoFormValues["resolution"] {
  return value &&
    RESOLUTIONS.includes(value as NonNullable<VideoFormValues["resolution"]>)
    ? (value as NonNullable<VideoFormValues["resolution"]>)
    : undefined
}

function normalizeDuration(value: number | null): VideoFormValues["duration"] {
  return value &&
    DURATIONS.includes(value as NonNullable<VideoFormValues["duration"]>)
    ? (value as NonNullable<VideoFormValues["duration"]>)
    : undefined
}

interface VideoPageProps {
  params: Promise<{ id: string }>
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1)

  if (!video || video.userId !== session.user.id) {
    notFound()
  }

  const videoUrl = video.path
    ? await getPresignedUrl({ key: video.path }).catch(() => "")
    : ""
  const [inputReferences, firstFrame, lastFrame] = await Promise.all([
    Promise.all(
      (video.inputReferences ?? []).map(async (key) => ({
        key,
        url: await getPresignedUrl({ key }),
      }))
    ).catch(() => []),
    video.frameFirst
      ? getPresignedUrl({ key: video.frameFirst })
          .then((url) => ({ key: video.frameFirst as string, url }))
          .catch(() => undefined)
      : Promise.resolve(undefined),
    video.frameLast
      ? getPresignedUrl({ key: video.frameLast })
          .then((url) => ({ key: video.frameLast as string, url }))
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ])

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <VideoPreview jobId={video.jobId} url={videoUrl} video={video} />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <VideoForm
          initialValues={{
            model: video.model,
            title: video.title,
            prompt: video.prompt,
            aspectRatio: normalizeAspectRatio(video.aspectRatio),
            resolution: normalizeResolution(video.resolution),
            duration: normalizeDuration(video.duration),
            generateAudio: video.generateAudio,
            inputReferences,
            firstFrame,
            lastFrame,
          }}
          readOnly
        />
      </aside>
    </div>
  )
}
