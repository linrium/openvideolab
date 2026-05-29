import { ResizableRightSidebar } from "@/components/resizable-right-sidebar"
import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"

const VIDEO_SETTINGS_SIDEBAR_WIDTH_KEY = "video-settings-sidebar-width"

export default async function Home() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <VideoPreview url="" />
      </section>
      <ResizableRightSidebar storageKey={VIDEO_SETTINGS_SIDEBAR_WIDTH_KEY}>
        <VideoForm />
      </ResizableRightSidebar>
    </div>
  )
}
