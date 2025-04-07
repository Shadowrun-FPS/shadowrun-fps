"use client";

import React, { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getRankByElo } from "@/lib/rank-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { toast } from "@/components/ui/use-toast";

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

// Create a wrapper component that uses the search params
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
    session?.user?.id === "238329746671271936" || // Admin ID
    (session?.user?.roles &&
      (session?.user?.roles.includes("admin") ||
        session?.user?.roles.includes("moderator") ||
        session?.user?.roles.includes("founder")));

  const searchInput = useDebounce<string>(searchInputRaw, 500);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/players/leaderboard?teamSize=${teamSize}&page=${page}&limit=10&search=${search}&sortField=${sortField}&sortDirection=${sortDirection}`
      );
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("teamSize", teamSize);
    params.set("page", page.toString());
    if (search) params.set("search", search);
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);

    router.push(`/leaderboard?${params.toString()}`, { scroll: false });
    fetchPlayers();
  }, [teamSize, page, search, sortField, sortDirection, fetchPlayers, router]);

  useEffect(() => {
    setSearch(searchInput);
    if (searchInput !== initialSearch) {
      setPage(1); // Reset to first page on new search
    }
  }, [searchInput, initialSearch]);

  const handleTeamSizeChange = (value: string) => {
    setTeamSize(value);
    setPage(1); // Reset to first page on size change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set to desc by default (most to least)
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1); // Reset to first page on sort change
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

  // Helper to get the display name for a team size
  const getTeamSizeDisplay = (size: string) => {
    switch (size) {
      case "1":
        return "1v1";
      case "2":
        return "2v2";
      case "4":
        return "4v4";
      case "5":
        return "5v5";
      default:
        return `${size}v${size}`;
    }
  };

  return (
    <div className="container py-8 mx-auto">
      <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">
            {teamSize}v{teamSize} Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} Players
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={teamSize} onValueChange={handleTeamSizeChange}>
            <SelectTrigger className="w-[120px]">
              <span className="flex items-center gap-2">
                <span className="font-medium">
                  {teamSize}v{teamSize}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1v1</SelectItem>
              <SelectItem value="2">2v2</SelectItem>
              <SelectItem value="4">4v4</SelectItem>
              <SelectItem value="5">5v5</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              placeholder="Search players..."
              value={searchInputRaw}
              onChange={(e) => setSearchInputRaw(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            {searchInputRaw && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute w-6 h-6 p-0 transform -translate-y-1/2 right-1 top-1/2"
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {teamSize}v{teamSize} Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-14">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort("elo")}
                    className="flex items-center justify-end w-full gap-1"
                  >
                    <span>ELO</span>
                    {getSortIcon("elo")}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort("wins")}
                    className="flex items-center justify-end w-full gap-1"
                  >
                    <span>Wins</span>
                    {getSortIcon("wins")}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort("losses")}
                    className="flex items-center justify-end w-full gap-1"
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
                      <Skeleton className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="w-24 h-4" />
                          <Skeleton className="w-16 h-3 mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-12 h-4 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-12 h-4 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-12 h-4 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-12 h-4 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading &&
                players.map((player) => {
                  const stats = player.teamStat;
                  const winRate = Math.round(
                    (stats.wins / (stats.wins + stats.losses || 1)) * 100
                  );
                  const rank = getRankByElo(stats.elo);

                  return (
                    <TableRow key={player._id}>
                      <TableCell className="text-center">
                        {player.globalRank === 1 ? (
                          <div className="flex justify-center">
                            <div className="relative inline-flex items-center justify-center">
                              <Trophy
                                className="w-6 h-6 text-yellow-500 animate-pulse"
                                fill="#FFC107"
                              />
                              <span className="absolute text-xs font-bold text-white">
                                1
                              </span>
                            </div>
                          </div>
                        ) : player.globalRank === 2 ? (
                          <div className="flex justify-center">
                            <div className="relative inline-flex items-center justify-center">
                              <Medal
                                className="w-5 h-5 text-gray-300"
                                fill="#E0E0E0"
                              />
                              <span className="absolute text-xs font-bold text-gray-800">
                                2
                              </span>
                            </div>
                          </div>
                        ) : player.globalRank === 3 ? (
                          <div className="flex justify-center">
                            <div className="relative inline-flex items-center justify-center">
                              <Medal
                                className="w-5 h-5 text-amber-700"
                                fill="#B45309"
                              />
                              <span className="absolute text-xs font-bold text-white">
                                3
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            {player.globalRank}
                          </span>
                        )}
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
                            className="flex items-center gap-3 hover:underline"
                          >
                            <div className="relative w-8 h-8 overflow-hidden rounded-full">
                              <Image
                                src={
                                  player.discordProfilePicture ||
                                  "/placeholder.svg"
                                }
                                alt={
                                  player.discordNickname ||
                                  player.discordUsername ||
                                  "Player"
                                }
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">
                                {player.discordNickname ||
                                  player.discordUsername ||
                                  "Unknown Player"}
                              </div>
                            </div>
                          </Link>
                        </PlayerContextMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                          className={
                            winRate > 60
                              ? "text-green-500"
                              : winRate < 40
                              ? "text-red-500"
                              : "text-blue-500"
                          }
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
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Showing {(page - 1) * pagination.limit + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} players
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="h-8 px-3"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-8 px-3"
            >
              Previous
            </Button>
            <div className="flex items-center h-8 px-2 text-sm border rounded-md bg-background border-input">
              Page {page} of {pagination.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(Math.min(pagination.pages, page + 1))
              }
              disabled={page === pagination.pages}
              className="h-8 px-3"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.pages)}
              disabled={page === pagination.pages}
              className="h-8 px-3"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-10">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">
                Loading leaderboard...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we fetch the rankings
              </p>
            </div>
          </div>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
