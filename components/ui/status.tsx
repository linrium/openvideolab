import type { ComponentProps, HTMLAttributes } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const STATUS_CONFIG = {
  completed: {
    indicatorClassName: "bg-emerald-500",
    label: "Completed",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  in_progress: {
    indicatorClassName: "bg-sky-500",
    label: "In Progress",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  pending: {
    indicatorClassName: "bg-amber-500",
    label: "Pending",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  failed: {
    indicatorClassName: "bg-rose-500",
    label: "Failed",
    className:
      "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  cancelled: {
    indicatorClassName: "bg-zinc-400",
    label: "Cancelled",
    className: "border-zinc-400/40 bg-zinc-400/10 text-zinc-500",
  },
  expired: {
    indicatorClassName: "bg-zinc-400",
    label: "Expired",
    className: "border-zinc-400/40 bg-zinc-400/10 text-zinc-500",
  },
} as const

export type StatusValue = keyof typeof STATUS_CONFIG

function getStatusConfig(status: string | null | undefined) {
  if (status && status in STATUS_CONFIG) {
    return STATUS_CONFIG[status as StatusValue]
  }

  return STATUS_CONFIG.pending
}

export type StatusProps = ComponentProps<typeof Badge> & {
  status: string | null | undefined
}

export const Status = ({
  children,
  className,
  status,
  ...props
}: StatusProps) => {
  const config = getStatusConfig(status)

  return (
    <Badge
      className={cn("inline-flex items-center gap-1.5", config.className, className)}
      variant="outline"
      {...props}
    >
      {children ?? (
        <>
          <StatusIndicator status={status} />
          <StatusLabel status={status} />
        </>
      )}
    </Badge>
  )
}

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  status: string | null | undefined
}

export const StatusIndicator = ({
  className,
  status,
  ...props
}: StatusIndicatorProps) => {
  const config = getStatusConfig(status)

  return (
    <span className={cn("relative flex size-2", className)} {...props}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          config.indicatorClassName
        )}
      />
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          config.indicatorClassName
        )}
      />
    </span>
  )
}

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement> & {
  status: string | null | undefined
}

export const StatusLabel = ({
  className,
  status,
  ...props
}: StatusLabelProps) => {
  const config = getStatusConfig(status)

  return (
    <span className={className} {...props}>
      {config.label}
    </span>
  )
}
