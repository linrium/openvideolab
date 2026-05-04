"use client"

import { Cancel01Icon, Upload01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface ImageValue {
  key: string
  url: string
}

export type AudioValue = ImageValue

async function uploadImage(file: File): Promise<ImageValue> {
  const body = new FormData()
  body.append("file", file)

  const res = await fetch("/api/upload", { method: "POST", body })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error ?? "Upload failed")
  }

  return { url: json.url, key: json.key }
}

interface ImageUploadProps {
  className?: string
  disabled?: boolean
  onChange: (value: ImageValue | undefined) => void
  value?: ImageValue
}

export function ImageUpload({
  value,
  onChange,
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function upload(file: File) {
    if (disabled) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      onChange(await uploadImage(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      e.target.value = ""
      return
    }
    const file = e.target.files?.[0]
    if (file) {
      upload(file)
    }
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) {
      return
    }
    const file = e.dataTransfer.files[0]
    if (file) {
      upload(file)
    }
  }

  function onRemove(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) {
      return
    }
    onChange(undefined)
    setError(null)
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden h-0"
        disabled={disabled}
        onChange={onFileChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />

      {value ? (
        <div className="group relative size-36 overflow-hidden rounded-md border">
          <Image
            alt="Uploaded image"
            className={cn(
              "object-cover transition-[filter]",
              !disabled && "group-hover:brightness-50"
            )}
            fill
            src={value.url}
          />
          {!disabled && (
            <button
              className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-white/30 group-hover:opacity-100"
              onClick={onRemove}
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
            </button>
          )}
        </div>
      ) : (
        <button
          className={cn(
            "flex size-36 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors",
            "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging && "border-primary bg-primary/5 text-primary",
            (uploading || disabled) && "pointer-events-none opacity-50"
          )}
          disabled={disabled || uploading}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.click()
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) {
              setDragging(true)
            }
          }}
          onDrop={onDrop}
          onKeyDown={(e) => {
            if (!disabled && e.key === "Enter") {
              inputRef.current?.click()
            }
          }}
          type="button"
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <HugeiconsIcon icon={Upload01Icon} size={20} strokeWidth={2} />
          )}
          <span className="text-xs">{uploading ? "Uploading…" : "Upload"}</span>
        </button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

interface MultiImageUploadProps {
  className?: string
  disabled?: boolean
  max?: number
  onChange: (values: ImageValue[]) => void
  values: ImageValue[]
}

export function MultiImageUpload({
  values,
  onChange,
  max = 5,
  className,
  disabled = false,
}: MultiImageUploadProps) {
  function set(index: number, value: ImageValue | undefined) {
    const next = [...values]
    if (value === undefined) {
      next.splice(index, 1)
    } else {
      next[index] = value
    }
    onChange(next)
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {values.map((value, i) => (
        <ImageUpload
          disabled={disabled}
          key={value.key}
          onChange={(v) => set(i, v)}
          value={value}
        />
      ))}
      {values.length < max && (
        <ImageUpload
          disabled={disabled}
          onChange={(v) => v && onChange([...values, v])}
        />
      )}
    </div>
  )
}

interface AudioUploadProps {
  className?: string
  disabled?: boolean
  onChange: (value: AudioValue | undefined) => void
  value?: AudioValue
}

export function AudioUpload({
  value,
  onChange,
  className,
  disabled = false,
}: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function upload(file: File) {
    if (disabled) {
      return
    }

    setUploading(true)
    setError(null)
    try {
      onChange(await uploadImage(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      e.target.value = ""
      return
    }

    const file = e.target.files?.[0]
    if (file) {
      upload(file)
    }
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) {
      return
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      upload(file)
    }
  }

  function onRemove(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) {
      return
    }

    onChange(undefined)
    setError(null)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        accept="audio/mpeg,audio/wav,audio/x-wav,audio/wave"
        className="hidden h-0"
        disabled={disabled}
        onChange={onFileChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />

      {value ? (
        <div className="space-y-2 rounded-md border p-3">
          {/* biome-ignore lint/a11y/useMediaCaption: uploaded reference audio has no caption track */}
          <audio className="w-full" controls src={value.url} />
          {!disabled && <ButtonLike onClick={onRemove} text="Remove audio" />}
        </div>
      ) : (
        <button
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors",
            "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging && "border-primary bg-primary/5 text-primary",
            (uploading || disabled) && "pointer-events-none opacity-50"
          )}
          disabled={disabled || uploading}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.click()
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) {
              setDragging(true)
            }
          }}
          onDrop={onDrop}
          onKeyDown={(e) => {
            if (!disabled && e.key === "Enter") {
              inputRef.current?.click()
            }
          }}
          type="button"
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <HugeiconsIcon icon={Upload01Icon} size={20} strokeWidth={2} />
          )}
          <span className="text-xs">
            {uploading ? "Uploading…" : "Upload MP3 or WAV"}
          </span>
        </button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

function ButtonLike({
  onClick,
  text,
}: {
  onClick: (e: React.MouseEvent) => void
  text: string
}) {
  return (
    <button
      className="text-left text-destructive text-xs hover:underline"
      onClick={onClick}
      type="button"
    >
      {text}
    </button>
  )
}
