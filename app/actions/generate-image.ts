"use server"

import { headers } from "next/headers"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
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

const DEFAULT_IMAGE_MIME_TYPE = "image/webp"
const TITLE_MAX_LENGTH = 80

export interface SubmitImageSuccess {
  generationId: string
  images: string[]
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

    const images =
      response.data
        ?.flatMap((image) => {
          if (image.url) {
            return [image.url]
          }

          if (image.b64_json) {
            return [`data:image/webp;base64,${image.b64_json}`]
          }

          return []
        })
        .filter(Boolean) ?? []

    if (images.length === 0) {
      return {
        ok: false,
        message: "OpenAI returned no images for this request",
      }
    }

    const prompt = data.prompt.trim()
    const dimensions = IMAGE_SIZE_DIMENSIONS[data.size]
    const title =
      prompt.length > TITLE_MAX_LENGTH
        ? `${prompt.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
        : prompt
    const totalCost = String(
      getEstimatedImageCost({
        n: images.length,
        quality: data.quality,
        size: data.size,
      })
    )

    const [generation] = await db
      .insert(generations)
      .values({
        estimatedCost: totalCost,
        model: SUPPORTED_IMAGE_MODEL,
        prompt,
        referenceId: String(response.created ?? ""),
        status: "completed",
        title,
        totalCost,
        type: "image",
        userId: session.user.id,
      })
      .returning({ id: generations.id })

    await db.insert(imagesTable).values(
      images.map((image, index) => ({
        generationId: generation.id,
        height: dimensions.height,
        mimeType: DEFAULT_IMAGE_MIME_TYPE,
        path: image.startsWith("data:") ? null : image,
        position: index,
        sourceUrl: image,
        width: dimensions.width,
      }))
    )

    return {
      generationId: generation.id,
      ok: true,
      images,
      size: data.size,
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
