import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Video preview column */}
      <section className="flex h-full min-h-0 flex-1 justify-center overflow-y-auto">
        <div className="w-full max-w-4xl space-y-3 px-4 pt-4">
          {/* Video player */}
          <Skeleton className="aspect-video w-full rounded-md" />

          {/* Status badge + actions */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Metadata rows */}
          <div className="flex gap-6 pb-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                  <Skeleton className="h-3.5" key={i} />
                ))}
              </div>
            </div>
            <div className="flex w-52 shrink-0 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Form aside */}
      <aside className="h-svh min-h-0 w-full max-w-lg shrink-0 overflow-y-auto border-border/80 border-t bg-background lg:border-t-0 lg:border-l">
        {/* Sticky header with tabs */}
        <div className="sticky top-0 z-10 border-border/70 border-b bg-background px-4 py-3 sm:px-5">
          <div className="flex gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-6 px-4 py-4 sm:px-5">
          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Aspect ratio */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-20" />
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <Skeleton className="h-8 w-12" key={i} />
              ))}
            </div>
          </div>

          {/* Resolution + Duration */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-20" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <Skeleton className="h-8 w-14" key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-border/70 border-t bg-background px-4 py-4 sm:px-5">
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
    </div>
  )
}
