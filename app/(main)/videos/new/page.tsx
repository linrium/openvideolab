import { VideoForm } from "@/components/video-form"
import { VideoPreview } from "@/components/video-preview"

export default async function Home() {
  return <VideoForm preview={<VideoPreview url="" />} />
}
