import type { VideoGenerationResponse } from "@openrouter/sdk/models"
import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"
import { openrouterClient } from "@/lib/openrouter-video"
import { getPresignedUrl } from "@/lib/r2"

const TEST_JOB_ID = "eGpsWAuifV13q7WlnWCT"

export default async function Home() {
  const [videoUrl, generation] = await Promise.all([
    getPresignedUrl({ key: "test-video.mp4" }),
    openrouterClient.videoGeneration
      .getGeneration({ jobId: TEST_JOB_ID })
      .catch((): VideoGenerationResponse | null => null),
  ])

  return (
    <div className="grid h-full min-h-0 w-full overflow-hidden lg:grid-cols-2">
      <section className="h-full min-h-0 overflow-y-auto">
        <VideoPreview generation={generation} url={videoUrl} />
      </section>
      <aside className="h-[100svh] min-h-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <VideoForm />
      </aside>
    </div>
  )
}
