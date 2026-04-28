import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder layout while changelog JSON is loading (matches dialog structure). */
export function ChangelogDialogSkeleton() {
  return (
    <div
      className="space-y-10"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading changelog"
    >
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-[5.25rem] rounded-md bg-muted/80" />
            <Skeleton className="h-5 w-[3.25rem] rounded-md bg-emerald-900/40" />
          </div>
          <Skeleton className="h-4 w-[5.5rem] rounded-md bg-muted/70" />
        </div>
        <ul className="m-0 list-none space-y-5 p-0">
          {PLACEHOLDER_NOTE_KEYS.map((key) => (
            <li key={key} className="flex gap-3">
              <Skeleton className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/40" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 max-w-[28rem] rounded-md bg-muted/75" />
                <Skeleton className="h-3 w-full rounded-md bg-muted/55" />
                <Skeleton className="h-3 max-w-[92%] rounded-md bg-muted/55" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5 opacity-[0.65]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-16 rounded-md bg-muted/65" />
          <Skeleton className="h-4 w-20 rounded-md bg-muted/55" />
        </div>
        <div className="space-y-5">
          {PLACEHOLDER_SECOND_KEYS.map((key) => (
            <div key={key} className="flex gap-3">
              <Skeleton className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/25" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 max-w-[22rem] rounded-md bg-muted/55" />
                <Skeleton className="h-3 w-[95%] rounded-md bg-muted/45" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const PLACEHOLDER_NOTE_KEYS = ["s1", "s2", "s3", "s4"] as const;
const PLACEHOLDER_SECOND_KEYS = ["t1", "t2"] as const;
