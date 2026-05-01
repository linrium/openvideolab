import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { getPresignedUrl } from "@/lib/r2"

export default async function Home() {
  const videoUrl = await getPresignedUrl({ key: "test-video.mp4" })

  return (
    <div className="flex min-h-screen items-start justify-center gap-6 p-8">
      <VideoForm />
      <VideoPreview url={videoUrl} />
    </div>
  )
}
