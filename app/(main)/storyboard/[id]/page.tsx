import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { StoryboardStudio } from "@/components/storyboard-studio"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { stories, storyPages } from "@/db/schema/stories"
import { auth } from "@/lib/auth"
import {
  STORYBOARD_DEFAULT_VALUES,
  type StoryboardAnalysis,
  type StoryboardValues,
} from "@/lib/storyboard"
import { getStoryCharacterImages } from "@/lib/storyboard-characters"
import { getStoryboardSelectableImages } from "@/lib/storyboard-images"

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
      styleNotes: stories.styleNotes,
      title: stories.title,
      userId: generations.userId,
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
      characters: storyPages.characters,
      imagePrompt: storyPages.imagePrompt,
      originalContent: storyPages.originalContent,
      pageNumber: storyPages.pageNumber,
      panelCount: storyPages.panelCount,
    })
    .from(storyPages)
    .where(eq(storyPages.storyId, story.storyId))
    .orderBy(asc(storyPages.pageNumber))

  const [selectableImages, characterImages] = await Promise.all([
    getStoryboardSelectableImages(session.user.id),
    getStoryCharacterImages(story.storyId),
  ])

  const initialAnalysis: StoryboardAnalysis = {
    characters: story.characters,
    pages: pageRows.map((page) => ({
      characters: page.characters,
      imagePrompt: page.imagePrompt,
      originalContent: page.originalContent,
      pageNumber: page.pageNumber,
      panelCount: page.panelCount,
    })),
    styleNotes: story.styleNotes,
  }

  const initialValues: StoryboardValues = {
    panelCount: pageRows[0]?.panelCount ?? STORYBOARD_DEFAULT_VALUES.panelCount,
    prompt: story.sourcePrompt,
    sourceUrl: story.sourceUrl ?? "",
    title: story.title,
  }

  return (
    <StoryboardStudio
      initialAnalysis={initialAnalysis}
      initialCharacterImages={characterImages}
      initialValues={initialValues}
      readOnly
      selectableImages={selectableImages}
      storyId={story.storyId}
    />
  )
}
