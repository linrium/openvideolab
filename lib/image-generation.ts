import z from "zod/v4"

export const IMAGE_MODE_OPTIONS = ["generate", "edit"] as const
export const IMAGE_INPUT_FIDELITY_OPTIONS = ["low", "high"] as const

export const SUPPORTED_IMAGE_GENERATION_MODEL =
  "gpt-image-2-2026-04-21" as const
export const SUPPORTED_IMAGE_EDIT_MODEL = "chatgpt-image-latest" as const
export const SUPPORTED_SEEDREAM_IMAGE_MODEL =
  "bytedance-seed/seedream-4.5" as const
export const SUPPORTED_GEMINI_IMAGE_MODEL =
  "google/gemini-3-pro-image-preview" as const
export const IMAGE_MODEL_OPTIONS = [
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_IMAGE_EDIT_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
  SUPPORTED_GEMINI_IMAGE_MODEL,
] as const
export const IMAGE_MODEL_SELECT_OPTIONS = [
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
  SUPPORTED_GEMINI_IMAGE_MODEL,
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

export const OPENROUTER_IMAGE_ASPECT_RATIO_OPTIONS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
] as const

export const OPENROUTER_IMAGE_SIZE_OPTIONS = ["1K", "2K", "4K"] as const

export const IMAGE_SIZE_OPTIONS = [
  "auto",
  ...IMAGE_EXPLICIT_SIZE_OPTIONS,
  ...OPENROUTER_IMAGE_ASPECT_RATIO_OPTIONS,
] as const

export const GPT_IMAGE_SIZE_OPTIONS = [
  "auto",
  ...IMAGE_EXPLICIT_SIZE_OPTIONS,
] as const

export const SEEDREAM_IMAGE_SIZE_OPTIONS = [
  "auto",
  ...OPENROUTER_IMAGE_ASPECT_RATIO_OPTIONS,
] as const

export const OPENROUTER_IMAGE_MODEL_OPTIONS = [
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
  SUPPORTED_GEMINI_IMAGE_MODEL,
] as const

export const imageInputSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
})

export const imageGenerationSchema = z.object({
  background: z.enum(IMAGE_BACKGROUND_OPTIONS),
  inputFidelity: z.enum(IMAGE_INPUT_FIDELITY_OPTIONS),
  inputImages: z.array(imageInputSchema).max(16),
  imageSize: z.enum(OPENROUTER_IMAGE_SIZE_OPTIONS),
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
export type ImageConfigSize = ImageGenerationValues["imageSize"]
export type ImageInputFidelity = ImageGenerationValues["inputFidelity"]
export type ImageInput = ImageGenerationValues["inputImages"][number]
export type ImageMode = ImageGenerationValues["mode"]
export type ImageModel = ImageGenerationValues["model"]
export type ImageModeration = ImageGenerationValues["moderation"]
export type ImageQuality = ImageGenerationValues["quality"]
export type ImageSize = ImageGenerationValues["size"]

export const IMAGE_DEFAULT_VALUES: ImageGenerationValues = {
  background: "auto",
  imageSize: "1K",
  inputFidelity: "high",
  inputImages: [],
  mask: undefined,
  mode: "generate",
  model: SUPPORTED_IMAGE_GENERATION_MODEL,
  moderation: "low",
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

export const SEEDREAM_IMAGE_COST = 0.04
export const GEMINI_IMAGE_INPUT_COST_PER_MILLION_TOKENS = 2
export const GEMINI_IMAGE_OUTPUT_COST_PER_MILLION_TOKENS = 12

export const IMAGE_MODEL_CAPABILITIES = {
  [SUPPORTED_IMAGE_GENERATION_MODEL]: {
    background: true,
    inputFidelity: false,
    mask: false,
    moderation: true,
    quality: true,
    sizes: GPT_IMAGE_SIZE_OPTIONS,
    sourceImages: false,
  },
  [SUPPORTED_IMAGE_EDIT_MODEL]: {
    background: true,
    inputFidelity: true,
    mask: true,
    moderation: true,
    quality: true,
    sizes: GPT_IMAGE_SIZE_OPTIONS,
    sourceImages: true,
  },
  [SUPPORTED_SEEDREAM_IMAGE_MODEL]: {
    background: false,
    inputFidelity: false,
    mask: false,
    moderation: false,
    quality: false,
    sizes: SEEDREAM_IMAGE_SIZE_OPTIONS,
    sourceImages: true,
  },
  [SUPPORTED_GEMINI_IMAGE_MODEL]: {
    background: false,
    inputFidelity: false,
    mask: false,
    moderation: false,
    quality: false,
    sizes: SEEDREAM_IMAGE_SIZE_OPTIONS,
    sourceImages: true,
  },
} as const

export const IMAGE_SIZE_DIMENSIONS: Record<
  ImageSize,
  { height: number; width: number }
> = {
  auto: { height: 1024, width: 1024 },
  "1:1": { height: 1024, width: 1024 },
  "1024x1024": { height: 1024, width: 1024 },
  "1024x1536": { height: 1536, width: 1024 },
  "16:9": { height: 768, width: 1344 },
  "2:3": { height: 1248, width: 832 },
  "21:9": { height: 672, width: 1536 },
  "3:2": { height: 832, width: 1248 },
  "3:4": { height: 1184, width: 864 },
  "4:3": { height: 864, width: 1184 },
  "4:5": { height: 1152, width: 896 },
  "5:4": { height: 896, width: 1152 },
  "9:16": { height: 1344, width: 768 },
  "1536x1024": { height: 1024, width: 1536 },
}

export function getImageModelCapabilities(model: ImageModel) {
  return IMAGE_MODEL_CAPABILITIES[model]
}

export function isSeedreamImageModel(
  model: ImageModel
): model is typeof SUPPORTED_SEEDREAM_IMAGE_MODEL {
  return model === SUPPORTED_SEEDREAM_IMAGE_MODEL
}

export function isGeminiImageModel(
  model: ImageModel
): model is typeof SUPPORTED_GEMINI_IMAGE_MODEL {
  return model === SUPPORTED_GEMINI_IMAGE_MODEL
}

export function isOpenRouterImageModel(
  model: ImageModel
): model is (typeof OPENROUTER_IMAGE_MODEL_OPTIONS)[number] {
  return OPENROUTER_IMAGE_MODEL_OPTIONS.some((option) => option === model)
}

export function isSupportedImageSizeForModel(
  model: ImageModel,
  size: ImageSize
): boolean {
  return getImageModelCapabilities(model).sizes.some(
    (supportedSize) => supportedSize === size
  )
}

export function getEstimatedImageCostRange(values: {
  model: ImageModel
  n: number
  quality: ImageQuality
  size: ImageSize
}): { max: number; min: number } {
  if (isSeedreamImageModel(values.model)) {
    const cost = SEEDREAM_IMAGE_COST * values.n
    return { max: cost, min: cost }
  }

  if (isGeminiImageModel(values.model)) {
    return { max: 0, min: 0 }
  }

  const qualities =
    values.quality === "auto"
      ? IMAGE_EXPLICIT_QUALITY_OPTIONS
      : [values.quality]
  const sizes: readonly (typeof IMAGE_EXPLICIT_SIZE_OPTIONS)[number][] =
    values.size !== "auto" &&
    IMAGE_EXPLICIT_SIZE_OPTIONS.includes(
      values.size as (typeof IMAGE_EXPLICIT_SIZE_OPTIONS)[number]
    )
      ? [values.size as (typeof IMAGE_EXPLICIT_SIZE_OPTIONS)[number]]
      : IMAGE_EXPLICIT_SIZE_OPTIONS
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
  model: ImageModel
  n: number
  quality: ImageQuality
  size: ImageSize
}): number {
  const { max, min } = getEstimatedImageCostRange(values)
  return min === max ? min : (min + max) / 2
}
