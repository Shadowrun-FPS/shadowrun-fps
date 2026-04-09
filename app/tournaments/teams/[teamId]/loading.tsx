import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        {/* Back button */}
        <div className="mb-6">
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>

        {/* Hero — left image panel + right info */}
        <div className="mb-8 grid gap-8 lg:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Left: image / about panel */}
          <Skeleton className="min-h-[220px] rounded-3xl sm:min-h-[280px]" />

          {/* Right: identity + actions + stats */}
          <div className="flex flex-col gap-6">
            {/* Team name */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-3/4 rounded-lg" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>

            {/* Share */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-10 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>

            {/* Team stats pills */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-20 rounded-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-12 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom two-column: upcoming events + roster */}
        <div className="grid gap-6 lg:grid-cols-[1fr,minmax(0,380px)] lg:gap-8">
          {/* Upcoming events */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="min-h-[260px] rounded-xl" />
          </div>

          {/* Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-3 w-40 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invites section */}
        <div className="mt-8 border-t border-border/40 pt-8 space-y-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
