"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import Link from "next/link";

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
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const teamsData = await getTeamRankings();
        setTeams(teamsData);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Create a derived state for sorted teams
  const sortedTeams = useMemo(() => {
    if (teams.length === 0) return [];

    return [...teams].sort((a, b) => {
      if (sortBy === "elo") {
        const aElo = a.teamElo || a.calculatedElo || 0;
        const bElo = b.teamElo || b.calculatedElo || 0;
        return bElo - aElo;
      } else if (sortBy === "winRatio") {
        return b.winRatio - a.winRatio;
      } else if (sortBy === "wins") {
        return (b.wins || 0) - (a.wins || 0);
      } else if (sortBy === "losses") {
        return (b.losses || 0) - (a.losses || 0);
      }
      return 0;
    });
  }, [teams, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTeams.length / teamsPerPage);
  const currentTeams = sortedTeams.slice(
    (currentPage - 1) * teamsPerPage,
    currentPage * teamsPerPage
  );

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Create a handler function that properly casts the string to SortOption
  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  // Calculate win rate with special handling for 100% case
  const calculateWinRate = (wins: number, losses: number) => {
    // Ensure wins and losses are numbers
    const winsNum = Number(wins || 0);
    const lossesNum = Number(losses || 0);

    const totalGames = winsNum + lossesNum;
    if (totalGames === 0) return "0.0%";

    // Special case for 1-0 record (100% win rate)
    if (winsNum === 1 && lossesNum === 0) {
      return "100.0%";
    }

    const winRate = (winsNum / totalGames) * 100;
    return winRate.toFixed(1) + "%";
  };

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
                <Select value={sortBy} onValueChange={handleSortChange}>
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
                            {index < 3 ? (
                              <Medal
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${getMedalColor(
                                  index
                                )}`}
                              />
                            ) : (
                              <span className="text-base font-semibold sm:text-lg text-muted-foreground">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <Link
                                  href={`/tournaments/teams/${team._id}`}
                                  className="font-medium transition-colors hover:text-primary hover:underline"
                                >
                                  {team.name}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                  Captain:{" "}
                                  {team.captain?.discordNickname ||
                                    team.captain?.discordUsername ||
                                    "Unknown"}
                                </span>
                              </div>
                            </div>
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
                            value={calculateWinRate(
                              Number(team.wins || 0),
                              Number(team.losses || 0)
                            )}
                            label="Win Rate"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {!loading && sortedTeams.length > 0 && (
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
