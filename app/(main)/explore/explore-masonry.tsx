"use client"

import { IconVideo } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

interface ImageItem {
  height: number
  href: string
  id: string
  publishedAt: Date
  type: "image"
  url: string
  width: number
}

interface VideoItem {
  aspectRatio: string
  href: string
  id: string
  publishedAt: Date
  type: "video"
  url: string
}

type ExploreItem = ImageItem | VideoItem

interface ExploreMasonryProps {
  items: ExploreItem[]
}

function parseAspectRatio(ratio: string): number {
  const [w, h] = ratio.split(":").map(Number)
  return w && h ? w / h : 16 / 9
}

function ExploreCard({ item }: { item: ExploreItem }) {
  const paddingBottom =
    item.type === "image"
      ? `${((item.height / item.width) * 100).toFixed(2)}%`
      : `${(100 / parseAspectRatio(item.aspectRatio)).toFixed(2)}%`

  return (
    <Link
      className="group mb-2 block break-inside-avoid overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      href={item.href}
    >
      <div className="relative w-full" style={{ paddingBottom }}>
        {item.type === "image" ? (
          <Image
            alt="Published image"
            className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-90"
            height={item.height}
            src={item.url}
            unoptimized
            width={item.width}
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-90"
            loop
            muted
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause()
              e.currentTarget.currentTime = 0
            }}
            playsInline
            preload="metadata"
            src={item.url}
          />
        )}
        {item.type === "video" && (
          <div className="absolute right-1.5 bottom-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconVideo className="text-white/80 drop-shadow" size={14} />
          </div>
        )}
      </div>
    </Link>
  )
}

export function ExploreMasonry({ items }: ExploreMasonryProps) {
  return (
    <div className="columns-2 gap-2 px-3 pt-3 sm:columns-3 lg:columns-4 xl:columns-5">
      {items.map((item) => (
        <ExploreCard item={item} key={`${item.type}-${item.id}`} />
      ))}
    </div>
  )
}
