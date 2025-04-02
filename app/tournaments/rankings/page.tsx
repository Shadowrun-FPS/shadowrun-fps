"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import {
  Trophy,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Medal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { MongoTeam } from "@/types/mongodb";
import { ReactNode } from "react";
import { FeatureGate } from "@/components/feature-gate";

interface TeamWithStats extends MongoTeam {
  calculatedElo: number;
  winRatio: number;
  teamElo?: number;
}

async function getTeamRankings(): Promise<TeamWithStats[]> {
  try {
    const response = await fetch("/api/teams");
    const teams: TeamWithStats[] = await response.json();

    // Sort teams by ELO by default
    return teams.sort((a, b) => {
      // First sort by teamElo (or calculatedElo if teamElo is not available)
      const aElo = a.teamElo || a.calculatedElo || 0;
      const bElo = b.teamElo || b.calculatedElo || 0;
      return bElo - aElo;
    });
  } catch (error) {
    console.error("Failed to fetch team rankings:", error);
    return [];
  }
}

type SortOption = "winRatio" | "elo" | "wins" | "losses";

export default function RankingsPage() {
  // Change default sort to "elo"
  const [sortBy, setSortBy] = useState<SortOption>("elo");
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const teamsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    getTeamRankings().then((data) => {
      setTeams(data);
      setLoading(false);
    });
  }, []);

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortBy(
          sortBy === "elo" ? ("winRatio" as SortOption) : ("elo" as SortOption)
        );
      } else {
        setSortBy(field as SortOption);
      }
    },
    [sortBy]
  );

  // Add this useEffect to sort by ELO when the component mounts
  useEffect(() => {
    if (teams.length > 0) {
      handleSort("elo");
    }
  }, [teams.length, handleSort]);

  // Calculate pagination
  const totalPages = Math.ceil(teams.length / teamsPerPage);
  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = teams.slice(indexOfFirstTeam, indexOfLastTeam);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <FeatureGate feature="rankings">
      <div className="min-h-screen bg-background">
        <main className="container px-4 py-8 mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 border-b sm:space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Team Rankings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Global rankings for all competitive teams
                  </p>
                </div>
                <Select value={sortBy} onValueChange={handleSort}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elo">Team ELO</SelectItem>
                    <SelectItem value="winRatio">Win Ratio</SelectItem>
                    <SelectItem value="wins">Most Wins</SelectItem>
                    <SelectItem value="losses">Most Losses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {/* Header row - Hide on mobile */}
                <div className="hidden px-6 py-4 sm:flex bg-muted/50">
                  <div className="w-8" />
                  <div className="flex-1" />
                  <div className="grid grid-cols-4 gap-6 text-sm font-medium text-muted-foreground w-[400px]">
                    <div className="text-center">Team ELO</div>
                    <div className="text-center">Wins</div>
                    <div className="text-center">Losses</div>
                    <div className="text-center">Win Rate</div>
                  </div>
                </div>

                {/* Team rows */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 rounded-full border-t-primary animate-spin" />
                  </div>
                ) : (
                  currentTeams.map((team, index) => (
                    <div
                      key={team._id.toString()}
                      className="relative px-4 py-4 transition-colors sm:px-6 group hover:bg-muted/50"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-primary/10 group-hover:bg-primary/20" />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Rank and Team Info */}
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8">
                            {indexOfFirstTeam + index < 3 ? (
                              <Medal
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${getMedalColor(
                                  indexOfFirstTeam + index
                                )}`}
                              />
                            ) : (
                              <span className="text-base font-semibold sm:text-lg text-muted-foreground">
                                #{indexOfFirstTeam + index + 1}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-base font-semibold sm:text-lg">
                              {team.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Captain: {team.captain.discordNickname}
                            </p>
                          </div>
                        </div>

                        {/* Stats Grid - Responsive layout */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 sm:w-[400px] ml-12 sm:ml-auto">
                          <Stat
                            icon={<TrendingUp className="w-4 h-4" />}
                            value={team.teamElo?.toLocaleString() || "0"}
                            label="ELO"
                          />
                          <Stat
                            icon={
                              <ArrowUp className="w-4 h-4 text-green-500" />
                            }
                            value={Number(team.wins || 0)}
                            label="Wins"
                          />
                          <Stat
                            icon={
                              <ArrowDown className="w-4 h-4 text-red-500" />
                            }
                            value={Number(team.losses || 0)}
                            label="Losses"
                          />
                          <Stat
                            icon={<Trophy className="w-4 h-4 text-primary" />}
                            value={`${(team.winRatio * 100).toFixed(1)}%`}
                            label="Win Rate"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {!loading && teams.length > 0 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="bg-[#111827] border-[#1f2937]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(page)}
                          className={
                            page === currentPage
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-[#111827] border-[#1f2937]"
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="bg-[#111827] border-[#1f2937]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </FeatureGate>
  );
}

interface StatProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-medium">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground sm:hidden">{label}</span>
    </div>
  );
}

function getMedalColor(index: number): string {
  switch (index) {
    case 0:
      return "text-yellow-500";
    case 1:
      return "text-gray-400";
    case 2:
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
}
