"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import z from "zod/v4"
import { saveUserSettingsAction } from "@/app/actions/save-user-settings"
import {
  ApiKeyGuideCard,
  type ApiKeyGuideSection,
} from "@/components/api-key-guide-card"
import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

const apiKeySchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || value.length >= 20,
    "API keys must be at least 20 characters or left blank."
  )

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || z.url().safeParse(value).success,
    "Enter a valid URL or leave the field blank."
  )

const settingsSchema = z.object({
  cloudflareR2AccessKeyId: apiKeySchema,
  cloudflareR2EndpointUrl: optionalUrlSchema,
  cloudflareR2SecretAccessKey: apiKeySchema,
  openRouterApiKey: apiKeySchema,
  openAiApiKey: apiKeySchema,
})

export type SettingsValues = z.infer<typeof settingsSchema>
type KeyFieldName = keyof SettingsValues

const EMPTY_SETTINGS_VALUES: SettingsValues = {
  cloudflareR2AccessKeyId: "",
  cloudflareR2EndpointUrl: "",
  cloudflareR2SecretAccessKey: "",
  openAiApiKey: "",
  openRouterApiKey: "",
}

const fieldLabels: Record<KeyFieldName, string> = {
  cloudflareR2AccessKeyId: "Cloudflare R2 Access Key ID",
  cloudflareR2EndpointUrl: "Cloudflare R2 Endpoint URL",
  cloudflareR2SecretAccessKey: "Cloudflare R2 Secret Access Key",
  openAiApiKey: "OpenAI API Key",
  openRouterApiKey: "OpenRouter API Key",
}

const getFieldError = (fieldName: KeyFieldName, value: string) => {
  const fieldSchema = settingsSchema.shape[fieldName]
  const result = fieldSchema.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

interface SettingsFormProps {
  initialValues?: SettingsValues
}

export function SettingsForm({
  initialValues = EMPTY_SETTINGS_VALUES,
}: SettingsFormProps) {
  const [isOpenRouterVisible, setIsOpenRouterVisible] = useState(false)
  const [isOpenAiVisible, setIsOpenAiVisible] = useState(false)
  const [isR2AccessKeyVisible, setIsR2AccessKeyVisible] = useState(false)
  const [isR2SecretVisible, setIsR2SecretVisible] = useState(false)
  const [activeGuideSection, setActiveGuideSection] =
    useState<ApiKeyGuideSection | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const toggleGuideSection = (section: ApiKeyGuideSection) => {
    setActiveGuideSection((currentValue) =>
      currentValue === section ? null : section
    )
  }

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const result = settingsSchema.safeParse(value)
      if (!result.success) {
        setStatusMessage("Fix the validation errors before saving.")
        return
      }

      const saveResult = await saveUserSettingsAction(result.data)
      if (!saveResult.ok) {
        setStatusMessage(saveResult.message)
        return
      }

      setStatusMessage("Settings saved.")
    },
  })

  return (
    <div className="grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:items-start">
      <div className="flex min-h-0 flex-col rounded-lg border border-border/70 bg-background">
        <CardHeader className="border-border/70 border-b px-4 py-4 sm:px-5">
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Save provider keys to your account settings for use across sessions.
          </CardDescription>
        </CardHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium text-sm">Cloudflare R2</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the R2 credentials used for S3-compatible storage
                    access.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    toggleGuideSection("cloudflare-r2")
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeGuideSection === "cloudflare-r2"
                    ? "Hide instructions"
                    : "Show instructions"}
                </Button>
              </div>

              <form.Field
                name="cloudflareR2EndpointUrl"
                validators={{
                  onBlur: ({ value }) =>
                    getFieldError("cloudflareR2EndpointUrl", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.cloudflareR2EndpointUrl}
                    </FieldLabel>
                    <FieldDescription>
                      Use your S3-compatible R2 endpoint, for example
                      `https://&lt;accountid&gt;.r2.cloudflarestorage.com`.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        autoComplete="off"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setStatusMessage(null)
                        }}
                        placeholder="https://<accountid>.r2.cloudflarestorage.com"
                        spellCheck={false}
                        type="url"
                        value={field.state.value}
                      />
                    </InputGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((error) => ({
                        message: String(error),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="cloudflareR2AccessKeyId"
                validators={{
                  onBlur: ({ value }) =>
                    getFieldError("cloudflareR2AccessKeyId", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.cloudflareR2AccessKeyId}
                    </FieldLabel>
                    <FieldDescription>
                      Use the access key ID from your Cloudflare R2 API token.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        autoComplete="off"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setStatusMessage(null)
                        }}
                        placeholder="9c4f...access-key-id"
                        spellCheck={false}
                        type={isR2AccessKeyVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsR2AccessKeyVisible(
                              (currentValue) => !currentValue
                            )
                          }}
                        >
                          {isR2AccessKeyVisible ? "Hide" : "Show"}
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

              <form.Field
                name="cloudflareR2SecretAccessKey"
                validators={{
                  onBlur: ({ value }) =>
                    getFieldError("cloudflareR2SecretAccessKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.cloudflareR2SecretAccessKey}
                    </FieldLabel>
                    <FieldDescription>
                      Use the secret access key paired with your R2 access key
                      ID.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        autoComplete="off"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setStatusMessage(null)
                        }}
                        placeholder="very-secret-r2-key"
                        spellCheck={false}
                        type={isR2SecretVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsR2SecretVisible(
                              (currentValue) => !currentValue
                            )
                          }}
                        >
                          {isR2SecretVisible ? "Hide" : "Show"}
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

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium text-sm">OpenRouter</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the API key used for OpenRouter generation
                    requests.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    toggleGuideSection("openrouter")
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeGuideSection === "openrouter"
                    ? "Hide instructions"
                    : "Show instructions"}
                </Button>
              </div>

              <form.Field
                name="openRouterApiKey"
                validators={{
                  onBlur: ({ value }) =>
                    getFieldError("openRouterApiKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.openRouterApiKey}
                    </FieldLabel>
                    <FieldDescription>
                      Used for OpenRouter-backed generation requests in this
                      app.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        autoComplete="off"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setStatusMessage(null)
                        }}
                        placeholder="sk-or-v1-..."
                        spellCheck={false}
                        type={isOpenRouterVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsOpenRouterVisible(
                              (currentValue) => !currentValue
                            )
                          }}
                        >
                          {isOpenRouterVisible ? "Hide" : "Show"}
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

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium text-sm">OpenAI</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the API key used for OpenAI-powered features.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    toggleGuideSection("openai")
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeGuideSection === "openai"
                    ? "Hide instructions"
                    : "Show instructions"}
                </Button>
              </div>

              <form.Field
                name="openAiApiKey"
                validators={{
                  onBlur: ({ value }) => getFieldError("openAiApiKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.openAiApiKey}
                    </FieldLabel>
                    <FieldDescription>
                      Used for OpenAI-powered features when you enable them
                      later.
                    </FieldDescription>
                    <InputGroup>
                      <InputGroupInput
                        aria-invalid={
                          field.state.meta.errors.length > 0 || undefined
                        }
                        autoComplete="off"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setStatusMessage(null)
                        }}
                        placeholder="sk-proj-..."
                        spellCheck={false}
                        type={isOpenAiVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsOpenAiVisible((currentValue) => !currentValue)
                          }}
                        >
                          {isOpenAiVisible ? "Hide" : "Show"}
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
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex items-center justify-between gap-3 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
            <p className="text-muted-foreground text-xs">
              {statusMessage ??
                "Leave a field blank if you do not want to store a key."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  form.setFieldValue("cloudflareR2AccessKeyId", "")
                  form.setFieldValue("cloudflareR2EndpointUrl", "")
                  form.setFieldValue("cloudflareR2SecretAccessKey", "")
                  form.setFieldValue("openRouterApiKey", "")
                  form.setFieldValue("openAiApiKey", "")
                  setStatusMessage(
                    "All fields cleared. Save to persist changes."
                  )
                }}
                type="button"
                variant="outline"
              >
                Clear
              </Button>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Saving..." : "Save Keys"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </CardFooter>
        </form>
      </div>

      {activeGuideSection ? (
        <ApiKeyGuideCard section={activeGuideSection} />
      ) : null}
    </div>
  )
}
