export const MODELS = [
  { value: "bytedance/seedance-2.0", label: "Seedance 2", disabled: false },
  {
    value: "bytedance/seedance-2.0-fast",
    label: "Seedance 2 Fast",
    disabled: false,
  },
  { value: "wan/wan-2.7", label: "Wan 2.7", disabled: true },
  {
    value: "alibaba/happy-horse-1.0",
    label: "Happy Horse 1.0",
    disabled: true,
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
} as const

export type Model = (typeof MODELS)[number]["value"]
