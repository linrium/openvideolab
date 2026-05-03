import { MusicForm } from "@/components/music-form"
import { MusicPreview } from "@/components/music-preview"

export default function NewMusicPage() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <MusicPreview url="" />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <MusicForm />
      </aside>
    </div>
  )
}
