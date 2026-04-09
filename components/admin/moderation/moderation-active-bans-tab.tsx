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
import { Loader2, Search, Unlock } from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { ModerationSortableTh } from "./moderation-sortable-th";
import { isPermanentBanDuration } from "@/hooks/useModerationData";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import type { AdminModerationLog } from "@/types/moderation-log";
import type { ActiveBansSortKey, UnbanConfirmPayload } from "@/types/moderation";

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

interface ModerationActiveBansTabProps {
  loading: boolean;
  activeActions: AdminModerationLog[];
  filteredActiveBans: AdminModerationLog[];
  sortedFilteredActiveBans: AdminModerationLog[];
  activeBansSort: { key: ActiveBansSortKey; dir: "asc" | "desc" };
  activeSearchQuery: string;
  unbanInProgressId: string | null;
  isUnbanned: (action: AdminModerationLog) => boolean;
  setActiveSearchQuery: (q: string) => void;
  cycleActiveBansSort: (key: ActiveBansSortKey) => void;
  openUnbanConfirm: (
    playerId: string,
    playerName: string,
    extra?: { reason?: string; durationLabel?: string },
  ) => void;
}

export function ModerationActiveBansTab({
  loading,
  activeActions,
  filteredActiveBans,
  sortedFilteredActiveBans,
  activeBansSort,
  activeSearchQuery,
  unbanInProgressId,
  isUnbanned,
  setActiveSearchQuery,
  cycleActiveBansSort,
  openUnbanConfirm,
}: ModerationActiveBansTabProps) {
  const handleUnban = (action: AdminModerationLog) =>
    openUnbanConfirm(action.playerId, action.playerName, {
      reason: action.reason,
      durationLabel: action.duration || "Permanent",
    });

  if (loading) {
    return (
      <TabsContent value="active" className="mt-0">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="active" className="mt-0">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Active Bans</h2>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search active bans..."
              className="pl-8 min-h-[44px] sm:min-h-0"
              value={activeSearchQuery}
              onChange={(e) => setActiveSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table
            wrapperClassName="rounded-xl border border-border/60 bg-card/30 shadow-sm"
            className="min-w-[640px]"
          >
            <TableCaption className="sr-only">
              Active bans: players currently banned; use Unban to restore access after confirmation.
            </TableCaption>
            <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <TableRow className="border-b border-border hover:bg-transparent">
                <ModerationSortableTh label="Player" columnKey="player" sortKey={activeBansSort.key} sortDir={activeBansSort.dir} onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Reason" columnKey="reason" sortKey={activeBansSort.key} sortDir={activeBansSort.dir} onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)} className="min-w-[8rem] max-w-[18rem]" />
                <ModerationSortableTh label="Duration" columnKey="duration" sortKey={activeBansSort.key} sortDir={activeBansSort.dir} onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Moderator" columnKey="moderator" sortKey={activeBansSort.key} sortDir={activeBansSort.dir} onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)} className="whitespace-nowrap" />
                <ModerationSortableTh label="Date" columnKey="date" sortKey={activeBansSort.key} sortDir={activeBansSort.dir} onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)} className="whitespace-nowrap" />
                <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActiveBans.length > 0 ? (
                sortedFilteredActiveBans.map((action) => (
                  <TableRow key={action._id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={action.playerProfilePicture || undefined} alt={action.playerName} />
                          <AvatarFallback>{action.playerName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{action.playerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[18rem]">
                      <span className="line-clamp-2 text-muted-foreground" title={action.reason}>{action.reason}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isPermanentBanDuration(action.duration) ? "destructive" : "secondary"}
                        className="font-normal tabular-nums"
                      >
                        {action.duration || "Permanent"}
                      </Badge>
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
                      <UnbanButton
                        action={action}
                        unbanInProgressId={unbanInProgressId}
                        isUnbanned={isUnbanned}
                        onUnban={handleUnban}
                        className="min-h-[44px] sm:min-h-0"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : activeActions.length > 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No active bans match your search</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No active bans found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {filteredActiveBans.length > 0 ? (
            sortedFilteredActiveBans.map((action) => (
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
                        <h3 className="font-medium">{action.playerName}</h3>
                        <p className="text-sm text-muted-foreground">{formatTimeAgo(new Date(action.timestamp))}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        action.action === "warn"
                          ? "warning"
                          : isUnbanned(action)
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {action.action === "warn" ? "Warning" : isUnbanned(action) ? "Unbanned" : "Ban"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-2 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Reason:</p>
                      <p className="line-clamp-2">{action.reason}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Moderator:</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={action.moderatorProfilePicture || undefined} alt={action.moderatorName} />
                          <AvatarFallback className="text-[10px]">{action.moderatorName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <p>{action.moderatorName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Duration:</p>
                      <Badge
                        variant={isPermanentBanDuration(action.duration) ? "destructive" : "secondary"}
                        className="mt-0.5 font-normal tabular-nums"
                      >
                        {action.duration || "Permanent"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <UnbanButton
                      action={action}
                      unbanInProgressId={unbanInProgressId}
                      isUnbanned={isUnbanned}
                      onUnban={handleUnban}
                      className="min-h-[44px] min-w-[7.5rem] sm:min-h-0"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : activeActions.length > 0 ? (
            <div className="flex flex-col justify-center items-center h-24 text-center">
              <p className="text-muted-foreground">No active bans match your search</p>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-24 text-center">
              <p className="text-muted-foreground">No active bans found</p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}

function UnbanButton({
  action,
  unbanInProgressId,
  isUnbanned,
  onUnban,
  className,
}: {
  action: AdminModerationLog;
  unbanInProgressId: string | null;
  isUnbanned: (a: AdminModerationLog) => boolean;
  onUnban: (a: AdminModerationLog) => void;
  className?: string;
}) {
  const inProgress = unbanInProgressId === action.playerId;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onUnban(action)}
      disabled={isUnbanned(action) || inProgress}
      className={cn(className, unbanTriggerClassName)}
    >
      {inProgress ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Unlock className="h-4 w-4 shrink-0" aria-hidden />
      )}
      Unban
    </Button>
  );
}
