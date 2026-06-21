"use server"

import type { ChatResult } from "@openrouter/sdk/models"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { toFile } from "openai"
import type { ImagesResponse } from "openai/resources/images"
import { v7 as uuidv7 } from "uuid"
import z from "zod/v4"
import type { GeneratedImageMetadata } from "@/components/image-studio"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import {
  images as imagesTable,
  type PersistedImageUsage,
} from "@/db/schema/images"
import { auth } from "@/lib/auth"
import {
  GPT_IMAGE_SIZE_OPTIONS,
  getEstimatedImageCost,
  IMAGE_SIZE_DIMENSIONS,
  type ImageGenerationValues,
  type ImageInput,
  type ImageModel,
  type ImageSize,
  imageGenerationSchema,
  isSeedreamImageModel,
  isSupportedImageSizeForModel,
  SEEDREAM_IMAGE_COST,
  SUPPORTED_IMAGE_EDIT_MODEL,
  SUPPORTED_IMAGE_GENERATION_MODEL,
  SUPPORTED_SEEDREAM_IMAGE_MODEL,
} from "@/lib/image-generation"
import { getOpenAiClientByUserId } from "@/lib/openai-client"
import { getOpenrouterClientByUserId } from "@/lib/openrouter-client"
import { getPresignedUrl, uploadToR2 } from "@/lib/r2"

const DEFAULT_IMAGE_MIME_TYPE = "image/webp"
const TITLE_MAX_LENGTH = 80
const DEFAULT_IMAGE_EXTENSION = "webp"
const MASK_MAX_SIZE_BYTES = 4 * 1024 * 1024
const DATA_URL_IMAGE_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i
const EDITABLE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

type GptImageSize = (typeof GPT_IMAGE_SIZE_OPTIONS)[number]

interface GeneratedImageAsset {
  key: string
  mimeType: string
  previewUrl: string
  sourceUrl: string | null
}

interface PreparedImageGeneration {
  estimatedCost: string
  model: ImageModel
  referenceId: string
  resolvedQuality: NonNullable<GeneratedImageMetadata["quality"]> | null
  resolvedSize: ImageSize
  totalCost: string
  uploadedImages: GeneratedImageAsset[]
  usage: PersistedImageUsage | undefined
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

function resolveRequestModel(data: ImageGenerationValues): ImageModel {
  if (isSeedreamImageModel(data.model)) {
    return data.model
  }

  return data.inputImages.length > 0
    ? SUPPORTED_IMAGE_EDIT_MODEL
    : SUPPORTED_IMAGE_GENERATION_MODEL
}

function resolveOpenAiImageSize(size: ImageSize): GptImageSize {
  return GPT_IMAGE_SIZE_OPTIONS.includes(size as GptImageSize)
    ? (size as GptImageSize)
    : "auto"
}

function buildImageUsage(
  response: ImagesResponse,
  _resolved: {
    quality: NonNullable<GeneratedImageMetadata["quality"]>
    size: ImageSize
  }
): PersistedImageUsage {
  return {
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

const updateImageTitleSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().trim(),
})

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

async function getEditableImageFile(input: ImageInput) {
  const response = await fetch(input.url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source image: ${response.status} ${response.statusText}`
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase() ?? ""
  if (!EDITABLE_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Source images must be JPEG, PNG, or WebP")
  }

  const fileName = input.key.split("/").pop() ?? `source-${uuidv7()}.jpg`
  return toFile(Buffer.from(await response.arrayBuffer()), fileName, {
    type: mimeType,
  })
}

async function getOpenRouterImageDataUrlContent(input: ImageInput) {
  const response = await fetch(input.url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source image: ${response.status} ${response.statusText}`
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase() ?? ""
  if (!EDITABLE_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Source images must be JPEG, PNG, or WebP")
  }

  const base64 = Buffer.from(await response.arrayBuffer()).toString("base64")

  return {
    imageUrl: {
      url: `data:${mimeType};base64,${base64}`,
    },
    type: "image_url" as const,
  }
}

async function getMaskImageFile(input: ImageInput) {
  const response = await fetch(input.url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch mask image: ${response.status} ${response.statusText}`
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase() ?? ""
  if (mimeType !== "image/png") {
    throw new Error("Mask must be a PNG image")
  }

  const body = Buffer.from(await response.arrayBuffer())
  if (body.byteLength > MASK_MAX_SIZE_BYTES) {
    throw new Error("Mask must be smaller than 4 MB")
  }

  const fileName = input.key.split("/").pop() ?? `mask-${uuidv7()}.png`
  return toFile(body, fileName, { type: mimeType })
}

async function createOpenAiImageResponse(
  openAiClient: Awaited<ReturnType<typeof getOpenAiClientByUserId>>,
  data: ImageGenerationValues
): Promise<{ model: string; response: ImagesResponse }> {
  const isEdit = data.inputImages.length > 0
  const model = resolveRequestModel(data)

  if (isEdit) {
    const size = resolveOpenAiImageSize(data.size)

    return {
      model,
      response: await openAiClient.images.edit({
        background: data.background,
        image: await Promise.all(data.inputImages.map(getEditableImageFile)),
        input_fidelity: data.inputFidelity,
        mask: data.mask ? await getMaskImageFile(data.mask) : undefined,
        model,
        n: data.n,
        output_format: "webp",
        prompt: data.prompt,
        quality: data.quality,
        size,
        ...({ moderation: data.moderation } as {
          moderation: typeof data.moderation
        }),
      }),
    }
  }

  return {
    model,
    response: await openAiClient.images.generate({
      background: data.background,
      model,
      moderation: data.moderation,
      n: data.n,
      output_format: "webp",
      prompt: data.prompt,
      quality: data.quality,
      size: resolveOpenAiImageSize(data.size),
    }),
  }
}

async function createSeedreamImageResponses(
  userId: string,
  data: ImageGenerationValues
): Promise<{
  images: Array<{ b64_json?: string | null; url?: string | null }>
  model: typeof SUPPORTED_SEEDREAM_IMAGE_MODEL
  referenceId: string
}> {
  const openrouterClient = await getOpenrouterClientByUserId(userId)
  const content =
    data.inputImages.length === 0
      ? data.prompt
      : [
          { text: data.prompt, type: "text" as const },
          ...(await Promise.all(
            data.inputImages.map(getOpenRouterImageDataUrlContent)
          )),
        ]
  const imageConfig: Record<string, string> = { image_size: data.imageSize }
  if (data.size !== "auto") {
    imageConfig.aspect_ratio = data.size
  }

  const responses: ChatResult[] = await Promise.all(
    Array.from({ length: data.n }, () =>
      openrouterClient.chat.send({
        chatRequest: {
          imageConfig,
          messages: [{ content, role: "user" }],
          modalities: ["image"],
          model: SUPPORTED_SEEDREAM_IMAGE_MODEL,
          stream: false,
        },
      })
    )
  )
  const images = responses.flatMap((response) =>
    (response.choices[0]?.message.images ?? []).map((image) => ({
      url: image.imageUrl.url,
    }))
  )

  return {
    images: images.slice(0, data.n),
    model: SUPPORTED_SEEDREAM_IMAGE_MODEL,
    referenceId: responses.map((response) => response.id).join(","),
  }
}

async function uploadGeneratedImageToR2(options: {
  image: { b64_json?: string | null; url?: string | null }
  userId: string
}): Promise<GeneratedImageAsset> {
  const sourceUrl = options.image.url ?? null

  let body: Buffer | null = null
  let mimeType = DEFAULT_IMAGE_MIME_TYPE
  let extension = DEFAULT_IMAGE_EXTENSION

  if (options.image.b64_json) {
    body = getImageBufferFromBase64(options.image.b64_json)
  } else if (options.image.url) {
    const dataUrlMatch = options.image.url.match(DATA_URL_IMAGE_PATTERN)

    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1].toLowerCase()
      extension = mimeType.split("/")[1] ?? DEFAULT_IMAGE_EXTENSION
      body = getImageBufferFromBase64(dataUrlMatch[2])
    } else {
      body = await getImageBufferFromUrl(options.image.url)
    }
  }

  if (!body) {
    throw new Error("Generated image payload is missing")
  }

  const key = `${options.userId}/images/${uuidv7()}.${extension}`
  await uploadToR2(key, body, mimeType)

  return {
    key,
    mimeType,
    previewUrl: await getPresignedUrl({ key }),
    sourceUrl,
  }
}

async function prepareImageGeneration(
  userId: string,
  data: ImageGenerationValues
): Promise<PreparedImageGeneration> {
  const model = resolveRequestModel(data)
  const isSeedreamRequest = isSeedreamImageModel(model)

  if (!isSupportedImageSizeForModel(model, data.size)) {
    throw new Error("Selected size is not supported by this image model")
  }

  const openAiResponse = isSeedreamRequest
    ? null
    : await createOpenAiImageResponse(
        await getOpenAiClientByUserId(userId),
        data
      )
  const seedreamResponse = isSeedreamRequest
    ? await createSeedreamImageResponses(userId, data)
    : null
  const generatedImages =
    openAiResponse?.response.data ?? seedreamResponse?.images ?? []
  const uploadedImages = await Promise.all(
    generatedImages
      .filter((image) => image.url || image.b64_json)
      .map((image) => uploadGeneratedImageToR2({ image, userId }))
  )

  if (uploadedImages.length === 0) {
    throw new Error(
      isSeedreamRequest
        ? "OpenRouter returned no images for this request"
        : "OpenAI returned no images for this request"
    )
  }

  const resolvedSize =
    openAiResponse === null
      ? data.size
      : resolveImageSize(data.size, openAiResponse.response)
  const resolvedQuality =
    openAiResponse === null
      ? null
      : resolveImageQuality(data.quality, openAiResponse.response)
  const estimatedCost = isSeedreamRequest
    ? String(SEEDREAM_IMAGE_COST * uploadedImages.length)
    : String(
        getEstimatedImageCost({
          model,
          n: uploadedImages.length,
          quality: data.quality,
          size: data.size,
        })
      )
  const totalCost =
    resolvedQuality === null
      ? estimatedCost
      : String(
          getEstimatedImageCost({
            model,
            n: uploadedImages.length,
            quality: resolvedQuality,
            size: resolvedSize,
          })
        )
  const usage =
    openAiResponse === null || resolvedQuality === null
      ? undefined
      : buildImageUsage(openAiResponse.response, {
          quality: resolvedQuality,
          size: resolvedSize,
        })

  return {
    estimatedCost,
    model,
    referenceId:
      openAiResponse === null
        ? (seedreamResponse?.referenceId ?? "")
        : String(openAiResponse.response.created ?? ""),
    resolvedQuality,
    resolvedSize,
    totalCost,
    uploadedImages,
    usage,
  }
}

export interface SubmitImageSuccess {
  generationId: string
  images: { id: string; url: string }[]
  metadata: GeneratedImageMetadata
  ok: true
  size: ImageSize
}

export interface SubmitImageError {
  message: string
  ok: false
}

interface SubmitImageOptions {
  sessionId?: string
}

export interface CreateImageGenerationSuccess {
  generationId: string
  ok: true
}

export interface CreateImageGenerationError {
  message: string
  ok: false
}

export interface UpdateImageTitleSuccess {
  ok: true
  title: string
}

export interface UpdateImageTitleError {
  message: string
  ok: false
}

export async function createImageGenerationAction(
  input: unknown
): Promise<CreateImageGenerationSuccess | CreateImageGenerationError> {
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

  const prompt = parsedInput.data.prompt.trim()
  const title = getImageTitle(parsedInput.data.title, prompt)
  const generationId = uuidv7()

  await db.insert(generations).values({
    count: parsedInput.data.n,
    id: generationId,
    status: "pending",
    title,
    type: "image",
    userId: session.user.id,
  })

  revalidatePath("/", "layout")
  revalidatePath("/images")

  return { generationId, ok: true }
}

export async function updateImageGenerationTitleAction(
  input: unknown
): Promise<UpdateImageTitleSuccess | UpdateImageTitleError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = updateImageTitleSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  const [generation] = await db
    .select({
      userId: generations.userId,
    })
    .from(generations)
    .where(eq(generations.id, parsedInput.data.sessionId))
    .limit(1)

  if (!generation || generation.userId !== session.user.id) {
    return { ok: false, message: "Unauthorized" }
  }

  const [latestImage] = await db
    .select({
      prompt: imagesTable.prompt,
    })
    .from(imagesTable)
    .where(eq(imagesTable.generationId, parsedInput.data.sessionId))
    .orderBy(desc(imagesTable.createdAt), desc(imagesTable.position))
    .limit(1)

  const title = getImageTitle(parsedInput.data.title, latestImage?.prompt ?? "")

  await db
    .update(generations)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(generations.id, parsedInput.data.sessionId))

  revalidatePath("/", "layout")
  revalidatePath(`/images/${parsedInput.data.sessionId}`)
  revalidatePath("/images")

  return { ok: true, title }
}

export async function submitImageAction(
  input: unknown,
  options: SubmitImageOptions = {}
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
    const prompt = data.prompt.trim()
    const preparedGeneration = await prepareImageGeneration(
      session.user.id,
      data
    )
    const {
      estimatedCost,
      model,
      referenceId,
      resolvedQuality,
      resolvedSize,
      totalCost,
      uploadedImages,
      usage,
    } = preparedGeneration
    const dimensions =
      resolvedSize === "auto" ? null : IMAGE_SIZE_DIMENSIONS[resolvedSize]
    const title = getImageTitle(data.title, prompt)
    const batchId = uuidv7()
    const sessionId = options.sessionId ?? uuidv7()

    if (options.sessionId) {
      await db
        .update(generations)
        .set({
          count: data.n,
          status: "completed",
          title,
          updatedAt: new Date(),
        })
        .where(eq(generations.id, sessionId))
    } else {
      await db.insert(generations).values({
        count: data.n,
        id: sessionId,
        status: "completed",
        title,
        type: "image",
        userId: session.user.id,
      })
    }

    const [generation] = await db
      .select({ createdAt: generations.createdAt, id: generations.id })
      .from(generations)
      .where(eq(generations.id, sessionId))
      .limit(1)

    const insertedImages = await db
      .insert(imagesTable)
      .values(
        uploadedImages.map((image, index) => ({
          background: data.background,
          batchId,
          count: data.n,
          estimatedCost,
          generationId: sessionId,
          inputFidelity: data.inputFidelity,
          mask: data.mask?.url ?? null,
          mode: data.mode,
          model,
          moderation: data.moderation,
          prompt,
          quality: resolvedQuality,
          referenceId,
          size: resolvedSize,
          sourceImages: data.inputImages.map((img) => img.url),
          status: "completed",
          totalCost,
          usage,
          userId: session.user.id,
          height: dimensions?.height ?? null,
          mimeType: image.mimeType,
          path: image.key,
          position: index,
          sourceUrl: image.sourceUrl,
          width: dimensions?.width ?? null,
        }))
      )
      .returning({ id: imagesTable.id })

    revalidatePath("/", "layout")
    revalidatePath(`/images/${sessionId}`)
    revalidatePath("/images")

    return {
      generationId: sessionId,
      ok: true,
      images: uploadedImages.map((image, index) => ({
        id: insertedImages[index]?.id ?? "",
        url: image.previewUrl,
      })),
      metadata: {
        background: data.background,
        cost: estimatedCost,
        count: data.n,
        createdAt: generation.createdAt.toISOString(),
        model,
        moderation: data.moderation,
        prompt,
        quality: resolvedQuality,
        size: resolvedSize,
        sourceImages: data.inputImages,
        totalCost,
      },
      size: resolvedSize,
    }
  } catch (error) {
    console.error(error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image"

    const { data } = parsedInput
    const prompt = data.prompt.trim()
    const model = resolveRequestModel(data)
    const sessionId = options.sessionId ?? uuidv7()
    const batchId = uuidv7()

    if (options.sessionId) {
      await db
        .update(generations)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(generations.id, sessionId))
    } else {
      await db.insert(generations).values({
        count: data.n,
        id: sessionId,
        status: "failed",
        title: getImageTitle(data.title, prompt),
        type: "image",
        userId: session.user.id,
      })
    }

    await db.insert(imagesTable).values(
      Array.from({ length: data.n }, (_, index) => ({
        background: data.background,
        batchId,
        count: data.n,
        error: errorMessage,
        generationId: sessionId,
        inputFidelity: data.inputFidelity,
        mask: data.mask?.url ?? null,
        mode: data.mode,
        model,
        moderation: data.moderation,
        position: index,
        prompt,
        sourceImages: data.inputImages.map((img) => img.url),
        status: "failed",
        userId: session.user.id,
      }))
    )

    revalidatePath("/", "layout")
    revalidatePath(`/images/${sessionId}`)
    revalidatePath("/images")

    return {
      ok: false,
      message: errorMessage,
    }
  }
}
