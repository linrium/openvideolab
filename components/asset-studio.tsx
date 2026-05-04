"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { toast } from "sonner"
import { submitAssetAction } from "@/app/actions/generate-asset"
import { AssetForm } from "@/components/asset-form"
import { AssetPreview } from "@/components/asset-preview"
import {
  ASSET_DEFAULT_VALUES,
  type AssetGenerationValues,
  type AssetSize,
  assetGenerationSchema,
} from "@/lib/asset-generation"

export interface GeneratedAssetsState {
  images: string[]
  size: AssetSize
}

function useAssetGenerationForm(
  onGenerated: (result: GeneratedAssetsState | null) => void
) {
  return useForm({
    defaultValues: ASSET_DEFAULT_VALUES,
    validators: {
      onSubmit: ({ value }) => {
        const result = assetGenerationSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((issue) => issue.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {
      const parsedValue = assetGenerationSchema.safeParse(value)
      if (!parsedValue.success) {
        toast.error("Fix the form errors before generating")
        return
      }

      onGenerated(null)

      const result = await submitAssetAction(parsedValue.data)
      if (!result.ok) {
        toast.error("Failed to generate asset", { description: result.message })
        return
      }

      onGenerated({
        images: result.images,
        size: result.size,
      })
    },
  })
}

export type AssetGenerationFormApi = ReturnType<typeof useAssetGenerationForm>
export type AssetGenerationFormValues = AssetGenerationValues

export function AssetStudio() {
  const [generatedAssets, setGeneratedAssets] =
    useState<GeneratedAssetsState | null>(null)
  const form = useAssetGenerationForm(setGeneratedAssets)

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <AssetPreview form={form} generatedAssets={generatedAssets} />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        <AssetForm form={form} />
      </aside>
    </div>
  )
}
