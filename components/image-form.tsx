"use client"

import {
  type Icon,
  IconDeviceMobile,
  IconDeviceTablet,
  IconSquare,
  IconWand,
} from "@tabler/icons-react"
import type {
  GeneratedImagesState,
  ImageGenerationFormApi,
} from "@/components/image-studio"
import { ImageUpload, MultiImageUpload } from "@/components/image-upload"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  getEstimatedImageCost,
  getEstimatedImageCostRange,
  getImageModelCapabilities,
  IMAGE_BACKGROUND_OPTIONS,
  IMAGE_EXPLICIT_QUALITY_OPTIONS,
  IMAGE_INPUT_FIDELITY_OPTIONS,
  IMAGE_MODEL_SELECT_OPTIONS,
  IMAGE_MODERATION_OPTIONS,
  IMAGE_PRICING,
  IMAGE_QUALITY_OPTIONS,
  type IMAGE_SIZE_OPTIONS,
  type ImageModel,
  type ImageSize,
  isSupportedImageSizeForModel,
  OPENROUTER_IMAGE_SIZE_OPTIONS,
  SEEDREAM_IMAGE_COST,
  SUPPORTED_IMAGE_EDIT_MODEL,
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_IMAGE_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
} from "@/lib/image-generation"
import { Input } from "./ui/input"

const SIZE_CONFIG: Record<ImageSize, { icon: Icon; label: string }> = {
  "1:1": { icon: IconSquare, label: "1:1" },
  auto: { icon: IconWand, label: "Auto" },
  "1024x1024": { icon: IconSquare, label: "Square" },
  "1024x1536": { icon: IconDeviceMobile, label: "Portrait" },
  "16:9": { icon: IconDeviceTablet, label: "16:9" },
  "2:3": { icon: IconDeviceMobile, label: "2:3" },
  "21:9": { icon: IconDeviceTablet, label: "21:9" },
  "3:2": { icon: IconDeviceTablet, label: "3:2" },
  "3:4": { icon: IconDeviceMobile, label: "3:4" },
  "4:3": { icon: IconDeviceTablet, label: "4:3" },
  "4:5": { icon: IconDeviceMobile, label: "4:5" },
  "5:4": { icon: IconDeviceTablet, label: "5:4" },
  "9:16": { icon: IconDeviceMobile, label: "9:16" },
  "1536x1024": { icon: IconDeviceTablet, label: "Landscape" },
}

const MODEL_LABELS = {
  [SUPPORTED_IMAGE_GENERATION_MODEL]: "GPT Image 2",
  [SUPPORTED_IMAGE_EDIT_MODEL]: "GPT Image 2",
  [SUPPORTED_SEEDREAM_IMAGE_MODEL]: "Seedream 4.5",
} as const
const OPENROUTER_IMAGE_SIZE_LABELS: Record<
  (typeof OPENROUTER_IMAGE_SIZE_OPTIONS)[number],
  string
> = {
  "1K": "1K",
  "2K": "2K",
  "4K": "4K",
}
const LABEL_SPLIT_PATTERN = /[-x]/

const labelFromValue = (value: string) =>
  value
    .split(LABEL_SPLIT_PATTERN)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

function formatEstimatedCost(values: {
  model: ImageModel
  n: number
  quality: (typeof IMAGE_QUALITY_OPTIONS)[number]
  size: (typeof IMAGE_SIZE_OPTIONS)[number]
}): string {
  const range = getEstimatedImageCostRange(values)

  if (range.min === range.max) {
    return `$${getEstimatedImageCost(values).toFixed(3)}`
  }

  return `$${range.min.toFixed(3)}-$${range.max.toFixed(3)}`
}

function formatCurrency(value: string | null): string | null {
  if (!value) {
    return null
  }

  return `$${Number(value).toFixed(3)}`
}

function getModelForSourceImageState(currentModel: ImageModel): ImageModel {
  if (currentModel === SUPPORTED_SEEDREAM_IMAGE_MODEL) {
    return SUPPORTED_SEEDREAM_IMAGE_MODEL
  }

  return SUPPORTED_IMAGE_GENERATION_MODEL
}

export function ImageForm({
  form,
  generatedImages = [],
  onTitleBlur,
  readOnly = false,
}: {
  form: ImageGenerationFormApi
  generatedImages?: GeneratedImagesState[]
  onTitleBlur?: (title: string) => void | Promise<void>
  readOnly?: boolean
}) {
  const totalSessionCost =
    generatedImages.length > 0
      ? generatedImages.reduce(
          (sum, batch) => sum + Number(batch.metadata.totalCost ?? 0),
          0
        )
      : null

  return (
    <form.Subscribe selector={(state) => state.values.model}>
      {(model) => {
        const capabilities = getImageModelCapabilities(model)

        return (
          <Tabs
            className="flex h-full min-h-0 flex-col gap-0"
            defaultValue="compose"
          >
            <CardHeader
              className="sticky top-0 z-10 border-border/70 border-b bg-background"
              style={{ paddingBottom: 0 }}
            >
              <TabsList variant="line">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent
              className="flex min-h-0 flex-1 flex-col"
              value="compose"
            >
              <div className="flex min-h-0 flex-1 flex-col">
                <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <FieldGroup>
                    <form.Field name="model">
                      {(field) => (
                        <Field>
                          <FieldLabel>Model</FieldLabel>
                          <FieldDescription>
                            Choose the image model for this request.
                          </FieldDescription>
                          <Select
                            disabled={readOnly}
                            onValueChange={(value) => {
                              const nextModel = value as ImageModel
                              const hasSourceImages =
                                form.state.values.inputImages.length > 0
                              const resolvedModel = nextModel

                              field.handleChange(resolvedModel)
                              if (
                                !isSupportedImageSizeForModel(
                                  resolvedModel,
                                  form.state.values.size
                                )
                              ) {
                                form.setFieldValue("size", "auto")
                              }

                              if (
                                !(
                                  getImageModelCapabilities(resolvedModel)
                                    .mask && hasSourceImages
                                )
                              ) {
                                form.setFieldValue("mask", undefined)
                              }
                            }}
                            value={field.state.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_MODEL_SELECT_OPTIONS.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {MODEL_LABELS[model]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    </form.Field>

                    <FieldSeparator />

                    <form.Subscribe
                      selector={(state) => state.values.inputImages.length > 0}
                    >
                      {(hasSourceImages) => (
                        <>
                          <form.Field name="inputImages">
                            {(field) => (
                              <Field
                                data-invalid={
                                  field.state.meta.errors.length > 0 ||
                                  undefined
                                }
                              >
                                <FieldLabel>Source Images</FieldLabel>
                                <FieldDescription className="w-full max-w-none">
                                  Upload up to 16 images to edit, combine, or
                                  restyle. Leave empty to generate from text
                                  only.
                                </FieldDescription>
                                <MultiImageUpload
                                  disabled={readOnly}
                                  max={16}
                                  onChange={(values) => {
                                    field.handleChange(values)
                                    const isEdit = values.length > 0
                                    form.setFieldValue(
                                      "mode",
                                      isEdit ? "edit" : "generate"
                                    )
                                    form.setFieldValue(
                                      "model",
                                      getModelForSourceImageState(
                                        form.state.values.model
                                      )
                                    )

                                    if (!isEdit) {
                                      form.setFieldValue("mask", undefined)
                                    }
                                  }}
                                  values={field.state.value}
                                />
                                <FieldError
                                  errors={field.state.meta.errors.map(
                                    (error) => ({
                                      message: String(error),
                                    })
                                  )}
                                />
                              </Field>
                            )}
                          </form.Field>

                          {capabilities.inputFidelity ? (
                            <form.Field name="inputFidelity">
                              {(field) => (
                                <Field>
                                  <FieldLabel>Input Fidelity</FieldLabel>
                                  <FieldDescription className="w-full max-w-none">
                                    Controls how strongly the edit preserves
                                    style, features, and facial details from
                                    source images.
                                  </FieldDescription>
                                  <ToggleGroup
                                    disabled={readOnly || !hasSourceImages}
                                    onValueChange={(value) => {
                                      if (value) {
                                        field.handleChange(
                                          value as (typeof IMAGE_INPUT_FIDELITY_OPTIONS)[number]
                                        )
                                      }
                                    }}
                                    type="single"
                                    value={field.state.value}
                                    variant="outline"
                                  >
                                    {IMAGE_INPUT_FIDELITY_OPTIONS.map(
                                      (option) => (
                                        <ToggleGroupItem
                                          key={option}
                                          value={option}
                                        >
                                          {labelFromValue(option)}
                                        </ToggleGroupItem>
                                      )
                                    )}
                                  </ToggleGroup>
                                </Field>
                              )}
                            </form.Field>
                          ) : null}

                          {capabilities.mask ? (
                            <form.Field name="mask">
                              {(field) => (
                                <Field
                                  data-invalid={
                                    field.state.meta.errors.length > 0 ||
                                    undefined
                                  }
                                >
                                  <FieldLabel>Mask</FieldLabel>
                                  <FieldDescription className="w-full max-w-none">
                                    Optional PNG mask. Transparent areas mark
                                    where the first source image should be
                                    edited.
                                  </FieldDescription>
                                  <ImageUpload
                                    accept="image/png"
                                    disabled={readOnly || !hasSourceImages}
                                    onChange={(value) =>
                                      field.handleChange(value)
                                    }
                                    value={field.state.value}
                                  />
                                  <FieldError
                                    errors={field.state.meta.errors.map(
                                      (error) => ({
                                        message: String(error),
                                      })
                                    )}
                                  />
                                </Field>
                              )}
                            </form.Field>
                          ) : null}
                        </>
                      )}
                    </form.Subscribe>

                    <FieldSeparator />

                    <form.Field name="title">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                          <FieldDescription>
                            Optional. Leave blank to derive a title from the
                            prompt.
                          </FieldDescription>
                          <Input
                            disabled={readOnly}
                            id={field.name}
                            name={field.name}
                            onBlur={() => {
                              field.handleBlur()
                              Promise.resolve(
                                onTitleBlur?.(field.state.value)
                              ).catch(() => undefined)
                            }}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder="Name this image set"
                            value={field.state.value}
                          />
                        </Field>
                      )}
                    </form.Field>

                    <FieldSeparator />

                    <form.Field name="size">
                      {(field) => (
                        <Field>
                          <FieldLabel>
                            {model === SUPPORTED_SEEDREAM_IMAGE_MODEL
                              ? "Aspect Ratio"
                              : "Size"}
                          </FieldLabel>
                          <FieldDescription>
                            {model === SUPPORTED_SEEDREAM_IMAGE_MODEL
                              ? "Pick the image shape, or let the model decide."
                              : "Pick the image shape and resolution, or let the model decide."}
                          </FieldDescription>
                          <ToggleGroup
                            className="flex w-full flex-wrap items-start justify-start"
                            disabled={readOnly}
                            onValueChange={(value) => {
                              if (value) {
                                field.handleChange(
                                  value as (typeof IMAGE_SIZE_OPTIONS)[number]
                                )
                              }
                            }}
                            spacing={1}
                            type="single"
                            value={field.state.value}
                            variant="outline"
                          >
                            {capabilities.sizes.map((option) => {
                              const { icon: SizeIcon, label } =
                                SIZE_CONFIG[option]
                              return (
                                <ToggleGroupItem key={option} value={option}>
                                  <SizeIcon
                                    data-icon="inline-start"
                                    size={14}
                                  />
                                  {label}
                                </ToggleGroupItem>
                              )
                            })}
                          </ToggleGroup>
                        </Field>
                      )}
                    </form.Field>

                    {model === SUPPORTED_SEEDREAM_IMAGE_MODEL ? (
                      <form.Field name="imageSize">
                        {(field) => (
                          <Field>
                            <FieldLabel>Image Size</FieldLabel>
                            <FieldDescription>
                              Choose the generated image resolution.
                            </FieldDescription>
                            <ToggleGroup
                              className="flex w-full flex-wrap items-start justify-start"
                              disabled={readOnly}
                              onValueChange={(value) => {
                                if (value) {
                                  field.handleChange(
                                    value as (typeof OPENROUTER_IMAGE_SIZE_OPTIONS)[number]
                                  )
                                }
                              }}
                              spacing={1}
                              type="single"
                              value={field.state.value}
                              variant="outline"
                            >
                              {OPENROUTER_IMAGE_SIZE_OPTIONS.map((option) => (
                                <ToggleGroupItem key={option} value={option}>
                                  {OPENROUTER_IMAGE_SIZE_LABELS[option]}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </Field>
                        )}
                      </form.Field>
                    ) : null}

                    {capabilities.quality ? (
                      <form.Field name="quality">
                        {(field) => (
                          <Field>
                            <FieldLabel>Quality</FieldLabel>
                            <FieldDescription>
                              Higher quality usually gives more detail but costs
                              more. Auto lets the model choose.
                            </FieldDescription>
                            <ToggleGroup
                              disabled={readOnly}
                              onValueChange={(value) => {
                                if (value) {
                                  field.handleChange(
                                    value as (typeof IMAGE_QUALITY_OPTIONS)[number]
                                  )
                                }
                              }}
                              type="single"
                              value={field.state.value}
                              variant="outline"
                            >
                              {IMAGE_QUALITY_OPTIONS.map((option) => (
                                <ToggleGroupItem key={option} value={option}>
                                  {labelFromValue(option)}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </Field>
                        )}
                      </form.Field>
                    ) : null}

                    <FieldSeparator />

                    <form.Field name="n">
                      {(field) => (
                        <Field
                          data-invalid={
                            field.state.meta.errors.length > 0 || undefined
                          }
                        >
                          <FieldLabel>Count</FieldLabel>
                          <FieldDescription>
                            How many images to generate in one request.
                          </FieldDescription>
                          <ToggleGroup
                            disabled={readOnly}
                            onValueChange={(value) => {
                              if (value) {
                                field.handleChange(Number(value))
                              }
                            }}
                            type="single"
                            value={String(field.state.value)}
                            variant="outline"
                          >
                            {["1", "2", "3", "4"].map((option) => (
                              <ToggleGroupItem key={option} value={option}>
                                {option}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                          <FieldError
                            errors={field.state.meta.errors.map((error) => ({
                              message: String(error),
                            }))}
                          />
                        </Field>
                      )}
                    </form.Field>

                    <FieldSeparator />

                    {capabilities.background ? (
                      <form.Field name="background">
                        {(field) => (
                          <Field>
                            <FieldLabel>Background</FieldLabel>
                            <FieldDescription>
                              Choose whether the image background should be
                              automatic, solid, or transparent.
                            </FieldDescription>
                            <ToggleGroup
                              disabled={readOnly}
                              onValueChange={(value) => {
                                if (value) {
                                  field.handleChange(
                                    value as (typeof IMAGE_BACKGROUND_OPTIONS)[number]
                                  )
                                }
                              }}
                              type="single"
                              value={field.state.value}
                              variant="outline"
                            >
                              {IMAGE_BACKGROUND_OPTIONS.map((option) => (
                                <ToggleGroupItem key={option} value={option}>
                                  {labelFromValue(option)}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </Field>
                        )}
                      </form.Field>
                    ) : null}

                    {capabilities.moderation ? (
                      <form.Field name="moderation">
                        {(field) => (
                          <Field>
                            <FieldLabel>Moderation</FieldLabel>
                            <FieldDescription>
                              Choose how strict safety filtering should be.
                            </FieldDescription>
                            <ToggleGroup
                              disabled={readOnly}
                              onValueChange={(value) => {
                                if (value) {
                                  field.handleChange(
                                    value as (typeof IMAGE_MODERATION_OPTIONS)[number]
                                  )
                                }
                              }}
                              type="single"
                              value={field.state.value}
                              variant="outline"
                            >
                              {IMAGE_MODERATION_OPTIONS.map((option) => (
                                <ToggleGroupItem key={option} value={option}>
                                  {labelFromValue(option)}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </Field>
                        )}
                      </form.Field>
                    ) : null}
                  </FieldGroup>
                </CardContent>

                <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-2 border-border/70 border-t bg-background px-4 pt-4 pb-4 text-left sm:px-5">
                  <form.Subscribe
                    selector={(state) => ({
                      n: state.values.n,
                      model: state.values.model,
                      quality: state.values.quality,
                      size: state.values.size,
                    })}
                  >
                    {({ model, n, quality, size }) => (
                      <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Images</span>
                            <span>{n}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Estimated cost</span>
                            <span className="tabular-nums">
                              {formatEstimatedCost({ model, n, quality, size })}
                            </span>
                          </div>
                          {model !== SUPPORTED_SEEDREAM_IMAGE_MODEL &&
                            (quality === "auto" || size === "auto") && (
                              <div className="text-muted-foreground/80">
                                Auto mode shows an estimated price range.
                              </div>
                            )}
                          {totalSessionCost === null ? null : (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Total cost</span>
                              <span className="tabular-nums">
                                {formatCurrency(String(totalSessionCost))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </form.Subscribe>
                </CardFooter>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-xs">
                    {MODEL_LABELS[SUPPORTED_IMAGE_MODEL]}
                  </p>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Pricing per generated image.
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-border/70">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr className="border-border/70 border-b">
                        <th className="px-3 py-2 text-left font-medium text-foreground">
                          Quality
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">
                          1024 × 1024
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">
                          1024 × 1536
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">
                          1536 × 1024
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {IMAGE_EXPLICIT_QUALITY_OPTIONS.map((quality) => (
                        <tr
                          className="border-border/60 border-b last:border-b-0"
                          key={quality}
                        >
                          <td className="px-3 py-2 text-muted-foreground">
                            {labelFromValue(quality)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            ${IMAGE_PRICING[quality]["1024x1024"].toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            ${IMAGE_PRICING[quality]["1024x1536"].toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            ${IMAGE_PRICING[quality]["1536x1024"].toFixed(3)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-border/60 border-b last:border-b-0">
                        <td className="px-3 py-2 text-muted-foreground">
                          Auto
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          ${IMAGE_PRICING.low["1024x1024"].toFixed(3)}-$
                          {IMAGE_PRICING.high["1024x1024"].toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          ${IMAGE_PRICING.low["1024x1536"].toFixed(3)}-$
                          {IMAGE_PRICING.high["1024x1536"].toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          ${IMAGE_PRICING.low["1536x1024"].toFixed(3)}-$
                          {IMAGE_PRICING.high["1536x1024"].toFixed(3)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="font-medium text-xs">
                    {MODEL_LABELS[SUPPORTED_SEEDREAM_IMAGE_MODEL]}
                  </p>
                  <p className="text-muted-foreground text-xs/relaxed">
                    ${SEEDREAM_IMAGE_COST.toFixed(2)} per generated image,
                    regardless of size.
                  </p>
                </div>
                <p className="text-muted-foreground text-xs/relaxed">
                  If size is also set to auto, the total estimate spans the full
                  range across all supported resolutions.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )
      }}
    </form.Subscribe>
  )
}
