export const MODELS = [
  {
    value: "bytedance/seedance-2.0",
    label: "ByteDance: Seedance 2",
    disabled: false,
  },
  {
    value: "bytedance/seedance-2.0-fast",
    label: "ByteDance: Seedance 2 Fast",
    disabled: false,
  },
  { value: "alibaba/wan-2.7", label: "Alibaba: Wan 2.7", disabled: false },
  {
    value: "alibaba/happy-horse-1.0",
    label: "Alibaba: Happy Horse 1.0",
    disabled: false,
  },
] as const

export type ModelValue = (typeof MODELS)[number]["value"]

export const ASPECT_RATIOS = [
  "9:16",
  "16:9",
  "1:1",
  "4:3",
  "3:4",
  "21:9",
  "9:21",
] as const

export const RESOLUTIONS = ["480p", "720p", "1080p"] as const
export const WAN_ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:3", "3:4"] as const
export const WAN_RESOLUTIONS = ["720p", "1080p"] as const

export const DURATIONS = [5, 10, 15] as const

export const PRICING = {
  "bytedance/seedance-2.0": {
    tokens: { with_audio: 7, no_audio: 7 },
    per_second: {
      with_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
      no_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
    },
  },
  "bytedance/seedance-2.0-fast": {
    tokens: { with_audio: 5.6, no_audio: 5.6 },
    per_second: {
      with_audio: { "480p": 0.0538, "720p": 0.121, "1080p": 0.2722 },
      no_audio: { "480p": 0.0538, "720p": 0.121, "1080p": 0.2722 },
    },
  },
  "alibaba/wan-2.7": {
    tokens: { with_audio: 7, no_audio: 7 },
    per_second: {
      with_audio: { "720p": 0.1, "1080p": 0.1 },
      no_audio: { "720p": 0.1, "1080p": 0.1 },
    },
  },
} as const

export type Model = (typeof MODELS)[number]["value"]

export type DurationConfig =
  | { type: "toggle"; options: readonly number[] }
  | { type: "range"; min: number; max: number }

export interface ModelFieldConfig {
  aspectRatios: readonly string[]
  defaults: {
    aspectRatio: string
    duration: number
    resolution: string
  }
  duration: DurationConfig
  features: {
    generateAudio: boolean
    inputReferences: boolean
    frames: boolean
    watermark: boolean
  }
  promptMaxLength: number
  resolutions: readonly string[]
}

const seedanceConfig: ModelFieldConfig = {
  aspectRatios: ASPECT_RATIOS,
  resolutions: RESOLUTIONS,
  duration: { type: "toggle", options: DURATIONS },
  promptMaxLength: 2500,
  defaults: {
    aspectRatio: "9:16",
    resolution: "480p",
    duration: 5,
  },
  features: {
    generateAudio: true,
    inputReferences: true,
    frames: true,
    watermark: false,
  },
}

const wanConfig: ModelFieldConfig = {
  aspectRatios: WAN_ASPECT_RATIOS,
  resolutions: WAN_RESOLUTIONS,
  duration: { type: "toggle", options: DURATIONS },
  promptMaxLength: 2500,
  defaults: {
    aspectRatio: "9:16",
    resolution: "720p",
    duration: 5,
  },
  features: {
    generateAudio: true,
    inputReferences: true,
    frames: true,
    watermark: false,
  },
}

export const MODEL_CONFIGS: Record<ModelValue, ModelFieldConfig> = {
  "bytedance/seedance-2.0": seedanceConfig,
  "bytedance/seedance-2.0-fast": seedanceConfig,
  "alibaba/wan-2.7": wanConfig,
  "alibaba/happy-horse-1.0": {
    aspectRatios: ["9:16", "16:9", "1:1", "4:3", "3:4"],
    resolutions: ["720P", "1080P"],
    duration: { type: "toggle", options: DURATIONS },
    promptMaxLength: 2500,
    defaults: {
      aspectRatio: "16:9",
      resolution: "720P",
      duration: 5,
    },
    features: {
      generateAudio: false,
      inputReferences: false,
      frames: false,
      watermark: true,
    },
  },
}

export const DEFAULT_MODEL_CONFIG: ModelFieldConfig = seedanceConfig
