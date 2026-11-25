import { memo } from "react";

import { formatEloChange } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";

interface EloChangeProps {
  change: number | null;
  className?: string;
}

/** Signed Elo delta with gain/loss coloring. Null renders an em dash. */
export const EloChange = memo(function EloChange({
  change,
  className,
}: EloChangeProps) {
  if (change == null) {
    return (
      <span className={cn("tabular-nums text-muted-foreground", className)}>
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "shrink-0 tabular-nums font-semibold",
        change > 0 && "text-primary",
        change < 0 && "text-destructive",
        change === 0 && "text-muted-foreground",
        className,
      )}
    >
      {formatEloChange(change)}
    </span>
  );
});
