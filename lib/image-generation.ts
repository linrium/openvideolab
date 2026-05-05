import z from "zod/v4"

export const SUPPORTED_IMAGE_MODEL = "gpt-image-2-2026-04-21" as const

export const IMAGE_BACKGROUND_OPTIONS = [
  "auto",
  "opaque",
  "transparent",
] as const

export const IMAGE_MODERATION_OPTIONS = ["auto", "low"] as const

export const IMAGE_EXPLICIT_QUALITY_OPTIONS = ["low", "medium", "high"] as const

export const IMAGE_QUALITY_OPTIONS = [
  "auto",
  ...IMAGE_EXPLICIT_QUALITY_OPTIONS,
] as const

export const IMAGE_EXPLICIT_SIZE_OPTIONS = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
] as const

export const IMAGE_SIZE_OPTIONS = [
  "auto",
  ...IMAGE_EXPLICIT_SIZE_OPTIONS,
] as const

export const imageGenerationSchema = z.object({
  background: z.enum(IMAGE_BACKGROUND_OPTIONS),
  model: z.literal(SUPPORTED_IMAGE_MODEL),
  moderation: z.enum(IMAGE_MODERATION_OPTIONS),
  n: z.number().int().min(1).max(4),
  prompt: z.string().trim().min(1, "Prompt is required"),
  quality: z.enum(IMAGE_QUALITY_OPTIONS),
  size: z.enum(IMAGE_SIZE_OPTIONS),
  title: z.string().trim(),
})

export type ImageGenerationValues = z.infer<typeof imageGenerationSchema>
export type ImageBackground = ImageGenerationValues["background"]
export type ImageModeration = ImageGenerationValues["moderation"]
export type ImageQuality = ImageGenerationValues["quality"]
export type ImageSize = ImageGenerationValues["size"]

export const IMAGE_DEFAULT_VALUES: ImageGenerationValues = {
  background: "auto",
  model: SUPPORTED_IMAGE_MODEL,
  moderation: "auto",
  n: 1,
  prompt: "",
  quality: "auto",
  size: "auto",
  title: "",
}

export const IMAGE_PRICING = {
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

export const IMAGE_SIZE_DIMENSIONS: Record<
  ImageSize,
  { height: number; width: number }
> = {
  auto: { height: 1024, width: 1024 },
  "1024x1024": { height: 1024, width: 1024 },
  "1024x1536": { height: 1536, width: 1024 },
  "1536x1024": { height: 1024, width: 1536 },
}

export function getEstimatedImageCostRange(values: {
  n: number
  quality: ImageQuality
  size: ImageSize
}): { max: number; min: number } {
  const qualities =
    values.quality === "auto"
      ? IMAGE_EXPLICIT_QUALITY_OPTIONS
      : [values.quality]
  const sizes =
    values.size === "auto" ? IMAGE_EXPLICIT_SIZE_OPTIONS : [values.size]
  const costs: number[] = []

  for (const quality of qualities) {
    for (const size of sizes) {
      costs.push(IMAGE_PRICING[quality][size] * values.n)
    }
  }

  return {
    max: Math.max(...costs),
    min: Math.min(...costs),
  }
}

export function getEstimatedImageCost(values: {
  n: number
  quality: ImageQuality
  size: ImageSize
}): number {
  const { max, min } = getEstimatedImageCostRange(values)
  return min === max ? min : (min + max) / 2
}
