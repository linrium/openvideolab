"use client"

import { Download01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type {
  GeneratedImagesState,
  ImageGenerationFormApi,
} from "@/components/image-studio"
import { Spokes } from "@/components/loading-ui/spokes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { IMAGE_SIZE_DIMENSIONS, type ImageSize } from "@/lib/image-generation"

const LABEL_SPLIT_PATTERN = /[-x]/

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatCost(value: string | null): string | null {
  if (!value) {
    return null
  }

  return `$${Number(value).toFixed(3)}`
}

function labelFromValue(value: string): string {
  return value
    .split(LABEL_SPLIT_PATTERN)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

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
  readOnly = false,
}: {
  form: ImageGenerationFormApi
  generatedImages: GeneratedImagesState[]
  readOnly?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    size: ImageSize
  } | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const selectedDimensions = selectedImage
    ? IMAGE_SIZE_DIMENSIONS[selectedImage.size]
    : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full">
          <div className="mx-auto w-full max-w-4xl">
            <div className="space-y-6 px-4 pt-4">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) =>
                  isSubmitting ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                      <ImagePlaceholder isGenerating />
                    </div>
                  ) : null
                }
              </form.Subscribe>

              {generatedImages.length > 0 ? (
                generatedImages.map((batch, batchIndex) => {
                  const batchKey =
                    batch.images[0] ?? batch.metadata.createdAt ?? batchIndex
                  const dimensions = IMAGE_SIZE_DIMENSIONS[batch.size]
                  const createdAtLabel = formatTimestamp(
                    batch.metadata.createdAt
                  )
                  const metadataItems = [
                    {
                      label: "Size",
                      value: [
                        batch.metadata.size.replace("x", " × "),
                        batch.metadata.quality
                          ? labelFromValue(batch.metadata.quality)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · "),
                    },
                    { label: "Model", value: batch.metadata.model },
                    {
                      label: "Cost",
                      value: formatCost(batch.metadata.cost),
                    },
                  ].filter((item) => item.value)

                  return (
                    <div key={batchKey}>
                      {batchIndex > 0 && <Separator className="mb-6" />}
                      <div className="grid gap-3 2xl:grid-cols-2">
                        {batch.images.map((image) => (
                          <div className="space-y-2" key={image}>
                            <div className="flex items-center justify-between text-muted-foreground text-xs">
                              <span>{createdAtLabel ?? " "}</span>
                            </div>
                            <div className="group relative overflow-hidden border border-border/70 bg-muted/20">
                              <button
                                aria-label="Open image viewer"
                                className="block w-full cursor-zoom-in"
                                onClick={() =>
                                  setSelectedImage({
                                    url: image,
                                    size: batch.size,
                                  })
                                }
                                type="button"
                              >
                                <Image
                                  alt="Generated image"
                                  className="h-auto w-full rounded-md"
                                  height={dimensions.height}
                                  src={image}
                                  unoptimized
                                  width={dimensions.width}
                                />
                              </button>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/15 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
                              <div className="absolute right-3 bottom-3 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <Button
                                  asChild
                                  size="sm"
                                  type="button"
                                  variant="secondary"
                                >
                                  <a download href={image} rel="noopener">
                                    <HugeiconsIcon
                                      icon={Download01Icon}
                                      size={14}
                                      strokeWidth={2}
                                    />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-1 text-muted-foreground text-xs">
                              {metadataItems.map((item, index) => (
                                <div
                                  className="flex items-center"
                                  key={item.label}
                                >
                                  {index > 0 ? (
                                    <span className="mx-2 text-border">/</span>
                                  ) : null}
                                  <span>
                                    {item.label}: {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) =>
                    isSubmitting ? null : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                        <ImagePlaceholder isGenerating={false} />
                      </div>
                    )
                  }
                </form.Subscribe>
              )}
            </div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 border-border/70 border-t bg-background px-4 pt-4 pb-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <form.Field name="prompt">
              {(field) => (
                <>
                  <Textarea
                    aria-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
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
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null)
          }
        }}
        open={selectedImage !== null}
      >
        <DialogContent
          className="max-h-[92vh] max-w-[92vw] border-none bg-transparent p-0 shadow-none sm:max-w-[92vw]"
          showCloseButton
        >
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the generated image at full size.
          </DialogDescription>
          {selectedImage ? (
            <div className="flex items-center justify-center bg-black/90">
              <button
                aria-label="Close image viewer"
                className="cursor-zoom-out"
                onClick={() => setSelectedImage(null)}
                type="button"
              >
                <Image
                  alt="Generated image preview"
                  className="max-h-[92vh] w-auto object-contain"
                  height={selectedDimensions?.height ?? 1024}
                  src={selectedImage.url}
                  unoptimized
                  width={selectedDimensions?.width ?? 1024}
                />
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
