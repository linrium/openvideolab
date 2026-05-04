"use client"

import type { AssetGenerationFormApi } from "@/components/asset-studio"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ASSET_BACKGROUND_OPTIONS,
  ASSET_MODERATION_OPTIONS,
  ASSET_PRICING,
  ASSET_QUALITY_OPTIONS,
  ASSET_SIZE_OPTIONS,
  getEstimatedAssetCost,
  SUPPORTED_ASSET_MODEL,
} from "@/lib/asset-generation"

const MODEL_LABEL = "gpt-image-2-2026-04-21"
const LABEL_SPLIT_PATTERN = /[-x]/

const labelFromValue = (value: string) =>
  value
    .split(LABEL_SPLIT_PATTERN)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export function AssetForm({ form }: { form: AssetGenerationFormApi }) {
  return (
    <Tabs className="flex h-full min-h-0 flex-col gap-0" defaultValue="compose">
      <CardHeader
        className="sticky top-0 z-10 border-border/70 border-b bg-background"
        style={{ paddingBottom: 0 }}
      >
        <TabsList variant="line">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent className="flex min-h-0 flex-1 flex-col" value="compose">
        <div className="flex min-h-0 flex-1 flex-col">
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <FieldGroup>
              <form.Field name="model">
                {(field) => (
                  <Field>
                    <FieldLabel>Model</FieldLabel>
                    <FieldDescription>
                      This asset flow currently supports one OpenAI snapshot.
                    </FieldDescription>
                    <Select disabled value={field.state.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SUPPORTED_ASSET_MODEL}>
                          {MODEL_LABEL}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="size">
                {(field) => (
                  <Field>
                    <FieldLabel>Size</FieldLabel>
                    <FieldDescription>
                      Pick the image shape and resolution.
                    </FieldDescription>
                    <ToggleGroup
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(
                            value as (typeof ASSET_SIZE_OPTIONS)[number]
                          )
                        }
                      }}
                      type="single"
                      value={field.state.value}
                      variant="outline"
                    >
                      {ASSET_SIZE_OPTIONS.map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {option.replace("x", " × ")}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <form.Field name="quality">
                {(field) => (
                  <Field>
                    <FieldLabel>Quality</FieldLabel>
                    <FieldDescription>
                      Higher quality usually gives more detail but costs more.
                    </FieldDescription>
                    <ToggleGroup
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(
                            value as (typeof ASSET_QUALITY_OPTIONS)[number]
                          )
                        }
                      }}
                      type="single"
                      value={field.state.value}
                      variant="outline"
                    >
                      {ASSET_QUALITY_OPTIONS.map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {labelFromValue(option)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="n">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 || undefined
                    }
                  >
                    <FieldLabel>Count</FieldLabel>
                    <FieldDescription>
                      How many images to generate in one request.
                    </FieldDescription>
                    <ToggleGroup
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(Number(value))
                        }
                      }}
                      type="single"
                      value={String(field.state.value)}
                      variant="outline"
                    >
                      {["1", "2", "3", "4"].map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {option}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldError
                      errors={field.state.meta.errors.map((error) => ({
                        message: String(error),
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <FieldSeparator />

              <form.Field name="background">
                {(field) => (
                  <Field>
                    <FieldLabel>Background</FieldLabel>
                    <FieldDescription>
                      Choose whether the image background should be automatic,
                      solid, or transparent.
                    </FieldDescription>
                    <ToggleGroup
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(
                            value as (typeof ASSET_BACKGROUND_OPTIONS)[number]
                          )
                        }
                      }}
                      type="single"
                      value={field.state.value}
                      variant="outline"
                    >
                      {ASSET_BACKGROUND_OPTIONS.map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {labelFromValue(option)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>

              <form.Field name="moderation">
                {(field) => (
                  <Field>
                    <FieldLabel>Moderation</FieldLabel>
                    <FieldDescription>
                      Choose how strict safety filtering should be.
                    </FieldDescription>
                    <ToggleGroup
                      onValueChange={(value) => {
                        if (value) {
                          field.handleChange(
                            value as (typeof ASSET_MODERATION_OPTIONS)[number]
                          )
                        }
                      }}
                      type="single"
                      value={field.state.value}
                      variant="outline"
                    >
                      {ASSET_MODERATION_OPTIONS.map((option) => (
                        <ToggleGroupItem key={option} value={option}>
                          {labelFromValue(option)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-2 border-border/70 border-t bg-background px-4 pt-4 pb-4 text-left sm:px-5">
            <form.Subscribe
              selector={(state) => ({
                n: state.values.n,
                quality: state.values.quality,
                size: state.values.size,
              })}
            >
              {({ n, quality, size }) => (
                <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Images</span>
                      <span>{n}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated cost</span>
                      <span className="tabular-nums">
                        $
                        {getEstimatedAssetCost({ n, quality, size }).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </form.Subscribe>
          </CardFooter>
        </div>
      </TabsContent>

      <TabsContent value="pricing">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
          <div className="space-y-1">
            <p className="font-medium text-xs">{MODEL_LABEL}</p>
            <p className="text-muted-foreground text-xs/relaxed">
              Pricing per generated image.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr className="border-border/70 border-b">
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    Quality
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">
                    1024 × 1024
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">
                    1024 × 1536
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">
                    1536 × 1024
                  </th>
                </tr>
              </thead>
              <tbody>
                {ASSET_QUALITY_OPTIONS.map((quality) => (
                  <tr
                    className="border-border/60 border-b last:border-b-0"
                    key={quality}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {labelFromValue(quality)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${ASSET_PRICING[quality]["1024x1024"].toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${ASSET_PRICING[quality]["1024x1536"].toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${ASSET_PRICING[quality]["1536x1024"].toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
