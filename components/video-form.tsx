"use client"

import type { AspectRatio, Resolution } from "@openrouter/sdk/models"
import {
  type Icon,
  IconArrowUp,
  IconDeviceMobile,
  IconDeviceTablet,
  IconSquare,
} from "@tabler/icons-react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import z from "zod/v4"
import {
  submitVideoAction,
  updateVideoGenerationTitleAction,
} from "@/app/actions/generate-video"
import {
  AudioUpload,
  ImageUpload,
  MultiAudioUpload,
  MultiImageUpload,
  MultiVideoUpload,
} from "@/components/image-upload"
import { Spokes } from "@/components/loading-ui/spokes"
import { PromptComposer } from "@/components/prompt-composer"
import { ResizableRightSidebar } from "@/components/resizable-right-sidebar"
import { SwapText } from "@/components/swap-text"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DEFAULT_MODEL_CONFIG,
  KIE_CREDIT_USD_RATE,
  MODEL_CONFIGS,
  MODELS,
  type ModelValue,
  PRICING,
} from "@/lib/constants"
import {
  isKieVideoModel,
  type PersistedVideoProvider,
} from "@/lib/video-provider"
import { Input } from "./ui/input"

const VIDEO_SETTINGS_SIDEBAR_WIDTH_KEY = "video-settings-sidebar-width"
const VIDEO_PREVIEW_CONTENT_CLASS = "mx-auto w-full max-w-4xl"
const TITLE_SAVE_DEBOUNCE_MS = 600

const MODEL_VALUES = MODELS.map((m) => m.value) as [ModelValue, ...ModelValue[]]

const schema = z.object({
  model: z.enum(MODEL_VALUES),
  title: z.string().trim(),
  prompt: z.string().min(1, "Prompt is required"),
  negativePrompt: z.string().optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  duration: z.number().int().min(1).max(15).optional(),
  generateAudio: z.boolean().optional(),
  promptExtend: z.boolean().optional(),
  audioReference: z.object({ url: z.string(), key: z.string() }).optional(),
  inputReferences: z
    .array(z.object({ url: z.string(), key: z.string() }))
    .optional(),
  firstFrame: z.object({ url: z.string(), key: z.string() }).optional(),
  lastFrame: z.object({ url: z.string(), key: z.string() }).optional(),
  nsfwChecker: z.boolean().optional(),
  referenceAudioUrls: z
    .array(z.object({ url: z.string(), key: z.string() }))
    .optional(),
  referenceVideoUrls: z
    .array(
      z.object({
        durationSeconds: z.number().optional(),
        key: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  watermark: z.boolean().optional(),
})

export type VideoFormValues = z.infer<typeof schema>

const DEFAULT_VALUES: VideoFormValues = {
  model: "bytedance/seedance-2.0",
  title: "",
  prompt: "",
  negativePrompt: "",
  aspectRatio: "9:16",
  resolution: "480p",
  duration: 5,
  generateAudio: true,
  promptExtend: false,
  audioReference: undefined,
  inputReferences: [],
  firstFrame: undefined,
  lastFrame: undefined,
  nsfwChecker: false,
  referenceAudioUrls: [],
  referenceVideoUrls: [],
  watermark: false,
}

const ASPECT_RATIO_CONFIG: Record<string, { icon: Icon; label: string }> = {
  "1:1": { icon: IconSquare, label: "1:1" },
  "16:9": { icon: IconDeviceTablet, label: "16:9" },
  "21:9": { icon: IconDeviceTablet, label: "21:9" },
  "3:4": { icon: IconDeviceMobile, label: "3:4" },
  "4:3": { icon: IconDeviceTablet, label: "4:3" },
  "9:16": { icon: IconDeviceMobile, label: "9:16" },
  "9:21": { icon: IconDeviceMobile, label: "9:21" },
}

function createAtlasCloudProvider({
  audioKey,
  audioUrl,
  isWanModel,
  negativePrompt,
  promptExtend,
}: {
  audioKey?: string
  audioUrl?: string
  isWanModel: boolean
  negativePrompt?: string
  promptExtend?: boolean
}): PersistedVideoProvider | null {
  return isWanModel
    ? {
        metadata: {
          audioKey: audioKey ?? null,
        },
        options: {
          "atlas-cloud": {
            audio_url: audioUrl,
            negative_prompt: negativePrompt?.trim() || undefined,
            prompt_extend: promptExtend ?? false,
          },
        },
      }
    : null
}

function createKieProvider({
  isKieModel,
  nsfwChecker,
  referenceAudioUrls,
  referenceVideoUrls,
}: {
  isKieModel: boolean
  nsfwChecker?: boolean
  referenceAudioUrls?: { key: string; url: string }[]
  referenceVideoUrls?: { durationSeconds?: number; key: string; url: string }[]
}): PersistedVideoProvider | null {
  if (!isKieModel) {
    return null
  }

  const audioUrls = referenceAudioUrls?.map(({ url }) => url) ?? []
  const videoUrls = referenceVideoUrls?.map(({ url }) => url) ?? []

  return {
    metadata: {
      kieReferenceAudioKeys: referenceAudioUrls?.map(({ key }) => key) ?? [],
      kieReferenceVideoDurations:
        referenceVideoUrls?.map(
          ({ durationSeconds }) => durationSeconds ?? 0
        ) ?? [],
      kieReferenceVideoKeys: referenceVideoUrls?.map(({ key }) => key) ?? [],
    },
    options: {
      kie: {
        nsfw_checker: nsfwChecker ?? false,
        reference_audio_urls: audioUrls.length > 0 ? audioUrls : undefined,
        reference_video_urls: videoUrls.length > 0 ? videoUrls : undefined,
      },
    },
  }
}

function getReferenceVideoDuration(
  referenceVideoUrls: { durationSeconds?: number }[] | undefined
): number {
  return (
    referenceVideoUrls?.reduce(
      (sum, video) => sum + (video.durationSeconds ?? 0),
      0
    ) ?? 0
  )
}

function getPricingEstimate({
  duration,
  generateAudio,
  model,
  referenceVideoUrls,
  resolution,
}: {
  duration?: number
  generateAudio?: boolean
  model: string
  referenceVideoUrls?: { durationSeconds?: number }[]
  resolution?: string
}): null | {
  billableDuration: number
  costType: "credit" | "money"
  inputDuration: number
  outputDuration: number
  rate: number
  total: number
  usesVideoInput: boolean
} {
  if (!(duration && resolution)) {
    return null
  }

  const pricing = PRICING[model as keyof typeof PRICING]
  if (!pricing) {
    return null
  }

  const usesVideoInput =
    isKieVideoModel(model) && (referenceVideoUrls?.length ?? 0) > 0

  if (isKieVideoModel(model)) {
    if (!("with_video_input" in pricing.per_second)) {
      return null
    }

    const table = usesVideoInput
      ? pricing.per_second.with_video_input
      : pricing.per_second.no_video_input
    const rate = table?.[resolution as keyof typeof table]
    if (rate == null) {
      return null
    }

    const inputDuration = usesVideoInput
      ? getReferenceVideoDuration(referenceVideoUrls)
      : 0
    const billableDuration = duration + inputDuration
    return {
      billableDuration,
      costType: "credit",
      inputDuration,
      outputDuration: duration,
      rate,
      total: rate * billableDuration,
      usesVideoInput,
    }
  }

  const table = generateAudio
    ? pricing.per_second.with_audio
    : pricing.per_second.no_audio
  const rate = table[resolution as keyof typeof table]
  return rate == null
    ? null
    : {
        billableDuration: duration,
        costType: "money",
        inputDuration: 0,
        outputDuration: duration,
        rate,
        total: rate * duration,
        usesVideoInput: false,
      }
}

function formatPricingAmount(value: number, costType: "credit" | "money") {
  return costType === "credit"
    ? `${value.toFixed(2)} credits`
    : `$${value.toFixed(4)}`
}

function formatCreditUsdEstimate(credits: number): string {
  return `~$${(credits * KIE_CREDIT_USD_RATE).toFixed(4)}`
}

function formatKiePricingRate(credits: number | null): string {
  if (credits == null) {
    return "—"
  }

  return `${credits.toFixed(1)}/s (${formatCreditUsdEstimate(credits)}/s)`
}

interface VideoFormProps {
  initialValues?: VideoFormValues
  preview?: ReactNode
  readOnly?: boolean
  videoId?: string
}

function getSubmitLabel(
  readOnly: boolean,
  confirming: boolean,
  isSubmitting: boolean
) {
  if (readOnly) {
    return "Video Already Exists"
  }
  if (isSubmitting) {
    return "Submitting…"
  }
  if (confirming) {
    return "Confirm?"
  }
  return "Generate Video"
}

export function VideoForm({
  initialValues = DEFAULT_VALUES,
  preview,
  readOnly = false,
  videoId,
}: VideoFormProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTitleSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTitleRef = useRef(initialValues.title)
  const latestTitleRef = useRef(initialValues.title)
  const titleSaveCountRef = useRef(0)
  const titleSaveVersionRef = useRef(0)
  const canEditTitle = Boolean(videoId)

  const handleGenerateClick = () => {
    if (confirming) {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current)
      }
      setConfirming(false)
      form.handleSubmit()
    } else {
      setConfirming(true)
      confirmTimeoutRef.current = setTimeout(() => setConfirming(false), 3000)
    }
  }

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {
      const {
        title,
        negativePrompt,
        inputReferences,
        firstFrame,
        lastFrame,
        audioReference,
        nsfwChecker,
        promptExtend,
        referenceAudioUrls,
        referenceVideoUrls,
        watermark: _watermark,
        aspectRatio,
        resolution,
        ...restBase
      } = value
      const isWanModel = value.model === "alibaba/wan-2.7"
      const isKieModel = isKieVideoModel(value.model)
      const atlasCloudProvider = createAtlasCloudProvider({
        audioKey: audioReference?.key,
        audioUrl: audioReference?.url,
        isWanModel,
        negativePrompt,
        promptExtend,
      })
      const kieProvider = createKieProvider({
        isKieModel,
        nsfwChecker,
        referenceAudioUrls,
        referenceVideoUrls,
      })
      const persistedProvider = atlasCloudProvider ?? kieProvider
      const result = await submitVideoAction(
        {
          ...restBase,
          aspectRatio: aspectRatio as AspectRatio | undefined,
          resolution: resolution as Resolution | undefined,
          provider: {
            options: {
              atlasCloud: atlasCloudProvider?.options?.["atlas-cloud"],
            },
          },
          inputReferences: inputReferences?.map(({ url }) => ({
            type: "image_url" as const,
            imageUrl: { url },
          })),
          frameImages: [
            ...(firstFrame
              ? [
                  {
                    type: "image_url" as const,
                    imageUrl: { url: firstFrame.url },
                    frameType: "first_frame" as const,
                  },
                ]
              : []),
            ...(lastFrame
              ? [
                  {
                    type: "image_url" as const,
                    imageUrl: { url: lastFrame.url },
                    frameType: "last_frame" as const,
                  },
                ]
              : []),
          ],
        },
        { provider: persistedProvider, title },
        {
          audioReferenceKey: audioReference?.key,
          inputReferenceKeys: inputReferences?.map(({ key }) => key),
          frameFirstKey: firstFrame?.key,
          frameLastKey: lastFrame?.key,
        }
      )
      console.log("[generate-video] result:", result)
      if (!result.ok) {
        toast.error("Failed to generate video", { description: result.message })
        return
      }

      const detailPath = `/videos/${result.id}`
      router.push(detailPath)
    },
  })

  useEffect(() => {
    savedTitleRef.current = initialValues.title
    latestTitleRef.current = initialValues.title
  }, [initialValues.title])

  useEffect(
    () => () => {
      if (pendingTitleSaveRef.current) {
        clearTimeout(pendingTitleSaveRef.current)
      }
    },
    []
  )

  const startTitleSave = () => {
    titleSaveCountRef.current += 1
    setIsSavingTitle(true)
  }

  const finishTitleSave = () => {
    titleSaveCountRef.current = Math.max(0, titleSaveCountRef.current - 1)
    setIsSavingTitle(titleSaveCountRef.current > 0)
  }

  const saveVideoTitle = async (title: string, version: number) => {
    if (!(videoId && canEditTitle)) {
      return
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle === savedTitleRef.current) {
      return
    }

    startTitleSave()
    try {
      const result = await updateVideoGenerationTitleAction({
        title: trimmedTitle,
        videoId,
      })

      if (version !== titleSaveVersionRef.current) {
        return
      }

      if (!result.ok) {
        toast.error("Failed to save video title", {
          description: result.message,
        })
        return
      }

      const isLatestTitle = latestTitleRef.current === title
      savedTitleRef.current = result.title
      if (isLatestTitle) {
        latestTitleRef.current = result.title
        form.setFieldValue("title", result.title)
      }
      router.refresh()
    } finally {
      finishTitleSave()
    }
  }

  const scheduleVideoTitleSave = (title: string) => {
    latestTitleRef.current = title

    if (!(videoId && canEditTitle)) {
      return
    }

    if (pendingTitleSaveRef.current) {
      clearTimeout(pendingTitleSaveRef.current)
    }

    const version = titleSaveVersionRef.current + 1
    titleSaveVersionRef.current = version

    pendingTitleSaveRef.current = setTimeout(() => {
      pendingTitleSaveRef.current = null
      saveVideoTitle(title, version).catch(() => {
        toast.error("Failed to save video title")
      })
    }, TITLE_SAVE_DEBOUNCE_MS)
  }

  const handleVideoTitleChange = (
    title: string,
    handleChange: (value: string) => void
  ) => {
    handleChange(title)
    scheduleVideoTitleSave(title)
  }

  const flushPendingTitleSave = () => {
    if (!pendingTitleSaveRef.current) {
      return
    }

    clearTimeout(pendingTitleSaveRef.current)
    pendingTitleSaveRef.current = null
    const version = titleSaveVersionRef.current
    saveVideoTitle(latestTitleRef.current, version).catch(() => {
      toast.error("Failed to save video title")
    })
  }

  const settings = (
    <Tabs className="flex h-full min-h-0 flex-col gap-0" defaultValue="compose">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <TabsList className="" variant="line">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent className="flex min-h-0 flex-1 flex-col" value="compose">
        <div className="flex min-h-0 flex-1 flex-col">
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <form.Field name="model">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                    <Select
                      disabled={readOnly}
                      onValueChange={(val) => {
                        const model = val as ModelValue
                        field.handleChange(model)
                        const { defaults } = MODEL_CONFIGS[model]
                        form.setFieldValue("aspectRatio", defaults.aspectRatio)
                        form.setFieldValue("resolution", defaults.resolution)
                        form.setFieldValue("duration", defaults.duration)
                      }}
                      value={field.state.value}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((m) => (
                          <SelectItem
                            disabled={m.disabled}
                            key={m.value}
                            value={m.value}
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="title">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <FieldDescription>
                      Optional. Give this video a short title for your sidebar
                      and detail views.
                    </FieldDescription>
                    <InputGroup
                      aria-busy={isSavingTitle}
                      data-disabled={(readOnly && !canEditTitle) || undefined}
                    >
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        disabled={readOnly && !canEditTitle}
                        id={field.name}
                        onBlur={() => {
                          field.handleBlur()
                        }}
                        onChange={(e) =>
                          handleVideoTitleChange(
                            e.target.value,
                            field.handleChange
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            flushPendingTitleSave()
                          }
                        }}
                        placeholder="e.g. Golden Hour Lake"
                        spellCheck={false}
                        type="text"
                        value={field.state.value}
                      />
                      <InputGroupAddon
                        align="inline-end"
                        aria-live="polite"
                        className={isSavingTitle ? undefined : "invisible"}
                      >
                        <Spokes aria-hidden className="size-3" />
                        <span className="sr-only">Saving title</span>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((e) => ({
                        message: String(e),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Subscribe
                selector={(s) => s.values.model === "alibaba/wan-2.7"}
              >
                {(isWanModel) =>
                  isWanModel && (
                    <>
                      <form.Field name="negativePrompt">
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>
                              Negative Prompt
                            </FieldLabel>
                            <FieldDescription>
                              Describe content, motion, or artifacts the model
                              should avoid for Wan 2.7.
                            </FieldDescription>
                            <Textarea
                              disabled={readOnly}
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="e.g. blurry faces, flickering lights, low detail hands"
                              rows={4}
                              spellCheck={false}
                              value={field.state.value ?? ""}
                            />
                          </Field>
                        )}
                      </form.Field>

                      <FieldSeparator />
                    </>
                  )
                }
              </form.Subscribe>

              <form.Subscribe
                selector={(s) =>
                  MODEL_CONFIGS[s.values.model] ?? DEFAULT_MODEL_CONFIG
                }
              >
                {(config) => (
                  <>
                    <form.Field name="aspectRatio">
                      {(field) => (
                        <Field>
                          <FieldLabel>Aspect Ratio</FieldLabel>
                          <FieldDescription>
                            Choose the frame shape. Use 16:9 for
                            landscape/widescreen, 9:16 for vertical/social, or
                            1:1 for square content.
                          </FieldDescription>
                          <ToggleGroup
                            className="flex w-full flex-wrap items-start justify-start"
                            disabled={readOnly}
                            onValueChange={(val) => {
                              if (val) {
                                field.handleChange(val)
                              }
                            }}
                            spacing={1}
                            type="single"
                            value={field.state.value ?? ""}
                            variant="outline"
                          >
                            {config.aspectRatios.map((ratio) => {
                              const { icon: Icon, label } = ASPECT_RATIO_CONFIG[
                                ratio
                              ] ?? {
                                icon: IconDeviceTablet,
                                label: ratio,
                              }

                              return (
                                <ToggleGroupItem key={ratio} value={ratio}>
                                  <Icon data-icon="inline-start" size={14} />
                                  {label}
                                </ToggleGroupItem>
                              )
                            })}
                          </ToggleGroup>
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="resolution">
                      {(field) => (
                        <Field>
                          <FieldLabel>Resolution</FieldLabel>
                          <FieldDescription>
                            Higher resolution produces sharper output but costs
                            more per second. 720p is a good balance for most use
                            cases.
                          </FieldDescription>
                          <ToggleGroup
                            disabled={readOnly}
                            onValueChange={(val) => {
                              if (val) {
                                field.handleChange(val)
                              }
                            }}
                            type="single"
                            value={field.state.value ?? ""}
                            variant="outline"
                          >
                            {config.resolutions.map((res) => (
                              <ToggleGroupItem
                                className="lowercase"
                                key={res}
                                value={res}
                              >
                                {res}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="duration">
                      {(field) => (
                        <Field>
                          <FieldLabel>Duration</FieldLabel>
                          <FieldDescription>
                            {config.duration.type === "toggle"
                              ? "Total length of the generated clip in seconds. Longer durations give the model more time to develop motion and narrative, and cost proportionally more."
                              : `Total length of the generated clip in seconds (${config.duration.min}–${config.duration.max}).`}
                          </FieldDescription>
                          {config.duration.type === "toggle" ? (
                            <ToggleGroup
                              disabled={readOnly}
                              onValueChange={(val) => {
                                if (val) {
                                  field.handleChange(Number(val))
                                }
                              }}
                              type="single"
                              value={field.state.value?.toString() ?? ""}
                              variant="outline"
                            >
                              {config.duration.options.map((s) => (
                                <ToggleGroupItem key={s} value={s.toString()}>
                                  {s}s
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                disabled={readOnly}
                                max={config.duration.max}
                                min={config.duration.min}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                  const v = Number.parseInt(e.target.value, 10)
                                  if (!Number.isNaN(v)) {
                                    field.handleChange(v)
                                  }
                                }}
                                placeholder={`${config.duration.min}–${config.duration.max}`}
                                type="number"
                                value={field.state.value?.toString() ?? ""}
                              />
                              <span className="text-muted-foreground text-sm">
                                sec
                              </span>
                            </div>
                          )}
                        </Field>
                      )}
                    </form.Field>

                    <FieldSeparator />

                    {config.features.generateAudio && (
                      <form.Field name="generateAudio">
                        {(field) => (
                          <Field orientation="horizontal">
                            <div className="flex flex-1 flex-col gap-0.5">
                              <FieldLabel htmlFor={field.name}>
                                Generate Audio
                              </FieldLabel>
                              <FieldDescription>
                                When enabled, the model generates a matching
                                soundtrack alongside the video. Adds no extra
                                cost over the per-second rate.
                              </FieldDescription>
                            </div>
                            <Switch
                              checked={field.state.value ?? false}
                              disabled={readOnly}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                field.handleChange(checked)
                              }
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.atlasCloudPromptExtend && (
                      <form.Field name="promptExtend">
                        {(field) => (
                          <Field orientation="horizontal">
                            <div className="flex flex-1 flex-col gap-0.5">
                              <FieldLabel htmlFor={field.name}>
                                Prompt Extend
                              </FieldLabel>
                              <FieldDescription>
                                Whether to use AI to enhance the prompt for
                                better video quality. Increases generation time.
                              </FieldDescription>
                            </div>
                            <Switch
                              checked={field.state.value ?? false}
                              disabled={readOnly}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                field.handleChange(checked)
                              }
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.atlasCloudAudioUrl && (
                      <form.Field name="audioReference">
                        {(field) => (
                          <Field>
                            <FieldLabel>Audio Reference</FieldLabel>
                            <FieldDescription>
                              URL of an audio file to use as the video
                              soundtrack. Supported formats: wav, mp3. Duration:
                              2–30 seconds. Maximum file size: 15 MB.
                            </FieldDescription>
                            <AudioUpload
                              disabled={readOnly}
                              onChange={(value) => field.handleChange(value)}
                              value={field.state.value}
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.kieNsfwChecker && (
                      <form.Field name="nsfwChecker">
                        {(field) => (
                          <Field orientation="horizontal">
                            <div className="flex flex-1 flex-col gap-0.5">
                              <FieldLabel htmlFor={field.name}>
                                NSFW Checker
                              </FieldLabel>
                              <FieldDescription>
                                Ask Kie.ai to run its NSFW safety check for this
                                Seedance task.
                              </FieldDescription>
                            </div>
                            <Switch
                              checked={field.state.value ?? false}
                              disabled={readOnly}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                field.handleChange(checked)
                              }
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.kieReferenceVideoUrls && (
                      <form.Field name="referenceVideoUrls">
                        {(field) => (
                          <Field>
                            <FieldLabel>Reference Videos</FieldLabel>
                            <FieldDescription>
                              Optional Kie.ai reference videos. Upload MP4, MOV,
                              or WebM files to R2 for this task.
                            </FieldDescription>
                            <MultiVideoUpload
                              disabled={readOnly}
                              onChange={(values) => field.handleChange(values)}
                              values={field.state.value ?? []}
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.kieReferenceAudioUrls && (
                      <form.Field name="referenceAudioUrls">
                        {(field) => (
                          <Field>
                            <FieldLabel>Reference Audio</FieldLabel>
                            <FieldDescription>
                              Optional Kie.ai reference audio. Upload MP3 or WAV
                              files to R2 for this task.
                            </FieldDescription>
                            <MultiAudioUpload
                              disabled={readOnly}
                              onChange={(values) => field.handleChange(values)}
                              values={field.state.value ?? []}
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.watermark && (
                      <form.Field name="watermark">
                        {(field) => (
                          <Field orientation="horizontal">
                            <div className="flex flex-1 flex-col gap-0.5">
                              <FieldLabel htmlFor={field.name}>
                                Watermark
                              </FieldLabel>
                              <FieldDescription>
                                When enabled, a watermark is added to the
                                generated video.
                              </FieldDescription>
                            </div>
                            <Switch
                              checked={field.state.value ?? false}
                              disabled={readOnly}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                field.handleChange(checked)
                              }
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {(config.features.generateAudio ||
                      config.features.watermark) &&
                      (config.features.inputReferences ||
                        config.features.frames) && <FieldSeparator />}

                    {config.features.inputReferences && (
                      <form.Field name="inputReferences">
                        {(field) => (
                          <Field>
                            <FieldLabel>Input References</FieldLabel>
                            <FieldDescription>
                              Upload images whose visual style, color palette,
                              or composition should influence the output. The
                              model uses these as soft guidance — they don't
                              need to match the prompt exactly. Up to 5 images.
                            </FieldDescription>
                            <MultiImageUpload
                              disabled={readOnly}
                              onChange={(values) => field.handleChange(values)}
                              values={field.state.value ?? []}
                            />
                          </Field>
                        )}
                      </form.Field>
                    )}

                    {config.features.frames && (
                      <>
                        {config.features.inputReferences && <FieldSeparator />}
                        <Field>
                          <FieldLabel>Frames</FieldLabel>
                          <FieldDescription>
                            Pin the first or last frame of the video to a
                            specific image. Useful for creating transitions or
                            ensuring the clip starts or ends at a known visual
                            state.
                          </FieldDescription>
                          <div className="flex gap-2">
                            <form.Field name="firstFrame">
                              {(field) => (
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground text-xs">
                                    First
                                  </span>
                                  <ImageUpload
                                    disabled={readOnly}
                                    onChange={(v) => field.handleChange(v)}
                                    value={field.state.value}
                                  />
                                </div>
                              )}
                            </form.Field>

                            <form.Field name="lastFrame">
                              {(field) => (
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground text-xs">
                                    Last
                                  </span>
                                  <ImageUpload
                                    disabled={readOnly}
                                    onChange={(v) => field.handleChange(v)}
                                    value={field.state.value}
                                  />
                                </div>
                              )}
                            </form.Field>
                          </div>
                        </Field>
                      </>
                    )}
                  </>
                )}
              </form.Subscribe>
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-3 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
            <form.Subscribe
              selector={(s) => ({
                model: s.values.model,
                resolution: s.values.resolution,
                duration: s.values.duration,
                generateAudio: s.values.generateAudio,
                referenceVideoUrls: s.values.referenceVideoUrls,
              })}
            >
              {({
                model,
                resolution,
                duration,
                generateAudio,
                referenceVideoUrls,
              }) => {
                const estimate = getPricingEstimate({
                  duration,
                  generateAudio,
                  model,
                  referenceVideoUrls,
                  resolution,
                })

                if (estimate === null) {
                  return null
                }

                const rateLabel =
                  estimate.costType === "credit"
                    ? `${estimate.rate.toFixed(2)} credits / sec`
                    : `$${estimate.rate.toFixed(5)} / sec`

                return (
                  <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rate</span>
                        <span className="tabular-nums">{rateLabel}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          {estimate.usesVideoInput
                            ? "Billable duration"
                            : "Duration"}
                        </span>
                        <span className="tabular-nums">
                          {estimate.usesVideoInput
                            ? `${estimate.inputDuration.toFixed(1)}s + ${estimate.outputDuration}s = ${estimate.billableDuration.toFixed(1)}s`
                            : `${estimate.outputDuration}s`}
                        </span>
                      </div>
                      <div className="flex justify-between border-border/60 border-t pt-1 font-medium text-foreground">
                        <span>Estimated cost</span>
                        <span className="tabular-nums">
                          {formatPricingAmount(
                            estimate.total,
                            estimate.costType
                          )}
                        </span>
                      </div>
                      {estimate.costType === "credit" && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Approx. USD</span>
                          <span className="tabular-nums">
                            {formatCreditUsdEstimate(estimate.total)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>
          </CardFooter>
        </div>
      </TabsContent>

      <TabsContent value="pricing">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
          {(
            [
              [
                "atlas-cloud/bytedance/seedance-2.0",
                "Atlas Cloud: Seedance 2 Pro",
              ],
              [
                "atlas-cloud/bytedance/seedance-2.0-fast",
                "Atlas Cloud: Seedance 2 Fast",
              ],
              ["kie/bytedance/seedance-2", "Kie.ai: Seedance 2"],
              ["kie/bytedance/seedance-2-fast", "Kie.ai: Seedance 2 Fast"],
              ["bytedance/seedance-2.0", "OpenRouter: Seedance 2"],
              ["bytedance/seedance-2.0-fast", "OpenRouter: Seedance 2 Fast"],
              ["alibaba/wan-2.7", "Alibaba: Wan 2.7"],
            ] as const
          ).map(([modelId, modelLabel]) => {
            const p = PRICING[modelId]
            const hasKieVideoPricing = "no_video_input" in p.per_second
            const isKiePricing = isKieVideoModel(modelId) && hasKieVideoPricing
            const rateTable = hasKieVideoPricing
              ? p.per_second.no_video_input
              : p.per_second.with_audio
            return (
              <div className="space-y-3" key={modelId}>
                <p className="font-medium text-xs">{modelLabel}</p>
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr className="border-border/70 border-b">
                        <th className="px-3 py-2 text-left font-medium text-foreground">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">
                          {isKiePricing ? "No video input" : "With audio"}
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">
                          {isKiePricing ? "With video input" : "No audio"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(rateTable).map((res, index, array) => {
                        const isLastRow = index === array.length - 1
                        const noVideoRate = hasKieVideoPricing
                          ? (
                              p.per_second.no_video_input as Record<
                                string,
                                number
                              >
                            )[res]
                          : null
                        const withVideoRate = hasKieVideoPricing
                          ? (
                              p.per_second.with_video_input as Record<
                                string,
                                number
                              >
                            )[res]
                          : null
                        const withAudioRate = (
                          p.per_second.with_audio as Record<string, number>
                        )[res]
                        const noAudioRate = (
                          p.per_second.no_audio as Record<string, number>
                        )[res]

                        return (
                          <tr
                            className={
                              isLastRow ? "" : "border-border/60 border-b"
                            }
                            key={res}
                          >
                            <td className="px-3 py-2 text-muted-foreground">
                              {res}
                            </td>
                            {isKiePricing ? (
                              <>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {formatKiePricingRate(noVideoRate)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {formatKiePricingRate(withVideoRate)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  ${withAudioRate}/s
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  ${noAudioRate}/s
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </TabsContent>
    </Tabs>
  )

  if (!preview) {
    return settings
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">{preview}</div>
        <div className="sticky bottom-0 border-border/70 border-t bg-background pt-4 pb-4">
          <div className={VIDEO_PREVIEW_CONTENT_CLASS}>
            <div className="px-4">
              <form.Subscribe
                selector={(state) =>
                  (state.values.inputReferences ?? []).map((ref, i) => ({
                    id: ref.url,
                    label: `Image${i + 1}`,
                    thumbnailUrl: ref.url,
                    url: ref.url,
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
                            disabled={readOnly}
                            items={mentionItems}
                            onBlur={field.handleBlur}
                            onChange={(value) => field.handleChange(value)}
                            placeholder="Describe the video you want to generate…"
                            value={field.state.value}
                          />
                          <InputGroupAddon
                            align="block-end"
                            className="justify-end"
                          >
                            <form.Subscribe
                              selector={(state) => ({
                                canSubmit: state.canSubmit,
                                isSubmitting: state.isSubmitting,
                                prompt: state.values.prompt,
                              })}
                            >
                              {({ canSubmit, isSubmitting, prompt }) => {
                                const hasPrompt = prompt.trim().length > 0
                                const submitLabel = getSubmitLabel(
                                  readOnly,
                                  confirming,
                                  isSubmitting
                                )

                                return (
                                  <InputGroupButton
                                    aria-label={submitLabel}
                                    disabled={
                                      readOnly ||
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
      </section>
      <ResizableRightSidebar storageKey={VIDEO_SETTINGS_SIDEBAR_WIDTH_KEY}>
        {settings}
      </ResizableRightSidebar>
    </div>
  )
}
