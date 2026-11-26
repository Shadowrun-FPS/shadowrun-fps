import { cn } from "@/lib/utils";
import type { EncounterResult } from "@/types/rivals";

const RESULT_LABEL: Record<EncounterResult, string> = {
  win: "Win",
  loss: "Loss",
  unresolved: "Result unavailable",
};

const RESULT_MARK: Record<EncounterResult, string> = {
  win: "W",
  loss: "L",
  unresolved: "–",
};

export function ResultPips({
  results,
  className,
}: {
  results: EncounterResult[];
  className?: string;
}) {
  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No meetings yet.</p>;
  }

  const summary = results.map((result) => RESULT_LABEL[result]).join(", ");

  return (
    <ol
      aria-label={`Last ${results.length} results: ${summary}`}
      className={cn("flex flex-wrap gap-1", className)}
    >
      {results.map((result, index) => (
        <li
          key={`${result}-${index}`}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
            result === "win" && "bg-primary/15 text-primary",
            result === "loss" && "bg-destructive/15 text-destructive",
            result === "unresolved" && "bg-muted text-muted-foreground",
          )}
        >
          <span className="sr-only">{RESULT_LABEL[result]}</span>
          <span aria-hidden="true">{RESULT_MARK[result]}</span>
        </li>
      ))}
    </ol>
  );
}

export function resultLabel(result: EncounterResult): string {
  return RESULT_LABEL[result];
}
