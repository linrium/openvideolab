import { and, asc, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import {
  type GeneratedImagesState,
  ImageStudio,
} from "@/components/image-studio"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { auth } from "@/lib/auth"
import {
  IMAGE_DEFAULT_VALUES,
  type ImageGenerationValues,
  type ImageSize,
  SUPPORTED_IMAGE_MODEL,
} from "@/lib/image-generation"
import { getPresignedUrl } from "@/lib/r2"

interface ImagePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ generate?: string }>
}

function inferImageSize(
  width: number | null,
  height: number | null
): ImageSize {
  if (width == null || height == null) {
    return "auto"
  }

  if (width === 1024 && height === 1536) {
    return "1024x1536"
  }

  if (width === 1536 && height === 1024) {
    return "1536x1024"
  }

  return width === 1024 && height === 1024 ? "1024x1024" : "auto"
}

function normalizeImageModel(value: string): ImageGenerationValues["model"] {
  return value === SUPPORTED_IMAGE_MODEL
    ? SUPPORTED_IMAGE_MODEL
    : IMAGE_DEFAULT_VALUES.model
}

type ImageRow = Awaited<ReturnType<typeof fetchImageRows>>[number]

async function fetchImageRows(generationId: string) {
  return db
    .select({
      batchId: images.batchId,
      createdAt: images.createdAt,
      error: images.error,
      estimatedCost: images.estimatedCost,
      height: images.height,
      model: images.model,
      path: images.path,
      position: images.position,
      prompt: images.prompt,
      quality: images.quality,
      referenceId: images.referenceId,
      size: images.size,
      sourceUrl: images.sourceUrl,
      status: images.status,
      totalCost: images.totalCost,
      width: images.width,
    })
    .from(images)
    .where(eq(images.generationId, generationId))
    .orderBy(desc(images.createdAt), asc(images.position))
}

function buildBatchMetadata(image: ImageRow, resolvedSize: ImageSize) {
  return {
    cost: image.estimatedCost,
    createdAt: image.createdAt.toISOString(),
    model: image.model,
    quality: image.quality,
    size: resolvedSize,
    totalCost: image.totalCost,
  }
}

async function resolveImageUrl(image: ImageRow): Promise<string> {
  if (image.path) {
    return getPresignedUrl({ key: image.path }).catch(() => "")
  }
  return image.sourceUrl ?? ""
}

async function buildGeneratedBatches(
  imageRows: ImageRow[]
): Promise<GeneratedImagesState[]> {
  const batchMap = new Map<string, GeneratedImagesState>()

  for (const image of imageRows) {
    const isFailed = image.status === "failed"
    const resolvedSize = image.size ?? inferImageSize(image.width, image.height)
    const existingBatch = batchMap.get(image.batchId)

    if (existingBatch) {
      if (!isFailed) {
        const imageUrl = await resolveImageUrl(image)
        if (imageUrl) {
          existingBatch.images.push(imageUrl)
        }
      }
      continue
    }

    if (isFailed) {
      batchMap.set(image.batchId, {
        error: image.error ?? "Generation failed",
        images: [],
        metadata: buildBatchMetadata(image, resolvedSize),
        size: resolvedSize,
      })
      continue
    }

    const imageUrl = await resolveImageUrl(image)
    if (imageUrl) {
      batchMap.set(image.batchId, {
        images: [imageUrl],
        metadata: buildBatchMetadata(image, resolvedSize),
        size: resolvedSize,
      })
    }
  }

  return Array.from(batchMap.values())
}

export default async function ImagePage({
  params,
  searchParams,
}: ImagePageProps) {
  const { id } = await params
  const { generate } = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const [generation] = await db
    .select({
      count: generations.count,
      generationId: generations.id,
      title: generations.title,
      userId: generations.userId,
    })
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.type, "image")))
    .limit(1)

  if (!generation || generation.userId !== session.user.id) {
    notFound()
  }

  const imageRows = await fetchImageRows(generation.generationId)
  const generatedBatches = await buildGeneratedBatches(imageRows)

  const latestBatch = imageRows[0]
  const initialValues: ImageGenerationValues = {
    ...IMAGE_DEFAULT_VALUES,
    model: normalizeImageModel(
      latestBatch?.model || IMAGE_DEFAULT_VALUES.model
    ),
    n: generation.count,
    prompt: latestBatch?.prompt || "",
    quality: latestBatch?.quality ?? IMAGE_DEFAULT_VALUES.quality,
    size:
      latestBatch?.size ??
      generatedBatches[0]?.size ??
      IMAGE_DEFAULT_VALUES.size,
    title: generation.title,
  }

  return (
    <ImageStudio
      autoGenerate={generate === "1"}
      initialGeneratedImages={generatedBatches}
      initialValues={initialValues}
      sessionId={generation.generationId}
    />
  )
}
