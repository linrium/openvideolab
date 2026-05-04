import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function AssetPreview() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full space-y-3">
          <div className="mx-auto w-full max-w-4xl space-y-3">
            <div className="px-4 pt-4">
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
                    Generated images will appear here once the compose flow is
                    wired up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-border/70 border-t bg-background px-4 pt-4 pb-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <Textarea
            placeholder="Describe the asset you want to generate…"
            rows={10}
            spellCheck={false}
          />
          <Button disabled type="button">
            Generate Asset
          </Button>
        </div>
      </div>
    </div>
  )
}
