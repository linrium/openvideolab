"use client"

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import { cn } from "@/lib/utils"

const DEFAULT_SIDEBAR_WIDTH = 448
const MIN_SIDEBAR_WIDTH = 320
const MAX_SIDEBAR_WIDTH = 768
const MIN_MAIN_CONTENT_WIDTH = 420
const KEYBOARD_RESIZE_STEP = 24

function clampSidebarWidth(width: number, viewportWidth: number): number {
  const maxWidth = Math.min(
    MAX_SIDEBAR_WIDTH,
    viewportWidth - MIN_MAIN_CONTENT_WIDTH
  )
  const boundedMaxWidth = Math.max(MIN_SIDEBAR_WIDTH, maxWidth)

  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), boundedMaxWidth)
}

interface ResizableRightSidebarProps {
  children: ReactNode
  className?: string
  storageKey: string
}

export function ResizableRightSidebar({
  children,
  className,
  storageKey,
}: ResizableRightSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const widthRef = useRef(DEFAULT_SIDEBAR_WIDTH)

  useEffect(() => {
    const savedWidth = window.localStorage.getItem(storageKey)
    if (!savedWidth) {
      return
    }

    const parsedWidth = Number(savedWidth)
    if (!Number.isFinite(parsedWidth)) {
      return
    }

    const nextWidth = clampSidebarWidth(parsedWidth, window.innerWidth)
    widthRef.current = nextWidth
    setWidth(nextWidth)
  }, [storageKey])

  const saveWidth = () => {
    window.localStorage.setItem(storageKey, String(widthRef.current))
  }

  const updateWidthFromClientX = (clientX: number) => {
    const nextWidth = clampSidebarWidth(
      window.innerWidth - clientX,
      window.innerWidth
    )
    widthRef.current = nextWidth
    setWidth(nextWidth)
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    updateWidthFromClientX(event.clientX)

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      updateWidthFromClientX(moveEvent.clientX)
    }

    const handlePointerUp = () => {
      saveWidth()
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp, { once: true })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!(event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      return
    }

    event.preventDefault()
    const direction = event.key === "ArrowLeft" ? 1 : -1
    const nextWidth = clampSidebarWidth(
      widthRef.current + direction * KEYBOARD_RESIZE_STEP,
      window.innerWidth
    )

    widthRef.current = nextWidth
    setWidth(nextWidth)
    window.localStorage.setItem(storageKey, String(nextWidth))
  }

  const style = {
    "--resizable-right-sidebar-width": `${width}px`,
  } as CSSProperties

  return (
    <aside
      className={cn(
        "relative h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:w-[var(--resizable-right-sidebar-width)] lg:min-w-80 lg:max-w-[min(50vw,48rem)] lg:border-t-0 lg:border-l",
        className
      )}
      style={style}
    >
      <button
        aria-label="Resize settings sidebar"
        className="absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-col-resize touch-none outline-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-transparent before:transition-colors hover:before:bg-sidebar-border focus-visible:before:bg-sidebar-border lg:block"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        type="button"
      />
      {children}
    </aside>
  )
}
