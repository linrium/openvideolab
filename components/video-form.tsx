"use client"

import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import z from "zod/v4"
import { submitVideoAction } from "@/app/actions/generate-video"
import { ImageUpload, MultiImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
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
  ASPECT_RATIOS,
  DURATIONS,
  MODELS,
  type ModelValue,
  PRICING,
  RESOLUTIONS,
} from "@/lib/constants"
import { Input } from "./ui/input"

const schema = z.object({
  model: z.enum([
    "bytedance/seedance-2.0",
    "bytedance/seedance-2.0-fast",
    "wan/wan-2.7",
    "alibaba/happy-horse-1.0",
  ]),
  title: z.string().trim().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  aspectRatio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"])
    .optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  duration: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  generateAudio: z.boolean(),
  inputReferences: z
    .array(z.object({ url: z.string(), key: z.string() }))
    .optional(),
  firstFrame: z.object({ url: z.string(), key: z.string() }).optional(),
  lastFrame: z.object({ url: z.string(), key: z.string() }).optional(),
})

export type VideoFormValues = z.infer<typeof schema>
type VideoFormAspectRatio = NonNullable<VideoFormValues["aspectRatio"]>
type VideoFormResolution = NonNullable<VideoFormValues["resolution"]>

const DEFAULT_VALUES: VideoFormValues = {
  model: "bytedance/seedance-2.0",
  title: "",
  prompt: "",
  aspectRatio: "9:16",
  resolution: "480p",
  duration: 5,
  generateAudio: true,
  inputReferences: [],
  firstFrame: undefined,
  lastFrame: undefined,
}

interface VideoFormProps {
  initialValues?: VideoFormValues
  readOnly?: boolean
}

export function VideoForm({
  initialValues = DEFAULT_VALUES,
  readOnly = false,
}: VideoFormProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const { title, inputReferences, firstFrame, lastFrame, ...rest } = value
      const result = await submitVideoAction(
        {
          ...rest,
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
        { title },
        {
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

  return (
    <Tabs className="flex min-h-0 flex-col gap-0" defaultValue="compose">
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
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <form.Field name="model">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                    <Select
                      disabled={readOnly}
                      onValueChange={(val) =>
                        field.handleChange(val as ModelValue)
                      }
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
                      Give this video a short title for your sidebar and detail
                      views.
                    </FieldDescription>
                    <Input
                      aria-invalid={
                        field.state.meta.errors.length > 0 || undefined
                      }
                      disabled={readOnly}
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Golden Hour Lake"
                      spellCheck={false}
                      type="text"
                      value={field.state.value}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => ({
                        message: String(e),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="prompt">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Prompt</FieldLabel>
                    <FieldDescription>
                      Describe the scene, mood, action, and visual style you
                      want. Be specific — include camera movement, lighting, and
                      subject details for best results.
                    </FieldDescription>
                    <Textarea
                      aria-invalid={
                        field.state.meta.errors.length > 0 || undefined
                      }
                      disabled={readOnly}
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. A serene mountain lake at golden hour, slow cinematic pan from left to right, soft warm light reflecting on calm water…"
                      rows={10}
                      spellCheck={false}
                      value={field.state.value}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => ({
                        message: String(e),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="aspectRatio">
                {(field) => (
                  <Field>
                    <FieldLabel>Aspect Ratio</FieldLabel>
                    <FieldDescription>
                      Choose the frame shape. Use 16:9 for landscape/widescreen,
                      9:16 for vertical/social, or 1:1 for square content.
                    </FieldDescription>
                    <ToggleGroup
                      disabled={readOnly}
                      onValueChange={(val) => {
                        if (val) {
                          field.handleChange(val as VideoFormAspectRatio)
                        }
                      }}
                      type="single"
                      value={field.state.value ?? ""}
                      variant="outline"
                    >
                      {ASPECT_RATIOS.map((ratio) => (
                        <ToggleGroupItem key={ratio} value={ratio}>
                          {ratio}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <form.Field name="resolution">
                {(field) => (
                  <Field>
                    <FieldLabel>Resolution</FieldLabel>
                    <FieldDescription>
                      Higher resolution produces sharper output but costs more
                      per second. 720p is a good balance for most use cases.
                    </FieldDescription>
                    <ToggleGroup
                      disabled={readOnly}
                      onValueChange={(val) => {
                        if (val) {
                          field.handleChange(val as VideoFormResolution)
                        }
                      }}
                      type="single"
                      value={field.state.value ?? ""}
                      variant="outline"
                    >
                      {RESOLUTIONS.map((res) => (
                        <ToggleGroupItem key={res} value={res}>
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
                      Total length of the generated clip in seconds. Longer
                      durations give the model more time to develop motion and
                      narrative, and cost proportionally more.
                    </FieldDescription>
                    <ToggleGroup
                      disabled={readOnly}
                      onValueChange={(val) => {
                        if (val) {
                          field.handleChange(Number(val) as 5 | 10 | 15)
                        }
                      }}
                      type="single"
                      value={field.state.value?.toString() ?? ""}
                      variant="outline"
                    >
                      {DURATIONS.map((s) => (
                        <ToggleGroupItem key={s} value={s.toString()}>
                          {s}s
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="generateAudio">
                {(field) => (
                  <Field orientation="horizontal">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <FieldLabel htmlFor={field.name}>
                        Generate Audio
                      </FieldLabel>
                      <FieldDescription>
                        When enabled, the model generates a matching soundtrack
                        alongside the video. Adds no extra cost over the
                        per-second rate.
                      </FieldDescription>
                    </div>
                    <Switch
                      checked={field.state.value}
                      disabled={readOnly}
                      id={field.name}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="inputReferences">
                {(field) => (
                  <Field>
                    <FieldLabel>Input References</FieldLabel>
                    <FieldDescription>
                      Upload images whose visual style, color palette, or
                      composition should influence the output. The model uses
                      these as soft guidance — they don't need to match the
                      prompt exactly. Up to 5 images.
                    </FieldDescription>
                    <MultiImageUpload
                      disabled={readOnly}
                      onChange={(values) => field.handleChange(values)}
                      values={field.state.value ?? []}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <Field>
                <FieldLabel>Frames</FieldLabel>
                <FieldDescription>
                  Pin the first or last frame of the video to a specific image.
                  Useful for creating transitions or ensuring the clip starts or
                  ends at a known visual state.
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
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-3 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
            <form.Subscribe
              selector={(s) => ({
                model: s.values.model,
                resolution: s.values.resolution,
                duration: s.values.duration,
                generateAudio: s.values.generateAudio,
                isSubmitting: s.isSubmitting,
                canSubmit: s.canSubmit,
              })}
            >
              {({
                model,
                resolution,
                duration,
                generateAudio,
                isSubmitting,
                canSubmit,
              }) => {
                const pricing =
                  PRICING[model as keyof typeof PRICING] ??
                  PRICING["bytedance/seedance-2.0"]
                const key = resolution as
                  | keyof typeof pricing.per_second.with_audio
                  | undefined
                const table = generateAudio
                  ? pricing.per_second.with_audio
                  : pricing.per_second.no_audio
                const rate = key ? table[key] : null
                const total = rate != null && duration ? rate * duration : null
                let submitLabel = "Generate Video"

                if (readOnly) {
                  submitLabel = "Video Already Exists"
                } else if (isSubmitting) {
                  submitLabel = "Submitting…"
                }

                return (
                  <>
                    {total !== null && (
                      <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Rate</span>
                            <span className="tabular-nums">
                              ${rate?.toFixed(5)} / sec
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Duration</span>
                            <span>{duration}s</span>
                          </div>
                          <div className="flex justify-between border-border/60 border-t pt-1 font-medium text-foreground">
                            <span>Estimated cost</span>
                            <span className="tabular-nums">
                              ${total.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={readOnly || !canSubmit || isSubmitting}
                      onClick={handleGenerateClick}
                      type="button"
                      variant={confirming ? "destructive" : "default"}
                    >
                      {confirming
                        ? "Confirm — click again to generate"
                        : submitLabel}
                    </Button>
                  </>
                )
              }}
            </form.Subscribe>
          </CardFooter>
        </form>
      </TabsContent>

      <TabsContent value="pricing">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
          {(
            [
              ["bytedance/seedance-2.0", "Seedance 2"],
              ["bytedance/seedance-2.0-fast", "Seedance 2 Fast"],
            ] as const
          ).map(([modelId, modelLabel]) => {
            const p = PRICING[modelId]
            return (
              <div key={modelId}>
                <p className="mb-1.5 font-medium text-xs">{modelLabel}</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-1 pr-6 text-left font-normal text-muted-foreground" />
                      <th className="px-3 py-1 text-right font-normal text-muted-foreground">
                        With audio
                      </th>
                      <th className="px-3 py-1 text-right font-normal text-muted-foreground">
                        No audio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-border/50 border-t">
                      <td className="py-1 pr-6 text-muted-foreground">
                        Video tokens
                      </td>
                      <td className="px-3 py-1 text-right tabular-nums">
                        ${p.tokens.with_audio}/M
                      </td>
                      <td className="px-3 py-1 text-right tabular-nums">
                        ${p.tokens.no_audio}/M
                      </td>
                    </tr>
                    {RESOLUTIONS.map((res) => {
                      const key = res as keyof typeof p.per_second.with_audio
                      return (
                        <tr className="border-border/50 border-t" key={res}>
                          <td className="py-1 pr-6 text-muted-foreground">
                            {res}
                          </td>
                          <td className="px-3 py-1 text-right tabular-nums">
                            ${p.per_second.with_audio[key]}/s
                          </td>
                          <td className="px-3 py-1 text-right tabular-nums">
                            ${p.per_second.no_audio[key]}/s
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </TabsContent>
    </Tabs>
  )
}
