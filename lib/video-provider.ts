export interface AtlasCloudProviderOptions {
  audio_url?: string
  negative_prompt?: string
  prompt_extend?: boolean
}

export interface PersistedVideoProvider {
  metadata?: {
    audioKey?: string | null
  }
  options?: {
    "atlas-cloud"?: AtlasCloudProviderOptions
  }
}

export function getAtlasCloudOptions(
  provider: PersistedVideoProvider | null | undefined
): AtlasCloudProviderOptions | undefined {
  return provider?.options?.["atlas-cloud"]
}
