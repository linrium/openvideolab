import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { StoryboardStudio } from "@/components/storyboard-studio"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { stories, storyPages, storyPanels } from "@/db/schema/stories"
import { auth } from "@/lib/auth"
import type { StoryboardAnalysis, StoryboardValues } from "@/lib/storyboard"

interface StoryboardPageProps {
  params: Promise<{ id: string }>
}

export default async function StoryboardPage({ params }: StoryboardPageProps) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const [story] = await db
    .select({
      characters: stories.characters,
      sourcePrompt: stories.sourcePrompt,
      sourceUrl: stories.sourceUrl,
      storyId: stories.id,
      storySummary: stories.storySummary,
      styleNotes: stories.styleNotes,
      userId: generations.userId,
      visualDirection: stories.visualDirection,
    })
    .from(stories)
    .innerJoin(generations, eq(stories.generationId, generations.id))
    .where(and(eq(generations.id, id), eq(generations.type, "storyboard")))
    .limit(1)

  if (!story || story.userId !== session.user.id) {
    notFound()
  }

  const pageRows = await db
    .select({
      cameraLanguage: storyPages.cameraLanguage,
      characters: storyPages.characters,
      id: storyPages.id,
      imagePrompt: storyPages.imagePrompt,
      keyEvents: storyPages.keyEvents,
      mood: storyPages.mood,
      pageNumber: storyPages.pageNumber,
      pageSummary: storyPages.pageSummary,
      panelCount: storyPages.panelCount,
      setting: storyPages.setting,
    })
    .from(storyPages)
    .where(eq(storyPages.storyId, story.storyId))
    .orderBy(asc(storyPages.pageNumber))

  const panelRows = await db
    .select({
      action: storyPanels.action,
      characters: storyPanels.characters,
      dialogue: storyPanels.dialogue,
      narration: storyPanels.narration,
      pageId: storyPanels.pageId,
      panelNumber: storyPanels.panelNumber,
      shotType: storyPanels.shotType,
      summary: storyPanels.summary,
    })
    .from(storyPanels)
    .innerJoin(storyPages, eq(storyPanels.pageId, storyPages.id))
    .where(eq(storyPages.storyId, story.storyId))
    .orderBy(asc(storyPages.pageNumber), asc(storyPanels.panelNumber))

  const panelsByPageId = new Map<string, typeof panelRows>()
  for (const panel of panelRows) {
    const pagePanels = panelsByPageId.get(panel.pageId) ?? []
    pagePanels.push(panel)
    panelsByPageId.set(panel.pageId, pagePanels)
  }

  const initialAnalysis: StoryboardAnalysis = {
    characters: story.characters,
    pages: pageRows.map((page) => ({
      cameraLanguage: page.cameraLanguage,
      characters: page.characters,
      imagePrompt: page.imagePrompt,
      keyEvents: page.keyEvents,
      mood: page.mood,
      pageNumber: page.pageNumber,
      pageSummary: page.pageSummary,
      panelCount: page.panelCount,
      panels: (panelsByPageId.get(page.id) ?? []).map((panel) => ({
        action: panel.action,
        characters: panel.characters,
        dialogue: panel.dialogue ?? "",
        narration: panel.narration ?? "",
        panelNumber: panel.panelNumber,
        shotType: panel.shotType,
        summary: panel.summary,
      })),
      setting: page.setting,
    })),
    storySummary: story.storySummary,
    styleNotes: story.styleNotes,
    visualDirection: story.visualDirection,
  }

  const initialValues: StoryboardValues = {
    prompt: story.sourcePrompt,
    sourceUrl: story.sourceUrl ?? "",
  }

  return (
    <StoryboardStudio
      initialAnalysis={initialAnalysis}
      initialValues={initialValues}
      readOnly
    />
  )
}
