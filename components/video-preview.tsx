interface VideoPreviewProps {
  url: string
}

export function VideoPreview({ url }: VideoPreviewProps) {
  return (
    <div className="w-full max-w-4xl">
      {/* biome-ignore lint/a11y/useMediaCaption: no captions available for generated video */}
      <video className="w-full rounded-md" controls src={url} />
    </div>
  )
}
