"use client"

import type { VideoGenerationResponse } from "@openrouter/sdk/models"
import {
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { syncVideoToR2 } from "@/app/actions/sync-video"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

interface MetaRowProps {
  label: string
  value: React.ReactNode
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  )
}

interface VideoPreviewProps {
  generation?: VideoGenerationResponse | null
  url: string
}

type SyncState = "idle" | "syncing" | "synced" | "error"

const SYNC_ICON: Record<SyncState, React.ReactNode> = {
  idle: <IconCloudUpload size={16} />,
  syncing: <IconLoader2 className="animate-spin" size={16} />,
  synced: <IconCheck size={16} />,
  error: <IconX size={16} />,
}

const SYNC_LABEL: Record<SyncState, string> = {
  idle: "Sync to R2",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Retry sync",
}

interface SyncButtonProps {
  jobId: string
}

function SyncButton({ jobId }: SyncButtonProps) {
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    setSyncState("syncing")
    setSyncError(null)
    startTransition(async () => {
      const result = await syncVideoToR2(jobId)
      if (result.ok) {
        setSyncState("synced")
      } else {
        setSyncState("error")
        setSyncError(result.message)
      }
    })
  }

  return (
    <div className="contents">
      <Button
        disabled={isPending || syncState === "synced"}
        onClick={handleSync}
        size="sm"
        variant="outline"
      >
        {SYNC_ICON[syncState]}
        {SYNC_LABEL[syncState]}
      </Button>
      {syncState === "error" && syncError && (
        <p className="w-full px-4 text-rose-500 text-xs">{syncError}</p>
      )}
    </div>
  )
}

export function VideoPreview({ generation, url }: VideoPreviewProps) {
  const downloadHref = generation ? `/api/videos/${generation.id}/content` : url

  const statusConfig = generation
    ? (STATUS_CONFIG[generation.status] ?? STATUS_CONFIG.pending)
    : null

  return (
    <div className="w-full max-w-4xl space-y-3">
      <div className="flex items-center justify-center px-4 pt-4">
        {/* biome-ignore lint/a11y/useMediaCaption: no captions available for generated video */}
        <video className="max-h-[40vh] w-full rounded-md" controls src={url} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        {statusConfig && (
          <Badge className={statusConfig.className} variant="outline">
            {statusConfig.label}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {generation && <SyncButton jobId={generation.id} />}
          <Button asChild size="sm" variant="outline">
            <a download href={downloadHref} rel="noopener">
              <IconDownload size={16} />
              Download
            </a>
          </Button>
        </div>
      </div>

      {generation && (
        <>
          <Separator />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 px-4 text-xs">
            <MetaRow
              label="Job ID"
              value={
                <span className="font-mono text-muted-foreground">
                  {generation.id}
                </span>
              }
            />
            {generation.generationId && (
              <MetaRow
                label="Generation ID"
                value={
                  <span className="font-mono text-muted-foreground">
                    {generation.generationId}
                  </span>
                }
              />
            )}
            {generation.usage?.cost != null && (
              <MetaRow
                label="Cost"
                value={
                  <span className="tabular-nums">
                    ${generation.usage.cost.toFixed(4)}
                  </span>
                }
              />
            )}
            {generation.usage?.isByok && (
              <MetaRow label="Key" value="Bring Your Own Key" />
            )}
            {generation.unsignedUrls && generation.unsignedUrls.length > 0 && (
              <MetaRow label="Outputs" value={generation.unsignedUrls.length} />
            )}
            {generation.error && (
              <MetaRow
                label="Error"
                value={
                  <span className="text-rose-500">{generation.error}</span>
                }
              />
            )}
          </dl>
        </>
      )}
    </div>
  )
}
