import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function AssetPreview() {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="flex aspect-square w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-3xl border border-border/70 border-dashed bg-muted/20 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={Image01Icon}
            size={28}
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1">
          <h2 className="font-medium text-base">Asset preview</h2>
          <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
            Generated images will appear here once the compose flow is wired up.
          </p>
        </div>
      </div>
    </div>
  )
}
