import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { VideoForm, type VideoFormValues } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"
import { getPresignedUrl } from "@/lib/r2"
import { getAtlasCloudOptions } from "@/lib/video-provider"

const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "9:21"]

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
    .select({
      aspectRatio: videos.aspectRatio,
      duration: videos.duration,
      error: videos.error,
      estimatedCost: videos.estimatedCost,
      frameFirst: videos.frameFirst,
      frameLast: videos.frameLast,
      generateAudio: videos.generateAudio,
      generationId: videos.referenceId,
      generationTime: videos.generationTime,
      inputReferences: videos.inputReferences,
      jobId: videos.jobId,
      latency: videos.latency,
      model: videos.model,
      path: videos.path,
      prompt: videos.prompt,
      provider: videos.provider,
      resolution: videos.resolution,
      status: videos.status,
      title: generations.title,
      totalCost: videos.totalCost,
      userId: generations.userId,
      videoId: videos.id,
    })
    .from(videos)
    .innerJoin(generations, eq(videos.generationId, generations.id))
    .where(eq(videos.id, id))
    .limit(1)

  if (!video || video.userId !== session.user.id) {
    notFound()
  }

  const videoUrl = video.path
    ? await getPresignedUrl({ key: video.path }).catch(() => "")
    : ""
  const atlasCloudOptions = getAtlasCloudOptions(video.provider)
  const audioKey = video.provider?.metadata?.audioKey
  const [inputReferences, firstFrame, lastFrame, audioReference] =
    await Promise.all([
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
      audioKey
        ? getPresignedUrl({ key: audioKey })
            .then((url) => ({ key: audioKey, url }))
            .catch(() => undefined)
        : Promise.resolve(undefined),
    ])

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <VideoPreview jobId={video.jobId} url={videoUrl} video={video} />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:border-t-0 lg:border-l xl:max-w-lg">
        <VideoForm
          initialValues={{
            model: video.model,
            title: video.title,
            prompt: video.prompt,
            negativePrompt: atlasCloudOptions?.negative_prompt ?? "",
            aspectRatio: normalizeAspectRatio(video.aspectRatio),
            resolution: normalizeResolution(video.resolution),
            duration: normalizeDuration(video.duration),
            generateAudio: video.generateAudio,
            promptExtend: atlasCloudOptions?.prompt_extend ?? false,
            audioReference,
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
