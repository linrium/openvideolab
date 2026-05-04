"use client"

import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import type {
  AssetGenerationFormApi,
  GeneratedAssetsState,
} from "@/components/asset-studio"
import { Spokes } from "@/components/loading-ui/spokes"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ASSET_SIZE_DIMENSIONS } from "@/lib/asset-generation"

function AssetPlaceholder({ isGenerating }: { isGenerating: boolean }) {
  if (isGenerating) {
    return (
      <>
        <Spokes className="size-8 text-muted-foreground" />
        <span>Generating assets…</span>
      </>
    )
  }

  return (
    <>
      <HugeiconsIcon
        className="text-muted-foreground"
        icon={Image01Icon}
        size={28}
        strokeWidth={2}
      />
      <span>Generated images will appear here</span>
    </>
  )
}

export function AssetPreview({
  form,
  generatedAssets,
}: {
  form: AssetGenerationFormApi
  generatedAssets: GeneratedAssetsState | null
}) {
  const dimensions = generatedAssets
    ? ASSET_SIZE_DIMENSIONS[generatedAssets.size]
    : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full space-y-3">
          <div className="mx-auto w-full max-w-4xl space-y-3">
            <div className="px-4 pt-4">
              {generatedAssets && dimensions ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {generatedAssets.images.map((image) => (
                    <div
                      className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20"
                      key={image}
                    >
                      <Image
                        alt="Generated asset"
                        className="h-auto w-full"
                        height={dimensions.height}
                        src={image}
                        unoptimized
                        width={dimensions.width}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <div className="flex aspect-square w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-3xl border border-border/70 border-dashed bg-muted/20 px-6 text-center text-muted-foreground text-sm">
                      <AssetPlaceholder isGenerating={isSubmitting} />
                    </div>
                  )}
                </form.Subscribe>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-border/70 border-t bg-background px-4 pt-4 pb-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <form.Field name="prompt">
            {(field) => (
              <>
                <Textarea
                  aria-invalid={field.state.meta.errors.length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Describe the image you want to generate…"
                  rows={10}
                  spellCheck={false}
                  value={field.state.value}
                />
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: String(error),
                  }))}
                />
              </>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                disabled={!canSubmit || isSubmitting}
                onClick={() => form.handleSubmit()}
                type="button"
              >
                {isSubmitting ? "Generating…" : "Generate Asset"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    </div>
  )
}
