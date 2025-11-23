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
  Calendar,
  Filter,
  X,
  Copy,
  Trash2,
  Trophy,
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
        return <Badge className="bg-green-600">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-600">In-Progress</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">In-Progress</Badge>;
      case "canceled":
        return <Badge className="bg-red-600">Canceled</Badge>;
      case "ready-check":
        return <Badge className="bg-yellow-600">Ready-Check</Badge>;
      case "queue":
        return <Badge className="bg-purple-600">Queue</Badge>;
      default:
        return <Badge className="bg-gray-600">Pending</Badge>;
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
    if (!confirm("Are you sure you want to delete this match?")) {
      return;
    }

    try {
      console.log("Deleting match:", matchId);
      console.log("Current user:", session?.user);

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
        console.log("Using admin override endpoint for your account");
        response = await fetch("/api/admin-override/delete-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ matchId }),
        });
      } else {
        // For other users, use the regular endpoint
        response = await fetch(`/api/matches/${matchId}`, {
          method: "DELETE",
        });
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete response error:", data);
        throw new Error(data.error || "Failed to delete match");
      }

      toast({
        title: "Success",
        description: "Match deleted successfully",
      });

      // Refresh matches
      fetchMatches();
    } catch (error) {
      console.error("Error deleting match:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete match",
        variant: "destructive",
      });
    }
  };

  const formatDateDisplay = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <FeatureGate feature="matches">
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Match History</h1>
            <p className="text-sm text-gray-400">
              {matches.length} results found
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
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
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
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

              <Button
                variant="outline"
                className="bg-[#111827] border-[#1f2937]"
                onClick={clearFilters}
              >
                Clear
              </Button>
            </div>
          </div>

          <Card className="bg-[#111827] border-[#1f2937] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2937]">
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className="flex gap-1 items-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className="flex gap-1 items-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() => handleSort("eloTier")}
                      >
                        ELO Tier
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className="flex gap-1 items-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() => handleSort("teamSize")}
                      >
                        Team Size
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className="flex gap-1 items-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() => handleSort("winner")}
                      >
                        Winner
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="p-4 text-left">
                      <Button
                        variant="ghost"
                        className="flex gap-1 items-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() => handleSort("createdAt")}
                      >
                        Date and Time
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400">
                        Loading matches...
                      </td>
                    </tr>
                  ) : matches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400">
                        No matches found
                      </td>
                    </tr>
                  ) : (
                    matches.map((match) => (
                      <ContextMenu key={match.matchId}>
                        <ContextMenuTrigger asChild>
                          <tr className="border-b border-[#1f2937] hover:bg-[#1a2234]">
                            <td className="p-4">
                              {getStatusBadge(match.status)}
                            </td>
                            <td className="p-4 text-white capitalize">
                              {match.eloTier}
                            </td>
                            <td className="p-4 text-white">
                              {match.teamSize}v{match.teamSize}
                            </td>
                            <td className={`p-4 ${getWinnerColor(match)}`}>
                              {match.winner && (
                                <div className="flex gap-2 items-center">
                                  <Trophy className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium">
                                    {getTeamName(match, match.winner)}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {formatDateDisplay(match.createdAt)}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                onClick={() => handleViewMatch(match.matchId)}
                              >
                                View Match
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

          <div className="flex gap-2 justify-center items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-[#111827] border-[#1f2937]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-1 items-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-[#111827] border-[#1f2937]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
