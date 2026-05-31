"use client"

import "@videojs/react/video/skin.css"
import { createPlayer } from "@videojs/react"
import { Video, VideoSkin, videoFeatures } from "@videojs/react/video"
import { useEffect, useState } from "react"

const Player = createPlayer({ features: videoFeatures })

interface VideoJsPlayerProps {
  aspectRatio?: string | null
  src: string
}

function getPlayerAspectRatio(value: string | null | undefined): string {
  return value?.replace(":", " / ") ?? "16 / 9"
}

export function VideoJsPlayer({ aspectRatio, src }: VideoJsPlayerProps) {
  const [isContainerReady, setIsContainerReady] = useState(false)

  useEffect(() => {
    setIsContainerReady(true)
  }, [])

  return (
    <Player.Provider>
      <VideoSkin
        className="max-h-[40vh] w-full overflow-hidden rounded-lg bg-black"
        style={{
          "--media-border-radius": "0.5rem",
          "--media-video-border-radius": "0.5rem",
          aspectRatio: getPlayerAspectRatio(aspectRatio),
        }}
      >
        {isContainerReady ? (
          <Video
            aria-label="Generated video preview"
            playsInline
            preload="metadata"
            src={src}
          />
        ) : null}
      </VideoSkin>
    </Player.Provider>
  )
}
