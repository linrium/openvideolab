import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { getPresignedUrl } from "@/lib/r2"

export default async function Home() {
  const videoUrl = await getPresignedUrl({ key: "test-video.mp4" })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:justify-center">
      <section className="w-full" id="generator">
        <VideoForm />
      </section>
      <section className="w-full max-w-2xl" id="preview">
        <VideoPreview url={videoUrl} />
      </section>
    </div>
  )
}
