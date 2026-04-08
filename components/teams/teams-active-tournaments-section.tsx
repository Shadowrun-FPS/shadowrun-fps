"use client";

import Link from "next/link";
import { Calendar, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TournamentListing } from "@/types";
import { TeamsPageSectionHeading } from "@/components/teams/teams-page-section-heading";

/** Document-level status variants used across older data and match-level naming */
function normalizedTournamentStatus(status: string | undefined): string {
  return (status ?? "").toLowerCase().replace(/-/g, "_");
}

function isActiveOrUpcomingListing(status: string | undefined): boolean {
  const s = normalizedTournamentStatus(status);
  return (
    s === "upcoming" ||
    s === "active" ||
    s === "live" ||
    s === "in_progress"
  );
}

function badgeLabelAndVariant(status: string | undefined): {
  label: string;
  variant: "live" | "upcoming" | "other";
} {
  const s = normalizedTournamentStatus(status);
  if (s === "upcoming") return { label: "UPCOMING", variant: "upcoming" };
  if (s === "active" || s === "live" || s === "in_progress") {
    return { label: "LIVE", variant: "live" };
  }
  return { label: "COMPLETED", variant: "other" };
}

type TeamsActiveTournamentsSectionProps = {
  tournaments: TournamentListing[];
  formatDate: (iso: string) => string;
};

export function TeamsActiveTournamentsSection({
  tournaments,
  formatDate,
}: TeamsActiveTournamentsSectionProps) {
  const active = tournaments.filter((t) => isActiveOrUpcomingListing(t.status));

  return (
    <div className="mt-8 sm:mt-12">
      <TeamsPageSectionHeading icon={Trophy} title="Active Tournaments" className="mb-4 sm:mb-6" />
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active or upcoming tournaments right now.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {active.map((tournament) => {
            const badge = badgeLabelAndVariant(tournament.status);
            return (
            <Link
              key={tournament._id}
              href={`/tournaments/${tournament._id}`}
              className="transition-transform motion-reduce:transform-none hover:scale-[1.02] motion-reduce:hover:scale-100 hover:shadow-lg"
            >
              <Card className="h-full overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 transition-all hover:border-primary/40 hover:shadow-xl">
                <div className="flex h-full flex-col p-4 sm:p-6">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="pr-2 text-lg font-bold sm:text-xl">{tournament.name}</h3>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${
                        badge.variant === "live"
                          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                          : badge.variant === "upcoming"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-muted/50"
                      }`}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {tournament.format === "single_elimination"
                        ? "Single Elimination"
                        : "Double Elimination"}
                    </Badge>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tournament.description || "Our first tournament!"}
                    </p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="truncate">{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="truncate">
                        {tournament.registeredTeams?.length || 0}/{tournament.maxTeams || 8} teams
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
