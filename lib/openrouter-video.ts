export type VideoJobStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"

export type VideoAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:3"
  | "3:4"
  | "21:9"
  | "9:21"

export type VideoResolution = "480p" | "720p" | "1080p" | "1K" | "2K" | "4K"

interface FrameImage {
  frame_type: "first_frame" | "last_frame"
  image_url: { url: string }
  type: "image_url"
}

interface InputReference {
  image_url: { url: string }
  type: "image_url"
}

export interface SubmitJobOptions {
  aspect_ratio?: VideoAspectRatio
  callback_url?: string
  duration?: number
  frame_images?: FrameImage[]
  generate_audio?: boolean
  input_references?: InputReference[]
  model?: string
  prompt: string
  provider?: { options: Record<string, unknown> }
  resolution?: VideoResolution
  seed?: number
  size?: string
}

interface VideoGenerationUsage {
  cost: number | null
  is_byok: boolean
}

interface VideoJobResponse {
  id: string
  polling_url: string
}

interface VideoStatusResponse {
  error?: string
  generation_id?: string
  id: string
  polling_url: string
  status: VideoJobStatus
  unsigned_urls?: string[]
  usage?: VideoGenerationUsage
}

export interface GenerateVideoOptions extends SubmitJobOptions {
  onStatus?: (status: VideoJobStatus) => void
  pollIntervalMs?: number
}

export interface GenerateVideoResult {
  cost: number | null
  generationId: string | undefined
  isByok: boolean
  jobId: string
  urls: string[]
}

export class OpenRouterVideoClient {
  private readonly apiKey: string
  private readonly baseUrl = "https://openrouter.ai/api/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private authHeaders(): HeadersInit {
    return { Authorization: `Bearer ${this.apiKey}` }
  }

  async submitJob(options: SubmitJobOptions): Promise<VideoJobResponse> {
    const { model = "bytedance/seedance-2.0", ...rest } = options
    const response = await fetch(`${this.baseUrl}/videos`, {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, ...rest }),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to submit video job: ${response.status} ${response.statusText}`
      )
    }

    return response.json() as Promise<VideoJobResponse>
  }

  async pollJob(
    pollingUrl: string,
    intervalMs = 5000,
    onStatus?: (status: VideoJobStatus) => void
  ): Promise<VideoStatusResponse> {
    while (true) {
      const response = await fetch(pollingUrl, { headers: this.authHeaders() })

      if (!response.ok) {
        throw new Error(
          `Polling failed: ${response.status} ${response.statusText}`
        )
      }

      const data = (await response.json()) as VideoStatusResponse
      onStatus?.(data.status)

      if (data.status === "completed") {
        return data
      }

      if (
        data.status === "failed" ||
        data.status === "cancelled" ||
        data.status === "expired"
      ) {
        throw new Error(
          data.error ?? `Video job ended with status: ${data.status}`
        )
      }

      await new Promise<void>((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  async downloadContent(jobId: string, index = 0): Promise<Response> {
    const url = new URL(`${this.baseUrl}/videos/${jobId}/content`)
    url.searchParams.set("index", String(index))

    const response = await fetch(url.toString(), {
      headers: this.authHeaders(),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to download video: ${response.status} ${response.statusText}`
      )
    }

    return response
  }

  async generate(options: GenerateVideoOptions): Promise<GenerateVideoResult> {
    const { onStatus, pollIntervalMs = 5000, ...submitOptions } = options

    const job = await this.submitJob(submitOptions)
    const result = await this.pollJob(job.polling_url, pollIntervalMs, onStatus)

    return {
      jobId: job.id,
      generationId: result.generation_id,
      urls: result.unsigned_urls ?? [],
      cost: result.usage?.cost ?? null,
      isByok: result.usage?.is_byok ?? false,
    }
  }
}

export const openrouterClient = new OpenRouterVideoClient(
  process.env.OPENROUTER_API_KEY
)
