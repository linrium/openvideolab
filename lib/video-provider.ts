export interface AtlasCloudProviderOptions {
  audio_url?: string
  negative_prompt?: string
  prompt_extend?: boolean
}

export interface KieProviderOptions {
  nsfw_checker?: boolean
  reference_audio_urls?: string[]
  reference_video_urls?: string[]
}

export interface PersistedVideoProvider {
  metadata?: {
    audioKey?: string | null
    kieReferenceAudioKeys?: string[]
    kieReferenceVideoDurations?: number[]
    kieReferenceVideoKeys?: string[]
  }
  options?: {
    "atlas-cloud"?: AtlasCloudProviderOptions
    kie?: KieProviderOptions
  }
}

export function getAtlasCloudOptions(
  provider: PersistedVideoProvider | null | undefined
): AtlasCloudProviderOptions | undefined {
  return provider?.options?.["atlas-cloud"]
}

export function getKieOptions(
  provider: PersistedVideoProvider | null | undefined
): KieProviderOptions | undefined {
  return provider?.options?.kie
}

export function isKieVideoModel(model: string): boolean {
  return model.startsWith("kie/")
}

export function toKieModel(model: string): string {
  return isKieVideoModel(model) ? model.slice("kie/".length) : model
}

export function isAtlasCloudVideoModel(model: string): boolean {
  return model.startsWith("atlas-cloud/")
}
