"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  X,
  Copy,
  Trash2,
  Trophy,
  RefreshCw,
  Eye,
  Loader2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/use-toast";
import { FeatureGate } from "@/components/feature-gate";
import { SECURITY_CONFIG } from "@/lib/security-config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Match {
  matchId: string;
  status: string;
  teamSize: number;
  eloTier: string;
  type: string;
  createdAt: number;
  winner?: number;
  completedAt?: number;
  // Add any other fields you need
}

export default function MatchHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eloTierFilter, setEloTierFilter] = useState<string>("");
  const [teamSizeFilter, setTeamSizeFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);

      let url = `/api/matches?page=${currentPage}&sort=${sortField}&direction=${sortDirection}`;

      if (statusFilter && statusFilter !== "all") {
        const statusMap: Record<string, string> = {
          Completed: "completed",
          "In-Progress": "in_progress",
          Canceled: "canceled",
          "Ready-Check": "ready_check",
          Queue: "queue",
          Pending: "pending",
        };

        const dbStatus = statusMap[statusFilter] || statusFilter.toLowerCase();
        url += `&status=${dbStatus}`;
      }

      if (eloTierFilter && eloTierFilter !== "all")
        url += `&eloTier=${eloTierFilter}`;
      if (teamSizeFilter && teamSizeFilter !== "all")
        url += `&teamSize=${teamSizeFilter}`;
      if (dateFilter) {
        // Convert the date to start of day in UTC
        const startOfDay = new Date(dateFilter);
        startOfDay.setUTCHours(0, 0, 0, 0);

        // Convert to Unix timestamp in milliseconds
        const startTimestamp = startOfDay.getTime();

        // End of day timestamp (start of next day - 1ms)
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
        const endTimestamp = endOfDay.getTime() - 1;

        url += `&startDate=${startTimestamp}&endDate=${endTimestamp}`;

        console.log("Date filter:", {
          date: dateFilter,
          startTimestamp,
          endTimestamp,
          startDate: new Date(startTimestamp).toISOString(),
          endDate: new Date(endTimestamp).toISOString(),
        });

        toast({
          title: "Date Filter Applied",
          description: `Filtering for: ${new Date(
            dateFilter
          ).toLocaleDateString()}`,
        });
      }

      const DEBUG_LOGS = false; // Set to true only when you need debugging

      const conditionalLog = (...args: any[]) => {
        if (DEBUG_LOGS && process.env.NODE_ENV === "development") {
          console.log(...args);
        }
      };

      conditionalLog("Fetching from URL:", url);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`Error fetching matches: ${response.statusText}`);
        }

        const data = await response.json();
        conditionalLog("API response data:", data);

        setMatches(data.matches || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in fetchMatches:", error);
      setMatches([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    sortField,
    sortDirection,
    statusFilter,
    eloTierFilter,
    teamSizeFilter,
    dateFilter,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewMatch = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setEloTierFilter("");
    setTeamSizeFilter("");
    setDateFilter(undefined);
    setIsFilterOpen(false);
    setIsDatePickerOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600/30">
            Completed
          </Badge>
        );
      case "in-progress":
      case "in_progress":
        return (
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30">
            In-Progress
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-red-600/20 text-red-400 border-red-600/50 hover:bg-red-600/30">
            Canceled
          </Badge>
        );
      case "ready-check":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50 hover:bg-yellow-600/30">
            Ready-Check
          </Badge>
        );
      case "queue":
        return (
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/50 hover:bg-purple-600/30">
            Queue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/50 hover:bg-gray-600/30">
            Pending
          </Badge>
        );
    }
  };

  const getTeamName = (match: any, teamNumber: number) => {
    // For tournament matches, use custom team names if available
    if (match.type === "tournament") {
      if (teamNumber === 1 && match.team1Name) {
        return match.team1Name;
      }
      if (teamNumber === 2 && match.team2Name) {
        return match.team2Name;
      }
    }

    // For ranked/queue matches, use Team 1/Team 2
    return `Team ${teamNumber}`;
  };

  const getWinnerDisplay = (match: Match) => {
    if (match.status !== "completed") return "Pending";

    if (match.winner === 1) return "Team 1";
    if (match.winner === 2) return "Team 2";

    return "Draw";
  };

  const getWinnerColor = (match: Match) => {
    if (match.status !== "completed") return "text-gray-400";

    if (match.winner === 1) return "text-blue-400";
    if (match.winner === 2) return "text-red-400";

    return "text-gray-400";
  };

  const handleCopyMatchId = (matchId: string) => {
    navigator.clipboard.writeText(matchId);
    toast({
      title: "Copied!",
      description: "Match ID copied to clipboard",
    });
  };

  const handleDeleteMatch = async (matchId: string) => {
    setMatchToDelete(matchId);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      // Check if the current user is you by ID
      const isYourAccount = session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID;
      const isstaff =
        session?.user?.roles?.includes("admin") ||
        session?.user?.roles?.includes("moderator") ||
        session?.user?.roles?.includes("founder");

      let response;

      // Use different endpoints based on who is making the request
      if (isYourAccount || isstaff) {
        // For your account, use the admin override endpoint that we know works
        response = await fetch("/api/admin-override/delete-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ matchId: matchToDelete }),
        });
      } else {
        // For other users, use the regular endpoint
        response = await fetch(`/api/matches/${matchToDelete}`, {
          method: "DELETE",
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Delete response error:", data);
        }
        throw new Error(data.error || "Failed to delete match");
      }

      toast({
        title: "Success",
        description: "Match deleted successfully",
      });

      // Refresh matches and router
      fetchMatches();
      router.refresh();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting match:", error);
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete match",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setMatchToDelete(null);
    }
  };

  const formatDateDisplay = (timestamp: string | number) => {
    // new Date() automatically converts to user's local timezone
    // format() from date-fns formats in the local timezone
    const date = new Date(timestamp);
    return format(date, "MMM d, yyyy, h:mm a");
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const hasActiveFilters = () => {
    return (
      (statusFilter && statusFilter !== "all") ||
      (eloTierFilter && eloTierFilter !== "all") ||
      (teamSizeFilter && teamSizeFilter !== "all") ||
      dateFilter !== undefined
    );
  };

  const getVisiblePageNumbers = () => {
    const maxVisible = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <FeatureGate feature="matches">
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Match History</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage your past matches
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMatches}
              disabled={loading}
              className="bg-[#111827] border-[#1f2937] hover:bg-[#1a2234]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Select
                value={statusFilter || "all"}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-[#111827] border-[#1f2937]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-[#3b82f6]">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In-Progress">In-Progress</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={eloTierFilter || "all"}
                onValueChange={setEloTierFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-[#111827] border-[#1f2937]">
                  <SelectValue placeholder="ELO tier" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-[#3b82f6]">
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Mid</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={teamSizeFilter || "all"}
                onValueChange={setTeamSizeFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-[#111827] border-[#1f2937]">
                  <SelectValue placeholder="Team Size" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-[#3b82f6]">
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="2v2">2v2</SelectItem>
                  <SelectItem value="4v4">4v4</SelectItem>
                  <SelectItem value="5v5">5v5</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative" ref={datePickerRef}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto bg-[#111827] border-[#1f2937] flex items-center"
                    >
                      <Calendar className="mr-2 w-4 h-4" />
                      {dateFilter
                        ? format(dateFilter, "MMM d, yyyy")
                        : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 bg-[#1f2937] border-[#3b82f6]">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                      className="border-none"
                    />
                    <div className="flex items-center justify-between p-3 border-t border-[#3b82f6]">
                      <Button
                        variant="ghost"
                        className="text-sm text-blue-400 hover:text-blue-300"
                        onClick={() => setDateFilter(undefined)}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-sm text-blue-400 hover:text-blue-300"
                        onClick={() => setDateFilter(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="bg-[#111827] border-[#1f2937] flex-shrink-0"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters()}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      {matches.length} {matches.length === 1 ? "match" : "matches"} found
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="bg-[#111827] border-[#1f2937]">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-20 bg-[#1a2234]" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16 bg-[#1a2234]" />
                      <Skeleton className="h-4 w-12 bg-[#1a2234]" />
                    </div>
                    <Skeleton className="h-4 w-32 bg-[#1a2234]" />
                  </CardContent>
                </Card>
              ))
            ) : matches.length === 0 ? (
              <Card className="bg-[#111827] border-[#1f2937]">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted/50">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-white mb-1">
                        No matches found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters()
                          ? "Try adjusting your filters"
                          : "No match history available yet"}
                      </p>
                    </div>
                    {hasActiveFilters() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <ContextMenu key={match.matchId}>
                  <ContextMenuTrigger asChild>
                    <Card className="bg-[#111827] border-[#1f2937] hover:bg-[#1a2234] transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(match.status)}
                            <Badge variant="outline" className="capitalize border-border/50 bg-muted/30">
                              {match.eloTier}
                            </Badge>
                            <Badge variant="outline" className="border-border/50 bg-muted/30">
                              {match.teamSize}v{match.teamSize}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 md:h-auto md:w-auto md:px-3 md:py-1.5 w-8 p-0 gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMatch(match.matchId);
                            }}
                          >
                            <Eye className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden md:inline">View Match</span>
                          </Button>
                        </div>
                        {match.winner && (
                          <div className={`flex items-center gap-2 ${getWinnerColor(match)}`}>
                            <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              Winner: {getTeamName(match, match.winner)}
                            </span>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {formatDateDisplay(match.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64 bg-[#1f2937] border-[#3b82f6] text-white">
                    <ContextMenuItem
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#2d3748]"
                      onClick={() => handleCopyMatchId(match.matchId)}
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Match ID</span>
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#2d3748]"
                      onClick={() => handleViewMatch(match.matchId)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Match</span>
                    </ContextMenuItem>
                    {(session?.user?.id ===
                      SECURITY_CONFIG.DEVELOPER_ID ||
                      (session?.user?.roles &&
                        (session.user.roles.includes("admin") ||
                          session.user.roles.includes("moderator") ||
                          session.user.roles.includes("founder")))) && (
                      <>
                        <ContextMenuSeparator className="bg-[#3b82f6]/30" />
                        <ContextMenuItem
                          className="flex items-center gap-2 text-red-400 cursor-pointer hover:bg-[#2d3748] hover:text-red-300"
                          onClick={() => handleDeleteMatch(match.matchId)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Match</span>
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <Card className="hidden lg:block bg-[#111827] border-[#1f2937] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2937]">
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className={`flex gap-1 items-center text-sm font-medium hover:text-white transition-colors ${
                          sortField === "status"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {getSortIcon("status")}
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className={`flex gap-1 items-center text-sm font-medium hover:text-white transition-colors ${
                          sortField === "eloTier"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleSort("eloTier")}
                      >
                        ELO Tier
                        {getSortIcon("eloTier")}
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className={`flex gap-1 items-center text-sm font-medium hover:text-white transition-colors ${
                          sortField === "teamSize"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleSort("teamSize")}
                      >
                        Team Size
                        {getSortIcon("teamSize")}
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className={`flex gap-1 items-center text-sm font-medium hover:text-white transition-colors ${
                          sortField === "winner"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleSort("winner")}
                      >
                        Winner
                        {getSortIcon("winner")}
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className={`flex gap-1 items-center text-sm font-medium hover:text-white transition-colors ${
                          sortField === "createdAt"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleSort("createdAt")}
                      >
                        Date and Time
                        {getSortIcon("createdAt")}
                      </Button>
                    </th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#1f2937]">
                        <td className="p-4">
                          <Skeleton className="h-6 w-20 bg-[#1a2234]" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-16 bg-[#1a2234]" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-12 bg-[#1a2234]" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-24 bg-[#1a2234]" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-32 bg-[#1a2234]" />
                        </td>
                        <td className="p-4 text-right">
                          <Skeleton className="h-8 w-24 bg-[#1a2234] ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : matches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-muted/50">
                            <History className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-white mb-1">
                              No matches found
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {hasActiveFilters()
                                ? "Try adjusting your filters"
                                : "No match history available yet"}
                            </p>
                          </div>
                          {hasActiveFilters() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                              className="mt-2"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    matches.map((match) => (
                      <ContextMenu key={match.matchId}>
                        <ContextMenuTrigger asChild>
                          <tr className="border-b border-[#1f2937] hover:bg-[#1a2234] transition-colors cursor-pointer">
                            <td className="p-4">
                              {getStatusBadge(match.status)}
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="capitalize border-border/50 bg-muted/30">
                                {match.eloTier}
                              </Badge>
                            </td>
                            <td className="p-4 text-white font-medium">
                              {match.teamSize}v{match.teamSize}
                            </td>
                            <td className={`p-4 ${getWinnerColor(match)}`}>
                              {match.winner ? (
                                <div className="flex gap-2 items-center">
                                  <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">
                                    {getTeamName(match, match.winner)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDateDisplay(match.createdAt)}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 gap-2"
                                onClick={() => handleViewMatch(match.matchId)}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Match</span>
                              </Button>
                            </td>
                          </tr>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-64 bg-[#1f2937] border-[#3b82f6] text-white">
                          <ContextMenuItem
                            className="flex items-center gap-2 cursor-pointer hover:bg-[#2d3748]"
                            onClick={() => handleCopyMatchId(match.matchId)}
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy Match ID</span>
                          </ContextMenuItem>

                          {/* Only show delete option for admins/moderators */}
                          {(session?.user?.id ===
                            SECURITY_CONFIG.DEVELOPER_ID ||
                            (session?.user?.roles &&
                              (session.user.roles.includes("admin") ||
                                session.user.roles.includes("moderator") ||
                                session.user.roles.includes("founder")))) && (
                            <>
                              <ContextMenuSeparator className="bg-[#3b82f6]/30" />
                              <ContextMenuItem
                                className="flex items-center gap-2 text-red-400 cursor-pointer hover:bg-[#2d3748] hover:text-red-300"
                                onClick={() => handleDeleteMatch(match.matchId)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Match</span>
                              </ContextMenuItem>
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination - Show when there are matches or multiple pages */}
          {(matches.length > 0 || totalPages > 1) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="bg-[#111827] border-[#1f2937] hover:bg-[#1a2234] disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {totalPages > 1 && (
                  <div className="flex gap-1 items-center">
                    {getVisiblePageNumbers().map((page, index) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          disabled={loading}
                          className={
                            page === currentPage
                              ? "bg-blue-600 hover:bg-blue-700 min-w-[40px]"
                              : "bg-[#111827] border-[#1f2937] hover:bg-[#1a2234] min-w-[40px]"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || loading || totalPages <= 1}
                  className="bg-[#111827] border-[#1f2937] hover:bg-[#1a2234] disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              {totalPages > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Match Confirmation Dialog */}
      <AlertDialog
        open={!!matchToDelete}
        onOpenChange={(open) => !open && setMatchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMatch}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeatureGate>
  );
}
