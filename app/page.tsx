import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { getPresignedUrl } from "@/lib/r2"

export default async function Home() {
  const videoUrl = await getPresignedUrl({ key: "test-video.mp4" })

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-start">
      <section className="w-full max-w-2xl">
        <VideoForm />
      </section>
      <section className="w-full max-w-2xl">
        <VideoPreview url={videoUrl} />
      </section>
    </div>
  )
}
