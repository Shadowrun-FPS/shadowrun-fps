"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Medal,
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  Shield,
  Loader2,
  Crown,
  ArrowUpDown,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MongoTeam } from "@/types/mongodb";
import { ReactNode } from "react";
import { FeatureGate } from "@/components/feature-gate";
import { useFeatureFlag } from "@/lib/features";
import Link from "next/link";

interface TeamWithStats extends MongoTeam {
  calculatedElo: number;
  winRatio: number;
  teamElo?: number;
  tournamentWins?: number;
  teamSize?: number;
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

type SortOption = "winRatio" | "elo" | "wins" | "losses" | "members" | "tournamentWins";
type SortDirection = "asc" | "desc";

export default function RankingsPage() {
  // Default sort to win rate
  const [sortBy, setSortBy] = useState<SortOption>("winRatio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamSize, setSelectedTeamSize] = useState<string>("4");
  const teamsPerPage = 10;
  
  // Check if player stats feature is enabled
  const playerStatsEnabled = useFeatureFlag("playerStats");

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

  // Create a derived state for filtered and sorted teams
  const sortedTeams = useMemo(() => {
    if (teams.length === 0) return [];

    // Filter teams by team size (always filter, no "all" option)
    const teamSize = parseInt(selectedTeamSize);
    let filtered = teams.filter((team) => {
      const teamSizeValue = team.teamSize || 4;
      return teamSizeValue === teamSize;
    });

    // Filter teams by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((team) => {
        return (
          team.name?.toLowerCase().includes(query) ||
          team.tag?.toLowerCase().includes(query) ||
          team.captain?.discordNickname?.toLowerCase().includes(query) ||
          team.captain?.discordUsername?.toLowerCase().includes(query)
        );
      });
    }

    // Sort teams
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "elo") {
        const aElo = a.teamElo || a.calculatedElo || 0;
        const bElo = b.teamElo || b.calculatedElo || 0;
        comparison = bElo - aElo;
      } else if (sortBy === "winRatio") {
        // Calculate win ratio as a number for sorting
        const aWins = Number(a.wins || 0);
        const aLosses = Number(a.losses || 0);
        const aTotal = aWins + aLosses;
        const aWinRatio = aTotal > 0 ? aWins / aTotal : 0;
        
        const bWins = Number(b.wins || 0);
        const bLosses = Number(b.losses || 0);
        const bTotal = bWins + bLosses;
        const bWinRatio = bTotal > 0 ? bWins / bTotal : 0;
        
        comparison = bWinRatio - aWinRatio;
      } else if (sortBy === "wins") {
        comparison = (b.wins || 0) - (a.wins || 0);
      } else if (sortBy === "losses") {
        comparison = (b.losses || 0) - (a.losses || 0);
      } else if (sortBy === "members") {
        comparison = (b.members?.length || 0) - (a.members?.length || 0);
      } else if (sortBy === "tournamentWins") {
        comparison = (b.tournamentWins || 0) - (a.tournamentWins || 0);
      }
      
      return sortDirection === "asc" ? -comparison : comparison;
    });
  }, [teams, sortBy, sortDirection, searchQuery, selectedTeamSize]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTeams.length / teamsPerPage);
  const currentTeams = sortedTeams.slice(
    (currentPage - 1) * teamsPerPage,
    currentPage * teamsPerPage
  );

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when search, sort, or team size filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortDirection, selectedTeamSize]);

  // Handle column header sort
  const handleSort = (column: SortOption) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with default descending
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Get sort icon for column headers
  const getSortIcon = (column: SortOption) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDownIcon className="w-3.5 h-3.5 text-primary" />
    );
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

  // Calculate default win rate-based ranking (always based on win rate, regardless of current sort)
  const winRateRankedTeams = useMemo(() => {
    if (teams.length === 0) return [];
    return [...teams].sort((a, b) => {
      // Calculate win ratio for sorting
      const aWins = Number(a.wins || 0);
      const aLosses = Number(a.losses || 0);
      const aTotal = aWins + aLosses;
      const aWinRatio = aTotal > 0 ? aWins / aTotal : 0;
      
      const bWins = Number(b.wins || 0);
      const bLosses = Number(b.losses || 0);
      const bTotal = bWins + bLosses;
      const bWinRatio = bTotal > 0 ? bWins / bTotal : 0;
      
      // Sort by win rate descending
      return bWinRatio - aWinRatio;
    });
  }, [teams]);

  // Get the win rate-based rank for a team (always shows rank based on win rate, not current sort)
  const getWinRateRank = (teamId: string) => {
    const index = winRateRankedTeams.findIndex((t) => t._id.toString() === teamId);
    return index >= 0 ? index + 1 : null;
  };

  // Calculate global rank for display (accounting for pagination in current sort)
  const getDisplayRank = (index: number) => {
    return (currentPage - 1) * teamsPerPage + index + 1;
  };

  return (
    <FeatureGate feature="rankings">
      <div className="min-h-screen bg-background">
        <main className="px-4 py-6 mx-auto max-w-screen-xl sm:px-6 lg:px-8 xl:px-12 sm:py-8 lg:py-10">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
                <Trophy className="relative w-6 h-6 sm:w-7 sm:h-7 text-primary drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                  Team Rankings
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Global rankings for all competitive teams
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <Card className="border-2 bg-gradient-to-br from-card via-card to-primary/5">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Teams</p>
                      <p className="text-lg sm:text-xl font-bold">{teams.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 bg-gradient-to-br from-card via-card to-green-500/5">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Top ELO</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {teams.length > 0
                          ? Math.max(
                              ...teams.map(
                                (t) => t.teamElo || t.calculatedElo || 0
                              )
                            ).toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 bg-gradient-to-br from-card via-card to-blue-500/5">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {teams.filter((t) => (t.wins || 0) + (t.losses || 0) > 0)
                          .length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 bg-gradient-to-br from-card via-card to-purple-500/5">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Games</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {teams.reduce((total, team) => {
                          const wins = Number(team.wins || 0);
                          const losses = Number(team.losses || 0);
                          return total + wins + losses;
                        }, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search and Sort */}
          <Card className="border-2 mb-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams, tags, or captains..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 border-2"
                  />
                </div>
                {/* Team Size Filter */}
                <div className="sm:w-[200px]">
                  <Select
                    value={selectedTeamSize}
                    onValueChange={setSelectedTeamSize}
                  >
                    <SelectTrigger className="h-10 border-2 w-full">
                      <SelectValue placeholder="All Team Sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Duos (2 players)</SelectItem>
                      <SelectItem value="3">Trios (3 players)</SelectItem>
                      <SelectItem value="4">Squads (4 players)</SelectItem>
                      <SelectItem value="5">Full Team (5 players)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Sort Dropdown for small/medium screens */}
                <div className="lg:hidden">
                  <Select
                    value={`${sortBy}-${sortDirection}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortDirection] = value.split("-") as [
                        SortOption,
                        SortDirection
                      ];
                      setSortBy(newSortBy);
                      setSortDirection(newSortDirection);
                    }}
                  >
                    <SelectTrigger className="h-10 border-2 w-full sm:w-[200px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elo-desc">Team ELO (High to Low)</SelectItem>
                      <SelectItem value="elo-asc">Team ELO (Low to High)</SelectItem>
                      <SelectItem value="wins-desc">Record (Most Wins)</SelectItem>
                      <SelectItem value="wins-asc">Record (Least Wins)</SelectItem>
                      <SelectItem value="winRatio-desc">Win Rate (Highest)</SelectItem>
                      <SelectItem value="winRatio-asc">Win Rate (Lowest)</SelectItem>
                      <SelectItem value="tournamentWins-desc">Tourn. Wins (Most)</SelectItem>
                      <SelectItem value="tournamentWins-asc">Tourn. Wins (Least)</SelectItem>
                      <SelectItem value="members-desc">Members (Most)</SelectItem>
                      <SelectItem value="members-asc">Members (Least)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Loading rankings...</p>
                </div>
              ) : sortedTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="relative p-4 rounded-full bg-muted mb-4">
                    <Trophy className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No teams found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery
                      ? "Try adjusting your search query or filters"
                      : "No teams have been created yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                   {/* Header row - Show only on large screens */}
                   <div className="hidden lg:flex px-6 py-4 bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                     <div className="w-12 shrink-0" />
                     <div className="flex-1 min-w-0 max-w-[300px]" />
                     <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-muted-foreground w-[600px] shrink-0 ml-auto">
                       <button
                         onClick={() => handleSort("elo")}
                         className="flex items-center justify-end gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                       >
                         Team ELO
                         {getSortIcon("elo")}
                       </button>
                       <button
                         onClick={() => handleSort("wins")}
                         className="flex items-center justify-end gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                       >
                         Record
                         {getSortIcon("wins")}
                       </button>
                       <button
                         onClick={() => handleSort("winRatio")}
                         className="flex items-center justify-end gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                       >
                         Win Rate
                         {getSortIcon("winRatio")}
                       </button>
                       <button
                         onClick={() => handleSort("tournamentWins")}
                         className="flex items-center justify-end gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                       >
                         Tourn. Wins
                         {getSortIcon("tournamentWins")}
                       </button>
                       <button
                         onClick={() => handleSort("members")}
                         className="flex items-center justify-end gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                       >
                         Members
                         {getSortIcon("members")}
                       </button>
                     </div>
                   </div>

                  {/* Team rows - grouped by team size */}
                  {(() => {
                    // Group teams by team size
                    const teamsBySize = currentTeams.reduce((acc, team) => {
                      const teamSize = team.teamSize || 4;
                      if (!acc[teamSize]) {
                        acc[teamSize] = [];
                      }
                      acc[teamSize].push(team);
                      return acc;
                    }, {} as Record<number, typeof currentTeams>);

                    // Sort team sizes (2, 3, 4, 5)
                    const sortedSizes = Object.keys(teamsBySize)
                      .map(Number)
                      .sort((a, b) => a - b);

                    // Render teams grouped by size
                    return sortedSizes.map((teamSize) => (
                      <React.Fragment key={teamSize}>
                        {/* Teams for this size */}
                        {teamsBySize[teamSize].map((team, index) => {
                          const winRateRank = getWinRateRank(team._id.toString());
                          // Ensure wins and losses are numbers to prevent string concatenation
                          const wins = Number(team.wins || 0);
                          const losses = Number(team.losses || 0);
                          const totalGames = wins + losses;
                          const memberCount = team.members?.length || 0;
                          const captainName = team.captain?.discordNickname || team.captain?.discordUsername || "Unknown";
                          // Use discordUsername for profile link (lowercase, no spaces), fallback to formatted nickname
                          const captainUsername = team.captain?.discordUsername 
                            ? team.captain.discordUsername.toLowerCase().replace(/\s+/g, "")
                            : team.captain?.discordNickname 
                              ? team.captain.discordNickname.toLowerCase().replace(/\s+/g, "")
                              : null;
                          const captainProfileUrl = captainUsername && playerStatsEnabled 
                            ? `/player/stats?playerName=${encodeURIComponent(captainUsername)}` 
                            : null;

                          return (
                            <div
                              key={team._id.toString()}
                              className="relative px-4 py-4 transition-all sm:px-6 group hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent border-b border-border/50 last:border-b-0"
                            >
                        <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 group-hover:bg-primary/30 transition-colors" />
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          {/* Rank and Team Info */}
                          <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0 max-w-[300px] shrink-0">
                            <div className="flex items-center justify-center w-10 lg:w-12 shrink-0">
                              {winRateRank !== null && winRateRank <= 3 ? (
                                <div className="relative">
                                  <div className={`relative flex items-center justify-center p-1.5 lg:p-2 rounded-full ${
                                    winRateRank === 1 
                                      ? "bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-yellow-500/20 border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/30 ring-2 ring-yellow-400/20" 
                                      : winRateRank === 2
                                      ? "bg-gradient-to-br from-gray-300/20 via-gray-200/10 to-gray-300/20 border-2 border-gray-300/50 shadow-lg shadow-gray-300/30 ring-2 ring-gray-300/20"
                                      : "bg-gradient-to-br from-amber-600/20 via-amber-500/10 to-amber-600/20 border-2 border-amber-600/50 shadow-lg shadow-amber-600/30 ring-2 ring-amber-600/20"
                                  }`}>
                                    <Medal
                                      className={`w-6 h-6 lg:w-7 lg:h-7 ${getMedalColor(
                                        winRateRank - 1
                                      )} drop-shadow-lg`}
                                    />
                                    {winRateRank === 1 && (
                                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 drop-shadow-md z-10" />
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-lg lg:text-xl font-bold text-muted-foreground">
                                  #{winRateRank || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  href={`/tournaments/teams/${team._id}`}
                                  className="font-bold text-base lg:text-lg hover:text-primary transition-colors hover:underline whitespace-nowrap"
                                >
                                  {team.name}
                                </Link>
                                {team.tag && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs lg:text-sm font-mono shrink-0"
                                  >
                                    [{team.tag}]
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs lg:text-sm text-muted-foreground">
                                <Crown className="w-3 h-3 shrink-0" />
                                {playerStatsEnabled && captainProfileUrl ? (
                                  <Link
                                    href={captainProfileUrl}
                                    className="hover:text-primary transition-colors hover:underline break-words"
                                  >
                                    {captainName}
                                  </Link>
                                ) : (
                                  <span className="break-words">{captainName}</span>
                                )}
                              </div>
                            </div>
                          </div>

                           {/* Stats Grid - Responsive layout */}
                           <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 lg:w-[600px] lg:shrink-0 ml-12 lg:ml-0 lg:ml-auto">
                             {/* ELO - Full width on mobile/tablet, first column on desktop */}
                             <div className="col-span-2 lg:col-span-1 flex flex-col items-center lg:items-end justify-center p-2 lg:p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                               <div className="flex items-center lg:items-end gap-1.5 mb-1 w-full lg:justify-end">
                                 <TrendingUp className="w-4 h-4 text-primary" />
                                 <span className="text-xs lg:text-sm font-medium text-muted-foreground lg:hidden">
                                   ELO
                                 </span>
                               </div>
                               <span className="text-base lg:text-lg font-bold text-right w-full lg:text-right">
                                 {(team.teamElo || team.calculatedElo || 0).toLocaleString()}
                               </span>
                             </div>
                             {/* Record - Next to Win Rate on mobile/tablet, second column on desktop */}
                             <div className="flex flex-col items-center lg:items-end justify-center p-2 lg:p-3 rounded-lg bg-gradient-to-br from-card to-muted/30 border border-border">
                               <div className="flex items-center lg:items-end gap-1.5 mb-1 w-full lg:justify-end">
                                 <div className="flex items-center gap-1">
                                   <ArrowUp className="w-3 h-3 text-green-500" />
                                   <span className="text-xs font-medium text-green-500">
                                     {wins}
                                   </span>
                                 </div>
                                 <span className="text-muted-foreground">-</span>
                                 <div className="flex items-center gap-1">
                                   <ArrowDown className="w-3 h-3 text-red-500" />
                                   <span className="text-xs font-medium text-red-500">
                                     {losses}
                                   </span>
                                 </div>
                                 <span className="text-xs lg:text-sm font-medium text-muted-foreground lg:hidden ml-1">
                                   Record
                                 </span>
                               </div>
                               <span className="text-xs text-muted-foreground text-right w-full lg:text-right">
                                 {totalGames} {totalGames === 1 ? "game" : "games"}
                               </span>
                             </div>
                             {/* Win Rate - Next to Record on mobile/tablet, third column on desktop */}
                             <div className="flex flex-col items-center lg:items-end justify-center p-2 lg:p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                               <div className="flex items-center lg:items-end gap-1.5 mb-1 w-full lg:justify-end">
                                 <Trophy className="w-4 h-4 text-amber-500" />
                                 <span className="text-xs lg:text-sm font-medium text-muted-foreground lg:hidden">
                                   Win Rate
                                 </span>
                               </div>
                               <span className="text-base lg:text-lg font-bold text-amber-600 dark:text-amber-400 text-right w-full lg:text-right">
                                 {calculateWinRate(wins, losses)}
                               </span>
                             </div>
                             {/* Tournament Wins - Next to Members on mobile/tablet, fourth column on desktop */}
                             <div className="flex flex-col items-center lg:items-end justify-center p-2 lg:p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                               <div className="flex items-center lg:items-end gap-1.5 mb-1 w-full lg:justify-end">
                                 <Trophy className="w-4 h-4 text-purple-500" />
                                 <span className="text-xs lg:text-sm font-medium text-muted-foreground lg:hidden">
                                   Tourn. Wins
                                 </span>
                               </div>
                               <span className="text-base lg:text-lg font-bold text-purple-600 dark:text-purple-400 text-right w-full lg:text-right">
                                 {team.tournamentWins || 0}
                               </span>
                             </div>
                             {/* Members - Next to Tournament Wins on mobile/tablet, fifth column on desktop */}
                             <div className="flex flex-col items-center lg:items-end justify-center p-2 lg:p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                               <div className="flex items-center lg:items-end gap-1.5 mb-1 w-full lg:justify-end">
                                 <Users className="w-4 h-4 text-blue-500" />
                                 <span className="text-xs lg:text-sm font-medium text-muted-foreground lg:hidden">
                                   Members
                                 </span>
                               </div>
                               <span className="text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400 text-right w-full lg:text-right">
                                 {memberCount}/{team.teamSize || 4}
                               </span>
                             </div>
                           </div>
                        </div>
                      </div>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                </div>
              )}

              {/* Pagination */}
              {!loading && sortedTeams.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 sm:px-6 border-t bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * teamsPerPage + 1} to{" "}
                    {Math.min(currentPage * teamsPerPage, sortedTeams.length)} of{" "}
                    {sortedTeams.length} teams
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="h-9 border-2"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 7) {
                          page = i + 1;
                        } else if (currentPage <= 4) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          page = totalPages - 6 + i;
                        } else {
                          page = currentPage - 3 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => paginate(page)}
                            className={`h-9 min-w-[36px] ${
                              page === currentPage
                                ? "border-2"
                                : "border-2"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="h-9 border-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </FeatureGate>
  );
}

function getMedalColor(index: number): string {
  switch (index) {
    case 0:
      return "text-yellow-500 fill-yellow-500";
    case 1:
      return "text-gray-400 fill-gray-400";
    case 2:
      return "text-amber-600 fill-amber-600";
    default:
      return "text-muted-foreground";
  }
}
