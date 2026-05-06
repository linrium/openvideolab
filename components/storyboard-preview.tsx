"use client"

import { Copy01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { CardHeader } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StoryboardAnalysis } from "@/lib/storyboard"

export function StoryboardPreview({
  analysis,
}: {
  analysis: StoryboardAnalysis | null
}) {
  const router = useRouter()

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied")
    } catch {
      toast.error("Failed to copy prompt")
    }
  }

  const handleGenerateImage = (prompt: string) => {
    router.push(`/images/new?prompt=${encodeURIComponent(prompt)}`)
  }

  const previewHeader = (
    <CardHeader
      className="sticky top-0 z-10 border-border/70 border-b bg-background px-6"
      style={{ paddingBottom: 0, paddingTop: 0 }}
    >
      <div className="flex items-center justify-between gap-3">
        <TabsList variant="line">
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        {analysis ? (
          <Badge variant="outline">{analysis.pages.length} pages</Badge>
        ) : null}
      </div>
    </CardHeader>
  )

  if (!analysis) {
    return (
      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-0 bg-muted/10"
        value="preview"
      >
        {previewHeader}
        <div className="flex min-h-0 flex-1 justify-center overflow-y-auto">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-center p-6">
            <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border/70 border-dashed bg-background/80 p-10 text-center">
              <p className="max-w-md text-muted-foreground text-sm">
                Create a storyboard to review the extracted comic structure and
                the Vietnamese GPT Image 2 prompt for each page.
              </p>
            </div>
          </div>
        </div>
      </Tabs>
    )
  }

  return (
    <Tabs
      className="flex min-h-0 flex-1 flex-col gap-0 bg-muted/10"
      value="preview"
    >
      {previewHeader}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
          <section className="space-y-4">
            <section className="space-y-2">
              <h2 className="font-medium text-sm">Visual direction</h2>
              <p className="text-muted-foreground text-sm">
                {analysis.visualDirection}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-medium text-sm">Style notes</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.styleNotes.map((note) => (
                  <Badge key={note} variant="secondary">
                    {note}
                  </Badge>
                ))}
              </div>
            </section>

            {analysis.characters.length > 0 ? (
              <section className="space-y-2">
                <h2 className="font-medium text-sm">Characters</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {analysis.characters.map((character) => (
                    <div
                      className="rounded-lg border border-border/70 bg-muted/20 p-3"
                      key={character.name}
                    >
                      <div className="font-medium text-sm">
                        {character.name}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {character.role}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <div className="space-y-4">
            {analysis.pages.map((page, index) => (
              <section
                className={
                  index === 0
                    ? "space-y-4 rounded-lg border border-border/70 bg-background/90 p-4"
                    : "space-y-4 rounded-lg border border-border/70 bg-background/90 p-4"
                }
                key={page.pageNumber}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-sm">
                    Page {page.pageNumber}
                  </h2>
                  <Badge variant="outline">{page.panelCount} panels</Badge>
                </div>

                <section className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Characters: </span>
                    <span className="text-muted-foreground">
                      {page.characters.join(", ")}
                    </span>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-medium text-sm">Original content</h3>
                  <div className="rounded-lg bg-muted/20 p-3 text-sm">
                    {page.originalContent}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-medium text-sm">Prompt</h3>
                  <InputGroup>
                    <InputGroupTextarea
                      className="min-h-[180px]"
                      readOnly
                      rows={8}
                      value={page.imagePrompt}
                    />
                    <InputGroupAddon align="block-end" className="border-t">
                      <InputGroupText>
                        Ready for image generation
                      </InputGroupText>
                      <InputGroupButton
                        className="ml-auto"
                        onClick={() => handleCopyPrompt(page.imagePrompt)}
                        size="sm"
                      >
                        Copy
                        <HugeiconsIcon
                          icon={Copy01Icon}
                          size={14}
                          strokeWidth={2}
                        />
                      </InputGroupButton>
                      <InputGroupButton
                        onClick={() => handleGenerateImage(page.imagePrompt)}
                        size="sm"
                        variant="default"
                      >
                        Generate
                        <HugeiconsIcon
                          icon={Image01Icon}
                          size={14}
                          strokeWidth={2}
                        />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </section>
              </section>
            ))}
          </div>
        </div>
      </div>
    </Tabs>
  )
}
