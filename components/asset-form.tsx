"use client"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
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

const GPT_IMAGE_2_PRICING = [
  {
    quality: "Low",
    square: "$0.006",
    portrait: "$0.005",
    landscape: "$0.005",
  },
  {
    quality: "Medium",
    square: "$0.053",
    portrait: "$0.041",
    landscape: "$0.041",
  },
  {
    quality: "High",
    square: "$0.211",
    portrait: "$0.165",
    landscape: "$0.165",
  },
] as const

export function AssetForm() {
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
              <Field>
                <FieldLabel>Model</FieldLabel>
                <FieldDescription>
                  The first asset workflow is wired for GPT Image 2.
                </FieldDescription>
                <Select defaultValue="openai/gpt-image-2">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai/gpt-image-2">
                      openai/gpt-image-2
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel>Compose</FieldLabel>
                <FieldDescription>
                  Asset generation inputs will be added next. This scaffold only
                  sets up the layout, preview panel, and pricing reference.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-0 flex flex-col gap-3 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
            <Button className="w-full" disabled type="button">
              Asset generation coming soon
            </Button>
          </CardFooter>
        </div>
      </TabsContent>

      <TabsContent value="pricing">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
          <div className="space-y-1">
            <p className="font-medium text-xs">openai/gpt-image-2</p>
            <p className="text-muted-foreground text-xs/relaxed">
              Additional sizes available.
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
                {GPT_IMAGE_2_PRICING.map((row) => (
                  <tr
                    className="border-border/60 border-b last:border-b-0"
                    key={row.quality}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.quality}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.square}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.portrait}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.landscape}
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
