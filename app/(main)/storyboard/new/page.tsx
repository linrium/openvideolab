import { ClipboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { StoryboardForm } from "@/components/storyboard-form"

export default function NewStoryboardPage() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      <section className="flex min-h-0 flex-1 justify-center overflow-y-auto bg-muted/10">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center p-6">
          <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border/70 border-dashed bg-background/80 p-10 text-center">
            <HugeiconsIcon icon={ClipboardIcon} size={28} strokeWidth={2} />
            <div className="space-y-1">
              <h1 className="font-medium text-lg">Storyboard</h1>
              <p className="text-muted-foreground text-sm">
                Build your storyboard layout here.
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:border-t-0 lg:border-l xl:max-w-lg">
        <StoryboardForm />
      </aside>
    </div>
  )
}
