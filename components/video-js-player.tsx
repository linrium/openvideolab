"use client"

import "@videojs/react/video/minimal-skin.css"
import { createPlayer } from "@videojs/react"
import { MinimalVideoSkin, Video, videoFeatures } from "@videojs/react/video"
import type { CSSProperties } from "react"
import { useEffect, useState } from "react"

const Player = createPlayer({ features: videoFeatures })

interface VideoJsPlayerProps {
  aspectRatio?: string | null
  src: string
}

function getPlayerAspectRatio(value: string | null | undefined): string {
  return value?.replace(":", " / ") ?? "16 / 9"
}

type VideoSkinStyle = CSSProperties & {
  "--media-border-radius": string
  "--media-video-border-radius": string
}

export function VideoJsPlayer({ aspectRatio, src }: VideoJsPlayerProps) {
  const [isContainerReady, setIsContainerReady] = useState(false)

  useEffect(() => {
    setIsContainerReady(true)
  }, [])

  const videoSkinStyle: VideoSkinStyle = {
    "--media-border-radius": "0.5rem",
    "--media-video-border-radius": "0.5rem",
    aspectRatio: getPlayerAspectRatio(aspectRatio),
  }

  return (
    <Player.Provider>
      <MinimalVideoSkin
        className="max-h-[50vh] w-full overflow-hidden rounded-lg bg-black"
        style={videoSkinStyle}
      >
        {isContainerReady ? (
          <Video
            aria-label="Generated video preview"
            playsInline
            preload="metadata"
            src={src}
          />
        ) : null}
      </MinimalVideoSkin>
    </Player.Provider>
  )
}
