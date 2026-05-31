"use client"

import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { useRef, useState } from "react"
import {
  fetchGeneratedImagesAction,
  type GeneratedImageItem,
} from "@/app/actions/fetch-generated-images"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface ImageValue {
  durationSeconds?: number
  key: string
  url: string
}

export type AudioValue = ImageValue
export interface VideoValue extends ImageValue {
  durationSeconds?: number
}

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

function formatSize(img: GeneratedImageItem): string {
  if (img.size) {
    return img.size.replace("x", "×")
  }
  if (img.width && img.height) {
    return `${img.width}×${img.height}`
  }
  return ""
}

function GalleryBody({
  images,
  loading,
  onSelect,
}: {
  images: GeneratedImageItem[]
  loading: boolean
  onSelect: (img: GeneratedImageItem) => void
}) {
  if (loading) {
    const skeletonHeights = [
      "140px",
      "100px",
      "120px",
      "110px",
      "130px",
      "95px",
    ]
    return (
      <div className="columns-2 gap-3 p-4">
        {skeletonHeights.map((h) => (
          <div className="mb-3 break-inside-avoid" key={h}>
            <Skeleton className="w-full rounded-md" style={{ height: h }} />
          </div>
        ))}
      </div>
    )
  }
  if (images.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-muted-foreground text-sm">
        No generated images yet.
      </p>
    )
  }
  return (
    <div className="columns-2 gap-3 p-4">
      {images.map((img) => {
        const sizeLabel = formatSize(img)
        const w = img.width ?? 400
        const h = img.height ?? 400
        return (
          <div className="mb-3 break-inside-avoid" key={img.key}>
            <button
              className="group w-full overflow-hidden rounded-md border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(img)}
              type="button"
            >
              <Image
                alt="Generated image"
                className="block w-full transition-[filter] group-hover:brightness-75"
                height={h}
                sizes="(max-width: 640px) 50vw, 180px"
                src={img.url}
                style={{ height: "auto" }}
                width={w}
              />
              <div className="flex flex-wrap items-center gap-1 border-t bg-muted/40 px-2 py-1.5">
                {img.model && (
                  <Badge className="max-w-full truncate" variant="secondary">
                    {img.model}
                  </Badge>
                )}
                {sizeLabel && <Badge variant="outline">{sizeLabel}</Badge>}
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

interface ImageUploadProps {
  accept?: string
  className?: string
  disabled?: boolean
  onChange: (value: ImageValue | undefined) => void
  value?: ImageValue
}

export function ImageUpload({
  accept = "image/jpeg,image/png,image/webp,image/gif",
  value,
  onChange,
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>(
    []
  )
  const [loadingGallery, setLoadingGallery] = useState(false)

  async function openGallery() {
    setPickerOpen(false)
    setGalleryOpen(true)
    setLoadingGallery(true)
    try {
      setGeneratedImages(await fetchGeneratedImagesAction())
    } finally {
      setLoadingGallery(false)
    }
  }

  function selectGeneratedImage(img: GeneratedImageItem) {
    onChange(img)
    setGalleryOpen(false)
  }

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
        accept={accept}
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
              <IconX size={20} />
            </button>
          )}
        </div>
      ) : (
        <>
          <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex size-36 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors",
                  "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dragging && "border-primary bg-primary/5 text-primary",
                  (uploading || disabled) && "pointer-events-none opacity-50"
                )}
                disabled={disabled || uploading}
                onDragLeave={() => setDragging(false)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!disabled) {
                    setDragging(true)
                  }
                }}
                onDrop={onDrop}
                type="button"
              >
                {uploading ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <IconUpload size={20} />
                )}
                <span className="text-xs">
                  {uploading ? "Uploading…" : "Upload"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 gap-0.5 p-1">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setPickerOpen(false)
                  inputRef.current?.click()
                }}
                type="button"
              >
                <IconUpload size={16} />
                Upload from file
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={openGallery}
                type="button"
              >
                <IconPhoto size={16} />
                From generated images
              </button>
            </PopoverContent>
          </Popover>

          <Sheet onOpenChange={setGalleryOpen} open={galleryOpen}>
            <SheetContent
              className="flex flex-col gap-0 p-0"
              style={{ maxWidth: "520px" }}
            >
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle>Select a generated image</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <GalleryBody
                  images={generatedImages}
                  loading={loadingGallery}
                  onSelect={selectGeneratedImage}
                />
              </div>
            </SheetContent>
          </Sheet>
        </>
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

interface MultiMediaUploadProps {
  accept: string
  buttonLabel: string
  className?: string
  disabled?: boolean
  getMetadata?: (file: File) => Promise<Partial<ImageValue>>
  max?: number
  onChange: (values: ImageValue[]) => void
  removeLabel: string
  renderPreview: (value: ImageValue) => React.ReactNode
  values: ImageValue[]
}

function MultiMediaUpload({
  accept,
  buttonLabel,
  values,
  onChange,
  getMetadata,
  renderPreview,
  removeLabel,
  max = 3,
  className,
  disabled = false,
}: MultiMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function remove(index: number) {
    if (disabled) {
      return
    }

    const next = [...values]
    next.splice(index, 1)
    onChange(next)
    setError(null)
  }

  async function upload(file: File) {
    if (disabled || values.length >= max) {
      return
    }

    setUploading(true)
    setError(null)
    try {
      const metadata = (await getMetadata?.(file)) ?? {}
      onChange([...values, { ...(await uploadImage(file)), ...metadata }])
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2">
        {values.map((value, index) => (
          <div className="space-y-2 rounded-md border p-3" key={value.key}>
            {renderPreview(value)}
            {!disabled && (
              <ButtonLike onClick={() => remove(index)} text={removeLabel} />
            )}
          </div>
        ))}
      </div>

      <input
        accept={accept}
        className="hidden h-0"
        disabled={disabled}
        onChange={onFileChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />

      {values.length < max && (
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
          type="button"
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <IconUpload size={20} />
          )}
          <span className="text-xs">
            {uploading ? "Uploading…" : buttonLabel}
          </span>
        </button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

function getVideoDuration(file: File): Promise<Partial<VideoValue>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
    }

    video.preload = "metadata"
    video.onloadedmetadata = () => {
      const durationSeconds = Number.isFinite(video.duration)
        ? Math.floor(Math.max(0, video.duration))
        : undefined
      cleanup()
      if (durationSeconds && durationSeconds > 0) {
        resolve({ durationSeconds })
        return
      }
      reject(new Error("Could not read video duration"))
    }
    video.onerror = () => {
      cleanup()
      reject(new Error("Could not read video duration"))
    }
    video.src = objectUrl
  })
}

function formatDuration(seconds: number | undefined): string {
  return seconds == null ? "unknown length" : `${seconds.toFixed(1)}s`
}

interface MultiAudioUploadProps {
  className?: string
  disabled?: boolean
  max?: number
  onChange: (values: AudioValue[]) => void
  values: AudioValue[]
}

export function MultiAudioUpload({
  values,
  onChange,
  max,
  className,
  disabled = false,
}: MultiAudioUploadProps) {
  return (
    <MultiMediaUpload
      accept="audio/mpeg,audio/wav,audio/x-wav,audio/wave"
      buttonLabel="Upload MP3 or WAV"
      className={className}
      disabled={disabled}
      max={max}
      onChange={onChange}
      removeLabel="Remove audio"
      renderPreview={(value) => (
        // biome-ignore lint/a11y/useMediaCaption: uploaded reference audio has no caption track
        <audio className="w-full" controls src={value.url} />
      )}
      values={values}
    />
  )
}

interface MultiVideoUploadProps {
  className?: string
  disabled?: boolean
  max?: number
  onChange: (values: VideoValue[]) => void
  values: VideoValue[]
}

export function MultiVideoUpload({
  values,
  onChange,
  max,
  className,
  disabled = false,
}: MultiVideoUploadProps) {
  return (
    <MultiMediaUpload
      accept="video/mp4,video/quicktime,video/webm"
      buttonLabel="Upload MP4, MOV, or WebM"
      className={className}
      disabled={disabled}
      getMetadata={getVideoDuration}
      max={max}
      onChange={onChange}
      removeLabel="Remove video"
      renderPreview={(value) => (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: uploaded reference video has no caption track */}
          <video
            className="aspect-video w-full rounded-md bg-muted"
            controls
            src={value.url}
          />
          <p className="text-muted-foreground text-xs">
            Length: {formatDuration(value.durationSeconds)}
          </p>
        </>
      )}
      values={values}
    />
  )
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
            <IconUpload size={20} />
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
