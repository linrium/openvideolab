import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const historyGroups = [
  {
    dateLabel: "Today",
    items: [
      {
        duration: "15 sec",
        prompt:
          "Rainy alley chase scene with neon reflections and handheld camera movement.",
        status: "Completed",
        timeLabel: "10:24",
        title: "Cyberpunk Chase",
      },
      {
        duration: "10 sec",
        prompt:
          "Studio product teaser with glossy turntable motion and dramatic spotlight transitions.",
        status: "Queued",
        timeLabel: "08:12",
        title: "Turntable Teaser",
      },
    ],
  },
  {
    dateLabel: "Yesterday",
    items: [
      {
        duration: "10 sec",
        prompt:
          "Quiet lakeside sunrise with mist drifting across the water and slow cinematic pan.",
        status: "Rendering",
        timeLabel: "18:05",
        title: "Lake Sunrise",
      },
    ],
  },
  {
    dateLabel: "Apr 29",
    items: [
      {
        duration: "5 sec",
        prompt:
          "Fantasy castle reveal above the clouds with sweeping aerial motion.",
        status: "Draft",
        timeLabel: "09:40",
        title: "Castle Reveal",
      },
      {
        duration: "15 sec",
        prompt:
          "Futuristic city fly-through with layered parallax traffic and reflective glass towers.",
        status: "Failed",
        timeLabel: "07:18",
        title: "City Fly-Through",
      },
    ],
  },
] as const

type HistoryStatus = (typeof historyGroups)[number]["items"][number]["status"]

const statusVariantByStatus: Record<
  HistoryStatus,
  "default" | "destructive" | "outline" | "secondary"
> = {
  Completed: "default",
  Draft: "outline",
  Failed: "destructive",
  Queued: "secondary",
  Rendering: "secondary",
}

const statusClassNameByStatus: Partial<Record<HistoryStatus, string>> = {
  Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Draft: "border-border/80 bg-background text-muted-foreground",
  Queued: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Rendering: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
}

export const metadata: Metadata = {
  title: "History | OpenVideoLab",
  description: "Review previous video generations in OpenVideoLab.",
}

export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="font-heading font-medium text-lg tracking-tight">
          History
        </h1>
        <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
          Review recent generations, in-progress jobs, and saved drafts.
        </p>
      </div>

      <div className="flex max-w-5xl flex-col gap-6">
        {historyGroups.map((group) => (
          <section className="flex flex-col gap-3" key={group.dateLabel}>
            <h2 className="font-medium text-[0.6875rem] tracking-tight">
              {group.dateLabel}
            </h2>

            <div className="grid gap-3">
              {group.items.map((item) => (
                <Card
                  className="w-full"
                  key={`${group.dateLabel}-${item.title}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <CardTitle className="truncate text-xs">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-[0.6875rem] leading-relaxed">
                            {item.prompt}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={`h-4 px-1.5 text-[0.5625rem] ${statusClassNameByStatus[item.status] ?? ""}`}
                        variant={statusVariantByStatus[item.status]}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3 text-[0.625rem] text-muted-foreground">
                      <span>Time: {item.timeLabel}</span>
                      <span>Duration: {item.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
