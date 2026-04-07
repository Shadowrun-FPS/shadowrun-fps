"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import { useFeatureFlag } from "@/lib/use-feature-flag";
import { safeLog } from "@/lib/security";
import { buildRankingsList, getTeamRankInList } from "@/lib/rankings-sort";
import type {
  RankingsSortDirection,
  RankingsSortOption,
  TeamRankingRow,
} from "@/types/rankings";
import { RankingsHero } from "@/components/tournaments/rankings/rankings-hero";
import { RankingsLoadingSkeleton } from "@/components/tournaments/rankings/rankings-loading-skeleton";
import { RankingsPagination } from "@/components/tournaments/rankings/rankings-pagination";
import { RankingsSortHeader } from "@/components/tournaments/rankings/rankings-sort-header";
import { RankingsStatStrip } from "@/components/tournaments/rankings/rankings-stat-strip";
import { RankingsTeamRow } from "@/components/tournaments/rankings/rankings-team-row";
import { RankingsToolbar } from "@/components/tournaments/rankings/rankings-toolbar";

async function fetchTeamRankings(): Promise<TeamRankingRow[]> {
  const { deduplicatedFetch } = await import("@/lib/request-deduplication");
  return deduplicatedFetch<TeamRankingRow[]>("/api/teams", { ttl: 30_000 });
}

export function RankingsPageContent() {
  const [sortBy, setSortBy] = useState<RankingsSortOption>("winRatio");
  const [sortDirection, setSortDirection] =
    useState<RankingsSortDirection>("desc");
  const [teams, setTeams] = useState<TeamRankingRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamSize, setSelectedTeamSize] = useState<string>("4");
  const teamsPerPage = 10;

  const playerStatsEnabled = useFeatureFlag("playerStats");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeamRankings();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      safeLog.error("Team rankings fetch failed:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const availableTeamSizes = useMemo(() => {
    const sizes = new Set<number>();
    teams.forEach((team) => {
      sizes.add(team.teamSize || 4);
    });
    return Array.from(sizes).sort((a, b) => a - b);
  }, [teams]);

  useEffect(() => {
    if (
      availableTeamSizes.length > 0 &&
      !availableTeamSizes.includes(parseInt(selectedTeamSize, 10))
    ) {
      setSelectedTeamSize(availableTeamSizes[0].toString());
    }
  }, [availableTeamSizes, selectedTeamSize]);

  const sortedTeams = useMemo(
    () =>
      buildRankingsList(teams, {
        teamSize: parseInt(selectedTeamSize, 10),
        searchQuery,
        sortBy,
        sortDirection,
      }),
    [teams, selectedTeamSize, searchQuery, sortBy, sortDirection],
  );

  const totalPages = Math.ceil(sortedTeams.length / teamsPerPage);
  const currentTeams = sortedTeams.slice(
    (currentPage - 1) * teamsPerPage,
    currentPage * teamsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortDirection, selectedTeamSize]);

  const handleSort = (column: RankingsSortOption) => {
    if (sortBy === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    scrollTop();
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    scrollTop();
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    scrollTop();
  };

  if (loading && teams.length === 0) {
    return (
      <FeatureGate feature="rankings">
        <RankingsLoadingSkeleton />
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="rankings">
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
          <RankingsHero />
          <RankingsStatStrip sortedTeams={sortedTeams} />

          <Card className="mt-6 border-2 border-primary/20">
            <RankingsToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              availableTeamSizes={availableTeamSizes}
              selectedTeamSize={selectedTeamSize}
              onTeamSizeChange={setSelectedTeamSize}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onMobileSortChange={(sb, dir) => {
                setSortBy(sb);
                setSortDirection(dir);
              }}
            />

            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Refreshing…</p>
                </div>
              ) : sortedTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-16">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Trophy className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No teams found</h3>
                  <p className="max-w-md text-center text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search or team size."
                      : "No teams have been created yet."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <RankingsSortHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  {(() => {
                    const teamsBySize = currentTeams.reduce(
                      (acc, team) => {
                        const sz = team.teamSize || 4;
                        if (!acc[sz]) acc[sz] = [];
                        acc[sz].push(team);
                        return acc;
                      },
                      {} as Record<number, typeof currentTeams>,
                    );

                    const sortedSizes = Object.keys(teamsBySize)
                      .map(Number)
                      .sort((a, b) => a - b);

                    return sortedSizes.map((teamSizeKey) => (
                      <React.Fragment key={teamSizeKey}>
                        {teamsBySize[teamSizeKey].map((team) => {
                          const teamRank = getTeamRankInList(
                            sortedTeams,
                            team._id.toString(),
                          );
                          return (
                            <RankingsTeamRow
                              key={team._id.toString()}
                              team={team}
                              teamRank={teamRank}
                              playerStatsEnabled={playerStatsEnabled}
                            />
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                </div>
              )}

              {!loading && sortedTeams.length > 0 && totalPages > 1 ? (
                <RankingsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={sortedTeams.length}
                  pageSize={teamsPerPage}
                  onPageChange={paginate}
                  onPrev={prevPage}
                  onNext={nextPage}
                />
              ) : null}
            </CardContent>
          </Card>
        </main>
      </div>
    </FeatureGate>
  );
}
