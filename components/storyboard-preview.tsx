"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StoryboardAnalysis } from "@/lib/storyboard"

export function StoryboardPreview({
  analysis,
}: {
  analysis: StoryboardAnalysis | null
}) {
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
          <Card className="bg-background/90">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>{analysis.storySummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <p className="mt-2 text-sm">{character.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {analysis.pages.map((page) => (
              <Card className="bg-background/90" key={page.pageNumber}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>Page {page.pageNumber}</CardTitle>
                    <Badge variant="outline">{page.panelCount} panels</Badge>
                    <Badge variant="secondary">{page.mood}</Badge>
                  </div>
                  <CardDescription>{page.pageSummary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                    <div className="space-y-4">
                      <section className="space-y-2">
                        <h3 className="font-medium text-sm">Scene breakdown</h3>
                        <ul className="space-y-1 text-muted-foreground text-sm">
                          {page.keyEvents.map((event) => (
                            <li key={event}>• {event}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Setting: </span>
                          <span className="text-muted-foreground">
                            {page.setting}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Camera: </span>
                          <span className="text-muted-foreground">
                            {page.cameraLanguage}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Characters: </span>
                          <span className="text-muted-foreground">
                            {page.characters.join(", ")}
                          </span>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-medium text-sm">Panels</h3>
                        <div className="space-y-2">
                          {page.panels.map((panel) => (
                            <div
                              className="rounded-lg border border-border/70 bg-muted/20 p-3"
                              key={`${page.pageNumber}-${panel.panelNumber}`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  Panel {panel.panelNumber}
                                </Badge>
                                <span className="text-muted-foreground text-xs">
                                  {panel.shotType}
                                </span>
                              </div>
                              <p className="mt-2 text-sm">{panel.summary}</p>
                              <p className="mt-1 text-muted-foreground text-sm">
                                {panel.action}
                              </p>
                              {panel.dialogue ? (
                                <p className="mt-2 text-sm">
                                  <span className="font-medium">
                                    Dialogue:{" "}
                                  </span>
                                  {panel.dialogue}
                                </p>
                              ) : null}
                              {panel.narration ? (
                                <p className="mt-1 text-sm">
                                  <span className="font-medium">
                                    Narration:{" "}
                                  </span>
                                  {panel.narration}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <section className="space-y-2">
                      <h3 className="font-medium text-sm">
                        Vietnamese prompt for GPT Image 2
                      </h3>
                      <div className="whitespace-pre-wrap rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
                        {page.imagePrompt}
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Tabs>
  )
}
