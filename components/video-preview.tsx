"use client"

import {
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { pollJobStatusAction } from "@/app/actions/poll-job-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { VideoJobStatus } from "@/lib/openrouter-client"

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

const TERMINAL_STATUSES = new Set([
  "completed",
  "failed",
  "cancelled",
  "expired",
])

interface MetaRowProps {
  label: string
  value: React.ReactNode
}

function formatMillisecondsAsMinutes(value: string): string {
  const minutes = Number(value) / 60_000
  return `${minutes.toFixed(2)} min`
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  )
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
        <IconRefresh className="text-muted-foreground" size={24} />
        <span>Create a video to see its preview here</span>
      </>
    )
  }

  if (status === "failed") {
    return (
      <>
        <IconX className="text-rose-500" size={24} />
        <span className="text-rose-500">Generation failed</span>
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
      <IconLoader2 className="animate-spin" size={24} />
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

  const handleClick = () => {
    startTransition(async () => {
      const result = await pollJobStatusAction(jobId)
      if (result.ok) {
        onStatusChange(result.status)
        if (result.url) {
          onUrlChange(result.url)
        }
      }
    })
  }

  return (
    <Button
      disabled={isTerminal || isPending}
      onClick={handleClick}
      size="sm"
      variant="outline"
    >
      {isPending ? (
        <IconLoader2 className="animate-spin" size={16} />
      ) : (
        <IconRefresh size={16} />
      )}
      Sync
    </Button>
  )
}

export interface VideoData {
  aspectRatio?: string | null
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
    <div className="w-full max-w-4xl space-y-3">
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
            <VideoPlaceholder hasJob={Boolean(jobId)} status={currentStatus} />
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

      {video && (
        <>
          <Separator />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 px-4 text-xs">
            <MetaRow
              label="Job ID"
              value={
                <span className="font-mono text-muted-foreground">
                  {video.jobId}
                </span>
              }
            />
            {video.generationId && (
              <MetaRow
                label="Generation ID"
                value={
                  <span className="font-mono text-muted-foreground">
                    {video.generationId}
                  </span>
                }
              />
            )}
            {video.error && (
              <MetaRow
                label="Error"
                value={
                  <span className="text-rose-600 dark:text-rose-400">
                    {video.error}
                  </span>
                }
              />
            )}
            {video.latency && (
              <MetaRow
                label="Latency"
                value={
                  <span className="tabular-nums">
                    {formatMillisecondsAsMinutes(video.latency)}
                  </span>
                }
              />
            )}
            {video.generationTime && (
              <MetaRow
                label="Generation Time"
                value={
                  <span className="tabular-nums">
                    {formatMillisecondsAsMinutes(video.generationTime)}
                  </span>
                }
              />
            )}
            {video.estimatedCost && (
              <MetaRow
                label="Estimated Cost"
                value={
                  <span className="tabular-nums">
                    ${Number(video.estimatedCost).toFixed(4)}
                  </span>
                }
              />
            )}
            {video.totalCost && (
              <MetaRow
                label="Total Cost"
                value={
                  <span className="tabular-nums">
                    ${Number(video.totalCost).toFixed(4)}
                  </span>
                }
              />
            )}
          </dl>
        </>
      )}
    </div>
  )
}
