import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ImageStudio } from "@/components/image-studio"
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

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const [generation] = await db
    .select({
      estimatedCost: generations.estimatedCost,
      createdAt: generations.createdAt,
      generationId: generations.id,
      model: generations.model,
      prompt: generations.prompt,
      title: generations.title,
      usage: generations.usage,
      userId: generations.userId,
    })
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.type, "image")))
    .limit(1)

  if (!generation || generation.userId !== session.user.id) {
    notFound()
  }

  const imageRows = await db
    .select({
      height: images.height,
      path: images.path,
      position: images.position,
      sourceUrl: images.sourceUrl,
      width: images.width,
    })
    .from(images)
    .where(eq(images.generationId, generation.generationId))
    .orderBy(asc(images.position))

  if (imageRows.length === 0) {
    notFound()
  }

  const imageUrls = (
    await Promise.all(
      imageRows.map(async (image) => {
        if (image.path) {
          return await getPresignedUrl({ key: image.path }).catch(() => "")
        }

        return image.sourceUrl ?? ""
      })
    )
  ).filter((url) => url.length > 0)

  if (imageUrls.length === 0) {
    notFound()
  }

  const firstImage = imageRows[0]
  const resolvedSize =
    generation.usage?.image?.size ??
    inferImageSize(firstImage.width, firstImage.height)
  const initialValues: ImageGenerationValues = {
    ...IMAGE_DEFAULT_VALUES,
    model: normalizeImageModel(generation.model),
    n: imageRows.length,
    prompt: generation.prompt,
    quality: generation.usage?.image?.quality ?? IMAGE_DEFAULT_VALUES.quality,
    size: resolvedSize,
    title: generation.title,
  }

  return (
    <ImageStudio
      initialGeneratedImages={{
        images: imageUrls,
        metadata: {
          cost: generation.estimatedCost,
          createdAt: generation.createdAt.toISOString(),
          model: generation.model,
          quality: initialValues.quality,
          size: resolvedSize,
        },
        size: resolvedSize,
      }}
      initialValues={initialValues}
    />
  )
}
