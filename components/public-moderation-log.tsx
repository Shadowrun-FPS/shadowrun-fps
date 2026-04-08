"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import {
  Search,
  Filter,
  RefreshCw,
  Shield,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toDiscordTimestamp, formatDuration } from "@/lib/discord-timestamp";
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
import { safeLog } from "@/lib/security";
import {
  MODERATION_LOG_PUSHER_CHANNEL,
  MODERATION_LOG_PUSHER_EVENT,
} from "@/lib/moderation-log-realtime-constants";

interface ModerationLog {
  _id: string;
  action: string;
  playerName: string;
  reason: string;
  duration: string;
  timestamp: string;
  expiry?: string;
  revoked?: boolean; // If the action was revoked (e.g., unban)
}

const PLACEHOLDER_SIGNED_IN = "Hover to reveal";
const PLACEHOLDER_SIGNED_OUT = "Sign in to reveal";

function LogDateDisplay({
  timestamp,
  align = "left",
}: {
  timestamp: string;
  align?: "left" | "right";
}) {
  const parts = formatModerationLogDateParts(timestamp);
  return (
    <div
      className={cn(
        "space-y-0.5",
        align === "right" && "text-right",
      )}
    >
      <time
        className="block text-sm font-medium text-foreground"
        dateTime={parts.dateTimeAttr}
      >
        {parts.primary}
      </time>
      <span className="block font-mono text-[11px] text-muted-foreground tabular-nums">
        {parts.secondary}
      </span>
      <div className="text-xs text-muted-foreground">{parts.relative}</div>
    </div>
  );
}

function RedactedPlayerName({
  name,
  canRevealOnHover,
}: {
  name: string;
  canRevealOnHover: boolean;
}) {
  if (canRevealOnHover) {
    return (
      <span
        className="group/player relative inline-flex min-h-[1.35rem] max-w-full cursor-default items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
        title="Hover or focus to reveal player name"
      >
        <span className="text-xs italic text-muted-foreground transition-opacity duration-200 group-hover/player:opacity-0 group-focus-within/player:opacity-0">
          {PLACEHOLDER_SIGNED_IN}
        </span>
        <span className="pointer-events-none absolute left-0 top-0 z-[1] max-w-[min(280px,70vw)] truncate text-sm font-medium text-foreground opacity-0 transition-opacity duration-200 group-hover/player:opacity-100 group-focus-within/player:opacity-100">
          {name}
        </span>
      </span>
    );
  }

  return (
    <span
      className="text-xs italic text-muted-foreground select-none"
      aria-label="Player name hidden. Sign in to enable reveal on hover."
    >
      {PLACEHOLDER_SIGNED_OUT}
    </span>
  );
}

type FilterType = "all" | "warn" | "ban" | "unban";
type SortField = "date" | "action" | "player" | "none";
type SortDirection = "asc" | "desc";

export default function PublicModerationLog() {
  const { status } = useSession();
  const canRevealPlayerNames = status === "authenticated";
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchLogs = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await fetch("/api/moderation/logs?limit=500");
      if (!response.ok) throw new Error("Failed to fetch moderation logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      safeLog.error("Error fetching public moderation logs:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cleaned = false;
    let disconnect: (() => void) | undefined;

    void import("pusher-js").then(({ default: Pusher }) => {
      if (cleaned) return;
      const client = new Pusher(key, { cluster });
      const channel = client.subscribe(MODERATION_LOG_PUSHER_CHANNEL);
      const onUpdated = () => {
        void fetchLogs({ silent: true });
      };
      channel.bind(MODERATION_LOG_PUSHER_EVENT, onUpdated);
      disconnect = () => {
        channel.unbind(MODERATION_LOG_PUSHER_EVENT, onUpdated);
        client.unsubscribe(MODERATION_LOG_PUSHER_CHANNEL);
        client.disconnect();
      };
    });

    return () => {
      cleaned = true;
      disconnect?.();
    };
  }, [fetchLogs]);

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((log) => {
        const reasonMatch = log.reason.toLowerCase().includes(query);
        const durationMatch = log.duration.toLowerCase().includes(query);
        const playerMatch =
          canRevealPlayerNames && log.playerName.toLowerCase().includes(query);
        return reasonMatch || durationMatch || playerMatch;
      });
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
  }, [
    logs,
    searchQuery,
    filter,
    sortField,
    sortDirection,
    canRevealPlayerNames,
  ]);

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
          <Badge
            variant="outline"
            className="border-amber-500/35 bg-amber-500/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 shadow-none dark:text-amber-400"
          >
            Warning
          </Badge>
        );
      case "ban":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/35 bg-rose-500/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700 shadow-none dark:text-rose-400"
          >
            Ban
          </Badge>
        );
      case "unban":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/35 bg-emerald-500/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-none dark:text-emerald-400"
          >
            Unban
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shadow-none"
          >
            {action}
          </Badge>
        );
    }
  };

  // Component to display duration with Discord timestamp format
  const DurationDisplay = ({ log }: { log: ModerationLog }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
      // Update every minute to keep countdown accurate
      const interval = setInterval(() => {
        setNow(new Date());
      }, 60000);
      return () => clearInterval(interval);
    }, []);

    // Warnings don't have durations
    if (log.action === "warn") {
      return <span className="text-muted-foreground">—</span>;
    }

    // If action was revoked (e.g., unban), show original duration
    if (log.revoked) {
      return <span>{formatDuration(log.duration)}</span>;
    }

    // For bans, check if they're still active
    if (log.action === "ban") {
      if (log.duration?.trim().toLowerCase() === "permanent") {
        return <span>Permanent</span>;
      }

      if (log.expiry) {
        const expiryDate = new Date(log.expiry);

        // If ban is still active, show Discord timestamp countdown
        if (expiryDate > now) {
          const discordTimestamp = toDiscordTimestamp(expiryDate, "R");
          const timeRemaining = formatDistanceToNow(expiryDate, {
            addSuffix: true,
          });
          return (
            <div className="space-y-1">
              <div className="font-medium text-primary">{timeRemaining}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {discordTimestamp}
              </div>
            </div>
          );
        } else {
          // Ban expired, show original duration
          return <span>{formatDuration(log.duration)}</span>;
        }
      }
    }

    // For other actions, show the duration if available
    if (log.duration) {
      return <span>{formatDuration(log.duration)}</span>;
    }

    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-3 items-center">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.07] p-2.5">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Moderation log
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Public record of moderation actions. Updates in near real time when configured.
          </p>
        </div>

        {/* Search, filter, refresh — one toolbar on desktop; mobile stacks cleanly */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                canRevealPlayerNames
                  ? "Search player, reason, or duration..."
                  : "Search reason or duration..."
              }
              className="min-h-[44px] rounded-xl border-border/60 bg-card/40 pl-9 transition-colors focus-visible:ring-primary/30 sm:min-h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as FilterType)}
            >
              <SelectTrigger className="min-h-[44px] flex-1 rounded-xl border-border/60 bg-card/40 sm:h-10 sm:min-h-0 sm:w-[min(100%,180px)] sm:flex-initial">
                <Filter className="mr-2 h-4 w-4 shrink-0" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="ban">Bans</SelectItem>
                <SelectItem value="unban">Unbans</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void fetchLogs()}
              disabled={loading}
              className="h-11 w-11 shrink-0 rounded-xl border-border/60 bg-card/40 min-h-[44px] transition-colors hover:bg-muted/60 sm:min-h-10"
              title="Refresh logs"
              aria-label="Refresh moderation log"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Log list: cards below lg (matches admin players mobile), table on lg+ */}
      {loading ? (
        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : paginatedLogs.length === 0 ? (
        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground opacity-50" />
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
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            className="w-full space-y-3 overflow-x-hidden sm:space-y-4 lg:hidden"
            role="feed"
            aria-label="Moderation actions"
          >
            {paginatedLogs.map((log) => (
              <Card
                key={log._id}
                className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 shrink-0">
                      {getActionBadge(log.action)}
                    </div>
                    <div className="min-w-0 text-right">
                      <LogDateDisplay timestamp={log.timestamp} align="right" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Player
                    </p>
                    <RedactedPlayerName
                      name={log.playerName}
                      canRevealOnHover={canRevealPlayerNames}
                    />
                  </div>

                  <div className="mt-4 space-y-1 border-t border-border/40 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Reason
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {log.reason || "No reason provided"}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1 border-t border-border/40 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Duration
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <DurationDisplay log={log} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div
            className="hidden overflow-x-auto lg:block"
            role="region"
            aria-label="Moderation actions table"
          >
            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/25 hover:bg-muted/25">
                      <TableHead
                        className="h-11 cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50"
                        onClick={() => handleSortClick("action")}
                      >
                        <div className="flex items-center gap-2">
                          Action
                          {renderSortIndicator("action")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="h-11 cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50"
                        onClick={() => handleSortClick("player")}
                      >
                        <div className="flex items-center gap-2">
                          Player
                          {renderSortIndicator("player")}
                        </div>
                      </TableHead>
                      <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Reason
                      </TableHead>
                      <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Duration
                      </TableHead>
                      <TableHead
                        className="h-11 cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50"
                        onClick={() => handleSortClick("date")}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {renderSortIndicator("date")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow
                        key={log._id}
                        className="border-border/40 transition-colors hover:bg-muted/[0.35]"
                      >
                        <TableCell className="py-4 align-middle">
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <RedactedPlayerName
                            name={log.playerName}
                            canRevealOnHover={canRevealPlayerNames}
                          />
                        </TableCell>
                        <TableCell className="max-w-md py-4 align-middle">
                          <p
                            className="line-clamp-2 text-sm leading-snug text-foreground/90 sm:line-clamp-none sm:truncate"
                            title={log.reason || "No reason provided"}
                          >
                            {log.reason || "No reason provided"}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 align-middle text-sm text-muted-foreground">
                          <DurationDisplay log={log} />
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <LogDateDisplay timestamp={log.timestamp} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </>
      )}

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
                    currentPage === 1 && "pointer-events-none opacity-50",
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
                },
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={cn(
                    currentPage === totalPages &&
                      "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Footer Info */}
      <Card className="rounded-2xl border border-border/60 bg-muted/15 shadow-none">
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-center text-base font-semibold text-foreground">
            About this log
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 pt-0">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            Actions listed here support transparency for the community. Player
            names use text placeholders; signed-in users can hover or focus to see the name. The list will
            refresh automatically when new actions are logged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
