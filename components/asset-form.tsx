"use client"

import type {
  ImageGenerateParamsBase,
  ImageModel,
} from "openai/resources/images"
import { useState } from "react"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type BackgroundValue = NonNullable<ImageGenerateParamsBase["background"]>
type ModerationValue = NonNullable<ImageGenerateParamsBase["moderation"]>
type QualityValue = NonNullable<ImageGenerateParamsBase["quality"]>
type SizeValue = NonNullable<ImageGenerateParamsBase["size"]>
type StyleValue = NonNullable<ImageGenerateParamsBase["style"]>

interface AssetGenerationConfig {
  background: BackgroundValue
  model: ImageModel
  moderation: ModerationValue
  n: number
  outputCompression: number
  quality: QualityValue
  size: SizeValue
  style: StyleValue
}

const GPT_IMAGE_2_PRICING = [
  {
    quality: "Low",
    square: "$0.006",
    portrait: "$0.005",
    landscape: "$0.005",
  },
  {
    quality: "Medium",
    square: "$0.053",
    portrait: "$0.041",
    landscape: "$0.041",
  },
  {
    quality: "High",
    square: "$0.211",
    portrait: "$0.165",
    landscape: "$0.165",
  },
] as const

const MODEL_OPTIONS = [
  { value: "gpt-image-1.5", label: "OpenAI GPT Image 1.5" },
  { value: "gpt-image-1", label: "OpenAI GPT Image 1" },
  { value: "gpt-image-1-mini", label: "OpenAI GPT Image 1 Mini" },
  { value: "dall-e-3", label: "OpenAI DALL·E 3" },
  { value: "dall-e-2", label: "OpenAI DALL·E 2" },
] as const satisfies ReadonlyArray<{ label: string; value: ImageModel }>

const GPT_MODELS = new Set<ImageModel>([
  "gpt-image-1.5",
  "gpt-image-1",
  "gpt-image-1-mini",
])

const GPT_SIZE_OPTIONS = [
  "auto",
  "1024x1024",
  "1024x1536",
  "1536x1024",
] as const satisfies readonly SizeValue[]

const DALLE_3_SIZE_OPTIONS = [
  "1024x1024",
  "1024x1792",
  "1792x1024",
] as const satisfies readonly SizeValue[]

const DALLE_2_SIZE_OPTIONS = [
  "256x256",
  "512x512",
  "1024x1024",
] as const satisfies readonly SizeValue[]

const GPT_QUALITY_OPTIONS = [
  "auto",
  "low",
  "medium",
  "high",
] as const satisfies readonly QualityValue[]

const DALLE_3_QUALITY_OPTIONS = [
  "auto",
  "standard",
  "hd",
] as const satisfies readonly QualityValue[]

const DALLE_2_QUALITY_OPTIONS = [
  "standard",
] as const satisfies readonly QualityValue[]

const BACKGROUND_OPTIONS = [
  "auto",
  "opaque",
  "transparent",
] as const satisfies readonly BackgroundValue[]

const MODERATION_OPTIONS = [
  "auto",
  "low",
] as const satisfies readonly ModerationValue[]

const STYLE_OPTIONS = [
  "vivid",
  "natural",
] as const satisfies readonly StyleValue[]

const LABEL_SPLIT_PATTERN = /[-x]/

const MODEL_DEFAULTS: Record<ImageModel, AssetGenerationConfig> = {
  "dall-e-2": {
    background: "auto",
    model: "dall-e-2",
    moderation: "auto",
    n: 1,
    outputCompression: 100,
    quality: "standard",
    size: "1024x1024",
    style: "vivid",
  },
  "dall-e-3": {
    background: "auto",
    model: "dall-e-3",
    moderation: "auto",
    n: 1,
    outputCompression: 100,
    quality: "hd",
    size: "1024x1024",
    style: "vivid",
  },
  "gpt-image-1": {
    background: "auto",
    model: "gpt-image-1",
    moderation: "auto",
    n: 1,
    outputCompression: 100,
    quality: "auto",
    size: "auto",
    style: "vivid",
  },
  "gpt-image-1-mini": {
    background: "auto",
    model: "gpt-image-1-mini",
    moderation: "auto",
    n: 1,
    outputCompression: 100,
    quality: "auto",
    size: "auto",
    style: "vivid",
  },
  "gpt-image-1.5": {
    background: "auto",
    model: "gpt-image-1.5",
    moderation: "auto",
    n: 1,
    outputCompression: 100,
    quality: "auto",
    size: "auto",
    style: "vivid",
  },
}

const getSizeOptions = (model: ImageModel) => {
  if (GPT_MODELS.has(model)) {
    return GPT_SIZE_OPTIONS
  }

  if (model === "dall-e-3") {
    return DALLE_3_SIZE_OPTIONS
  }

  return DALLE_2_SIZE_OPTIONS
}

const getQualityOptions = (model: ImageModel) => {
  if (GPT_MODELS.has(model)) {
    return GPT_QUALITY_OPTIONS
  }

  if (model === "dall-e-3") {
    return DALLE_3_QUALITY_OPTIONS
  }

  return DALLE_2_QUALITY_OPTIONS
}

const labelFromValue = (value: string) =>
  value
    .split(LABEL_SPLIT_PATTERN)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const GPT_IMAGE_2_PRICING_LOOKUP = {
  high: {
    "1024x1024": 0.211,
    "1024x1536": 0.165,
    "1536x1024": 0.165,
  },
  low: {
    "1024x1024": 0.006,
    "1024x1536": 0.005,
    "1536x1024": 0.005,
  },
  medium: {
    "1024x1024": 0.053,
    "1024x1536": 0.041,
    "1536x1024": 0.041,
  },
} as const

export function AssetForm() {
  const [config, setConfig] = useState<AssetGenerationConfig>(
    MODEL_DEFAULTS["gpt-image-1.5"]
  )

  const isGptModel = GPT_MODELS.has(config.model)
  const quantityMax = config.model === "dall-e-3" ? 1 : 10
  const sizeOptions = getSizeOptions(config.model)
  const qualityOptions = getQualityOptions(config.model)
  const estimatedCost =
    config.quality === "low" ||
    config.quality === "medium" ||
    config.quality === "high"
      ? GPT_IMAGE_2_PRICING_LOOKUP[config.quality][
          config.size as keyof (typeof GPT_IMAGE_2_PRICING_LOOKUP)[typeof config.quality]
        ]
      : null

  return (
    <Tabs className="flex h-full min-h-0 flex-col gap-0" defaultValue="compose">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <TabsList variant="line">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent className="flex min-h-0 flex-1 flex-col" value="compose">
        <div className="flex min-h-0 flex-1 flex-col">
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <Field>
                <FieldLabel>Model</FieldLabel>
                <FieldDescription>
                  Choose the image model you want to use.
                </FieldDescription>
                <Select
                  onValueChange={(value) => {
                    const model = value as ImageModel
                    setConfig(MODEL_DEFAULTS[model])
                  }}
                  value={config.model}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel>Size</FieldLabel>
                <FieldDescription>
                  Pick the image shape and resolution.
                </FieldDescription>
                <ToggleGroup
                  onValueChange={(value) => {
                    if (value) {
                      setConfig((current) => ({
                        ...current,
                        size: value as SizeValue,
                      }))
                    }
                  }}
                  type="single"
                  value={config.size}
                  variant="outline"
                >
                  {sizeOptions.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {option === "auto" ? "Auto" : option.replace("x", " × ")}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Quality</FieldLabel>
                <FieldDescription>
                  Higher quality usually gives more detail but costs more.
                </FieldDescription>
                <ToggleGroup
                  onValueChange={(value) => {
                    if (value) {
                      setConfig((current) => ({
                        ...current,
                        quality: value as QualityValue,
                      }))
                    }
                  }}
                  type="single"
                  value={config.quality}
                  variant="outline"
                >
                  {qualityOptions.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {labelFromValue(option)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel htmlFor="asset-count">Count</FieldLabel>
                <FieldDescription>
                  How many images to generate in one request.
                </FieldDescription>
                <Input
                  id="asset-count"
                  max={quantityMax}
                  min={1}
                  onChange={(event) => {
                    const nextValue = Number.parseInt(event.target.value, 10)

                    if (!Number.isNaN(nextValue)) {
                      setConfig((current) => ({
                        ...current,
                        n: Math.min(quantityMax, Math.max(1, nextValue)),
                      }))
                    }
                  }}
                  type="number"
                  value={config.n}
                />
              </Field>

              <Field>
                <FieldLabel>Background</FieldLabel>
                <FieldDescription>
                  Decide whether the image should have a normal, transparent, or
                  auto-chosen background.
                </FieldDescription>
                <ToggleGroup
                  disabled={!isGptModel}
                  onValueChange={(value) => {
                    if (value) {
                      setConfig((current) => ({
                        ...current,
                        background: value as BackgroundValue,
                      }))
                    }
                  }}
                  type="single"
                  value={isGptModel ? config.background : ""}
                  variant="outline"
                >
                  {BACKGROUND_OPTIONS.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {labelFromValue(option)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Moderation</FieldLabel>
                <FieldDescription>
                  Choose how strict safety filtering should be.
                </FieldDescription>
                <ToggleGroup
                  disabled={!isGptModel}
                  onValueChange={(value) => {
                    if (value) {
                      setConfig((current) => ({
                        ...current,
                        moderation: value as ModerationValue,
                      }))
                    }
                  }}
                  type="single"
                  value={isGptModel ? config.moderation : ""}
                  variant="outline"
                >
                  {MODERATION_OPTIONS.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {labelFromValue(option)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              {isGptModel && (
                <Field>
                  <FieldLabel htmlFor="asset-output-compression">
                    Output Compression
                  </FieldLabel>
                  <FieldDescription>
                    Lower values make smaller files. Higher values keep more
                    image detail.
                  </FieldDescription>
                  <Input
                    id="asset-output-compression"
                    max={100}
                    min={0}
                    onChange={(event) => {
                      const nextValue = Number.parseInt(event.target.value, 10)

                      if (!Number.isNaN(nextValue)) {
                        setConfig((current) => ({
                          ...current,
                          outputCompression: Math.min(
                            100,
                            Math.max(0, nextValue)
                          ),
                        }))
                      }
                    }}
                    type="number"
                    value={config.outputCompression}
                  />
                </Field>
              )}

              {config.model === "dall-e-3" && (
                <Field>
                  <FieldLabel>Style</FieldLabel>
                  <FieldDescription>
                    Choose between a more natural look or a more dramatic one.
                  </FieldDescription>
                  <ToggleGroup
                    onValueChange={(value) => {
                      if (value) {
                        setConfig((current) => ({
                          ...current,
                          style: value as StyleValue,
                        }))
                      }
                    }}
                    type="single"
                    value={config.style}
                    variant="outline"
                  >
                    {STYLE_OPTIONS.map((option) => (
                      <ToggleGroupItem key={option} value={option}>
                        {labelFromValue(option)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              )}
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-2 border-border/70 border-t bg-background px-4 pt-4 pb-4 text-left sm:px-5">
            <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Default format</span>
                  <span>WEBP</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Images</span>
                  <span>{config.n}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated cost</span>
                  <span className="tabular-nums">
                    {estimatedCost === null
                      ? "Choose fixed size + low/medium/high"
                      : `$${(estimatedCost * config.n).toFixed(3)}`}
                  </span>
                </div>
              </div>
            </div>
          </CardFooter>
        </div>
      </TabsContent>

      <TabsContent value="pricing">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
          <div className="space-y-1">
            <p className="font-medium text-xs">openai/gpt-image-2</p>
            <p className="text-muted-foreground text-xs/relaxed">
              Additional sizes available.
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
                {GPT_IMAGE_2_PRICING.map((row) => (
                  <tr
                    className="border-border/60 border-b last:border-b-0"
                    key={row.quality}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.quality}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.square}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.portrait}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.landscape}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
