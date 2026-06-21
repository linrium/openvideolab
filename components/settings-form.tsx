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
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  atlasCloudApiKey: apiKeySchema,
  cloudflareR2AccessKeyId: apiKeySchema,
  cloudflareR2EndpointUrl: optionalUrlSchema,
  cloudflareR2SecretAccessKey: apiKeySchema,
  deepSeekApiKey: apiKeySchema,
  kieApiKey: apiKeySchema,
  openRouterApiKey: apiKeySchema,
  openAiApiKey: apiKeySchema,
})

export type SettingsValues = z.infer<typeof settingsSchema>
type KeyFieldName = keyof SettingsValues

const EMPTY_SETTINGS_VALUES: SettingsValues = {
  atlasCloudApiKey: "",
  cloudflareR2AccessKeyId: "",
  cloudflareR2EndpointUrl: "",
  cloudflareR2SecretAccessKey: "",
  deepSeekApiKey: "",
  kieApiKey: "",
  openAiApiKey: "",
  openRouterApiKey: "",
}

const fieldLabels: Record<KeyFieldName, string> = {
  atlasCloudApiKey: "Atlas Cloud API Key",
  cloudflareR2AccessKeyId: "Cloudflare R2 Access Key ID",
  cloudflareR2EndpointUrl: "Cloudflare R2 Endpoint URL",
  cloudflareR2SecretAccessKey: "Cloudflare R2 Secret Access Key",
  deepSeekApiKey: "DeepSeek API Key",
  kieApiKey: "Kie.ai API Key",
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
  const [isAtlasCloudVisible, setIsAtlasCloudVisible] = useState(false)
  const [isDeepSeekVisible, setIsDeepSeekVisible] = useState(false)
  const [isKieVisible, setIsKieVisible] = useState(false)
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
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <Tabs className="flex flex-col gap-0" value="api">
          <TabsList variant="line">
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="w-full max-w-3xl">
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
              {activeGuideSection === "cloudflare-r2" ? (
                <ApiKeyGuideCard section="cloudflare-r2" />
              ) : null}

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
                  <h2 className="font-medium text-sm">DeepSeek</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the API key used for direct DeepSeek model access.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    toggleGuideSection("deepseek")
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeGuideSection === "deepseek"
                    ? "Hide instructions"
                    : "Show instructions"}
                </Button>
              </div>
              {activeGuideSection === "deepseek" ? (
                <ApiKeyGuideCard section="deepseek" />
              ) : null}

              <form.Field
                name="deepSeekApiKey"
                validators={{
                  onBlur: ({ value }) => getFieldError("deepSeekApiKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.deepSeekApiKey}
                    </FieldLabel>
                    <FieldDescription>
                      Used for DeepSeek-powered features when you enable them
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
                        placeholder="sk-..."
                        spellCheck={false}
                        type={isDeepSeekVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsDeepSeekVisible(
                              (currentValue) => !currentValue
                            )
                          }}
                        >
                          {isDeepSeekVisible ? "Hide" : "Show"}
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
                  <h2 className="font-medium text-sm">Atlas Cloud</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the API key used for Atlas Cloud Seedance video
                    generation.
                  </p>
                </div>
              </div>

              <form.Field
                name="atlasCloudApiKey"
                validators={{
                  onBlur: ({ value }) =>
                    getFieldError("atlasCloudApiKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.atlasCloudApiKey}
                    </FieldLabel>
                    <FieldDescription>
                      Used when you select the Atlas Cloud Seedance models.
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
                        placeholder="ac_..."
                        spellCheck={false}
                        type={isAtlasCloudVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsAtlasCloudVisible(
                              (currentValue) => !currentValue
                            )
                          }}
                        >
                          {isAtlasCloudVisible ? "Hide" : "Show"}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium text-sm">Kie.ai</h2>
                  <p className="text-muted-foreground text-xs/relaxed">
                    Configure the API key used for direct Kie.ai Seedance video
                    generation.
                  </p>
                </div>
              </div>

              <form.Field
                name="kieApiKey"
                validators={{
                  onBlur: ({ value }) => getFieldError("kieApiKey", value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>
                      {fieldLabels.kieApiKey}
                    </FieldLabel>
                    <FieldDescription>
                      Used when you select the Kie.ai Seedance models.
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
                        placeholder="kie_..."
                        spellCheck={false}
                        type={isKieVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={() => {
                            setIsKieVisible((currentValue) => !currentValue)
                          }}
                        >
                          {isKieVisible ? "Hide" : "Show"}
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
              {activeGuideSection === "openrouter" ? (
                <ApiKeyGuideCard section="openrouter" />
              ) : null}

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
              {activeGuideSection === "openai" ? (
                <ApiKeyGuideCard section="openai" />
              ) : null}

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
          </div>
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
                form.setFieldValue("deepSeekApiKey", "")
                form.setFieldValue("openRouterApiKey", "")
                form.setFieldValue("openAiApiKey", "")
                setStatusMessage("All fields cleared. Save to persist changes.")
              }}
              type="button"
              variant="outline"
            >
              Clear
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardFooter>
      </form>
    </div>
  )
}
