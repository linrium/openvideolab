export const MODELS = [
  {
    value: "kie/bytedance/seedance-2",
    label: "Kie.ai: Seedance 2",
    disabled: false,
  },
  {
    value: "kie/bytedance/seedance-2-fast",
    label: "Kie.ai: Seedance 2 Fast",
    disabled: false,
  },
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

export const KIE_CREDIT_USD_RATE = 0.005

export const PRICING = {
  "kie/bytedance/seedance-2": {
    cost_type: "credit",
    tokens: { with_audio: 0, no_audio: 0 },
    per_second: {
      with_audio: { "480p": 19, "720p": 41, "1080p": 102 },
      no_audio: { "480p": 19, "720p": 41, "1080p": 102 },
      with_video_input: { "480p": 11.5, "720p": 25, "1080p": 62 },
      no_video_input: { "480p": 19, "720p": 41, "1080p": 102 },
    },
    usd_per_second: {
      with_video_input: { "480p": 0.057, "720p": 0.125, "1080p": 0.31 },
      no_video_input: { "480p": 0.095, "720p": 0.205, "1080p": 0.51 },
    },
  },
  "kie/bytedance/seedance-2-fast": {
    cost_type: "credit",
    tokens: { with_audio: 0, no_audio: 0 },
    per_second: {
      with_audio: { "480p": 15.5, "720p": 33 },
      no_audio: { "480p": 15.5, "720p": 33 },
      with_video_input: { "480p": 9, "720p": 20 },
      no_video_input: { "480p": 15.5, "720p": 33 },
    },
    usd_per_second: {
      with_video_input: { "480p": 0.045, "720p": 0.1 },
      no_video_input: { "480p": 0.0775, "720p": 0.165 },
    },
  },
  "bytedance/seedance-2.0": {
    cost_type: "money",
    tokens: { with_audio: 7, no_audio: 7 },
    per_second: {
      with_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
      no_audio: { "480p": 0.067_26, "720p": 0.1512, "1080p": 0.3402 },
    },
  },
  "bytedance/seedance-2.0-fast": {
    cost_type: "money",
    tokens: { with_audio: 5.6, no_audio: 5.6 },
    per_second: {
      with_audio: { "480p": 0.0538, "720p": 0.121, "1080p": 0.2722 },
      no_audio: { "480p": 0.0538, "720p": 0.121, "1080p": 0.2722 },
    },
  },
  "alibaba/wan-2.7": {
    cost_type: "money",
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
    atlasCloudAudioUrl: boolean
    atlasCloudNegativePrompt: boolean
    atlasCloudPromptExtend: boolean
    generateAudio: boolean
    inputReferences: boolean
    kieNsfwChecker: boolean
    kieReferenceAudioUrls: boolean
    kieReferenceVideoUrls: boolean
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
    atlasCloudAudioUrl: false,
    atlasCloudNegativePrompt: false,
    atlasCloudPromptExtend: false,
    generateAudio: true,
    inputReferences: true,
    kieNsfwChecker: false,
    kieReferenceAudioUrls: false,
    kieReferenceVideoUrls: false,
    frames: true,
    watermark: false,
  },
}

const kieSeedanceConfig: ModelFieldConfig = {
  ...seedanceConfig,
  features: {
    ...seedanceConfig.features,
    kieNsfwChecker: true,
    kieReferenceAudioUrls: true,
    kieReferenceVideoUrls: true,
  },
}

const kieSeedanceFastConfig: ModelFieldConfig = {
  ...kieSeedanceConfig,
  resolutions: ["480p", "720p"],
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
    atlasCloudAudioUrl: true,
    atlasCloudNegativePrompt: true,
    atlasCloudPromptExtend: true,
    generateAudio: true,
    inputReferences: true,
    kieNsfwChecker: false,
    kieReferenceAudioUrls: false,
    kieReferenceVideoUrls: false,
    frames: true,
    watermark: false,
  },
}

export const MODEL_CONFIGS: Record<ModelValue, ModelFieldConfig> = {
  "kie/bytedance/seedance-2": kieSeedanceConfig,
  "kie/bytedance/seedance-2-fast": kieSeedanceFastConfig,
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
      atlasCloudAudioUrl: false,
      atlasCloudNegativePrompt: false,
      atlasCloudPromptExtend: false,
      generateAudio: false,
      inputReferences: false,
      kieNsfwChecker: false,
      kieReferenceAudioUrls: false,
      kieReferenceVideoUrls: false,
      frames: false,
      watermark: true,
    },
  },
}

export const DEFAULT_MODEL_CONFIG: ModelFieldConfig = seedanceConfig
