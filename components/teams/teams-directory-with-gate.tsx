"use client";

import { FeatureGate } from "@/components/feature-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TeamsDirectoryClient } from "@/components/teams/teams-directory-client";
import type { TeamListing, TournamentListing } from "@/types";

type TeamsDirectoryWithGateProps = {
  initialTeams: TeamListing[];
  initialTournaments: TournamentListing[];
};

export function TeamsDirectoryWithGate({
  initialTeams,
  initialTournaments,
}: TeamsDirectoryWithGateProps) {
  return (
    <FeatureGate feature="teams">
      <TooltipProvider>
        <TeamsDirectoryClient
          initialTeams={initialTeams}
          initialTournaments={initialTournaments}
        />
      </TooltipProvider>
    </FeatureGate>
  );
}
