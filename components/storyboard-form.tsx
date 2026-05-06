"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { toast } from "sonner"
import { analyzeStoryboardAction } from "@/app/actions/analyze-storyboard"
import { fetchStoryboardReadingAction } from "@/app/actions/fetch-storyboard-reading"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  STORYBOARD_DEFAULT_VALUES,
  type StoryboardAnalysis,
  type StoryboardValues,
  sourceUrlSchema,
  storyboardSchema,
} from "@/lib/storyboard"

export function StoryboardForm({
  initialValues = STORYBOARD_DEFAULT_VALUES,
  onGenerated,
  readOnly = false,
}: {
  initialValues?: StoryboardValues
  onGenerated: (analysis: StoryboardAnalysis) => void
  readOnly?: boolean
}) {
  const [isFetchingReading, setIsFetchingReading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = storyboardSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((issue) => issue.message).join(", ")
        }
      },
    },
    onSubmit: async ({ value }) => {
      const parsedValue = storyboardSchema.safeParse(value)
      if (!parsedValue.success) {
        toast.error("Fix the form errors before creating")
        return
      }

      if (readOnly) {
        return
      }

      setIsAnalyzing(true)
      try {
        const result = await analyzeStoryboardAction(parsedValue.data)
        if (!result.ok) {
          toast.error("Failed to analyze storyboard", {
            description: result.message,
          })
          return
        }

        onGenerated(result.analysis)
        toast.success("Storyboard analysis ready")
      } finally {
        setIsAnalyzing(false)
      }
    },
  })

  const handleFetchReading = async () => {
    const sourceUrl = form.state.values.sourceUrl.trim()
    if (!sourceUrl) {
      toast.error("Enter a source URL first")
      return
    }

    if (readOnly) {
      return
    }

    setIsFetchingReading(true)
    try {
      const result = await fetchStoryboardReadingAction({ url: sourceUrl })
      if (!result.ok) {
        toast.error("Failed to fetch storyboard text", {
          description: result.message,
        })
        return
      }

      form.setFieldValue("prompt", result.content)
      toast.success("Imported storyboard text")
    } finally {
      setIsFetchingReading(false)
    }
  }

  const promptLineCount = Math.max(
    1,
    form.state.values.prompt.split("\n").length
  )

  return (
    <Tabs className="flex h-full min-h-0 flex-col gap-0" defaultValue="compose">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <TabsList variant="line">
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent className="flex min-h-0 flex-1 flex-col" value="compose">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <form.Field name="title">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <FieldDescription>
                      Optional. Leave blank to derive a title automatically.
                    </FieldDescription>
                    <Input
                      disabled={readOnly}
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value)
                      }}
                      placeholder="Name this storyboard"
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="panelCount">
                {(field) => (
                  <Field>
                    <FieldLabel>Panels per page</FieldLabel>
                    <FieldDescription>
                      Each generated page prompt will use this exact number of
                      panels.
                    </FieldDescription>
                    <ToggleGroup
                      disabled={readOnly}
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(Number(value))
                        }
                      }}
                      type="single"
                      value={String(field.state.value)}
                      variant="outline"
                    >
                      {["4", "5", "6"].map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {option}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field
                name="sourceUrl"
                validators={{
                  onBlur: ({ value }) => {
                    const result = sourceUrlSchema.safeParse(value)
                    if (!result.success) {
                      return result.error.issues
                        .map((issue) => issue.message)
                        .join(", ")
                    }
                  },
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Source URL</FieldLabel>
                    <FieldDescription>
                      Paste a page URL to import text from its `.reading`
                      section.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        disabled={readOnly}
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                        }}
                        placeholder="https://example.com/story"
                        spellCheck={false}
                        type="url"
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            readOnly ||
                            isFetchingReading ||
                            !field.state.value.trim()
                          }
                          onClick={handleFetchReading}
                          size="sm"
                          type="button"
                        >
                          {isFetchingReading ? "Fetching…" : "Fetch"}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((error) => ({
                        message: String(error),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="prompt">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Content</FieldLabel>
                    <FieldDescription>
                      Describe the shot flow, structure, and key beats you want
                      to outline.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupTextarea
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        className="min-h-[240px]"
                        disabled={readOnly}
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                        }}
                        placeholder="e.g. Opening wide shot, then a close-up on the product, followed by a split-screen transition…"
                        rows={12}
                        spellCheck={false}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="block-end" className="border-t">
                        <InputGroupText>
                          {promptLineCount} line
                          {promptLineCount === 1 ? "" : "s"}
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((error) => ({
                        message: String(error),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </CardContent>

          {readOnly ? null : (
            <CardFooter className="border-border/70 border-t bg-background px-4 py-4 sm:px-5">
              <Button className="w-full" disabled={isAnalyzing} type="submit">
                {isAnalyzing ? "Creating…" : "Create"}
              </Button>
            </CardFooter>
          )}
        </form>
      </TabsContent>
    </Tabs>
  )
}
