import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { StoryboardStudio } from "@/components/storyboard-studio"
import { auth } from "@/lib/auth"
import { getStoryboardSelectableImages } from "@/lib/storyboard-images"

export default async function NewStoryboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const selectableImages = await getStoryboardSelectableImages(session.user.id)

  return <StoryboardStudio selectableImages={selectableImages} />
}
