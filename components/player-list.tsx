"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  AlertTriangle,
  Ban,
  History,
  Eye,
  Search,
  Users,
  UserX,
  Calendar,
  Loader2,
  ShieldCheck,
  Shield,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Filter,
  UserCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { ModerationDialog } from "@/components/moderation-dialog";
import { useRouter } from "next/navigation";
import { playerHistoryHrefFromBrowserLocation } from "@/lib/safe-return-to";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { Player, ModerationActionType } from "@/types/moderation";
import { formatDistanceToNow, format } from "date-fns";
import { PlayerNameDisplay } from "@/components/player-name-display";
import { formatTimeAgo } from "@/lib/utils";
import { sanitizeDisplayName } from "@/lib/security";
import { Card, CardContent } from "@/components/ui/card";

type FilterType = "all" | "active" | "banned";
type SortField = "name" | "lastActive" | "none" | "updatedAt" | "discordId" | "status" | "warnings" | "bans";
type SortDirection = "asc" | "desc";

interface PlayerListProps {
  onModerationSuccess?: () => void;
}

export function PlayerList({ onModerationSuccess }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [moderationAction, setModerationAction] =
    useState<ModerationActionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("lastActive");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Pagination settings
  const playersPerPage = 10;

  const fetchPlayers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/players");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load players. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleModerationSuccess = useCallback(() => {
    fetchPlayers();
    onModerationSuccess?.();
  }, [fetchPlayers, onModerationSuccess]);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortField, sortDirection]);

  // Filter players based on search query and filter selection
  const filteredPlayers = players.filter((player) => {
    // First apply the ban filter
    if (filter === "active" && player.isBanned) return false;
    if (filter === "banned" && !player.isBanned) return false;

    // Then apply the search filter
    const searchLower = searchQuery.toLowerCase();
    return (
      player.discordUsername?.toLowerCase().includes(searchLower) ||
      player.discordNickname?.toLowerCase().includes(searchLower) ||
      player.discordId?.toLowerCase().includes(searchLower)
    );
  });

  // Sort the filtered players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let sortValueA: any = "";
    let sortValueB: any = "";

    if (sortField === "name") {
      sortValueA = a.discordNickname || a.discordUsername || "";
      sortValueB = b.discordNickname || b.discordUsername || "";

      return sortDirection === "asc"
        ? sortValueA.localeCompare(sortValueB)
        : sortValueB.localeCompare(sortValueA);
    }

    if (sortField === "discordId") {
      sortValueA = a.discordId || "";
      sortValueB = b.discordId || "";

      return sortDirection === "asc"
        ? sortValueA.localeCompare(sortValueB)
        : sortValueB.localeCompare(sortValueA);
    }

    if (sortField === "status") {
      sortValueA = a.isBanned ? 1 : 0;
      sortValueB = b.isBanned ? 1 : 0;

      return sortDirection === "asc"
        ? sortValueA - sortValueB
        : sortValueB - sortValueA;
    }

    if (sortField === "warnings") {
      sortValueA = getWarningCount(a);
      sortValueB = getWarningCount(b);

      return sortDirection === "asc"
        ? sortValueA - sortValueB
        : sortValueB - sortValueA;
    }

    if (sortField === "bans") {
      sortValueA = getBanCount(a);
      sortValueB = getBanCount(b);

      return sortDirection === "asc"
        ? sortValueA - sortValueB
        : sortValueB - sortValueA;
    }

    if (sortField === "lastActive" || sortField === "updatedAt") {
      sortValueA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      sortValueB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

      return sortDirection === "asc"
        ? sortValueA - sortValueB
        : sortValueB - sortValueA;
    }

    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const paginatedPlayers = sortedPlayers.slice(
    startIndex,
    startIndex + playersPerPage
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterType);
  };

  // Sorting handlers
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Copy Discord ID to clipboard
  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: "Discord ID copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy Discord ID",
      });
    }
  };

  const handleOpenModeration = (
    player: Player,
    action: ModerationActionType
  ) => {
    setSelectedPlayer(player);
    setModerationAction(action);
    setDialogOpen(true);
  };

  const handleViewHistory = (player: Player) => {
    router.push(playerHistoryHrefFromBrowserLocation(String(player._id)));
  };

  // Helper to get warning and ban counts
  const getWarningCount = (player: Player) => {
    return player.warnings?.length || 0;
  };

  const getBanCount = (player: Player) => {
    return player.bans?.length || 0;
  };

  // Helper to render sort indicators
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="inline w-4 h-4 ml-1" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUp className="inline w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="inline w-4 h-4 ml-1" />
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Enhanced responsive pagination
    return (
      <div className="flex flex-wrap justify-center w-full gap-2 mt-4">
        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </Button>

        {/* First page + ellipsis for larger ranges */}
        {currentPage > 3 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="h-9 w-9"
              aria-label="Go to page 1"
            >
              1
            </Button>

            {currentPage > 4 && (
              <span className="flex items-center justify-center w-9 h-9">
                ...
              </span>
            )}
          </>
        )}

        {/* Nearby pages - show fewer on mobile */}
        <div className="flex gap-1 sm:gap-2">
          {/* Show just the current page on very small screens */}
          <div className="block sm:hidden">
            <Button variant="default" size="sm" className="h-9 w-9" aria-current="page" aria-label={`Current page, page ${currentPage}`}>
              {currentPage}
            </Button>
          </div>

          {/* Show surrounding pages on larger screens */}
          <div className="hidden gap-1 sm:flex">
            {/* Previous nearby page */}
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-9 w-9"
              >
                {currentPage - 1}
              </Button>
            )}

            {/* Current page */}
            <Button variant="default" size="sm" className="h-9 w-9" aria-current="page" aria-label={`Current page, page ${currentPage}`}>
              {currentPage}
            </Button>

            {/* Next nearby page */}
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-9 w-9"
              >
                {currentPage + 1}
              </Button>
            )}
          </div>
        </div>

        {/* Last page + ellipsis for larger ranges */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="flex items-center justify-center w-9 h-9">
                ...
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="h-9 w-9"
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9"
          aria-label="Go to next page"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-12 sm:py-16 text-center" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" aria-hidden />
        <p className="text-muted-foreground">Loading players...</p>
      </div>
    );
  }

  const isEmpty = sortedPlayers.length === 0;

  return (
    <div className="w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Search and Filter Bar - softer styling */}
      <div className="flex flex-col w-full gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
          <Input
            type="search"
            placeholder="Search players by name or ID..."
            aria-label="Search players by name or Discord ID"
            className="pl-10 min-h-[44px] sm:min-h-0 rounded-xl border border-border/60 bg-background/80 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all" aria-haspopup="listbox">
              <Filter className="w-4 h-4 mr-2" aria-hidden />
              {filter === "all"
                ? "All Players"
                : filter === "active"
                ? "Active Players"
                : filter === "banned"
                ? "Banned Players"
                : filter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFilterChange("all")}>
              <Users className="w-4 h-4 mr-2" />
              All Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("active")}>
              <UserCheck className="w-4 h-4 mr-2" />
              Active Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("banned")}>
              <UserX className="w-4 h-4 mr-2" />
              Banned Players
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 py-12 px-4 text-center" role="status">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden />
          <p className="text-foreground font-medium">
            {players.length === 0
              ? "No players yet"
              : "No players match your search or filter"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {players.length === 0
              ? "Add a player to get started."
              : "Try a different search term or show all players."}
          </p>
          {filter !== "all" || searchQuery.trim() ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
      <div className="w-full space-y-3 sm:space-y-4 overflow-x-hidden lg:hidden">
        {paginatedPlayers.map((player) => (
          <Card key={player._id} className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/player/stats?playerName=${encodeURIComponent(
                        player.discordUsername || player.discordNickname || ""
                      )}`}
                      className="text-base sm:text-lg font-semibold truncate hover:text-primary hover:underline transition-colors"
                    >
                      {sanitizeDisplayName(
                        player.discordNickname || player.discordUsername,
                        "Unknown Player"
                      )}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 group focus-within:blur-0">
                      <div className="overflow-hidden text-xs sm:text-sm break-all whitespace-normal text-muted-foreground font-mono blur-[2px] group-hover:blur-0 group-focus-within:blur-0 transition-all duration-300 select-none">
                        {player.discordId}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 min-w-[28px] min-h-[28px] touch-manipulation"
                        onClick={(e) => handleCopyId(player.discordId || "", e)}
                        title="Copy Discord ID"
                        aria-label={copiedId === player.discordId ? "Discord ID copied" : "Copy Discord ID"}
                      >
                        {copiedId === player.discordId ? (
                          <Check className="h-4 w-4 text-green-500" aria-hidden />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {player.isBanned ? (
                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Last Active</div>
                    <div className="text-sm font-medium">
                      {player.updatedAt
                        ? formatTimeAgo(new Date(player.updatedAt))
                        : "Never"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Activity</div>
                    <div className="flex gap-3 text-sm">
                      <div>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{getWarningCount(player)}</span>
                        <span className="text-muted-foreground ml-1">warnings</span>
                      </div>
                      <div>
                        <span className="font-medium text-red-600 dark:text-red-400">{getBanCount(player)}</span>
                        <span className="text-muted-foreground ml-1">bans</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 min-h-[44px] sm:min-h-0"
                    onClick={() => handleOpenModeration(player, "warn")}
                    aria-label={`Issue warning to ${player.discordNickname || player.discordUsername || "player"}`}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" aria-hidden />
                    <span className="text-xs sm:text-sm">Warn</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/40 min-h-[44px] sm:min-h-0"
                    onClick={() => handleOpenModeration(player, "ban")}
                    aria-label={player.isBanned ? `Update ban for ${player.discordNickname || player.discordUsername || "player"}` : `Ban ${player.discordNickname || player.discordUsername || "player"}`}
                  >
                    <Ban className="w-4 h-4 mr-1.5" aria-hidden />
                    <span className="text-xs sm:text-sm">Ban</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40 min-h-[44px] sm:min-h-0"
                    onClick={() =>
                      router.push(
                        playerHistoryHrefFromBrowserLocation(
                          String(player._id),
                        ),
                      )
                    }
                    aria-label={`View moderation history for ${player.discordNickname || player.discordUsername || "player"}`}
                  >
                    <History className="w-4 h-4 mr-1.5" aria-hidden />
                    <span className="text-xs sm:text-sm">History</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Simplified mobile pagination */}
        {renderPagination()}
      </div>

      <div className="hidden overflow-x-auto lg:block" role="region" aria-label="Players table">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                  <TableHead className="w-[250px] font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                      onClick={() => handleSortClick("name")}
                      aria-sort={sortField === "name" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Player
                      {renderSortIndicator("name")}
                    </button>
                  </TableHead>
                  <TableHead className="font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                      onClick={() => handleSortClick("discordId")}
                      aria-sort={sortField === "discordId" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Discord ID
                      {renderSortIndicator("discordId")}
                    </button>
                  </TableHead>
                  <TableHead className="font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                      onClick={() => handleSortClick("status")}
                      aria-sort={sortField === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Status
                      {renderSortIndicator("status")}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -my-0.5 mx-auto"
                      onClick={() => handleSortClick("warnings")}
                      aria-sort={sortField === "warnings" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Warnings
                      {renderSortIndicator("warnings")}
                    </button>
                  </TableHead>
                  <TableHead className="text-center font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -my-0.5 mx-auto"
                      onClick={() => handleSortClick("bans")}
                      aria-sort={sortField === "bans" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Bans
                      {renderSortIndicator("bans")}
                    </button>
                  </TableHead>
                  <TableHead className="font-medium text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center gap-2 hover:bg-muted/40 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                      onClick={() => handleSortClick("lastActive")}
                      aria-sort={sortField === "lastActive" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Last Active
                      {renderSortIndicator("lastActive")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlayers.map((player) => (
                  <TableRow key={player._id} className="hover:bg-muted/20 transition-colors border-b border-border/30 last:border-b-0">
                    <TableCell className="font-medium">
                      <PlayerNameDisplay player={player} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 group focus-within:blur-0">
                        <span className="font-mono text-sm text-muted-foreground blur-[2px] group-hover:blur-0 group-focus-within:blur-0 transition-all duration-300 select-none">
                          {player.discordId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity hover:bg-muted"
                          onClick={(e) => handleCopyId(player.discordId || "", e)}
                          aria-label={copiedId === player.discordId ? "Discord ID copied" : "Copy Discord ID"}
                        >
                          {copiedId === player.discordId ? (
                            <Check className="h-4 w-4 text-green-500" aria-hidden />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.isBanned ? (
                        <Badge variant="destructive" className="font-medium">Banned</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-medium"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                        {getWarningCount(player)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-sm">
                        {getBanCount(player)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {player.updatedAt
                        ? formatTimeAgo(new Date(player.updatedAt))
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModeration(player, "warn")}
                          aria-label={`Issue warning to ${player.discordNickname || player.discordUsername || "player"}`}
                          className="hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          <AlertTriangle className="w-4 h-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModeration(player, "ban")}
                          aria-label={player.isBanned ? `Update ban for ${player.discordNickname || player.discordUsername || "player"}` : `Ban ${player.discordNickname || player.discordUsername || "player"}`}
                          className={`hover:bg-red-500/10 ${
                            player.isBanned
                              ? "text-muted-foreground"
                              : "hover:text-red-600 dark:hover:text-red-400"
                          }`}
                        >
                          <Ban className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(player)}
                          aria-label={`View moderation history for ${player.discordNickname || player.discordUsername || "player"}`}
                          className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Shield className="w-4 h-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Desktop pagination with page info */}
        <div className="flex flex-wrap items-center justify-between w-full gap-4 py-4 sm:py-6 sm:flex-nowrap">
          <div className="order-2 w-full text-sm text-muted-foreground sm:order-1 sm:w-auto">
            <span className="font-medium text-foreground">{paginatedPlayers.length}</span> of{" "}
            <span className="font-medium text-foreground">{sortedPlayers.length}</span> players
            {totalPages > 1 && (
              <> • Page {currentPage} of {totalPages}</>
            )}
          </div>
          <nav className="flex justify-center order-1 w-full sm:order-2 sm:w-auto" aria-label="Pagination">
            {renderPagination()}
          </nav>
        </div>
      </div>
        </>
      )}

      {selectedPlayer && moderationAction && (
        <ModerationDialog
          player={selectedPlayer}
          action={moderationAction}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleModerationSuccess}
        />
      )}
    </div>
  );
}
