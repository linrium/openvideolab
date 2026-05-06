import { ImageStudio } from "@/components/image-studio"
import {
  IMAGE_DEFAULT_VALUES,
  type ImageGenerationValues,
} from "@/lib/image-generation"

interface NewImagePageProps {
  searchParams: Promise<{ prompt?: string }>
}

export default async function NewImagePage({
  searchParams,
}: NewImagePageProps) {
  const { prompt } = await searchParams

  const initialValues: ImageGenerationValues = {
    ...IMAGE_DEFAULT_VALUES,
    prompt: prompt?.trim() ?? IMAGE_DEFAULT_VALUES.prompt,
  }

  return <ImageStudio initialValues={initialValues} />
}
