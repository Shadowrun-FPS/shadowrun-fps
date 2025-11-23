"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Ban,
  Check,
  Search,
  Filter,
  RefreshCw,
  Shield,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationLog {
  _id: string;
  action: string;
  playerName: string;
  reason: string;
  duration: string;
  timestamp: string;
  expiry?: string;
}

// Add these styles to your CSS file or use inline styles
const blurredStyle = {
  filter: "blur(4px)",
  transition: "filter 0.2s ease-in-out",
};

const hoverStyle = {
  filter: "blur(0)",
};

// Add this CSS class to your module or global CSS
// .player-name-blur {
//   filter: blur(4px);
//   transition: filter 0.2s ease-in-out;
// }
//
// .player-name-blur:hover {
//   filter: blur(0);
// }

type FilterType = "all" | "warn" | "ban" | "unban";
type SortField = "date" | "action" | "player" | "none";
type SortDirection = "asc" | "desc";

export default function PublicModerationLog() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/moderation/logs?limit=500");
      if (!response.ok) throw new Error("Failed to fetch moderation logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching moderation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.playerName.toLowerCase().includes(query) ||
          log.reason.toLowerCase().includes(query) ||
          log.duration.toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (filter !== "all") {
      filtered = filtered.filter((log) => log.action === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let sortValueA: any = "";
      let sortValueB: any = "";

      if (sortField === "date") {
        sortValueA = new Date(a.timestamp).getTime();
        sortValueB = new Date(b.timestamp).getTime();
        return sortDirection === "asc"
          ? sortValueA - sortValueB
          : sortValueB - sortValueA;
      } else if (sortField === "action") {
        sortValueA = a.action;
        sortValueB = b.action;
        return sortDirection === "asc"
          ? sortValueA.localeCompare(sortValueB)
          : sortValueB.localeCompare(sortValueA);
      } else if (sortField === "player") {
        sortValueA = a.playerName.toLowerCase();
        sortValueB = b.playerName.toLowerCase();
        return sortDirection === "asc"
          ? sortValueA.localeCompare(sortValueB)
          : sortValueB.localeCompare(sortValueA);
      } else {
        return 0;
      }
    });

    return filtered;
  }, [logs, searchQuery, filter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredAndSortedLogs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, sortField, sortDirection]);

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="inline ml-1 w-3 h-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="inline ml-1 w-3 h-3" />
    ) : (
      <ChevronDown className="inline ml-1 w-3 h-3" />
    );
  };

  // Function to get action badge based on action type
  const getActionBadge = (action: string) => {
    switch (action) {
      case "warn":
        return (
          <Badge className="text-white bg-amber-500 border-0 hover:bg-amber-600">
            Warning
          </Badge>
        );
      case "ban":
        return (
          <Badge className="text-white bg-red-500 border-0 hover:bg-red-600">
            Ban
          </Badge>
        );
      case "unban":
        return (
          <Badge className="text-white bg-green-500 border-0 hover:bg-green-600">
            Unban
          </Badge>
        );
      default:
        return (
          <Badge className="text-white bg-gray-500 border-0 hover:bg-gray-600">
            {action}
          </Badge>
        );
    }
  };

  // Get ban status based on action and expiry
  const getBanStatus = (log: ModerationLog) => {
    if (log.action !== "ban") return null;

    if (log.duration === "Permanent") {
      return "Permanent";
    }

    if (log.expiry) {
      const expiryDate = new Date(log.expiry);
      const now = new Date();

      if (expiryDate > now) {
        return `Expires: ${format(expiryDate, "MMMM d, yyyy")}`;
      } else {
        return "Expired";
      }
    }

    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg border bg-primary/10 border-primary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r sm:text-3xl md:text-4xl from-foreground to-foreground/70">
                Community Moderation Log
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Public record of moderation actions taken to maintain community
              standards
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="min-h-[44px] sm:min-h-0 w-10 h-10 hover:bg-accent transition-colors"
            title="Refresh logs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by player or reason..."
              className="pl-9 min-h-[44px] sm:min-h-0 border-2 focus:border-primary/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
          >
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0 border-2">
              <Filter className="mr-2 w-4 h-4" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="warn">Warnings</SelectItem>
              <SelectItem value="ban">Bans</SelectItem>
              <SelectItem value="unban">Unbans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-2">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead
                    className="transition-colors cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSortClick("action")}
                  >
                    <div className="flex gap-2 items-center">
                      Action
                      {renderSortIndicator("action")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="transition-colors cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSortClick("player")}
                  >
                    <div className="flex gap-2 items-center">
                      Player
                      {renderSortIndicator("player")}
                    </div>
                  </TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead
                    className="transition-colors cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSortClick("date")}
                  >
                    <div className="flex gap-2 items-center">
                      Date
                      {renderSortIndicator("date")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col justify-center items-center space-y-3">
                        <Shield className="w-12 h-12 opacity-50 text-muted-foreground" />
                        <div>
                          <p className="text-base font-medium text-foreground">
                            No moderation actions found
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {searchQuery || filter !== "all"
                              ? "Try adjusting your search or filters"
                              : "No moderation actions have been recorded yet"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow
                      key={log._id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="relative group">
                          <span className="inline-block transition-all duration-300 cursor-default blur-[2px] group-hover:blur-0 select-none">
                            {log.playerName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p
                          className="truncate"
                          title={log.reason || "No reason provided"}
                        >
                          {log.reason || "No reason provided"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{log.duration}</div>
                          {getBanStatus(log) && (
                            <div className="text-xs text-muted-foreground">
                              {getBanStatus(log)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {format(new Date(log.timestamp), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={cn(
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={cn(
                    currentPage === totalPages &&
                      "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Footer Info */}
      <Card className="border-2 bg-muted/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-center text-muted-foreground">
            <p className="font-medium text-foreground">
              About the Moderation Log
            </p>
            <p>
              This log displays public moderation actions taken by our team to
              maintain community standards. Player names are blurred for privacy
              and can be revealed by hovering.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
