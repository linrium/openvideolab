"use server"

import { headers } from "next/headers"
import {
  type AssetSize,
  assetGenerationSchema,
  SUPPORTED_ASSET_MODEL,
} from "@/lib/asset-generation"
import { auth } from "@/lib/auth"
import { getOpenAiClientByUserId } from "@/lib/openai-client"

export interface SubmitAssetSuccess {
  images: string[]
  ok: true
  size: AssetSize
}

export interface SubmitAssetError {
  message: string
  ok: false
}

export async function submitAssetAction(
  input: unknown
): Promise<SubmitAssetSuccess | SubmitAssetError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = assetGenerationSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  try {
    const openAiClient = await getOpenAiClientByUserId(session.user.id)
    const response = await openAiClient.images.generate({
      background: parsedInput.data.background,
      model: SUPPORTED_ASSET_MODEL,
      moderation: parsedInput.data.moderation,
      n: parsedInput.data.n,
      output_format: "webp",
      prompt: parsedInput.data.prompt,
      quality: parsedInput.data.quality,
      response_format: "url",
      size: parsedInput.data.size,
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

    return {
      ok: true,
      images,
      size: parsedInput.data.size,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to generate asset",
    }
  }
}
