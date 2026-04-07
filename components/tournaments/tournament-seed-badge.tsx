"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TournamentSeedBadgeProps = {
  seed: number;
  className?: string;
  mono?: boolean;
};

export function tournamentSeedBadgeClass(seed: number, mono = true): string {
  return cn(
    mono && "font-mono",
    "font-bold",
    seed === 1 && "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    seed === 2 && "bg-gray-400/20 text-gray-300 border-gray-400/50",
    seed === 3 && "bg-amber-600/20 text-amber-500 border-amber-600/50",
    seed > 3 && "border-border/60 bg-muted/40 text-muted-foreground",
  );
}

export function TournamentSeedBadge({
  seed,
  className,
  mono = true,
}: TournamentSeedBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 justify-center px-2.5 py-1",
        tournamentSeedBadgeClass(seed, mono),
        className,
      )}
    >
      #{seed}
    </Badge>
  );
}
