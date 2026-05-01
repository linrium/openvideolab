"use client"

import { useForm } from "@tanstack/react-form"
import z from "zod/v4"
import { ImageUpload, MultiImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { VideoAspectRatio, VideoResolution } from "@/lib/openrouter-video"

const ASPECT_RATIOS: VideoAspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "21:9",
  "9:21",
]
const RESOLUTIONS: VideoResolution[] = ["480p", "720p", "1080p"]
const DURATIONS = [5, 10, 15] as const

const PRICING = {
  tokens: { with_audio: 7, no_audio: 7 },
  per_second: {
    with_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
    no_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
  },
} as const

const schema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"])
    .optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  duration: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  generate_audio: z.boolean(),
  input_references: z.array(z.string()).optional(),
  first_frame: z.string().optional(),
  last_frame: z.string().optional(),
})

export function VideoForm() {
  const form = useForm({
    defaultValues: {
      prompt: "",
      aspect_ratio: "16:9" as VideoAspectRatio | undefined,
      resolution: "720p" as VideoResolution | undefined,
      duration: 10 as 5 | 10 | 15,
      generate_audio: false,
      input_references: [] as string[],
      first_frame: undefined as string | undefined,
      last_frame: undefined as string | undefined,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(", ")
        }
      },
    },
    onSubmit: ({ value }) => {
      const { input_references, first_frame, last_frame, ...rest } = value
      console.log({
        model: "bytedance/seedance-2.0",
        ...rest,
        input_references: input_references?.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
        frame_images: [
          ...(first_frame
            ? [
                {
                  type: "image_url" as const,
                  image_url: { url: first_frame },
                  frame_type: "first_frame" as const,
                },
              ]
            : []),
          ...(last_frame
            ? [
                {
                  type: "image_url" as const,
                  image_url: { url: last_frame },
                  frame_type: "last_frame" as const,
                },
              ]
            : []),
        ],
      })
    },
  })

  return (
    <div className="flex min-h-0 flex-col">
      <CardHeader className="border-border/70 border-b px-4 py-4 sm:px-5">
        <CardTitle>Generate Video</CardTitle>
        <CardDescription>
          Powered by Bytedance Seedance 2.0 via OpenRouter. Describe your scene,
          pick a resolution and duration, then submit — the job runs
          asynchronously and the finished video is stored in your R2 bucket.
        </CardDescription>
        <div className="pt-2">
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
                  ${PRICING.tokens.with_audio}/M
                </td>
                <td className="px-3 py-1 text-right tabular-nums">
                  ${PRICING.tokens.no_audio}/M
                </td>
              </tr>
              {RESOLUTIONS.map((res) => {
                const key = res as keyof typeof PRICING.per_second.with_audio
                return (
                  <tr className="border-border/50 border-t" key={res}>
                    <td className="py-1 pr-6 text-muted-foreground">{res}</td>
                    <td className="px-3 py-1 text-right tabular-nums">
                      ${PRICING.per_second.with_audio[key]}/s
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums">
                      ${PRICING.per_second.no_audio[key]}/s
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardHeader>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <FieldGroup>
            <form.Field name="prompt">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel htmlFor={field.name}>Prompt</FieldLabel>
                  <FieldDescription>
                    Describe the scene, mood, action, and visual style you want.
                    Be specific — include camera movement, lighting, and subject
                    details for best results.
                  </FieldDescription>
                  <Textarea
                    aria-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. A serene mountain lake at golden hour, slow cinematic pan from left to right, soft warm light reflecting on calm water…"
                    rows={4}
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

            <form.Field name="aspect_ratio">
              {(field) => (
                <Field>
                  <FieldLabel>Aspect Ratio</FieldLabel>
                  <FieldDescription>
                    Choose the frame shape. Use 16:9 for landscape/widescreen,
                    9:16 for vertical/social, or 1:1 for square content.
                  </FieldDescription>
                  <ToggleGroup
                    onValueChange={(val) => {
                      if (val) {
                        field.handleChange(val as VideoAspectRatio)
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
                    Higher resolution produces sharper output but costs more per
                    second. 720p is a good balance for most use cases.
                  </FieldDescription>
                  <ToggleGroup
                    onValueChange={(val) => {
                      if (val) {
                        field.handleChange(val as VideoResolution)
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

            <form.Field name="generate_audio">
              {(field) => (
                <Field orientation="horizontal">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <FieldLabel htmlFor={field.name}>Generate Audio</FieldLabel>
                    <FieldDescription>
                      When enabled, the model generates a matching soundtrack
                      alongside the video. Adds no extra cost over the
                      per-second rate.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>

            <FieldSeparator />

            <form.Field name="input_references">
              {(field) => (
                <Field>
                  <FieldLabel>Input References</FieldLabel>
                  <FieldDescription>
                    Upload images whose visual style, color palette, or
                    composition should influence the output. The model uses
                    these as soft guidance — they don't need to match the prompt
                    exactly. Up to 5 images.
                  </FieldDescription>
                  <MultiImageUpload
                    onChange={(urls) => field.handleChange(urls)}
                    values={field.state.value}
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
                <form.Field name="first_frame">
                  {(field) => (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">
                        First
                      </span>
                      <ImageUpload
                        onChange={(url) => field.handleChange(url)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="last_frame">
                  {(field) => (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">
                        Last
                      </span>
                      <ImageUpload
                        onChange={(url) => field.handleChange(url)}
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
              resolution: s.values.resolution,
              duration: s.values.duration,
              generate_audio: s.values.generate_audio,
              isSubmitting: s.isSubmitting,
              canSubmit: s.canSubmit,
            })}
          >
            {({
              resolution,
              duration,
              generate_audio,
              isSubmitting,
              canSubmit,
            }) => {
              const key = resolution as
                | keyof typeof PRICING.per_second.with_audio
                | undefined
              const table = generate_audio
                ? PRICING.per_second.with_audio
                : PRICING.per_second.no_audio
              const rate = key ? table[key] : null
              const total = rate != null && duration ? rate * duration : null

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
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Submitting…" : "Generate Video"}
                  </Button>
                </>
              )
            }}
          </form.Subscribe>
        </CardFooter>
      </form>
    </div>
  )
}
