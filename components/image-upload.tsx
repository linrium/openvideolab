"use client"

import { IconUpload, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  className?: string
  onChange: (url: string | undefined) => void
  value?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed")
      }
      onChange(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      upload(file)
    }
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      upload(file)
    }
  }

  function onRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(undefined)
    setError(null)
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onFileChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />

      {value ? (
        <div className="group relative size-36 overflow-hidden rounded-md border">
          <Image
            alt="Uploaded image"
            className="size-full object-cover transition-[filter] group-hover:brightness-50"
            src={value}
          />
          <button
            className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-white/30 group-hover:opacity-100"
            onClick={onRemove}
            type="button"
          >
            <IconX className="size-5" />
          </button>
        </div>
      ) : (
        <button
          className={cn(
            "flex size-36 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors",
            "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging && "border-primary bg-primary/5 text-primary",
            uploading && "pointer-events-none opacity-50"
          )}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDrop={onDrop}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <IconUpload className="size-5" />
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
  max?: number
  onChange: (urls: string[]) => void
  values: string[]
}

export function MultiImageUpload({
  values,
  onChange,
  max = 5,
  className,
}: MultiImageUploadProps) {
  function set(index: number, url: string | undefined) {
    const next = [...values]
    if (url === undefined) {
      next.splice(index, 1)
    } else {
      next[index] = url
    }
    onChange(next)
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {values.map((url, i) => (
        <ImageUpload
          key={i.toString()}
          onChange={(url) => set(i, url)}
          value={url}
        />
      ))}
      {values.length < max && (
        <ImageUpload onChange={(url) => url && onChange([...values, url])} />
      )}
    </div>
  )
}
