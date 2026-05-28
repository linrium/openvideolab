"use client"

import {
  ArrowReloadHorizontalIcon,
  Cancel01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useEffectEvent, useState, useTransition } from "react"
import { pollJobStatusAction } from "@/app/actions/poll-job-status-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { VideoJobStatus } from "@/lib/openrouter-client"
import { Spokes } from "./loading-ui/spokes"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  pending: {
    label: "Pending",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    className:
      "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-zinc-400/40 bg-zinc-400/10 text-zinc-500",
  },
  expired: {
    label: "Expired",
    className: "border-zinc-400/40 bg-zinc-400/10 text-zinc-500",
  },
}

// const TERMINAL_STATUSES = new Set([
//   "completed",
//   "failed",
//   "cancelled",
//   "expired",
// ])
const AUTO_SYNC_STATUSES = new Set(["pending", "in_progress"])
const AUTO_SYNC_INTERVAL_MS = 5000

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
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={ArrowReloadHorizontalIcon}
          size={24}
          strokeWidth={2}
        />
        <span>Create a video to see its preview here</span>
      </>
    )
  }

  if (status === "failed") {
    return (
      <>
        <HugeiconsIcon
          className="text-rose-500"
          icon={Cancel01Icon}
          size={24}
          strokeWidth={2}
        />
        <span className="text-rose-500">Generation failed</span>
      </>
    )
  }
  if (status === "cancelled" || status === "expired") {
    return (
      <>
        <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={2} />
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
  // const isTerminal = TERMINAL_STATUSES.has(currentStatus)

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
      // disabled={isTerminal || isPending}
      onClick={handleClick}
      size="sm"
      variant="outline"
    >
      {isPending ? (
        <Spokes className="size-3" />
      ) : (
        <HugeiconsIcon
          icon={ArrowReloadHorizontalIcon}
          size={16}
          strokeWidth={2}
        />
      )}
      Sync
    </Button>
  )
}

export interface VideoData {
  aspectRatio?: string | null
  duration?: number | null
  error?: string | null
  estimatedCost?: string | null
  generateAudio: boolean
  generationId?: string | null
  generationTime?: string | null
  jobId: string
  latency?: string | null
  model: string
  prompt: string
  resolution?: string | null
  status: string
  totalCost?: string | null
}

interface VideoPreviewProps {
  initialStatus?: string
  jobId?: string
  url: string
  video?: VideoData
}

export function VideoPreview({
  jobId,
  url,
  video,
  initialStatus,
}: VideoPreviewProps) {
  const [currentStatus, setCurrentStatus] = useState(
    video?.status ?? initialStatus
  )
  const [currentUrl, setCurrentUrl] = useState(url)

  const statusConfig = currentStatus
    ? (STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.pending)
    : null

  return (
    <div className="w-full space-y-3">
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <div className="flex items-center justify-center px-4 pt-4">
          {currentStatus === "completed" ? (
            // biome-ignore lint/a11y/useMediaCaption: no captions available for generated video
            <video
              className="max-h-[40vh] w-full rounded-md"
              controls
              src={currentUrl}
            />
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
          {statusConfig && (
            <Badge className={statusConfig.className} variant="outline">
              {statusConfig.label}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {currentUrl && (
              <Button asChild size="sm" variant="outline">
                <a download href={currentUrl} rel="noopener">
                  <HugeiconsIcon
                    icon={Download01Icon}
                    size={16}
                    strokeWidth={2}
                  />
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
          <div className="mx-auto flex w-full max-w-4xl gap-6 px-4 pb-4 text-xs">
            {/* Left: time + cost */}
            <dl className="grid flex-1 grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-0.5">
              {(video.latency || video.generationTime) && (
                <>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Latency
                  </dt>
                  <dd className="tabular-nums">
                    {video.latency
                      ? formatMillisecondsAsSeconds(video.latency)
                      : "—"}
                  </dd>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Gen Time
                  </dt>
                  <dd className="tabular-nums">
                    {video.generationTime
                      ? formatMillisecondsAsMinutes(video.generationTime)
                      : "—"}
                  </dd>
                </>
              )}
              {(video.estimatedCost || video.totalCost) && (
                <>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Est Cost
                  </dt>
                  <dd className="tabular-nums">
                    {video.estimatedCost
                      ? `$${Number(video.estimatedCost).toFixed(4)}`
                      : "—"}
                  </dd>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Total Cost
                  </dt>
                  <dd className="tabular-nums">
                    {video.totalCost
                      ? `$${Number(video.totalCost).toFixed(4)}`
                      : "—"}
                  </dd>
                </>
              )}
              {video.error && (
                <>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Error
                  </dt>
                  <dd className="col-span-3 text-rose-600 dark:text-rose-400">
                    {video.error}
                  </dd>
                </>
              )}
            </dl>

            {/* Right: IDs */}
            <dl className="grid w-52 shrink-0 grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
              <dt className="whitespace-nowrap text-muted-foreground/70">
                Job ID
              </dt>
              <dd className="min-w-0 truncate font-mono text-muted-foreground">
                {video.jobId}
              </dd>
              {video.generationId && (
                <>
                  <dt className="whitespace-nowrap text-muted-foreground/70">
                    Gen ID
                  </dt>
                  <dd className="min-w-0 truncate font-mono text-muted-foreground">
                    {video.generationId}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
