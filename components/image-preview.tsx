"use client"

import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type {
  GeneratedImagesState,
  ImageGenerationFormApi,
} from "@/components/image-studio"
import { Spokes } from "@/components/loading-ui/spokes"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { IMAGE_SIZE_DIMENSIONS } from "@/lib/image-generation"

function ImagePlaceholder({ isGenerating }: { isGenerating: boolean }) {
  if (isGenerating) {
    return (
      <>
        <Spokes className="size-8 text-muted-foreground" />
        <span>Generating images…</span>
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

export function ImagePreview({
  form,
  generatedImages,
}: {
  form: ImageGenerationFormApi
  generatedImages: GeneratedImagesState | null
}) {
  const [confirming, setConfirming] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dimensions = generatedImages
    ? IMAGE_SIZE_DIMENSIONS[generatedImages.size]
    : null

  useEffect(
    () => () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current)
      }
    },
    []
  )

  const handleGenerateClick = () => {
    if (confirming) {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current)
      }
      setConfirming(false)
      form.handleSubmit()
      return
    }

    setConfirming(true)
    confirmTimeoutRef.current = setTimeout(() => setConfirming(false), 3000)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full space-y-3">
          <div className="mx-auto w-full max-w-4xl space-y-3">
            <div className="px-4 pt-4">
              {generatedImages && dimensions ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {generatedImages.images.map((image) => (
                    <div
                      className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20"
                      key={image}
                    >
                      <Image
                        alt="Generated image"
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
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                      <ImagePlaceholder isGenerating={isSubmitting} />
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
              prompt: state.values.prompt,
            })}
          >
            {({ canSubmit, isSubmitting, prompt }) => {
              let submitLabel = "Generate Image"
              if (isSubmitting) {
                submitLabel = "Generating…"
              } else if (confirming) {
                submitLabel = "Click again to confirm"
              }

              const hasPrompt = prompt.trim().length > 0

              return (
                <Button
                  disabled={!(canSubmit && hasPrompt) || isSubmitting}
                  onClick={handleGenerateClick}
                  type="button"
                  variant={confirming ? "destructive" : "default"}
                >
                  {submitLabel}
                </Button>
              )
            }}
          </form.Subscribe>
        </div>
      </div>
    </div>
  )
}
