"use client"

import { useForm } from "@tanstack/react-form"
import z from "zod/v4"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const storyboardSchema = z.object({
  prompt: z.string().trim().min(1, "Storyboard prompt is required"),
})

const DEFAULT_VALUES = {
  prompt: "",
}

export function StoryboardForm() {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onSubmit: ({ value }) => {
        const result = storyboardSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((issue) => issue.message).join(", ")
        }
      },
    },
    onSubmit: async () => undefined,
  })

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
              <form.Field name="prompt">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      Storyboard prompt
                    </FieldLabel>
                    <FieldDescription>
                      Describe the shot flow, structure, and key beats you want
                      to outline.
                    </FieldDescription>
                    <Textarea
                      aria-invalid={
                        field.state.meta.errors.length > 0 || undefined
                      }
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

          <CardFooter className="border-border/70 border-t bg-background px-4 py-4 sm:px-5">
            <Button className="w-full" disabled type="submit">
              Create
            </Button>
          </CardFooter>
        </form>
      </TabsContent>
    </Tabs>
  )
}
