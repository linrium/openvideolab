"use client"

import { Download01Icon, MusicNote01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

interface MusicPreviewProps {
  url: string
}

export function MusicPreview({ url }: MusicPreviewProps) {
  return (
    <div className="w-full space-y-3">
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <div className="flex items-center justify-center px-4 pt-4">
          {url ? (
            // biome-ignore lint/a11y/useMediaCaption: no captions available for generated audio
            <audio className="w-full" controls src={url} />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-muted-foreground text-sm">
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={MusicNote01Icon}
                size={24}
                strokeWidth={2}
              />
              <span>Create a music track to see its preview here</span>
            </div>
          )}
        </div>

        {url && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-4">
            <Button asChild size="sm" variant="outline">
              <a download href={url} rel="noopener">
                <HugeiconsIcon
                  icon={Download01Icon}
                  size={16}
                  strokeWidth={2}
                />
                Download
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
