"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { toast } from "sonner"
import { submitImageAction } from "@/app/actions/generate-image"
import { ImageForm } from "@/components/image-form"
import { ImagePreview } from "@/components/image-preview"
import {
  IMAGE_DEFAULT_VALUES,
  type ImageGenerationValues,
  type ImageQuality,
  type ImageSize,
  imageGenerationSchema,
} from "@/lib/image-generation"

export interface GeneratedImageMetadata {
  cost: string | null
  createdAt: string | null
  model: string
  quality: ImageQuality | null
  size: ImageSize
  totalCost: string | null
}

export interface GeneratedImagesState {
  images: string[]
  metadata: GeneratedImageMetadata
  size: ImageSize
}

function useImageGenerationForm(
  onGenerated: (result: GeneratedImagesState | null) => void,
  options: {
    defaultValues?: ImageGenerationValues
    readOnly?: boolean
  } = {}
) {
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

      onGenerated(null)

      const result = await submitImageAction(parsedValue.data)
      if (!result.ok) {
        toast.error("Failed to generate image", { description: result.message })
        return
      }

      onGenerated({
        images: result.images,
        metadata: result.metadata,
        size: result.size,
      })
    },
  })
}

export type ImageGenerationFormApi = ReturnType<typeof useImageGenerationForm>
export type ImageGenerationFormValues = ImageGenerationValues

interface ImageStudioProps {
  initialGeneratedImages?: GeneratedImagesState | null
  initialValues?: ImageGenerationValues
  readOnly?: boolean
}

export function ImageStudio({
  initialGeneratedImages = null,
  initialValues = IMAGE_DEFAULT_VALUES,
  readOnly = false,
}: ImageStudioProps = {}) {
  const [generatedImages, setGeneratedImages] = useState<
    GeneratedImagesState[]
  >(initialGeneratedImages ? [initialGeneratedImages] : [])

  const handleGenerated = (result: GeneratedImagesState | null) => {
    if (result === null) {
      return
    }
    setGeneratedImages((prev) => [result, ...prev])
  }

  const form = useImageGenerationForm(handleGenerated, {
    defaultValues: initialValues,
    readOnly,
  })

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <section className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <ImagePreview
          form={form}
          generatedImages={generatedImages}
          readOnly={readOnly}
        />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <ImageForm
          form={form}
          generatedImages={generatedImages}
          readOnly={readOnly}
        />
      </aside>
    </div>
  )
}
