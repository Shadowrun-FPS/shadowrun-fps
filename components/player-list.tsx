"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { ModerationDialog } from "@/components/moderation-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { Player, ModerationActionType } from "@/types/moderation";
import { formatDistanceToNow, format } from "date-fns";
import { PlayerNameDisplay } from "@/components/player-name-display";
import { formatTimeAgo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type FilterType = "all" | "active" | "banned";
type SortField = "name" | "lastActive" | "none" | "updatedAt";
type SortDirection = "asc" | "desc";

export function PlayerList() {
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
  const router = useRouter();
  const { toast } = useToast();

  // Pagination settings
  const playersPerPage = 10;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/admin/players");
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Failed to fetch players:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load players. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [toast]);

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

    if (sortField === "lastActive") {
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

  const handleOpenModeration = (
    player: Player,
    action: ModerationActionType
  ) => {
    setSelectedPlayer(player);
    setModerationAction(action);
    setDialogOpen(true);
  };

  const handleViewHistory = (player: Player) => {
    router.push(`/admin/players/${player._id}/history`);
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
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* First page + ellipsis for larger ranges */}
        {currentPage > 3 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="h-9 w-9"
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
            <Button variant="default" size="sm" className="h-9 w-9">
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
            <Button variant="default" size="sm" className="h-9 w-9">
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
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return <div className="py-8 text-center">Loading players...</div>;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="flex flex-col w-full gap-3 px-0 mx-auto sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search players..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-[180px]">
              <Users className="w-4 h-4 mr-2" />
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
              All Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("active")}>
              Active Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("banned")}>
              Banned Players
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full space-y-4 overflow-x-hidden md:hidden">
        {paginatedPlayers.map((player) => (
          <Card key={player._id} className="w-full overflow-hidden border-box">
            <CardContent className="p-0">
              <div className="p-3 space-y-2">
                <div className="flex flex-col">
                  <div className="text-base font-semibold">
                    {player.discordNickname ||
                      player.discordUsername ||
                      "Unknown Player"}
                  </div>

                  <div className="overflow-hidden text-sm break-all whitespace-normal text-muted-foreground">
                    {player._id}
                  </div>
                </div>

                <div className="text-sm">
                  Last active:{" "}
                  {player.updatedAt
                    ? formatTimeAgo(new Date(player.updatedAt))
                    : "Never"}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">Warnings:</span>{" "}
                    {getWarningCount(player)}
                  </div>
                  <div>
                    <span className="font-semibold">Bans:</span>{" "}
                    {getBanCount(player)}
                  </div>
                </div>

                <div className="flex border-t">
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-none text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    onClick={() => handleOpenModeration(player, "warn")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-xs sm:text-sm">Warn</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 text-red-500 rounded-none border-x hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleOpenModeration(player, "ban")}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    <span className="text-xs sm:text-sm">Ban</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 text-blue-500 rounded-none hover:text-blue-600 hover:bg-blue-50"
                    onClick={() =>
                      router.push(`/admin/players/${player._id}/history`)
                    }
                  >
                    <History className="w-4 h-4 mr-1" />
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

      <div className="hidden overflow-x-auto md:block">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[250px] cursor-pointer"
                    onClick={() => handleSortClick("name")}
                  >
                    Player {renderSortIndicator("name")}
                  </TableHead>
                  <TableHead>Discord ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Warnings</TableHead>
                  <TableHead className="text-center">Bans</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortClick("lastActive")}
                  >
                    Last Active {renderSortIndicator("lastActive")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlayers.map((player) => (
                  <TableRow key={player._id}>
                    <TableCell>
                      <PlayerNameDisplay player={player} />
                    </TableCell>
                    <TableCell className="font-mono">
                      {player.discordId}
                    </TableCell>
                    <TableCell>
                      {player.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-green-700 bg-green-100 border-green-200"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getWarningCount(player)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getBanCount(player)}
                    </TableCell>
                    <TableCell>
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
                          title="Add Warning"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModeration(player, "ban")}
                          title={player.isBanned ? "Update Ban" : "Ban Player"}
                        >
                          <Ban
                            className={`h-4 w-4 ${
                              player.isBanned
                                ? "text-muted-foreground"
                                : "text-red-500"
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(player)}
                          title="View History"
                        >
                          <Shield className="w-4 h-4 text-blue-500" />
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
        <div className="flex flex-wrap items-center justify-between w-full gap-4 py-4 sm:flex-nowrap">
          <div className="order-2 w-full text-sm text-muted-foreground sm:order-1 sm:w-auto">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex justify-center order-1 w-full sm:order-2 sm:w-auto">
            {renderPagination()}
          </div>
        </div>
      </div>

      {selectedPlayer && moderationAction && (
        <ModerationDialog
          player={selectedPlayer}
          action={moderationAction}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
