import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface VideoPreviewProps {
  url: string
}

export function VideoPreview({ url }: VideoPreviewProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Most recently generated video.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* biome-ignore lint/a11y/useMediaCaption: no captions available for generated video */}
        <video className="w-full rounded-md" controls src={url} />
      </CardContent>
    </Card>
  )
}
