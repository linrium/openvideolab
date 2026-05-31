"use client"

import { useEffect, useRef } from "react"

interface SwapTextProps {
  text: string
}

export function SwapText({ text }: SwapTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const prevTextRef = useRef(text)

  useEffect(() => {
    const el = spanRef.current
    if (!el || prevTextRef.current === text) {
      return
    }

    const dur =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--text-swap-dur"
        )
      ) || 150

    el.classList.add("is-exit")
    const timer = setTimeout(() => {
      el.textContent = text
      prevTextRef.current = text
      el.classList.remove("is-exit")
      el.classList.add("is-enter-start")
      // biome-ignore lint/complexity/noVoid: force browser reflow to restart CSS transition
      void el.offsetHeight
      el.classList.remove("is-enter-start")
    }, dur)

    return () => clearTimeout(timer)
  }, [text])

  return (
    <span className="t-text-swap" ref={spanRef}>
      {text}
    </span>
  )
}
