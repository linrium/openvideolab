"use client"

import {
  IconArrowBackUp,
  IconArrowUp,
  IconArrowUpRight,
  IconDownload,
  IconEye,
  IconPhoto,
} from "@tabler/icons-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  IMAGE_SIZE_DIMENSIONS,
  type ImageSize,
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
} from "@/lib/image-generation"
import { cn } from "@/lib/utils"

const LABEL_SPLIT_PATTERN = /[-x]/
const IMAGE_PREVIEW_CONTENT_CLASS = "mx-auto w-full max-w-4xl"
const PROMPT_UNDO_STORAGE_PREFIX = "image-prompt-composer-undo:"

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
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

function getSubmitLabel({
  confirming,
  isEdit,
  isSubmitting,
}: {
  confirming: boolean
  isEdit: boolean
  isSubmitting: boolean
}): string {
  if (isSubmitting) {
    return isEdit ? "Editing…" : "Generating…"
  }

  if (confirming) {
    return "Click again to confirm"
  }

  return isEdit ? "Edit Image" : "Generate Image"
}

function downloadImage(url: string): void {
  const link = document.createElement("a")
  link.href = `/api/images/download?url=${encodeURIComponent(url)}`
  document.body.append(link)
  link.click()
  link.remove()
}

function getPromptUndoStorageKey(): string {
  return `${PROMPT_UNDO_STORAGE_PREFIX}${window.location.pathname}`
}

function savePromptForUndo(prompt: string): void {
  window.localStorage.setItem(
    getPromptUndoStorageKey(),
    JSON.stringify({ prompt })
  )
}

function readPromptForUndo(): string | null {
  const savedValue = window.localStorage.getItem(getPromptUndoStorageKey())
  if (!savedValue) {
    return null
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)
    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "prompt" in parsedValue &&
      typeof parsedValue.prompt === "string"
    ) {
      return parsedValue.prompt
    }
  } catch {
    window.localStorage.removeItem(getPromptUndoStorageKey())
  }

  return null
}

function clearPromptUndo(): void {
  window.localStorage.removeItem(getPromptUndoStorageKey())
}

function ImageError({
  createdAt,
  message,
}: {
  createdAt: string | null
  message: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{formatTimestamp(createdAt) ?? " "}</span>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-destructive text-sm">
        <span className="font-medium">Generation failed</span>
        <span className="line-clamp-3 max-w-full break-all text-xs opacity-70">
          {message}
        </span>
      </div>
    </div>
  )
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
      <IconPhoto className="text-muted-foreground" size={28} />
      <span>Generated images will appear here</span>
    </>
  )
}

export function ImagePreview({
  form,
  generatedImages,
  generationError = null,
  readOnly = false,
}: {
  form: ImageGenerationFormApi
  generatedImages: GeneratedImagesState[]
  generationError?: { createdAt: string; message: string } | null
  readOnly?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [canUndoPrompt, setCanUndoPrompt] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    size: ImageSize
  } | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(
    () => () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    setCanUndoPrompt(readPromptForUndo() !== null)
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || generatedImages.length === 0) {
      return
    }

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })
  }, [generatedImages.length])

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

  const handleReferenceClick = (url: string) => {
    const current = form.store.state.values.inputImages
    const currentModel = form.store.state.values.model
    const nextModel =
      currentModel === SUPPORTED_SEEDREAM_IMAGE_MODEL
        ? SUPPORTED_SEEDREAM_IMAGE_MODEL
        : SUPPORTED_IMAGE_GENERATION_MODEL
    const next = [...current, { key: uuidv4(), url }]
    form.setFieldValue("inputImages", next)
    form.setFieldValue("mode", "edit")
    form.setFieldValue("model", nextModel)
  }

  const handleViewPromptClick = (prompt: string) => {
    savePromptForUndo(form.store.state.values.prompt)
    setCanUndoPrompt(true)
    form.setFieldValue("prompt", prompt)
  }

  const handleUndoPromptClick = () => {
    const savedPrompt = readPromptForUndo()
    if (savedPrompt === null) {
      setCanUndoPrompt(false)
      return
    }

    form.setFieldValue("prompt", savedPrompt)
    clearPromptUndo()
    setCanUndoPrompt(false)
  }

  const selectedDimensions = selectedImage
    ? IMAGE_SIZE_DIMENSIONS[selectedImage.size]
    : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="w-full">
          <div className={IMAGE_PREVIEW_CONTENT_CLASS}>
            <div className="space-y-4 px-4 pt-4 pb-4">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => {
                  if (isSubmitting) {
                    return (
                      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                        <ImagePlaceholder isGenerating />
                      </div>
                    )
                  }
                  if (generationError) {
                    return (
                      <ImageError
                        createdAt={generationError.createdAt}
                        message={generationError.message}
                      />
                    )
                  }
                  return null
                }}
              </form.Subscribe>

              {generatedImages.length > 0 ? (
                generatedImages.toReversed().map((batch, batchIndex) => {
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

                  if (batch.error) {
                    return (
                      <div key={batchKey}>
                        {batchIndex > 0 && <Separator className="mb-4" />}
                        <ImageError
                          createdAt={batch.metadata.createdAt}
                          message={batch.error}
                        />
                      </div>
                    )
                  }

                  const isGallery = batch.images.length > 1

                  return (
                    <div key={batchKey}>
                      {batchIndex > 0 && <Separator className="mb-4" />}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
                        <span>{createdAtLabel ?? " "}</span>
                        {isGallery ? (
                          <span>{batch.images.length} images</span>
                        ) : null}
                      </div>
                      <div className="mb-3 flex flex-wrap items-center gap-y-1 text-muted-foreground text-xs">
                        {metadataItems.map((item, index) => (
                          <div className="flex items-center" key={item.label}>
                            {index > 0 ? (
                              <span className="mx-2 text-border">|</span>
                            ) : null}
                            <span>
                              {item.label}: {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div
                        className={cn(
                          "gap-3",
                          isGallery ? "columns-1 sm:columns-2" : "grid"
                        )}
                      >
                        {batch.images.map((image, imageIndex) => (
                          <div
                            className={cn(
                              "space-y-2",
                              isGallery && "mb-3 break-inside-avoid"
                            )}
                            key={image}
                          >
                            <div className="group relative overflow-hidden rounded-md border border-border/70 bg-muted/20">
                              <button
                                aria-label="Open image viewer"
                                className={cn(
                                  "block w-full cursor-zoom-in",
                                  isGallery && "bg-muted/40"
                                )}
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
                                  className="h-auto w-full"
                                  height={dimensions.height}
                                  loading={
                                    batchIndex === 0 && imageIndex === 0
                                      ? "eager"
                                      : "lazy"
                                  }
                                  src={image}
                                  unoptimized
                                  width={dimensions.width}
                                />
                              </button>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/15 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
                              <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                {!readOnly && (
                                  <Button
                                    aria-label="Use as reference"
                                    onClick={() => handleReferenceClick(image)}
                                    size="icon-sm"
                                    title="Reference"
                                    type="button"
                                    variant="secondary"
                                  >
                                    <IconArrowUpRight size={14} />
                                  </Button>
                                )}
                                {!readOnly && batch.metadata.prompt ? (
                                  <Button
                                    aria-label="View prompt"
                                    onClick={() =>
                                      handleViewPromptClick(
                                        batch.metadata.prompt ?? ""
                                      )
                                    }
                                    size="icon-sm"
                                    title="View Prompt"
                                    type="button"
                                    variant="secondary"
                                  >
                                    <IconEye size={14} />
                                  </Button>
                                ) : null}
                                <Button
                                  aria-label="Download image"
                                  onClick={() => {
                                    downloadImage(image)
                                  }}
                                  size="icon-sm"
                                  title="Download"
                                  type="button"
                                  variant="secondary"
                                >
                                  <IconDownload size={14} />
                                </Button>
                              </div>
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
                    isSubmitting || generationError ? null : (
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
        <div className="sticky bottom-0 border-border/70 border-t bg-background pt-4 pb-4">
          <div className={IMAGE_PREVIEW_CONTENT_CLASS}>
            <div className="px-4">
              <form.Field name="prompt">
                {(field) => (
                  <>
                    <InputGroup>
                      <InputGroupTextarea
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        className="max-h-[min(40svh,24rem)] overflow-y-auto"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Describe the image you want to generate…"
                        rows={4}
                        spellCheck={false}
                        value={field.state.value}
                      />
                      <InputGroupAddon
                        align="block-end"
                        className="justify-end"
                      >
                        <form.Subscribe
                          selector={(state) => ({
                            canSubmit: state.canSubmit,
                            isEdit: state.values.inputImages.length > 0,
                            isSubmitting: state.isSubmitting,
                            prompt: state.values.prompt,
                          })}
                        >
                          {({ canSubmit, isEdit, isSubmitting, prompt }) => {
                            const hasPrompt = prompt.trim().length > 0
                            const submitLabel = getSubmitLabel({
                              confirming,
                              isEdit,
                              isSubmitting,
                            })

                            return (
                              <div className="flex items-center gap-2">
                                {canUndoPrompt ? (
                                  <InputGroupButton
                                    disabled={isSubmitting}
                                    onClick={handleUndoPromptClick}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <IconArrowBackUp size={14} />
                                    Undo
                                  </InputGroupButton>
                                ) : null}
                                <InputGroupButton
                                  aria-label={submitLabel}
                                  disabled={
                                    !(canSubmit && hasPrompt) || isSubmitting
                                  }
                                  onClick={handleGenerateClick}
                                  size="icon-sm"
                                  title={submitLabel}
                                  type="button"
                                  variant={
                                    confirming ? "destructive" : "default"
                                  }
                                >
                                  {isSubmitting ? (
                                    <Spokes className="size-3" />
                                  ) : (
                                    <IconArrowUp size={16} />
                                  )}
                                </InputGroupButton>
                              </div>
                            )
                          }}
                        </form.Subscribe>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((error) => ({
                        message: String(error),
                      }))}
                    />
                  </>
                )}
              </form.Field>
            </div>
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
          className="w-fit max-w-[92vw] border-none bg-transparent p-0 shadow-none sm:max-w-[92vw]"
          showCloseButton
        >
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the generated image at full size.
          </DialogDescription>
          {selectedImage ? (
            <div className="flex w-fit items-center justify-center bg-black/90">
              <button
                aria-label="Close image viewer"
                className="block cursor-zoom-out"
                onClick={() => setSelectedImage(null)}
                type="button"
              >
                <Image
                  alt="Generated image preview"
                  className="max-h-[92vh] max-w-[92vw] object-contain"
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
