"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TournamentListing } from "@/types";
import type { TeamsPageTeamStatus } from "@/lib/teams-page-url";
import { TeamsFiltersFields } from "@/components/teams/teams-filters-fields";

type TeamsFiltersContentProps = {
  tournaments: TournamentListing[];
  selectedTournament: string;
  onTournamentChange: (value: string) => void;
  selectedTeamSize: string;
  onTeamSizeChange: (value: string) => void;
  teamStatus: TeamsPageTeamStatus;
  onTeamStatusChange: (value: TeamsPageTeamStatus) => void;
  onClearFilters: () => void;
  showClearButton: boolean;
};

export function TeamsFiltersContent({
  tournaments,
  selectedTournament,
  onTournamentChange,
  selectedTeamSize,
  onTeamSizeChange,
  teamStatus,
  onTeamStatusChange,
  onClearFilters,
  showClearButton,
}: TeamsFiltersContentProps) {
  return (
    <Card className="mb-6 border-2 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2">
              <Filter className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
              <CardDescription className="mt-0.5 text-xs sm:text-sm">
                Narrow down teams based on tournaments and stats
              </CardDescription>
            </div>
          </div>
          {showClearButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 gap-2 text-xs sm:text-sm"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear Filters
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <TeamsFiltersFields
          tournaments={tournaments}
          selectedTournament={selectedTournament}
          onTournamentChange={onTournamentChange}
          selectedTeamSize={selectedTeamSize}
          onTeamSizeChange={onTeamSizeChange}
          teamStatus={teamStatus}
          onTeamStatusChange={onTeamStatusChange}
        />
      </CardContent>
    </Card>
  );
}
