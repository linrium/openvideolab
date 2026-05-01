"use client"

import { useForm } from "@tanstack/react-form"
import { useEffect, useState } from "react"
import z from "zod/v4"
import { ApiKeyGuideCard } from "@/components/api-key-guide-card"
import { Button } from "@/components/ui/button"
import {
  Card,
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

const SETTINGS_STORAGE_KEY = "shortdrama.api-settings"

const apiKeySchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || value.length >= 20,
    "API keys must be at least 20 characters or left blank."
  )

const settingsSchema = z.object({
  cloudflareR2AccessKeyId: apiKeySchema,
  cloudflareR2SecretAccessKey: apiKeySchema,
  openRouterApiKey: apiKeySchema,
  openAiApiKey: apiKeySchema,
})

type SettingsValues = z.infer<typeof settingsSchema>
type KeyFieldName = keyof SettingsValues

const fieldLabels: Record<KeyFieldName, string> = {
  cloudflareR2AccessKeyId: "Cloudflare R2 Access Key ID",
  cloudflareR2SecretAccessKey: "Cloudflare R2 Secret Access Key",
  openAiApiKey: "OpenAI API Key",
  openRouterApiKey: "OpenRouter API Key",
}

const getFieldError = (fieldName: KeyFieldName, value: string) => {
  const fieldSchema = settingsSchema.shape[fieldName]
  const result = fieldSchema.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

const readStoredSettings = (): SettingsValues => {
  if (typeof window === "undefined") {
    return {
      cloudflareR2AccessKeyId: "",
      cloudflareR2SecretAccessKey: "",
      openAiApiKey: "",
      openRouterApiKey: "",
    }
  }

  const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!storedValue) {
    return {
      cloudflareR2AccessKeyId: "",
      cloudflareR2SecretAccessKey: "",
      openAiApiKey: "",
      openRouterApiKey: "",
    }
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown
    const result = settingsSchema.safeParse(parsedValue)
    if (result.success) {
      return result.data
    }
  } catch {
    // Ignore malformed local storage payloads and fall back to empty values.
  }

  return {
    cloudflareR2AccessKeyId: "",
    cloudflareR2SecretAccessKey: "",
    openAiApiKey: "",
    openRouterApiKey: "",
  }
}

export function SettingsForm() {
  const [isOpenRouterVisible, setIsOpenRouterVisible] = useState(false)
  const [isOpenAiVisible, setIsOpenAiVisible] = useState(false)
  const [isR2AccessKeyVisible, setIsR2AccessKeyVisible] = useState(false)
  const [isR2SecretVisible, setIsR2SecretVisible] = useState(false)
  const [isGuideVisible, setIsGuideVisible] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      cloudflareR2AccessKeyId: "",
      cloudflareR2SecretAccessKey: "",
      openAiApiKey: "",
      openRouterApiKey: "",
    } satisfies SettingsValues,
    onSubmit: ({ value }) => {
      const result = settingsSchema.safeParse(value)
      if (!result.success) {
        setStatusMessage("Fix the validation errors before saving.")
        return
      }

      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(result.data)
      )
      setStatusMessage("Settings saved to this browser.")
    },
  })

  useEffect(() => {
    const storedSettings = readStoredSettings()
    form.setFieldValue(
      "cloudflareR2AccessKeyId",
      storedSettings.cloudflareR2AccessKeyId
    )
    form.setFieldValue(
      "cloudflareR2SecretAccessKey",
      storedSettings.cloudflareR2SecretAccessKey
    )
    form.setFieldValue("openRouterApiKey", storedSettings.openRouterApiKey)
    form.setFieldValue("openAiApiKey", storedSettings.openAiApiKey)
  }, [form])

  return (
    <div className="grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:items-start">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription className="flex flex-col gap-3">
            <span>
              Save provider keys for this browser session. Keys are stored
              locally on this device until you clear them.
            </span>
            <div>
              <Button
                onClick={() => {
                  setIsGuideVisible((currentValue) => !currentValue)
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {isGuideVisible
                  ? "Hide key instructions"
                  : "How to get API keys"}
              </Button>
            </div>
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <CardContent>
            <FieldGroup>
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

          <CardFooter className="flex items-center justify-between gap-3 pt-6">
            <p className="text-muted-foreground text-xs">
              {statusMessage ??
                "Leave a field blank if you do not want to store a key."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  form.setFieldValue("cloudflareR2AccessKeyId", "")
                  form.setFieldValue("cloudflareR2SecretAccessKey", "")
                  form.setFieldValue("openRouterApiKey", "")
                  form.setFieldValue("openAiApiKey", "")
                  window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
                  setStatusMessage("Saved keys cleared from this browser.")
                }}
                type="button"
                variant="outline"
              >
                Clear
              </Button>
              <Button type="submit">Save Keys</Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {isGuideVisible ? <ApiKeyGuideCard /> : null}
    </div>
  )
}
