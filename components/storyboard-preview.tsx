"use client"

import { Copy01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { CardHeader } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type {
  StoryboardAnalysis,
  StoryboardSelectableImage,
} from "@/lib/storyboard"

export function StoryboardPreview({
  analysis,
  selectableImages,
}: {
  analysis: StoryboardAnalysis | null
  selectableImages: StoryboardSelectableImage[]
}) {
  const router = useRouter()
  const [activeCharacterName, setActiveCharacterName] = useState<string | null>(
    null
  )
  const [selectedImagesByCharacter, setSelectedImagesByCharacter] = useState<
    Record<string, StoryboardSelectableImage | undefined>
  >({})

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

  const handleSelectCharacterImage = (
    characterName: string,
    image: StoryboardSelectableImage
  ) => {
    setSelectedImagesByCharacter((current) => ({
      ...current,
      [characterName]: image,
    }))
    setActiveCharacterName(null)
    toast.success(`Selected image for ${characterName}`)
  }

  const previewHeader = (
    <CardHeader
      className="sticky top-0 z-10 border-border/70 border-b bg-background px-6"
      style={{ paddingBottom: 0, paddingTop: 0 }}
    >
      <div className="flex items-center justify-between gap-3">
        <TabsList variant="line">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
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
        defaultValue="preview"
      >
        {previewHeader}
        <TabsContent className="min-h-0 flex-1" value="preview">
          <div className="flex min-h-0 flex-1 justify-center overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-center p-6">
              <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border/70 border-dashed bg-background/80 p-10 text-center">
                <p className="max-w-md text-muted-foreground text-sm">
                  Create a storyboard to review the extracted comic structure
                  and the Vietnamese GPT Image 2 prompt for each page.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent className="min-h-0 flex-1" value="characters">
          <div className="flex min-h-0 flex-1 justify-center overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-center p-6">
              <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border/70 border-dashed bg-background/80 p-10 text-center">
                <p className="max-w-md text-muted-foreground text-sm">
                  Create a storyboard to inspect the extracted character list.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Tabs
      className="flex min-h-0 flex-1 flex-col gap-0 bg-muted/10"
      defaultValue="preview"
    >
      {previewHeader}
      <TabsContent className="min-h-0 flex-1 overflow-y-auto" value="preview">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
          <section className="space-y-4">
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

                <section className="space-y-2">
                  <h3 className="font-medium text-sm">Characters</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {page.characters.map((characterName) => {
                      const selectedImage =
                        selectedImagesByCharacter[characterName] ?? null
                      return (
                        <button
                          aria-label={`Select image for ${characterName}`}
                          className="flex items-center gap-3 overflow-hidden rounded-lg border border-border/70 bg-muted/30 pr-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={selectableImages.length === 0}
                          key={characterName}
                          onClick={() => setActiveCharacterName(characterName)}
                          type="button"
                        >
                          <div className="relative size-12 shrink-0 bg-muted">
                            {selectedImage ? (
                              <Image
                                alt={`${characterName} reference`}
                                className="object-cover"
                                fill
                                sizes="48px"
                                src={selectedImage.url}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <HugeiconsIcon
                                  className="text-muted-foreground"
                                  icon={Image01Icon}
                                  size={18}
                                  strokeWidth={2}
                                />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-sm">
                            {characterName}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-medium text-sm">Original content</h3>
                  <Textarea
                    className="min-h-[140px] resize-none bg-muted/20 text-sm"
                    readOnly
                    rows={6}
                    value={page.originalContent}
                  />
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
      </TabsContent>
      <TabsContent
        className="min-h-0 flex-1 overflow-y-auto"
        value="characters"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
          {analysis.characters.length > 0 ? (
            <section className="space-y-3">
              <div className="grid gap-2">
                {analysis.characters.map((character) => {
                  const selectedImage =
                    selectedImagesByCharacter[character.name] ?? null

                  return (
                    <div
                      className="flex items-stretch overflow-hidden rounded-lg border border-border/70 bg-background/90"
                      key={character.name}
                    >
                      <button
                        aria-label={`Select image for ${character.name}`}
                        className="relative w-20 shrink-0 bg-muted/50 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={selectableImages.length === 0}
                        onClick={() => setActiveCharacterName(character.name)}
                        type="button"
                      >
                        {selectedImage ? (
                          <Image
                            alt={`${character.name} reference`}
                            className="object-cover"
                            fill
                            sizes="80px"
                            src={selectedImage.url}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <HugeiconsIcon
                              className="text-muted-foreground"
                              icon={Image01Icon}
                              size={18}
                              strokeWidth={2}
                            />
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1 p-3">
                        <div className="font-medium text-sm">
                          {character.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {character.role}
                        </div>
                        {selectedImage ? (
                          <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
                            {selectedImage.title || selectedImage.prompt}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-border/70 border-dashed bg-background/80 p-10 text-center text-muted-foreground text-sm">
              No characters were extracted for this storyboard.
            </div>
          )}
        </div>
      </TabsContent>
      <Drawer
        direction="right"
        onOpenChange={(open) => {
          if (!open) {
            setActiveCharacterName(null)
          }
        }}
        open={activeCharacterName !== null}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Select image
              {activeCharacterName ? ` for ${activeCharacterName}` : ""}
            </DrawerTitle>
            <DrawerDescription>
              Choose from your previously generated images.
            </DrawerDescription>
          </DrawerHeader>

          {selectableImages.length > 0 ? (
            <div className="no-scrollbar grid gap-3 overflow-y-auto px-4 pb-4 sm:grid-cols-2">
              {selectableImages.map((image) => {
                const isSelected =
                  activeCharacterName !== null &&
                  selectedImagesByCharacter[activeCharacterName]?.id ===
                    image.id

                return (
                  <button
                    className="flex h-64 flex-col overflow-hidden rounded-lg border border-border/70 bg-background text-left transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    key={image.id}
                    onClick={() => {
                      if (activeCharacterName) {
                        handleSelectCharacterImage(activeCharacterName, image)
                      }
                    }}
                    type="button"
                  >
                    <div className="relative h-40 w-full bg-muted">
                      <Image
                        alt={image.title || "Generated image"}
                        className="object-cover"
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        src={image.url}
                      />
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1 font-medium text-sm">
                          {image.title || "Untitled image"}
                        </span>
                        {isSelected ? (
                          <Badge variant="secondary">Selected</Badge>
                        ) : null}
                      </div>
                      <p className="line-clamp-3 text-muted-foreground text-xs">
                        {image.prompt}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="m-4 rounded-lg border border-border/70 border-dashed bg-muted/20 p-6 text-center text-muted-foreground text-sm">
              No generated images are available yet.
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </Tabs>
  )
}
