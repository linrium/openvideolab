import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Video preview column */}
      <section className="flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div className="max-h-[65vh] min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl space-y-3 px-4 pt-4">
            {/* Video player */}
            <Skeleton className="mx-auto aspect-video w-full max-w-[calc(50vh*16/9)] rounded-md" />

            {/* Status badge + actions */}
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>

            {/* Separator */}
            <Skeleton className="h-px w-full" />

            {/* Metadata table */}
            <div className="pb-4">
              <div className="overflow-hidden rounded-lg border border-border/70">
                <div className="grid grid-cols-[9rem_1fr] gap-x-3 border-border/70 border-b bg-muted/30 px-3 py-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-14" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    className="grid grid-cols-[9rem_1fr] gap-x-3 border-border/60 border-b px-3 py-2 last:border-b-0"
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                    key={i}
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky prompt composer */}
        <div className="sticky bottom-0 border-border/70 border-t bg-background pt-4 pb-4">
          <div className="mx-auto w-full max-w-4xl">
            <div className="px-4">
              <Skeleton className="h-[calc(16*1.25rem+1rem)] max-h-[calc(16*1.25rem+1rem)] w-full rounded-md" />
              <div className="mt-2 flex justify-end">
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form aside */}
      <aside className="relative h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:w-[448px] lg:min-w-80 lg:max-w-[min(50vw,48rem)] lg:border-t-0 lg:border-l">
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
