"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  ChevronDown,
  Eye,
  Filter,
  History,
  Loader2,
  Search,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModerationSortableTh } from "./moderation-sortable-th";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import type { AdminModerationLog } from "@/types/moderation-log";
import type { ModerationFilterType, RecentActionsSortKey } from "@/types/moderation";

const unbanTriggerClassName =
  "border border-privileged/80 bg-privileged text-privileged-foreground shadow-sm hover:bg-privileged/88 hover:text-privileged-foreground active:bg-privileged/80 focus-visible:ring-privileged/40";

function LogDateCell({ iso }: { iso: string }) {
  const parts = formatModerationLogDateParts(iso);
  return (
    <time dateTime={parts.dateTimeAttr} className="tabular-nums" title={parts.secondary || undefined}>
      {parts.primary}
    </time>
  );
}

interface ModerationRecentTabProps {
  loading: boolean;
  logs: AdminModerationLog[];
  stats: { totalActions: number };
  filter: ModerationFilterType;
  searchQuery: string;
  recentActionsSort: { key: RecentActionsSortKey; dir: "asc" | "desc" };
  filteredRecentActions: AdminModerationLog[];
  sortedFilteredRecentActions: AdminModerationLog[];
  unbanInProgressId: string | null;
  isUnbanned: (action: AdminModerationLog) => boolean;
  setSearchQuery: (q: string) => void;
  onFilterChange: (value: ModerationFilterType) => void;
  cycleRecentActionsSort: (key: RecentActionsSortKey) => void;
  openUnbanConfirm: (
    playerId: string,
    playerName: string,
    extra?: { reason?: string; durationLabel?: string },
  ) => void;
  setDetailLog: (log: AdminModerationLog | null) => void;
  setDetailOpen: (open: boolean) => void;
  handleViewHistory: (action: AdminModerationLog) => void;
}

export function ModerationRecentTab({
  loading,
  logs,
  stats,
  filter,
  searchQuery,
  recentActionsSort,
  filteredRecentActions,
  sortedFilteredRecentActions,
  unbanInProgressId,
  isUnbanned,
  setSearchQuery,
  onFilterChange,
  cycleRecentActionsSort,
  openUnbanConfirm,
  setDetailLog,
  setDetailOpen,
  handleViewHistory,
}: ModerationRecentTabProps) {
  const openDetail = (action: AdminModerationLog) => {
    setDetailLog(action);
    setDetailOpen(true);
  };

  const handleUnban = (action: AdminModerationLog) =>
    openUnbanConfirm(action.playerId, action.playerName, {
      reason: action.reason,
      durationLabel: action.duration || "Permanent",
    });

  if (loading) {
    return (
      <TabsContent value="recent" className="mt-0">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="recent" className="mt-0">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search actions..."
              className="pl-8 min-h-[44px] sm:min-h-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(v) => onFilterChange(v as ModerationFilterType)}>
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0">
              <div className="flex items-center">
                <Filter className="mr-2 w-4 h-4" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="warnings">Warnings</SelectItem>
              <SelectItem value="bans">Bans</SelectItem>
              <SelectItem value="active">Active Bans</SelectItem>
              <SelectItem value="queue_removals">Queue removals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {logs.length} loaded actions
          {stats.totalActions > logs.length
            ? ` of ${stats.totalActions} total in the database`
            : stats.totalActions > 0
              ? " (all loaded)"
              : ""}
          . Sort with column headers; default is date (newest first).
        </p>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table
            wrapperClassName="rounded-xl border border-border/60 bg-card/30 shadow-sm"
            className="min-w-[720px]"
          >
            <TableCaption className="sr-only">
              Recent moderation actions, newest first. Open the actions menu on a row for details, history, or unban.
            </TableCaption>
            <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <TableRow className="border-b border-border hover:bg-transparent">
                <ModerationSortableTh label="Type" columnKey="type" sortKey={recentActionsSort.key} sortDir={recentActionsSort.dir} onSort={(k) => cycleRecentActionsSort(k as RecentActionsSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Player" columnKey="player" sortKey={recentActionsSort.key} sortDir={recentActionsSort.dir} onSort={(k) => cycleRecentActionsSort(k as RecentActionsSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Reason" columnKey="reason" sortKey={recentActionsSort.key} sortDir={recentActionsSort.dir} onSort={(k) => cycleRecentActionsSort(k as RecentActionsSortKey)} className="min-w-[8rem] max-w-[18rem]" />
                <ModerationSortableTh label="Moderator" columnKey="moderator" sortKey={recentActionsSort.key} sortDir={recentActionsSort.dir} onSort={(k) => cycleRecentActionsSort(k as RecentActionsSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Date" columnKey="date" sortKey={recentActionsSort.key} sortDir={recentActionsSort.dir} onSort={(k) => cycleRecentActionsSort(k as RecentActionsSortKey)} className="whitespace-nowrap" />
                <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFilteredRecentActions.map((action) => (
                <TableRow key={action._id}>
                  <TableCell className="whitespace-nowrap">
                    <ActionTypeBadge action={action} isUnbanned={isUnbanned} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={action.playerProfilePicture || undefined} alt={action.playerName} />
                        <AvatarFallback>{action.playerName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{action.playerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[18rem]">
                    <span className="line-clamp-2 text-muted-foreground" title={action.reason}>{action.reason}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex max-w-[12rem] items-center gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={action.moderatorProfilePicture || undefined} alt={action.moderatorName} />
                        <AvatarFallback>{action.moderatorName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate">{action.moderatorName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <LogDateCell iso={action.timestamp} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(action)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(action)}>
                          <History className="mr-2 w-4 h-4" />
                          View Player History
                        </DropdownMenuItem>
                        {action.action === "ban" && (
                          <DropdownMenuItem
                            className="text-privileged focus:bg-privileged/15 focus:text-privileged-foreground"
                            onClick={() => handleUnban(action)}
                            disabled={isUnbanned(action) || unbanInProgressId === action.playerId}
                          >
                            {unbanInProgressId === action.playerId ? (
                              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <Unlock className="mr-2 h-4 w-4 shrink-0" />
                            )}
                            Unban player
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecentActions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No actions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {sortedFilteredRecentActions.map((action) => (
            <Card
              key={action._id}
              className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={action.playerProfilePicture || undefined} alt={action.playerName} />
                      <AvatarFallback>{action.playerName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{action.playerName}</p>
                      <p className="text-sm text-muted-foreground">
                        <LogDateCell iso={action.timestamp} />
                      </p>
                    </div>
                  </div>
                  <ActionTypeBadge action={action} isUnbanned={isUnbanned} />
                </div>
                <p className="mb-2 text-sm">{action.reason}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={action.moderatorProfilePicture || undefined} alt={action.moderatorName} />
                      <AvatarFallback className="text-[8px]">{action.moderatorName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">By {action.moderatorName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center p-0 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
                      title="Details"
                      onClick={() => openDetail(action)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center"
                      onClick={() => handleViewHistory(action)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    {action.action === "ban" && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Unban player"
                        aria-label={`Unban ${action.playerName}`}
                        className={cn(
                          "flex min-h-[44px] min-w-[44px] items-center justify-center p-0 sm:h-8 sm:min-h-0 sm:min-w-0 sm:w-8",
                          unbanTriggerClassName,
                        )}
                        onClick={() => handleUnban(action)}
                        disabled={isUnbanned(action) || unbanInProgressId === action.playerId}
                      >
                        {unbanInProgressId === action.playerId ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Unlock className="h-4 w-4" aria-hidden />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredRecentActions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No actions found</div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}

function ActionTypeBadge({
  action,
  isUnbanned,
}: {
  action: AdminModerationLog;
  isUnbanned: (a: AdminModerationLog) => boolean;
}) {
  if (action.action === "warn") return <Badge variant="warning">Warning</Badge>;
  if (action.action === "queue_remove_player") return <Badge variant="secondary">Queue removal</Badge>;
  return (
    <Badge variant={isUnbanned(action) ? "outline" : "destructive"}>
      {isUnbanned(action) ? "Unbanned" : "Ban"}
    </Badge>
  );
}
