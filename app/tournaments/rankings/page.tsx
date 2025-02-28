"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Trophy, TrendingUp, ArrowUp, ArrowDown, Medal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MongoTeam } from "@/types/mongodb";
import { ReactNode } from "react";

interface TeamWithStats extends MongoTeam {
  calculatedElo: number;
  winRatio: number;
  teamElo?: number;
}

async function getTeamRankings(): Promise<TeamWithStats[]> {
  try {
    const response = await fetch("/api/teams");
    const teams: TeamWithStats[] = await response.json();

    // Sort teams by win ratio by default
    return teams.sort((a, b) => {
      // First sort by win ratio
      if (b.winRatio !== a.winRatio) {
        return b.winRatio - a.winRatio;
      }
      // If win ratios are equal, sort by total games played
      const aTotalGames = Number(a.wins || 0) + Number(a.losses || 0);
      const bTotalGames = Number(b.wins || 0) + Number(b.losses || 0);
      if (bTotalGames !== aTotalGames) {
        return bTotalGames - aTotalGames;
      }
      // If still equal, sort by ELO
      return b.calculatedElo - a.calculatedElo;
    });
  } catch (error) {
    console.error("Failed to fetch team rankings:", error);
    return [];
  }
}

type SortOption = "winRatio" | "elo" | "wins" | "losses";

export default function RankingsPage() {
  const [sortBy, setSortBy] = useState<SortOption>("winRatio");
  const [teams, setTeams] = useState<TeamWithStats[]>([]);

  useEffect(() => {
    getTeamRankings().then(setTeams);
  }, []);

  const handleSort = (value: SortOption) => {
    setSortBy(value);
    const sortedTeams = [...teams].sort((a, b) => {
      switch (value) {
        case "winRatio":
          return b.winRatio - a.winRatio;
        case "elo":
          return b.calculatedElo - a.calculatedElo;
        case "wins":
          return Number(b.wins || 0) - Number(a.wins || 0);
        case "losses":
          return Number(b.losses || 0) - Number(a.losses || 0);
        default:
          return 0;
      }
    });
    setTeams(sortedTeams);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
                  <SelectItem value="winRatio">Win Ratio</SelectItem>
                  <SelectItem value="elo">Team ELO</SelectItem>
                  <SelectItem value="wins">Most Wins</SelectItem>
                  <SelectItem value="losses">Most Losses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {/* Header row - Hide on mobile */}
              <div className="hidden sm:flex px-6 py-4 bg-muted/50">
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
              {teams.map((team, index) => (
                <div
                  key={team._id.toString()}
                  className="relative px-4 py-4 sm:px-6 transition-colors group hover:bg-muted/50"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary/10 group-hover:bg-primary/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                          <span className="text-base sm:text-lg font-semibold text-muted-foreground">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base sm:text-lg font-semibold">
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
                        icon={<ArrowUp className="w-4 h-4 text-green-500" />}
                        value={Number(team.wins || 0)}
                        label="Wins"
                      />
                      <Stat
                        icon={<ArrowDown className="w-4 h-4 text-red-500" />}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
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
