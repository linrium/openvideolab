"use client"

import { useState } from "react"
import { StoryboardForm } from "@/components/storyboard-form"
import { StoryboardPreview } from "@/components/storyboard-preview"
import {
  STORYBOARD_DEFAULT_VALUES,
  type StoryboardAnalysis,
  type StoryboardValues,
} from "@/lib/storyboard"

interface StoryboardStudioProps {
  initialAnalysis?: StoryboardAnalysis | null
  initialValues?: StoryboardValues
  readOnly?: boolean
}

export function StoryboardStudio({
  initialAnalysis = null,
  initialValues = STORYBOARD_DEFAULT_VALUES,
  readOnly = false,
}: StoryboardStudioProps) {
  const [analysis, setAnalysis] = useState<StoryboardAnalysis | null>(
    initialAnalysis
  )

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <section className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <StoryboardPreview analysis={analysis} />
      </section>

      <aside className="h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:border-t-0 lg:border-l xl:max-w-lg">
        <StoryboardForm
          initialValues={initialValues}
          onGenerated={setAnalysis}
          readOnly={readOnly}
        />
      </aside>
    </div>
  )
}
