"use client"

import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconRefresh,
  IconVideo,
  IconWorld,
  IconWorldOff,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useEffectEvent, useState, useTransition } from "react"
import { toast } from "sonner"
import { pollJobStatusAction } from "@/app/actions/poll-job-status-action"
import { publishGenerationAction } from "@/app/actions/publish-generation"
import { CopyLinkButton } from "@/components/copy-link-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Status } from "@/components/ui/status"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VideoJsPlayer } from "@/components/video-js-player"
import { KIE_CREDIT_USD_RATE } from "@/lib/constants"
import type { VideoJobStatus } from "@/lib/openrouter-client"
import { Spokes } from "./loading-ui/spokes"

const TERMINAL_STATUSES = new Set([
  "completed",
  "failed",
  "cancelled",
  "expired",
])
const AUTO_SYNC_STATUSES = new Set(["pending", "in_progress"])
const AUTO_SYNC_INTERVAL_MS = 5000
const COPIED_ID_RESET_DELAY_MS = 1800

async function copyTextToClipboard(value: string): Promise<void> {
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

function CopyIdButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await copyTextToClipboard(value)
      setCopied(true)
      toast.success(`${label} copied`)
      window.setTimeout(() => setCopied(false), COPIED_ID_RESET_DELAY_MS)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  return (
    <Button
      aria-label={`Copy ${label}`}
      className="size-5"
      onClick={handleClick}
      size="icon-xs"
      title={`Copy ${label}`}
      type="button"
      variant="ghost"
    >
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
    </Button>
  )
}

function formatMillisecondsAsMinutes(value: string): string {
  const minutes = Number(value) / 60_000
  return `${minutes.toFixed(2)} min`
}

function formatMillisecondsAsSeconds(value: string): string {
  const seconds = Number(value) / 1000
  return `${seconds.toFixed(2)} sec`
}

function VideoPlaceholder({
  hasJob,
  status,
}: {
  hasJob: boolean
  status: string | undefined
}) {
  if (!hasJob) {
    return (
      <>
        <IconVideo className="text-muted-foreground" size={28} />
        <span>Create a video to see its preview here</span>
      </>
    )
  }

  if (status === "failed") {
    return (
      <>
        <IconX className="text-red-400" size={24} />
        <span className="text-red-400">Generation failed</span>
      </>
    )
  }
  if (status === "cancelled" || status === "expired") {
    return (
      <>
        <IconX size={24} />
        <span className="capitalize">{status}</span>
      </>
    )
  }
  return (
    <>
      <Spokes className="size-8 text-muted-foreground" />
      <span>{status === "in_progress" ? "Generating…" : "Pending…"}</span>
    </>
  )
}

interface SyncButtonProps {
  currentStatus?: string
  jobId: string
  onStatusChange: (status: VideoJobStatus) => void
  onUrlChange: (url: string) => void
}

function SyncButton({
  jobId,
  currentStatus = "pending",
  onStatusChange,
  onUrlChange,
}: SyncButtonProps) {
  const [isPending, startTransition] = useTransition()
  const isTerminal = TERMINAL_STATUSES.has(currentStatus)

  const syncStatus = useEffectEvent(() => {
    startTransition(async () => {
      const result = await pollJobStatusAction(jobId)
      if (result.ok) {
        onStatusChange(result.status)
        if (result.url) {
          onUrlChange(result.url)
        }
      }
    })
  })

  useEffect(() => {
    if (!AUTO_SYNC_STATUSES.has(currentStatus) || isPending) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      syncStatus()
    }, AUTO_SYNC_INTERVAL_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentStatus, isPending])

  const handleClick = () => {
    syncStatus()
  }

  return (
    <Button
      disabled={isTerminal || isPending}
      onClick={handleClick}
      size="sm"
      variant="outline"
    >
      {isPending ? <Spokes className="size-3" /> : <IconRefresh size={16} />}
      Sync
    </Button>
  )
}

export interface VideoData {
  aspectRatio?: string | null
  costType?: "credit" | "money" | null
  duration?: number | null
  error?: string | null
  estimatedCost?: string | null
  generateAudio: boolean
  generationId?: string | null
  generationTime?: string | null
  inputVideoDuration?: number | null
  jobId: string
  latency?: string | null
  model: string
  prompt: string
  resolution?: string | null
  status: string
  totalCost?: string | null
}

function formatCostValue(
  value: string | null | undefined,
  costType: VideoData["costType"]
): string {
  if (!value) {
    return "—"
  }

  const formattedValue = Number(value).toFixed(4)
  return costType === "credit"
    ? `${formattedValue} credits`
    : `$${formattedValue}`
}

function formatCostUsdValue(
  value: string | null | undefined,
  costType: VideoData["costType"]
): string {
  if (!(value && costType === "credit")) {
    return ""
  }

  return ` (~$${(Number(value) * KIE_CREDIT_USD_RATE).toFixed(4)})`
}

function costsAreEqual(
  first: string | null | undefined,
  second: string | null | undefined
): boolean {
  if (!(first && second)) {
    return false
  }

  const firstValue = Number(first)
  const secondValue = Number(second)

  if (!(Number.isFinite(firstValue) && Number.isFinite(secondValue))) {
    return first === second
  }

  return firstValue === secondValue
}

function PublishButton({
  generationId,
  isPublished,
  publicPath,
}: {
  generationId: string
  isPublished: boolean
  publicPath?: string
}) {
  const [published, setPublished] = useState(isPublished)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await publishGenerationAction(generationId, !published)
      if (result.ok) {
        setPublished(result.publishedAt !== null)
      }
    })
  }

  return (
    <>
      {published && publicPath && (
        <CopyLinkButton href={publicPath} size="sm" variant="outline" />
      )}
      <Button
        disabled={isPending}
        onClick={handleToggle}
        size="sm"
        type="button"
        variant={published ? "default" : "outline"}
      >
        {published ? (
          <>
            <IconWorldOff size={16} />
            Unpublish
          </>
        ) : (
          <>
            <IconWorld size={16} />
            Publish
          </>
        )}
      </Button>
    </>
  )
}

function VideoMetadata({ video }: { video: VideoData }) {
  const showEstimatedCost =
    Boolean(video.estimatedCost) &&
    !costsAreEqual(video.estimatedCost, video.totalCost)
  const showTotalCost = Boolean(video.totalCost)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-4">
      <div className="overflow-hidden rounded-lg border border-border/70">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/70 border-b hover:bg-transparent">
              <TableHead className="h-auto w-36 px-3 py-2">Info</TableHead>
              <TableHead className="h-auto px-3 py-2">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {video.latency && (
              <TableRow className="border-border/60 border-b">
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Latency
                </TableCell>
                <TableCell className="px-3 py-2 tabular-nums">
                  {formatMillisecondsAsSeconds(video.latency)}
                </TableCell>
              </TableRow>
            )}
            {video.generationTime && (
              <TableRow className="border-border/60 border-b">
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Gen Time
                </TableCell>
                <TableCell className="px-3 py-2 tabular-nums">
                  {formatMillisecondsAsMinutes(video.generationTime)}
                </TableCell>
              </TableRow>
            )}
            {video.inputVideoDuration != null && (
              <>
                <TableRow>
                  <TableCell className="px-3 py-2 text-muted-foreground">
                    Input Video
                  </TableCell>
                  <TableCell className="px-3 py-2 tabular-nums">
                    {video.inputVideoDuration}s
                  </TableCell>
                </TableRow>
                <TableRow className="border-border/60 border-b">
                  <TableCell className="px-3 py-2 text-muted-foreground">
                    Billable
                  </TableCell>
                  <TableCell className="px-3 py-2 tabular-nums">
                    {video.duration == null
                      ? `${video.inputVideoDuration}s + —`
                      : `${video.inputVideoDuration}s + ${video.duration}s = ${
                          video.inputVideoDuration + video.duration
                        }s`}
                  </TableCell>
                </TableRow>
              </>
            )}
            {showEstimatedCost && (
              <TableRow className="border-border/60 border-b">
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Est Cost
                </TableCell>
                <TableCell className="px-3 py-2 tabular-nums">
                  {formatCostValue(video.estimatedCost, video.costType)}
                  {formatCostUsdValue(video.estimatedCost, video.costType)}
                </TableCell>
              </TableRow>
            )}
            {showTotalCost && (
              <TableRow className="border-border/60 border-b">
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Total Cost
                </TableCell>
                <TableCell className="px-3 py-2 tabular-nums">
                  {formatCostValue(video.totalCost, video.costType)}
                  {formatCostUsdValue(video.totalCost, video.costType)}
                </TableCell>
              </TableRow>
            )}
            <TableRow className="border-border/60 border-b">
              <TableCell className="px-3 py-2 text-muted-foreground">
                Job ID
              </TableCell>
              <TableCell className="px-3 py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="min-w-0 truncate font-mono text-muted-foreground">
                    {video.jobId}
                  </span>
                  <CopyIdButton label="Job ID" value={video.jobId} />
                </div>
              </TableCell>
            </TableRow>
            {video.generationId && (
              <TableRow className="border-border/60 border-b">
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Gen ID
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 truncate font-mono text-muted-foreground">
                      {video.generationId}
                    </span>
                    <CopyIdButton label="Gen ID" value={video.generationId} />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {video.error && (
              <TableRow>
                <TableCell className="px-3 py-2 text-muted-foreground">
                  Error
                </TableCell>
                <TableCell className="whitespace-normal px-3 py-2 text-rose-600 dark:text-rose-400">
                  {video.error}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface VideoPreviewProps {
  generationId?: string
  initialStatus?: string
  isPublished?: boolean
  jobId?: string
  publicPath?: string
  url: string
  video?: VideoData
}

export function VideoPreview({
  generationId,
  jobId,
  url,
  video,
  initialStatus,
  isPublished = false,
  publicPath,
}: VideoPreviewProps) {
  const [currentStatus, setCurrentStatus] = useState(
    video?.status ?? initialStatus
  )
  const [currentUrl, setCurrentUrl] = useState(url)

  return (
    <div className="w-full space-y-3">
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <div className="flex items-center justify-center px-4 pt-4">
          {currentStatus === "completed" && currentUrl ? (
            <VideoJsPlayer aspectRatio={video?.aspectRatio} src={currentUrl} />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-muted-foreground text-sm">
              <VideoPlaceholder
                hasJob={Boolean(jobId)}
                status={currentStatus}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4">
          {currentStatus && <Status status={currentStatus} />}
          <div className="ml-auto flex items-center gap-2">
            {generationId && currentStatus === "completed" && (
              <PublishButton
                generationId={generationId}
                isPublished={isPublished}
                publicPath={publicPath}
              />
            )}
            {currentUrl && (
              <Button asChild size="sm" variant="outline">
                <a download href={currentUrl} rel="noopener">
                  <IconDownload size={16} />
                  Download
                </a>
              </Button>
            )}
            {jobId && (
              <SyncButton
                currentStatus={currentStatus}
                jobId={jobId}
                onStatusChange={setCurrentStatus}
                onUrlChange={setCurrentUrl}
              />
            )}
          </div>
        </div>
      </div>

      {video && (
        <>
          <Separator />
          <VideoMetadata video={video} />
        </>
      )}
    </div>
  )
}
