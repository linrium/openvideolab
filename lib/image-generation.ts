import z from "zod/v4"

export const IMAGE_MODE_OPTIONS = ["generate", "edit"] as const
export const IMAGE_INPUT_FIDELITY_OPTIONS = ["low", "high"] as const

export const SUPPORTED_IMAGE_GENERATION_MODEL =
  "gpt-image-2-2026-04-21" as const
export const SUPPORTED_IMAGE_EDIT_MODEL = "chatgpt-image-latest" as const
export const IMAGE_MODEL_OPTIONS = [
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_IMAGE_EDIT_MODEL,
] as const
export const SUPPORTED_IMAGE_MODEL = SUPPORTED_IMAGE_GENERATION_MODEL

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

export const imageInputSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
})

export const imageGenerationSchema = z.object({
  background: z.enum(IMAGE_BACKGROUND_OPTIONS),
  inputFidelity: z.enum(IMAGE_INPUT_FIDELITY_OPTIONS),
  inputImages: z.array(imageInputSchema).max(16),
  mask: imageInputSchema.optional(),
  mode: z.enum(IMAGE_MODE_OPTIONS),
  model: z.enum(IMAGE_MODEL_OPTIONS),
  moderation: z.enum(IMAGE_MODERATION_OPTIONS),
  n: z.number().int().min(1).max(4),
  prompt: z.string().trim().min(1, "Prompt is required"),
  quality: z.enum(IMAGE_QUALITY_OPTIONS),
  size: z.enum(IMAGE_SIZE_OPTIONS),
  title: z.string().trim(),
})

export type ImageGenerationValues = z.infer<typeof imageGenerationSchema>
export type ImageBackground = ImageGenerationValues["background"]
export type ImageInputFidelity = ImageGenerationValues["inputFidelity"]
export type ImageInput = ImageGenerationValues["inputImages"][number]
export type ImageMode = ImageGenerationValues["mode"]
export type ImageModel = ImageGenerationValues["model"]
export type ImageModeration = ImageGenerationValues["moderation"]
export type ImageQuality = ImageGenerationValues["quality"]
export type ImageSize = ImageGenerationValues["size"]

export const IMAGE_DEFAULT_VALUES: ImageGenerationValues = {
  background: "auto",
  inputFidelity: "high",
  inputImages: [],
  mask: undefined,
  mode: "generate",
  model: SUPPORTED_IMAGE_GENERATION_MODEL,
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
