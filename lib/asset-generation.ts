import z from "zod/v4"

export const SUPPORTED_ASSET_MODEL = "gpt-image-2-2026-04-21" as const

export const ASSET_BACKGROUND_OPTIONS = [
  "auto",
  "opaque",
  "transparent",
] as const

export const ASSET_MODERATION_OPTIONS = ["auto", "low"] as const

export const ASSET_QUALITY_OPTIONS = ["low", "medium", "high"] as const

export const ASSET_SIZE_OPTIONS = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
] as const

export const assetGenerationSchema = z.object({
  background: z.enum(ASSET_BACKGROUND_OPTIONS),
  model: z.literal(SUPPORTED_ASSET_MODEL),
  moderation: z.enum(ASSET_MODERATION_OPTIONS),
  n: z.number().int().min(1).max(4),
  prompt: z.string().trim().min(1, "Prompt is required"),
  quality: z.enum(ASSET_QUALITY_OPTIONS),
  size: z.enum(ASSET_SIZE_OPTIONS),
})

export type AssetGenerationValues = z.infer<typeof assetGenerationSchema>
export type AssetBackground = AssetGenerationValues["background"]
export type AssetModeration = AssetGenerationValues["moderation"]
export type AssetQuality = AssetGenerationValues["quality"]
export type AssetSize = AssetGenerationValues["size"]

export const ASSET_DEFAULT_VALUES: AssetGenerationValues = {
  background: "auto",
  model: SUPPORTED_ASSET_MODEL,
  moderation: "auto",
  n: 1,
  prompt: "",
  quality: "medium",
  size: "1024x1024",
}

export const ASSET_PRICING = {
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

export const ASSET_SIZE_DIMENSIONS: Record<
  AssetSize,
  { height: number; width: number }
> = {
  "1024x1024": { height: 1024, width: 1024 },
  "1024x1536": { height: 1536, width: 1024 },
  "1536x1024": { height: 1024, width: 1536 },
}

export function getEstimatedAssetCost(values: {
  n: number
  quality: AssetQuality
  size: AssetSize
}): number {
  return ASSET_PRICING[values.quality][values.size] * values.n
}
