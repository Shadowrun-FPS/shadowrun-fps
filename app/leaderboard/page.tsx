"use client";

import React, { Suspense } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Trophy,
  Medal,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getRankByElo } from "@/lib/rank-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { toast } from "@/components/ui/use-toast";
import { FeatureGate } from "@/components/feature-gate";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Player {
  _id: string;
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  discordProfilePicture: string;
  teamStat: {
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
  };
  teamSizeStats: Array<{
    teamSize: number;
    elo: number;
    wins: number;
    losses: number;
    lastMatchDate: string;
  }>;
  globalRank: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type SortField = "elo" | "wins" | "losses" | "lastMatch";
type SortDirection = "asc" | "desc";

// Custom debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Player Avatar Component
function PlayerAvatar({ src, alt }: { src: string | null; alt: string }) {
  const [imgSrc, setImgSrc] = useState<string>(src || "/placeholder.svg");

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      loading="lazy"
      onError={() => {
        setImgSrc("https://cdn.discordapp.com/embed/avatars/0.png");
      }}
    />
  );
}

// Rank Display Component
function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex relative justify-center items-center">
          <Trophy
            className="w-6 h-6 text-yellow-500 animate-pulse"
            fill="#FFC107"
          />
          <span className="absolute text-xs font-bold text-white">1</span>
        </div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex relative justify-center items-center">
          <Medal className="w-5 h-5 text-gray-300" fill="#E0E0E0" />
          <span className="absolute text-xs font-bold text-gray-800">2</span>
        </div>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex relative justify-center items-center">
          <Medal className="w-5 h-5 text-amber-700" fill="#B45309" />
          <span className="absolute text-xs font-bold text-white">3</span>
        </div>
      </div>
    );
  }
  return (
    <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  );
}

// Leaderboard Content Component
function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  const [availableTeamSizes, setAvailableTeamSizes] = useState<number[]>([4]);

  const initialTeamSize = searchParams?.get("teamSize") || "4";
  const initialPage = searchParams?.get("page") || "1";
  const initialSearch = searchParams?.get("search") || "";
  const initialSortField =
    (searchParams?.get("sortField") as SortField) || "elo";
  const initialSortDirection =
    (searchParams?.get("sortDirection") as SortDirection) || "desc";

  const [teamSize, setTeamSize] = useState<string>(initialTeamSize);
  const [page, setPage] = useState<number>(parseInt(initialPage));
  const [search, setSearch] = useState<string>(initialSearch);
  const [searchInputRaw, setSearchInputRaw] = useState<string>(initialSearch);
  const [sortField, setSortField] = useState<SortField>(initialSortField);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);

  // Check if user has mod access
  const hasModAccess =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles &&
      (session?.user?.roles.includes("admin") ||
        session?.user?.roles.includes("moderator") ||
        session?.user?.roles.includes("founder")));

  const searchInput = useDebounce<string>(searchInputRaw, 500);

  // Optimized fetch function
  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        teamSize,
        page: page.toString(),
        limit: "10",
        search,
        sortField,
        sortDirection,
      });

      const response = await fetch(
        `/api/players/leaderboard?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      setPlayers(data.players || []);
      setPagination(
        data.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
      );
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [teamSize, page, search, sortField, sortDirection]);

  // Fetch available team sizes
  const fetchAvailableTeamSizes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/players/leaderboard?getAvailableTeamSizes=true`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch team sizes");
      }

      const data = await response.json();
      if (data.availableTeamSizes && data.availableTeamSizes.length > 0) {
        setAvailableTeamSizes(data.availableTeamSizes);

        // If current teamSize is not available, switch to the first available
        if (!data.availableTeamSizes.includes(Number(teamSize))) {
          setTeamSize(data.availableTeamSizes[0].toString());
          setPage(1);
        }
      }
    } catch (error) {
      console.error("Error fetching available team sizes:", error);
    }
  }, [teamSize]);

  // Update URL and fetch when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("teamSize", teamSize);
    params.set("page", page.toString());
    if (search) params.set("search", search);
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);

    router.push(`/leaderboard?${params.toString()}`, { scroll: false });
  }, [teamSize, page, search, sortField, sortDirection, router]);

  // Fetch players when dependencies change
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Fetch available team sizes on mount
  useEffect(() => {
    fetchAvailableTeamSizes();
  }, [fetchAvailableTeamSizes]);

  // Update search when debounced input changes
  useEffect(() => {
    setSearch(searchInput);
    if (searchInput !== initialSearch) {
      setPage(1);
    }
  }, [searchInput, initialSearch]);

  const handleTeamSizeChange = (value: string) => {
    setTeamSize(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  // Calculate win rate helper
  const calculateWinRate = useCallback((wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  }, []);

  return (
    <FeatureGate feature="leaderboard">
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
                  {teamSize}v{teamSize} Leaderboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {pagination.total} Players
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <div className="sm:w-[140px]">
                <Select value={teamSize} onValueChange={handleTeamSizeChange}>
                  <SelectTrigger className="h-10 border-2 w-full">
                    <SelectValue placeholder="Team Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamSizes.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}v{size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchInputRaw}
                  onChange={(e) => setSearchInputRaw(e.target.value)}
                  className="pl-9 h-10 border-2"
                />
                {searchInputRaw && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0 w-6 h-6"
                    onClick={() => {
                      setSearchInputRaw("");
                      setSearch("");
                    }}
                  >
                    <span className="sr-only">Clear search</span>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <Card className="border-2 mb-6 hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle>Player Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("elo")}
                          className="flex gap-1 justify-end items-center w-full hover:text-primary transition-colors"
                        >
                          <span>ELO</span>
                          {getSortIcon("elo")}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("wins")}
                          className="flex gap-1 justify-end items-center w-full hover:text-primary transition-colors"
                        >
                          <span>Wins</span>
                          {getSortIcon("wins")}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          onClick={() => handleSort("losses")}
                          className="flex gap-1 justify-end items-center w-full hover:text-primary transition-colors"
                        >
                          <span>Losses</span>
                          {getSortIcon("losses")}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading &&
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center">
                            <Skeleton className="mx-auto w-8 h-8" />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-3 items-center">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <Skeleton className="w-32 h-4" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="ml-auto w-16 h-4" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="ml-auto w-12 h-4" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="ml-auto w-12 h-4" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="ml-auto w-16 h-4" />
                          </TableCell>
                        </TableRow>
                      ))}

                    {!loading &&
                      players.map((player) => {
                        const stats = player.teamStat;
                        const winRate = calculateWinRate(stats.wins, stats.losses);
                        const rank = getRankByElo(stats.elo);

                        return (
                          <TableRow key={player._id}>
                            <TableCell className="text-center">
                              <RankDisplay rank={player.globalRank} />
                            </TableCell>
                            <TableCell>
                              <PlayerContextMenu
                                player={player}
                                disabled={!hasModAccess}
                                showRank={false}
                              >
                                <Link
                                  href={`/player/stats?playerName=${encodeURIComponent(
                                    player.discordUsername
                                  )}`}
                                  className="flex gap-3 items-center hover:underline"
                                >
                                  <div className="overflow-hidden relative w-10 h-10 rounded-full">
                                    <PlayerAvatar
                                      src={player.discordProfilePicture}
                                      alt={
                                        player.discordNickname ||
                                        player.discordUsername ||
                                        "Player"
                                      }
                                    />
                                  </div>
                                  <div className="font-medium">
                                    {player.discordNickname ||
                                      player.discordUsername ||
                                      "Unknown Player"}
                                  </div>
                                </Link>
                              </PlayerContextMenu>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end items-center">
                                <div className="relative w-7 h-7">
                                  <Image
                                    src={`/rankedicons/${rank.name.toLowerCase()}.png`}
                                    alt={rank.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <span className="font-bold">{stats.elo}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-right text-green-500">
                              {stats.wins}
                            </TableCell>
                            <TableCell className="font-medium text-right text-red-500">
                              {stats.losses}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  "font-medium",
                                  winRate > 60
                                    ? "text-green-500"
                                    : winRate < 40
                                    ? "text-red-500"
                                    : "text-blue-500"
                                )}
                              >
                                {winRate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                    {!loading && players.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {search
                            ? `No players found matching "${search}" for this team size`
                            : "No players found for this team size"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="w-32 h-4 mb-2" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                      <Skeleton className="w-8 h-8" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}

            {!loading &&
              players.map((player) => {
                const stats = player.teamStat;
                const winRate = calculateWinRate(stats.wins, stats.losses);
                const rank = getRankByElo(stats.elo);

                return (
                  <Card key={player._id} className="border-2">
                    <CardContent className="p-4">
                      {/* Player Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0">
                          <RankDisplay rank={player.globalRank} />
                        </div>
                        <PlayerContextMenu
                          player={player}
                          disabled={!hasModAccess}
                          showRank={false}
                        >
                          <Link
                            href={`/player/stats?playerName=${encodeURIComponent(
                              player.discordUsername
                            )}`}
                            className="flex gap-3 items-center flex-1 min-w-0"
                          >
                            <div className="overflow-hidden relative w-12 h-12 rounded-full flex-shrink-0">
                              <PlayerAvatar
                                src={player.discordProfilePicture}
                                alt={
                                  player.discordNickname ||
                                  player.discordUsername ||
                                  "Player"
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {player.discordNickname ||
                                  player.discordUsername ||
                                  "Unknown Player"}
                              </div>
                            </div>
                          </Link>
                        </PlayerContextMenu>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* ELO */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                              ELO
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6">
                              <Image
                                src={`/rankedicons/${rank.name.toLowerCase()}.png`}
                                alt={rank.name}
                                fill
                                loading="lazy"
                                className="object-contain"
                              />
                            </div>
                            <span className="text-lg font-bold">
                              {stats.elo}
                            </span>
                          </div>
                        </div>

                        {/* Win Rate */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Win Rate
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-lg font-bold",
                              winRate > 60
                                ? "text-green-500"
                                : winRate < 40
                                ? "text-red-500"
                                : "text-blue-500"
                            )}
                          >
                            {winRate}%
                          </span>
                        </div>

                        {/* Wins */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ArrowUp className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Wins
                            </span>
                          </div>
                          <span className="text-lg font-bold text-green-500">
                            {stats.wins}
                          </span>
                        </div>

                        {/* Losses */}
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ArrowDown className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Losses
                            </span>
                          </div>
                          <span className="text-lg font-bold text-red-500">
                            {stats.losses}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {!loading && players.length === 0 && (
              <Card className="border-2">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {search
                      ? `No players found matching "${search}" for this team size`
                      : "No players found for this team size"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 sm:px-6 border-t bg-muted/30 rounded-b-lg">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pagination.limit + 1} to{" "}
                {Math.min(page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} players
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="h-9 border-2 hidden sm:inline-flex"
                >
                  First
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="h-9 border-2"
                >
                  Previous
                </Button>

                <div className="flex items-center px-3 h-9 text-sm rounded-md border-2 bg-background">
                  Page {page} of {pagination.pages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(pagination.pages, page + 1))
                  }
                  disabled={page === pagination.pages}
                  className="h-9 border-2"
                >
                  Next
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={page === pagination.pages}
                  className="h-9 border-2 hidden sm:inline-flex"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </FeatureGate>
  );
}

// Main page component with Suspense boundary
export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">
              Loading leaderboard...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we fetch the rankings
            </p>
          </div>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
