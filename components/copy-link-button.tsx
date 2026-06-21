"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import type { ComponentProps } from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type CopyLinkButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "onClick" | "type"
> & {
  copiedLabel?: string
  href?: string
  label?: string
  labelClassName?: string
}

const COPIED_RESET_DELAY_MS = 1800

function getAbsoluteLink(href?: string): string {
  if (!href) {
    return window.location.href
  }

  return new URL(href, window.location.origin).toString()
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error("Clipboard copy failed")
  }
}

export function CopyLinkButton({
  copiedLabel = "Copied",
  href,
  label = "Copy link",
  labelClassName,
  ...buttonProps
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await copyText(getAbsoluteLink(href))
      setCopied(true)
      toast.success("Link copied")
      window.setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Button onClick={handleClick} type="button" {...buttonProps}>
      {copied ? (
        <IconCheck data-icon="inline-start" />
      ) : (
        <IconCopy data-icon="inline-start" />
      )}
      <span className={labelClassName}>{copied ? copiedLabel : label}</span>
    </Button>
  )
}
