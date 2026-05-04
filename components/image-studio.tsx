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
  type ImageSize,
  imageGenerationSchema,
} from "@/lib/image-generation"

export interface GeneratedImagesState {
  images: string[]
  size: ImageSize
}

function useImageGenerationForm(
  onGenerated: (result: GeneratedImagesState | null) => void
) {
  return useForm({
    defaultValues: IMAGE_DEFAULT_VALUES,
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

      onGenerated(null)

      const result = await submitImageAction(parsedValue.data)
      if (!result.ok) {
        toast.error("Failed to generate image", { description: result.message })
        return
      }

      onGenerated({
        images: result.images,
        size: result.size,
      })
    },
  })
}

export type ImageGenerationFormApi = ReturnType<typeof useImageGenerationForm>
export type ImageGenerationFormValues = ImageGenerationValues

export function ImageStudio() {
  const [generatedImages, setGeneratedImages] =
    useState<GeneratedImagesState | null>(null)
  const form = useImageGenerationForm(setGeneratedImages)

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <ImagePreview form={form} generatedImages={generatedImages} />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <ImageForm form={form} />
      </aside>
    </div>
  )
}
