"use client";

import { useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  Loader2,
  Scale,
  UserMinus,
} from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { ModerationStatsCards } from "./moderation-stats-cards";
import type { AdminModerationLog } from "@/types/moderation-log";
import type { Dispute } from "@/types/moderation";

const PENDING_DISPUTES_EMPTY_VARIANTS = [
  {
    title: "Peace in the queue",
    body: "No open disputes—mods get a breather, and nobody's appealing anything. We'll call that a win until someone gets spicy in chat again.",
  },
  {
    title: "Inbox zero (dispute edition)",
    body: "The appeal desk is so quiet we checked if it was still plugged in. All good—just a rare moment of universal agreement.",
  },
  {
    title: "Nothing to gavel today",
    body: "Zero pending disputes means the team can focus on literally anything else. Enjoy it; these moments are historically brief.",
  },
] as const;

interface ModerationOverviewTabProps {
  loading: boolean;
  logs: AdminModerationLog[];
  disputes: Dispute[];
  stats: { warnings: number; activeBans: number; totalActions: number };
  showScrollToOverviewContentCue: boolean;
  overviewBelowStatsRef: React.Ref<HTMLElement>;
  scrollToOverviewMainContent: () => void;
  onTabChange: (tab: string) => void;
  onViewDispute: (dispute: Dispute) => void;
  isUnbanned: (action: AdminModerationLog) => boolean;
}

export function ModerationOverviewTab({
  loading,
  logs,
  disputes,
  stats,
  showScrollToOverviewContentCue,
  overviewBelowStatsRef,
  scrollToOverviewMainContent,
  onTabChange,
  onViewDispute,
  isUnbanned,
}: ModerationOverviewTabProps) {
  const emptyCopy = useMemo(() => {
    const seed = disputes.length;
    return PENDING_DISPUTES_EMPTY_VARIANTS[seed % PENDING_DISPUTES_EMPTY_VARIANTS.length];
  }, [disputes.length]);

  return (
    <TabsContent value="overview" className="mt-0">
      <div className="space-y-6 sm:space-y-8">
        {/* Mobile compact stats + scroll cue */}
        <div className="space-y-2 sm:hidden">
          <section
            aria-label="Moderation statistics"
            className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm"
          >
            {loading ? (
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
            ) : (
              <div className="flex items-stretch justify-between gap-1 text-center text-xs tabular-nums">
                <MobileStatItem icon={<AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />} label="Warnings" value={stats.warnings} />
                <div className="w-px shrink-0 self-stretch bg-border/60" aria-hidden />
                <MobileStatItem icon={<Ban className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />} label="Bans" value={stats.activeBans} />
                <div className="w-px shrink-0 self-stretch bg-border/60" aria-hidden />
                <MobileStatItem icon={<Activity className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden />} label="Actions" value={stats.totalActions} />
              </div>
            )}
          </section>

          {showScrollToOverviewContentCue ? (
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={scrollToOverviewMainContent}
                className="flex flex-col items-center gap-0.5 rounded-md py-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Scroll to recent actions and disputes"
              >
                <span className="text-[11px] font-medium">Activity below</span>
                <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        {/* Stats Cards (tablet+) */}
        <ModerationStatsCards
          loading={loading}
          warnings={stats.warnings}
          activeBans={stats.activeBans}
          totalActions={stats.totalActions}
        />

        {/* Recent Actions + Pending Disputes */}
        <section
          ref={overviewBelowStatsRef}
          id="admin-moderation-overview-main"
          tabIndex={-1}
          aria-label="Recent actions and pending disputes"
          className="scroll-mt-4 outline-none sm:scroll-mt-6"
        >
          <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-7">
            {/* Recent actions preview */}
            <Card className="flex h-full min-h-0 flex-col border-2 bg-gradient-to-br from-background to-muted/20 lg:col-span-4">
              <CardHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Recent Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 sm:px-6 pb-2 sm:pb-2">
                {loading ? (
                  <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.slice(0, 5).map((action) => {
                      const detailLabel =
                        action.action === "warn"
                          ? "Warning"
                          : action.action === "queue_remove_player"
                            ? "Queue removal"
                            : action.action === "ban"
                              ? `Ban (${action.duration || "Permanent"})`
                              : "Unban";
                      return (
                        <div
                          key={action._id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b pb-3 text-left last:border-0 last:pb-0"
                        >
                          <p className="min-w-0 text-sm font-medium leading-snug">{action.playerName}</p>
                          <time
                            className="justify-self-end text-xs leading-snug text-muted-foreground tabular-nums"
                            dateTime={action.timestamp}
                          >
                            {formatTimeAgo(new Date(action.timestamp))}
                          </time>
                          <p className="min-w-0 text-xs leading-snug text-muted-foreground">{detailLabel}</p>
                          <div className="flex items-center justify-self-end [&_svg]:shrink-0">
                            {action.action === "warn" ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                            ) : action.action === "queue_remove_player" ? (
                              <UserMinus className="h-4 w-4 text-muted-foreground" aria-hidden />
                            ) : action.action === "ban" ? (
                              <Badge
                                variant={isUnbanned(action) ? "outline" : "destructive"}
                                className="whitespace-nowrap text-[10px] sm:text-xs"
                              >
                                {isUnbanned(action) ? "Unbanned" : "Ban"}
                              </Badge>
                            ) : (
                              <Check className="h-4 w-4 text-green-500" aria-hidden />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto shrink-0 border-t-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-0"
                  onClick={() => onTabChange("recent")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>

            {/* Pending disputes preview */}
            <Card className="flex h-full min-h-0 flex-col border-2 bg-gradient-to-br from-background to-muted/20 lg:col-span-3">
              <CardHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Pending Disputes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 sm:px-6 pb-2 sm:pb-2">
                {loading ? (
                  <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.slice(0, 3).map((dispute) => (
                      <div
                        key={dispute._id}
                        className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{dispute.playerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Disputing{" "}
                            {dispute.moderationAction.type === "warning" ? "Warning" : "Ban"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDispute(dispute)}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center sm:py-8"
                    role="status"
                    aria-label="No pending disputes"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                      <Scale className="h-7 w-7" aria-hidden />
                    </div>
                    <div className="max-w-[18rem] space-y-2 px-1">
                      <p className="text-sm font-semibold text-foreground">{emptyCopy.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {emptyCopy.body}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80">No pending disputes right now.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto shrink-0 border-t-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-0"
                  onClick={() => onTabChange("disputes")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </TabsContent>
  );
}

function MobileStatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
      <span className={cn("flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground")}>
        {icon}
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
