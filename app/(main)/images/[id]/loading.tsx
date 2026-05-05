import { Skeleton } from "@/components/ui/skeleton"

function SkeletonField({
  descriptionWidth = "w-3/4",
  itemCount = 3,
  itemWidths,
  labelWidth = "w-16",
  type = "toggle",
}: {
  descriptionWidth?: string
  itemCount?: number
  itemWidths?: string[]
  labelWidth?: string
  type?: "toggle" | "input" | "select"
}) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-4 ${labelWidth}`} />
      <Skeleton className={`h-3 ${descriptionWidth}`} />
      {type === "input" && <Skeleton className="h-9 w-full" />}
      {type === "select" && <Skeleton className="h-9 w-full" />}
      {type === "toggle" && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: itemCount }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            <Skeleton className={`h-8 ${itemWidths?.[i] ?? "w-16"}`} key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full">
          <div className="mx-auto w-full max-w-4xl">
            <div className="space-y-4 px-4 pt-4 pb-4">
              <Skeleton className="aspect-video w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-border/70 border-t bg-background px-4 pt-4 pb-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <Skeleton className="h-[168px] w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      <div className="sticky top-0 z-10 border-border/70 border-b bg-background px-4 py-3">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-6">
            <SkeletonField
              descriptionWidth="w-full"
              labelWidth="w-12"
              type="select"
            />
            <div className="border-border/50 border-t" />
            <SkeletonField
              descriptionWidth="w-5/6"
              labelWidth="w-8"
              type="input"
            />
            <div className="border-border/50 border-t" />
            <SkeletonField
              descriptionWidth="w-4/5"
              itemCount={4}
              itemWidths={["w-16", "w-20", "w-20", "w-8"]}
              labelWidth="w-8"
            />
            <SkeletonField
              descriptionWidth="w-3/4"
              itemCount={4}
              itemWidths={["w-8", "w-10", "w-10", "w-8"]}
              labelWidth="w-14"
            />
            <div className="border-border/50 border-t" />
            <SkeletonField
              descriptionWidth="w-3/4"
              itemCount={4}
              itemWidths={["w-6", "w-6", "w-6", "w-6"]}
              labelWidth="w-12"
            />
            <div className="border-border/50 border-t" />
            <SkeletonField
              descriptionWidth="w-4/5"
              itemCount={3}
              itemWidths={["w-16", "w-12", "w-20"]}
              labelWidth="w-20"
            />
            <SkeletonField
              descriptionWidth="w-4/5"
              itemCount={2}
              itemWidths={["w-14", "w-12"]}
              labelWidth="w-20"
            />
          </div>
        </div>

        <div className="sticky bottom-0 mt-0 border-border/70 border-t bg-background px-4 pt-4 pb-4 sm:px-5">
          <Skeleton className="h-[72px] w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

export default function ImagePageLoading() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      <section className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <PreviewSkeleton />
      </section>
      <aside className="h-svh min-h-0 w-full max-w-sm shrink-0 overflow-y-auto border-border/80 border-t bg-background md:max-w-md lg:border-t-0 lg:border-l xl:max-w-lg">
        <FormSkeleton />
      </aside>
    </div>
  )
}
