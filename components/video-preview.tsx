"use client"

import { IconDownload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface VideoPreviewProps {
  jobId?: string
  url: string
}

export function VideoPreview({ jobId, url }: VideoPreviewProps) {
  const downloadHref = jobId ? `/api/videos/${jobId}/content` : url

  return (
    <div className="w-full max-w-4xl space-y-3">
      {/* biome-ignore lint/a11y/useMediaCaption: no captions available for generated video */}
      <video className="w-full rounded-md" controls src={url} />
      <Button asChild size="sm" variant="outline">
        <a download href={downloadHref} rel="noopener">
          <IconDownload size={16} />
          Download
        </a>
      </Button>
    </div>
  )
}
