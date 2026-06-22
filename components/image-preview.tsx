"use client"

import {
  type Icon,
  IconArrowBackUp,
  IconArrowUp,
  IconArrowUpRight,
  IconCalendarTime,
  IconCpu,
  IconCurrencyDollar,
  IconDownload,
  IconEye,
  IconPhoto,
  IconRulerMeasure,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react"
import { useStore } from "@tanstack/react-form"
import Image from "next/image"
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { v4 as uuidv4 } from "uuid"
import { publishImageAction } from "@/app/actions/publish-image"
import { CopyLinkButton } from "@/components/copy-link-button"
import type {
  GeneratedImage,
  GeneratedImageMetadata,
  GeneratedImagesState,
  ImageGenerationFormApi,
} from "@/components/image-studio"
import { Spokes } from "@/components/loading-ui/spokes"
import { TextShimmer } from "@/components/motion-primitives/text-shimmer"
import { PromptComposer } from "@/components/prompt-composer"
import { SwapText } from "@/components/swap-text"
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
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  getEstimatedImageCostRange,
  IMAGE_DEFAULT_VALUES,
  IMAGE_SIZE_DIMENSIONS,
  type ImageGenerationValues,
  type ImageModel,
  type ImageSize,
  imageGenerationSchema,
  isGeminiImageModel,
  isOpenRouterImageModel,
  SUPPORTED_GEMINI_IMAGE_MODEL,
  SUPPORTED_IMAGE_EDIT_MODEL,
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
} from "@/lib/image-generation"
import { cn } from "@/lib/utils"

const LABEL_SPLIT_PATTERN = /[-x]/
const IMAGE_PREVIEW_CONTENT_CLASS = "mx-auto w-full max-w-4xl"
const IMAGE_ACTION_BUTTON_CLASS =
  "@md/image-card:size-auto size-6 @md/image-card:px-2 px-0 @md/image-card:has-data-[icon=inline-start]:pl-1.5 has-data-[icon=inline-start]:pl-0"
const DRAFT_CONFIG_UNDO_STORAGE_PREFIX = "image-draft-config-undo:"
const MODEL_LABELS = {
  [SUPPORTED_IMAGE_EDIT_MODEL]: "GPT Image 2",
  [SUPPORTED_IMAGE_GENERATION_MODEL]: "GPT Image 2",
  [SUPPORTED_SEEDREAM_IMAGE_MODEL]: "Seedream 4.5",
  [SUPPORTED_GEMINI_IMAGE_MODEL]: "Gemini 3 Pro Image",
} as const

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

function formatCostRange(range: { max: number; min: number }): string {
  if (range.min === range.max) {
    return `$${range.min.toFixed(3)}`
  }

  return `$${range.min.toFixed(3)}-$${range.max.toFixed(3)}`
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
    return "Confirm?"
  }

  return isEdit ? "Edit Image" : "Generate Image"
}

function downloadImage(url: string): void {
  const link = document.createElement("a")
  link.href = `/api/images/download?url=${encodeURIComponent(url)}`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function getDraftConfigUndoStorageKey(): string {
  return `${DRAFT_CONFIG_UNDO_STORAGE_PREFIX}${window.location.pathname}`
}

type ImageDraftConfig = Pick<
  ImageGenerationValues,
  | "background"
  | "imageSize"
  | "inputFidelity"
  | "inputImages"
  | "mask"
  | "mode"
  | "model"
  | "moderation"
  | "n"
  | "prompt"
  | "quality"
  | "size"
>

function getDraftConfig(values: ImageGenerationValues): ImageDraftConfig {
  return {
    background: values.background,
    imageSize: values.imageSize,
    inputFidelity: values.inputFidelity,
    inputImages: values.inputImages,
    mask: values.mask,
    mode: values.mode,
    model: values.model,
    moderation: values.moderation,
    n: values.n,
    prompt: values.prompt,
    quality: values.quality,
    size: values.size,
  }
}

function saveDraftConfigForUndo(values: ImageGenerationValues): void {
  window.localStorage.setItem(
    getDraftConfigUndoStorageKey(),
    JSON.stringify(getDraftConfig(values))
  )
}

function readDraftConfigForUndo(): ImageDraftConfig | null {
  const savedValue = window.localStorage.getItem(getDraftConfigUndoStorageKey())
  if (!savedValue) {
    return null
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)
    const parsedDraft = imageGenerationSchema.safeParse({
      ...IMAGE_DEFAULT_VALUES,
      ...(typeof parsedValue === "object" && parsedValue !== null
        ? parsedValue
        : {}),
    })
    if (parsedDraft.success) {
      return getDraftConfig(parsedDraft.data)
    }
  } catch {
    window.localStorage.removeItem(getDraftConfigUndoStorageKey())
  }

  return null
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
      <TextShimmer className="font-medium text-sm" duration={1.4}>
        Generating images…
      </TextShimmer>
    )
  }

  return (
    <>
      <IconPhoto className="text-muted-foreground" size={28} />
      <span>Generated images will appear here</span>
    </>
  )
}

function MetadataText({
  children,
  icon: IconComponent,
}: {
  children: ReactNode
  icon: Icon
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <IconComponent aria-hidden size={14} />
      <span className="min-w-0">{children}</span>
    </span>
  )
}

function ImagePublishButton({
  image,
  onToggle,
}: {
  image: GeneratedImage
  onToggle: (imageId: string, publishedAt: string | null) => void
}) {
  const [publishedAt, setPublishedAt] = useState(image.publishedAt)
  const [isPending, startTransition] = useTransition()
  const published = publishedAt !== null

  const handleToggle = () => {
    startTransition(async () => {
      const result = await publishImageAction(image.id, !published)
      if (result.ok) {
        setPublishedAt(result.publishedAt)
        onToggle(image.id, result.publishedAt)
      }
    })
  }

  return (
    <>
      {published && (
        <CopyLinkButton
          aria-label="Copy published image link"
          className={IMAGE_ACTION_BUTTON_CLASS}
          href={`/explore/images/${image.id}`}
          label="Copy"
          labelClassName="@md/image-card:inline hidden"
          size="sm"
          title="Copy link"
          variant="secondary"
        />
      )}
      <Button
        aria-label={published ? "Unpublish image" : "Publish image"}
        className={cn(
          IMAGE_ACTION_BUTTON_CLASS,
          published &&
            "border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        disabled={isPending}
        onClick={handleToggle}
        size="sm"
        title={published ? "Unpublish" : "Publish"}
        type="button"
        variant="secondary"
      >
        {published ? (
          <>
            <IconWorldOff data-icon="inline-start" />
            <span className="@md/image-card:inline hidden">Unpublish</span>
          </>
        ) : (
          <>
            <IconWorld data-icon="inline-start" />
            <span className="@md/image-card:inline hidden">Publish</span>
          </>
        )}
      </Button>
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
  const [canUndoDraftConfig, setCanUndoDraftConfig] = useState(false)
  const [loadingStartedAt, setLoadingStartedAt] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    size: ImageSize
  } | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null)
  const isViewingPromptConfigRef = useRef(false)
  const canSubmit = useStore(form.store, (state) => state.canSubmit)
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const loadingMetadata = useStore(form.store, (state) => ({
    cost: isGeminiImageModel(state.values.model)
      ? "Metered"
      : formatCostRange(
          getEstimatedImageCostRange({
            model: state.values.model,
            n: state.values.n,
            quality: state.values.quality,
            size: state.values.size,
          })
        ),
    model: MODEL_LABELS[state.values.model],
    quality:
      state.values.quality === "auto"
        ? null
        : labelFromValue(state.values.quality),
    size: state.values.size,
  }))

  useEffect(
    () => () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (isSubmitting) {
      setLoadingStartedAt((current) => current ?? new Date().toISOString())
      return
    }

    setLoadingStartedAt(null)
  }, [isSubmitting])

  useEffect(() => {
    if (!(generatedImages.length > 0 || isSubmitting || generationError)) {
      return
    }

    const animationFrame = requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({ block: "end" })
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [generatedImages.length, generationError, isSubmitting])

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

  const handleCancelGenerate = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current)
    }
    setConfirming(false)
  }

  const handleGenerateShortcut = () => {
    const state = form.store.state
    const hasPrompt = state.values.prompt.trim().length > 0
    if (!(state.canSubmit && hasPrompt) || state.isSubmitting) {
      return
    }

    handleGenerateClick()
  }

  const handleReferenceClick = (url: string) => {
    const current = form.store.state.values.inputImages
    const currentModel = form.store.state.values.model
    const nextModel = isOpenRouterImageModel(currentModel)
      ? currentModel
      : SUPPORTED_IMAGE_GENERATION_MODEL
    const next = [...current, { key: uuidv4(), url }]
    form.setFieldValue("inputImages", next)
    form.setFieldValue("mode", "edit")
    form.setFieldValue("model", nextModel)
  }

  const resolveMetadataModel = (model: string): ImageModel =>
    model === SUPPORTED_SEEDREAM_IMAGE_MODEL ||
    model === SUPPORTED_GEMINI_IMAGE_MODEL
      ? model
      : SUPPORTED_IMAGE_GENERATION_MODEL

  const applyDraftConfig = (draftConfig: ImageDraftConfig) => {
    form.setFieldValue("background", draftConfig.background)
    form.setFieldValue("imageSize", draftConfig.imageSize)
    form.setFieldValue("inputFidelity", draftConfig.inputFidelity)
    form.setFieldValue("inputImages", draftConfig.inputImages)
    form.setFieldValue("mask", draftConfig.mask)
    form.setFieldValue("mode", draftConfig.mode)
    form.setFieldValue("model", draftConfig.model)
    form.setFieldValue("moderation", draftConfig.moderation)
    form.setFieldValue("n", draftConfig.n)
    form.setFieldValue("prompt", draftConfig.prompt)
    form.setFieldValue("quality", draftConfig.quality)
    form.setFieldValue("size", draftConfig.size)
  }

  const handleViewPromptClick = (metadata: GeneratedImageMetadata) => {
    if (!isViewingPromptConfigRef.current) {
      saveDraftConfigForUndo(form.store.state.values)
      isViewingPromptConfigRef.current = true
    }
    setCanUndoDraftConfig(true)

    const sourceImages = metadata.sourceImages
    form.setFieldValue("background", metadata.background)
    form.setFieldValue("inputImages", sourceImages)
    form.setFieldValue("mask", undefined)
    form.setFieldValue("mode", sourceImages.length > 0 ? "edit" : "generate")
    form.setFieldValue("model", resolveMetadataModel(metadata.model))
    form.setFieldValue("moderation", metadata.moderation)
    form.setFieldValue("n", metadata.count)
    form.setFieldValue("prompt", metadata.prompt ?? "")
    form.setFieldValue(
      "quality",
      metadata.quality ?? IMAGE_DEFAULT_VALUES.quality
    )
    form.setFieldValue("size", metadata.size)
  }

  const handlePromptChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    if (!isViewingPromptConfigRef.current) {
      saveDraftConfigForUndo({
        ...form.store.state.values,
        prompt: value,
      })
    }
    onChange(value)
  }

  const handleUndoDraftConfigClick = () => {
    const savedDraftConfig = readDraftConfigForUndo()
    if (savedDraftConfig === null) {
      setCanUndoDraftConfig(false)
      return
    }

    applyDraftConfig(savedDraftConfig)
    isViewingPromptConfigRef.current = false
    setCanUndoDraftConfig(false)
  }

  const selectedDimensions = selectedImage
    ? IMAGE_SIZE_DIMENSIONS[selectedImage.size]
    : null
  const lcpImageUrl = generatedImages[0]?.images[0]?.url
  const shouldShowEmptyState =
    generatedImages.length === 0 && !isSubmitting && !generationError
  const shouldShowGenerationError = !isSubmitting && generationError

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full">
          <div className={IMAGE_PREVIEW_CONTENT_CLASS}>
            <div className="space-y-4 px-4 pt-4 pb-4">
              {generatedImages.length > 0
                ? generatedImages.toReversed().map((batch, batchIndex) => {
                    const batchKey =
                      batch.images[0]?.url ??
                      batch.metadata.createdAt ??
                      batchIndex
                    const dimensions = IMAGE_SIZE_DIMENSIONS[batch.size]
                    const createdAtLabel = formatTimestamp(
                      batch.metadata.createdAt
                    )
                    const metadataItems = [
                      {
                        icon: IconRulerMeasure,
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
                      {
                        icon: IconCpu,
                        label: "Model",
                        value: batch.metadata.model,
                      },
                      {
                        icon: IconCurrencyDollar,
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
                          <MetadataText icon={IconCalendarTime}>
                            {createdAtLabel ?? " "}
                          </MetadataText>
                          {isGallery ? (
                            <MetadataText icon={IconPhoto}>
                              {batch.images.length} images
                            </MetadataText>
                          ) : null}
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                          {metadataItems.map((item) => (
                            <MetadataText icon={item.icon} key={item.label}>
                              <span className="font-medium text-foreground/80">
                                {item.label}
                              </span>
                              : {item.value}
                            </MetadataText>
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
                              key={image.url}
                            >
                              <div className="group @container/image-card relative overflow-hidden rounded-md border border-border/70 bg-muted/20">
                                <button
                                  aria-label="Open image viewer"
                                  className={cn(
                                    "block w-full cursor-zoom-in",
                                    isGallery && "bg-muted/40"
                                  )}
                                  onClick={() =>
                                    setSelectedImage({
                                      url: image.url,
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
                                      image.url === lcpImageUrl &&
                                      imageIndex === 0
                                        ? "eager"
                                        : "lazy"
                                    }
                                    src={image.url}
                                    unoptimized
                                    width={dimensions.width}
                                  />
                                </button>
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/15 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
                                <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                  {!readOnly && image.id && (
                                    <ImagePublishButton
                                      image={image}
                                      onToggle={() => undefined}
                                    />
                                  )}
                                  {!readOnly && (
                                    <Button
                                      aria-label="Use as reference"
                                      className={IMAGE_ACTION_BUTTON_CLASS}
                                      onClick={() =>
                                        handleReferenceClick(image.url)
                                      }
                                      size="sm"
                                      title="Reference"
                                      type="button"
                                      variant="secondary"
                                    >
                                      <IconArrowUpRight data-icon="inline-start" />
                                      <span className="@md/image-card:inline hidden">
                                        Reference
                                      </span>
                                    </Button>
                                  )}
                                  {!readOnly && batch.metadata.prompt ? (
                                    <Button
                                      aria-label="View prompt"
                                      className={IMAGE_ACTION_BUTTON_CLASS}
                                      onClick={() =>
                                        handleViewPromptClick(batch.metadata)
                                      }
                                      size="sm"
                                      title="View Prompt"
                                      type="button"
                                      variant="secondary"
                                    >
                                      <IconEye data-icon="inline-start" />
                                      <span className="@md/image-card:inline hidden">
                                        View Prompt
                                      </span>
                                    </Button>
                                  ) : null}
                                  <Button
                                    aria-label="Download image"
                                    className={IMAGE_ACTION_BUTTON_CLASS}
                                    onClick={() => {
                                      downloadImage(image.url)
                                    }}
                                    size="sm"
                                    title="Download"
                                    type="button"
                                    variant="secondary"
                                  >
                                    <IconDownload data-icon="inline-start" />
                                    <span className="@md/image-card:inline hidden">
                                      Download
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                : null}

              {isSubmitting && (
                <div>
                  {generatedImages.length > 0 && <Separator className="mb-4" />}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
                    <MetadataText icon={IconCalendarTime}>
                      {formatTimestamp(loadingStartedAt) ?? " "}
                    </MetadataText>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                    <MetadataText icon={IconRulerMeasure}>
                      <span className="font-medium text-foreground/80">
                        Size
                      </span>
                      :{" "}
                      {[
                        loadingMetadata.size.replace("x", " × "),
                        loadingMetadata.quality,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </MetadataText>
                    <MetadataText icon={IconCpu}>
                      <span className="font-medium text-foreground/80">
                        Model
                      </span>
                      : {loadingMetadata.model}
                    </MetadataText>
                    <MetadataText icon={IconCurrencyDollar}>
                      <span className="font-medium text-foreground/80">
                        Cost
                      </span>
                      : {loadingMetadata.cost}
                    </MetadataText>
                  </div>
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                    <ImagePlaceholder isGenerating />
                  </div>
                </div>
              )}

              {shouldShowGenerationError && (
                <ImageError
                  createdAt={generationError.createdAt}
                  message={generationError.message}
                />
              )}

              {shouldShowEmptyState ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-center text-muted-foreground text-sm">
                  <ImagePlaceholder isGenerating={false} />
                </div>
              ) : null}
              <div ref={bottomAnchorRef} />
            </div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 border-border/70 border-t bg-background pt-4 pb-4">
          <div className={IMAGE_PREVIEW_CONTENT_CLASS}>
            <div className="px-4">
              <form.Subscribe
                selector={(state) =>
                  state.values.inputImages.map((img, i) => ({
                    id: img.key,
                    label: `Image${i + 1}`,
                    thumbnailUrl: img.url,
                    url: img.url,
                  }))
                }
              >
                {(mentionItems) => (
                  <form.Field name="prompt">
                    {(field) => (
                      <>
                        <InputGroup>
                          <PromptComposer
                            aria-invalid={
                              field.state.meta.errors.length > 0 || undefined
                            }
                            className="max-h-[min(40svh,24rem)] overflow-y-auto"
                            items={mentionItems}
                            onBlur={field.handleBlur}
                            onCancelShortcut={handleCancelGenerate}
                            onChange={(value) =>
                              handlePromptChange(value, field.handleChange)
                            }
                            onSubmitShortcut={handleGenerateShortcut}
                            placeholder="Describe the image you want to generate…"
                            shortcutCancelDisabled={!confirming}
                            shortcutSubmitDisabled={
                              !(
                                canSubmit && field.state.value.trim().length > 0
                              ) || isSubmitting
                            }
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
                              {({
                                canSubmit,
                                isEdit,
                                isSubmitting,
                                prompt,
                              }) => {
                                const hasPrompt = prompt.trim().length > 0
                                const submitLabel = getSubmitLabel({
                                  confirming,
                                  isEdit,
                                  isSubmitting,
                                })

                                return (
                                  <div className="flex items-center gap-2">
                                    {canUndoDraftConfig ? (
                                      <InputGroupButton
                                        disabled={isSubmitting}
                                        onClick={handleUndoDraftConfigClick}
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
                                        !(canSubmit && hasPrompt) ||
                                        isSubmitting
                                      }
                                      onClick={handleGenerateClick}
                                      size="sm"
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
                                      <SwapText text={submitLabel} />
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
                )}
              </form.Subscribe>
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
