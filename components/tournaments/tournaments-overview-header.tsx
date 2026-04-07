"use client";

import { PlusCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

type TournamentsOverviewHeaderProps = {
  canCreateTournament: boolean;
  onCreateClick: () => void;
};

export function TournamentsOverviewHeader({
  canCreateTournament,
  onCreateClick,
}: TournamentsOverviewHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 shadow-lg shadow-primary/10">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
          <Trophy
            className="relative h-6 w-6 text-primary drop-shadow-sm sm:h-7 sm:w-7"
            aria-hidden
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Tournaments
          </h1>
          <p className="mt-1 text-sm text-foreground/70 sm:text-base">
            Browse, filter, and register for competitive events
          </p>
        </div>
      </div>
      {canCreateTournament ? (
        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 rounded-full sm:h-12 sm:w-auto"
          onClick={onCreateClick}
        >
          <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
          Create tournament
        </Button>
      ) : null}
    </div>
  );
}
