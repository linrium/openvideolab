import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { getPresignedUrl } from "@/lib/r2"

export default async function Home() {
  const videoUrl = await getPresignedUrl({ key: "test-video.mp4" })

  return (
    <div className="grid h-full min-h-0 w-full overflow-hidden lg:grid-cols-2">
      <section className="h-full min-h-0 overflow-hidden p-4 sm:p-6">
        <VideoPreview url={videoUrl} />
      </section>
      <aside className="h-[100svh] min-h-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <VideoForm />
      </aside>
    </div>
  )
}
