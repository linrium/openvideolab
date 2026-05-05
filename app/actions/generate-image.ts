"use server"

import { headers } from "next/headers"
import type { ImagesResponse } from "openai/resources/images"
import { v7 as uuidv7 } from "uuid"
import type { GeneratedImageMetadata } from "@/components/image-studio"
import { db } from "@/db"
import {
  generations,
  type PersistedGenerationUsage,
} from "@/db/schema/generations"
import { images as imagesTable } from "@/db/schema/images"
import { auth } from "@/lib/auth"
import {
  getEstimatedImageCost,
  IMAGE_SIZE_DIMENSIONS,
  type ImageSize,
  imageGenerationSchema,
  SUPPORTED_IMAGE_MODEL,
} from "@/lib/image-generation"
import { getOpenAiClientByUserId } from "@/lib/openai-client"
import { getPresignedUrl, uploadToR2 } from "@/lib/r2"

const DEFAULT_IMAGE_MIME_TYPE = "image/webp"
const TITLE_MAX_LENGTH = 80
const DEFAULT_IMAGE_EXTENSION = "webp"

interface GeneratedImageAsset {
  key: string
  previewUrl: string
  sourceUrl: string | null
}

function resolveImageQuality(
  requestedQuality: GeneratedImageMetadata["quality"],
  response: ImagesResponse
): NonNullable<GeneratedImageMetadata["quality"]> {
  return response.quality ?? requestedQuality ?? "auto"
}

function resolveImageSize(
  requestedSize: ImageSize,
  response: ImagesResponse
): ImageSize {
  return response.size ?? requestedSize
}

function buildGenerationUsage(
  response: ImagesResponse,
  resolved: {
    quality: NonNullable<GeneratedImageMetadata["quality"]>
    size: ImageSize
  }
): PersistedGenerationUsage {
  return {
    image: {
      quality: resolved.quality,
      size: resolved.size,
    },
    provider: response.usage
      ? {
          inputTokens: response.usage.input_tokens,
          inputTokensDetails: {
            imageTokens: response.usage.input_tokens_details.image_tokens,
            textTokens: response.usage.input_tokens_details.text_tokens,
          },
          outputTokens: response.usage.output_tokens,
          outputTokensDetails: response.usage.output_tokens_details
            ? {
                imageTokens: response.usage.output_tokens_details.image_tokens,
                textTokens: response.usage.output_tokens_details.text_tokens,
              }
            : undefined,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  }
}

function getImageTitle(inputTitle: string, prompt: string): string {
  const trimmedTitle = inputTitle.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  const trimmedPrompt = prompt.trim()
  return trimmedPrompt.length > TITLE_MAX_LENGTH
    ? `${trimmedPrompt.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : trimmedPrompt
}

function getImageBufferFromBase64(base64Content: string): Buffer {
  return Buffer.from(base64Content, "base64")
}

async function getImageBufferFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch generated image: ${response.status} ${response.statusText}`
    )
  }

  return Buffer.from(await response.arrayBuffer())
}

async function uploadGeneratedImageToR2(options: {
  image: { b64_json?: string | null; url?: string | null }
  userId: string
}): Promise<GeneratedImageAsset> {
  const key = `${options.userId}/images/${uuidv7()}.${DEFAULT_IMAGE_EXTENSION}`
  const sourceUrl = options.image.url ?? null

  let body: Buffer | null = null

  if (options.image.b64_json) {
    body = getImageBufferFromBase64(options.image.b64_json)
  } else if (options.image.url) {
    body = await getImageBufferFromUrl(options.image.url)
  }

  if (!body) {
    throw new Error("Generated image payload is missing")
  }

  await uploadToR2(key, body, DEFAULT_IMAGE_MIME_TYPE)

  return {
    key,
    previewUrl: await getPresignedUrl({ key }),
    sourceUrl,
  }
}

export interface SubmitImageSuccess {
  generationId: string
  images: string[]
  metadata: GeneratedImageMetadata
  ok: true
  size: ImageSize
}

export interface SubmitImageError {
  message: string
  ok: false
}

export async function submitImageAction(
  input: unknown
): Promise<SubmitImageSuccess | SubmitImageError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = imageGenerationSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  try {
    const { data } = parsedInput
    const openAiClient = await getOpenAiClientByUserId(session.user.id)
    const response = await openAiClient.images.generate({
      background: data.background,
      model: SUPPORTED_IMAGE_MODEL,
      moderation: data.moderation,
      n: data.n,
      output_format: "webp",
      prompt: data.prompt,
      quality: data.quality,
      size: data.size,
    })

    const uploadedImages = await Promise.all(
      (response.data ?? [])
        .filter((image) => image.url || image.b64_json)
        .map((image) =>
          uploadGeneratedImageToR2({
            image,
            userId: session.user.id,
          })
        )
    )

    if (uploadedImages.length === 0) {
      return {
        ok: false,
        message: "OpenAI returned no images for this request",
      }
    }

    const prompt = data.prompt.trim()
    const resolvedSize = resolveImageSize(data.size, response)
    const resolvedQuality = resolveImageQuality(data.quality, response)
    const dimensions =
      resolvedSize === "auto" ? null : IMAGE_SIZE_DIMENSIONS[resolvedSize]
    const title = getImageTitle(data.title, prompt)
    const estimatedCost = String(
      getEstimatedImageCost({
        n: uploadedImages.length,
        quality: data.quality,
        size: data.size,
      })
    )
    const totalCost = String(
      getEstimatedImageCost({
        n: uploadedImages.length,
        quality: resolvedQuality,
        size: resolvedSize,
      })
    )
    const usage = buildGenerationUsage(response, {
      quality: resolvedQuality,
      size: resolvedSize,
    })

    const [generation] = await db
      .insert(generations)
      .values({
        estimatedCost,
        model: SUPPORTED_IMAGE_MODEL,
        prompt,
        referenceId: String(response.created ?? ""),
        status: "completed",
        title,
        totalCost,
        type: "image",
        usage,
        userId: session.user.id,
      })
      .returning({ createdAt: generations.createdAt, id: generations.id })

    await db.insert(imagesTable).values(
      uploadedImages.map((image, index) => ({
        generationId: generation.id,
        height: dimensions?.height ?? null,
        mimeType: DEFAULT_IMAGE_MIME_TYPE,
        path: image.key,
        position: index,
        sourceUrl: image.sourceUrl,
        width: dimensions?.width ?? null,
      }))
    )

    return {
      generationId: generation.id,
      ok: true,
      images: uploadedImages.map((image) => image.previewUrl),
      metadata: {
        cost: estimatedCost,
        createdAt: generation.createdAt.toISOString(),
        model: SUPPORTED_IMAGE_MODEL,
        quality: resolvedQuality,
        size: resolvedSize,
        totalCost,
      },
      size: resolvedSize,
    }
  } catch (error) {
    console.error(error)
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to generate image",
    }
  }
}
