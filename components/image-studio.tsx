"use client"

import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  createImageGenerationAction,
  submitImageAction,
  updateImageGenerationTitleAction,
} from "@/app/actions/generate-image"
import { ImageForm } from "@/components/image-form"
import { ImagePreview } from "@/components/image-preview"
import {
  IMAGE_DEFAULT_VALUES,
  type ImageGenerationValues,
  type ImageQuality,
  type ImageSize,
  imageGenerationSchema,
} from "@/lib/image-generation"

const PENDING_IMAGE_GENERATION_KEY_PREFIX = "pending-image-generation:"

export interface GeneratedImageMetadata {
  cost: string | null
  createdAt: string | null
  model: string
  prompt?: string | null
  quality: ImageQuality | null
  size: ImageSize
  totalCost: string | null
}

export interface GeneratedImagesState {
  error?: string | null
  images: string[]
  metadata: GeneratedImageMetadata
  size: ImageSize
}

function useImageGenerationForm(
  onGenerated: (result: GeneratedImagesState | null) => void,
  onError: (message: string) => void,
  options: {
    defaultValues?: ImageGenerationValues
    readOnly?: boolean
    sessionId?: string
  } = {}
) {
  const router = useRouter()

  return useForm({
    defaultValues: options.defaultValues ?? IMAGE_DEFAULT_VALUES,
    validators: {
      onSubmit: ({ value }) => {
        const result = imageGenerationSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((issue) => issue.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {
      const parsedValue = imageGenerationSchema.safeParse(value)
      if (!parsedValue.success) {
        toast.error("Fix the form errors before generating")
        return
      }

      if (options.readOnly) {
        return
      }

      if (!options.sessionId) {
        const createResult = await createImageGenerationAction(parsedValue.data)
        if (!createResult.ok) {
          toast.error("Failed to create image session", {
            description: createResult.message,
          })
          return
        }

        window.sessionStorage.setItem(
          `${PENDING_IMAGE_GENERATION_KEY_PREFIX}${createResult.generationId}`,
          JSON.stringify(parsedValue.data)
        )
        router.push(`/images/${createResult.generationId}?generate=1`)
        router.refresh()
        return
      }

      onGenerated(null)

      const result = await submitImageAction(parsedValue.data, {
        sessionId: options.sessionId,
      })
      if (!result.ok) {
        toast.error("Failed to generate image", { description: result.message })
        onError(result.message)
        return
      }

      onGenerated({
        images: result.images,
        metadata: result.metadata,
        size: result.size,
      })
      router.refresh()
    },
  })
}

export type ImageGenerationFormApi = ReturnType<typeof useImageGenerationForm>
export type ImageGenerationFormValues = ImageGenerationValues

interface ImageStudioProps {
  autoGenerate?: boolean
  initialGeneratedImages?: GeneratedImagesState[]
  initialValues?: ImageGenerationValues
  readOnly?: boolean
  sessionId?: string
}

export function ImageStudio({
  autoGenerate = false,
  initialGeneratedImages = [],
  initialValues = IMAGE_DEFAULT_VALUES,
  readOnly = false,
  sessionId,
}: ImageStudioProps = {}) {
  const router = useRouter()
  const [generatedImages, setGeneratedImages] = useState<
    GeneratedImagesState[]
  >(initialGeneratedImages)
  const [generationError, setGenerationError] = useState<{
    message: string
    createdAt: string
  } | null>(null)
  const savedTitleRef = useRef(initialValues.title)
  const hasAttemptedAutoGenerationRef = useRef(false)

  const handleGenerated = (result: GeneratedImagesState | null) => {
    if (result === null) {
      setGenerationError(null)
      return
    }
    setGeneratedImages((prev) => [result, ...prev])
  }

  const handleError = (message: string) => {
    setGenerationError({ message, createdAt: new Date().toISOString() })
  }

  const handleTitleBlur = async (title: string) => {
    if (!sessionId || readOnly) {
      return
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle === savedTitleRef.current) {
      return
    }

    const result = await updateImageGenerationTitleAction({
      sessionId,
      title: trimmedTitle,
    })

    if (!result.ok) {
      toast.error("Failed to save image title", {
        description: result.message,
      })
      return
    }

    savedTitleRef.current = result.title
    router.refresh()
  }

  const form = useImageGenerationForm(handleGenerated, handleError, {
    defaultValues: initialValues,
    readOnly,
    sessionId,
  })

  useEffect(() => {
    savedTitleRef.current = initialValues.title
  }, [initialValues.title])

  useEffect(() => {
    if (
      !(autoGenerate && sessionId) ||
      readOnly ||
      generatedImages.length > 0 ||
      hasAttemptedAutoGenerationRef.current
    ) {
      return
    }

    const pendingGeneration = window.sessionStorage.getItem(
      `${PENDING_IMAGE_GENERATION_KEY_PREFIX}${sessionId}`
    )
    if (!pendingGeneration) {
      return
    }

    hasAttemptedAutoGenerationRef.current = true

    const parsedGeneration = imageGenerationSchema.safeParse(
      JSON.parse(pendingGeneration)
    )
    if (!parsedGeneration.success) {
      window.sessionStorage.removeItem(
        `${PENDING_IMAGE_GENERATION_KEY_PREFIX}${sessionId}`
      )
      toast.error("Failed to restore pending image generation")
      return
    }

    form.reset(parsedGeneration.data)

    const submitPendingGeneration = async () => {
      try {
        await form.handleSubmit()
      } finally {
        window.sessionStorage.removeItem(
          `${PENDING_IMAGE_GENERATION_KEY_PREFIX}${sessionId}`
        )
      }
    }

    submitPendingGeneration()
  }, [autoGenerate, form, generatedImages.length, readOnly, sessionId])

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <section className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <ImagePreview
          form={form}
          generatedImages={generatedImages}
          generationError={generationError}
          readOnly={readOnly}
        />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:border-t-0 lg:border-l xl:max-w-lg">
        <ImageForm
          form={form}
          generatedImages={generatedImages}
          onTitleBlur={handleTitleBlur}
          readOnly={readOnly}
        />
      </aside>
    </div>
  )
}
