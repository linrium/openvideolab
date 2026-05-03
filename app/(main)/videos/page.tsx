import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"

export default async function Home() {
  return (
    <div className="grid h-full min-h-0 w-full overflow-hidden lg:grid-cols-2">
      <section className="h-full min-h-0 overflow-y-auto">
        <VideoPreview url="" />
      </section>
      <aside className="h-svh min-h-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <VideoForm />
      </aside>
    </div>
  )
}
