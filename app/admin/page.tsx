"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield,
  Users,
  Book,
  Activity,
  AlertCircle,
  MapPin,
  Settings,
  Video,
  Trophy,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  deduplicatedFetch,
  requestDeduplicator,
} from "@/lib/request-deduplication";
import { formatTimeAgo } from "@/lib/utils";
import type {
  AdminModerationLog,
  AdminModerationLogsApiResponse,
} from "@/types/moderation-log";

interface DashboardStats {
  totalPlayers: number;
  activeBans: number;
  totalRules: number;
  recentModerationActions: number;
}

const EMPTY_STATS: DashboardStats = {
  totalPlayers: 0,
  activeBans: 0,
  totalRules: 0,
  recentModerationActions: 0,
};

const PLAYERS_COUNT_URL = "/api/admin/players?count=true";
const MODERATION_PREVIEW_URL = "/api/admin/moderation-logs?limit=5&skip=0";
const RULES_URL = "/api/admin/rules";

type FetchSlot = "players" | "moderation" | "rules";

function formatModerationActionLabel(
  action: string,
  duration?: string,
): string {
  switch (action) {
    case "warn":
      return "Warning";
    case "ban":
      return duration ? `Ban (${duration})` : "Ban";
    case "unban":
      return "Unban";
    case "queue_remove_player":
      return "Queue removal";
    default:
      return action;
  }
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentLogs, setRecentLogs] = useState<AdminModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Partial<Record<FetchSlot, string>>>(
    {},
  );

  const loadDashboard = useCallback(async (options?: { bypassCache?: boolean }) => {
    const useCache = !options?.bypassCache;
    const isFullLoad = !options?.bypassCache;
    if (isFullLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setFatalError(null);
    setSlotErrors({});

    if (options?.bypassCache) {
      requestDeduplicator.invalidate(PLAYERS_COUNT_URL);
      requestDeduplicator.invalidate(MODERATION_PREVIEW_URL);
      requestDeduplicator.invalidate(RULES_URL);
    }

    const nextStats: DashboardStats = { ...EMPTY_STATS };
    const nextErrors: Partial<Record<FetchSlot, string>> = {};
    let nextLogs: AdminModerationLog[] = [];

    try {
      const [playersResult, moderationResult, rulesResult] =
        await Promise.allSettled([
          deduplicatedFetch<{ count?: number }>(PLAYERS_COUNT_URL, {
            ttl: 60_000,
            useCache,
          }),
          deduplicatedFetch<AdminModerationLogsApiResponse>(
            MODERATION_PREVIEW_URL,
            { ttl: 30_000, useCache },
          ),
          deduplicatedFetch<unknown[]>(RULES_URL, { ttl: 120_000, useCache }),
        ]);

      if (playersResult.status === "fulfilled") {
        nextStats.totalPlayers = playersResult.value.count ?? 0;
      } else {
        nextErrors.players = "Player count unavailable";
      }

      if (moderationResult.status === "fulfilled") {
        const payload = moderationResult.value;
        nextStats.activeBans = payload.stats?.activeBans ?? 0;
        nextStats.recentModerationActions = payload.stats?.totalActions ?? 0;
        nextLogs = Array.isArray(payload.logs) ? payload.logs : [];
      } else {
        nextErrors.moderation = "Moderation summary unavailable";
      }

      if (rulesResult.status === "fulfilled") {
        const rulesData = rulesResult.value;
        nextStats.totalRules = Array.isArray(rulesData) ? rulesData.length : 0;
      } else {
        nextErrors.rules = "Rules count unavailable";
      }

      setStats(nextStats);
      setRecentLogs(nextLogs);
      setSlotErrors(nextErrors);

      if (
        playersResult.status === "rejected" &&
        moderationResult.status === "rejected" &&
        rulesResult.status === "rejected"
      ) {
        setFatalError("Could not load dashboard data. Check your connection and try again.");
      }
    } catch {
      setFatalError("Could not load dashboard data. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const hasSlotErrors = Object.keys(slotErrors).length > 0;

  const coreQuickLinks = [
    {
      href: "/admin/players",
      icon: Users,
      title: "Manage Players",
      description: "View and manage all players",
      iconBg: "bg-blue-500/10",
      iconClass: "text-blue-500",
    },
    {
      href: "/admin/moderation",
      icon: Shield,
      title: "Moderation",
      description: "Logs, active bans, disputes",
      iconBg: "bg-red-500/10",
      iconClass: "text-red-500",
    },
    {
      href: "/admin/rules",
      icon: Book,
      title: "Rules",
      description: "Community rules library",
      iconBg: "bg-emerald-500/10",
      iconClass: "text-emerald-500",
    },
  ] as const;

  const crossLinks = [
    {
      href: "/admin/queues",
      icon: MapPin,
      title: "Queues",
      description: "Match queues and launches",
      iconBg: "bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      href: "/admin/guild-settings",
      icon: Settings,
      title: "Guild settings",
      description: "Discord integration & bot options",
      iconBg: "bg-slate-500/10",
      iconClass: "text-slate-600 dark:text-slate-300",
    },
    {
      href: "/admin/featured-video",
      icon: Video,
      title: "Featured video",
      description: "Homepage broadcast slot",
      iconBg: "bg-violet-500/10",
      iconClass: "text-violet-500",
    },
    {
      href: "/tournaments",
      icon: Trophy,
      title: "Tournaments",
      description: "Brackets, teams, scrimmages",
      iconBg: "bg-primary/10",
      iconClass: "text-primary",
    },
  ] as const;

  const renderLinkCard = (link: (typeof coreQuickLinks)[number] | (typeof crossLinks)[number]) => {
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:bg-card hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 sm:py-5"
      >
        <div
          className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-[1.03] ${link.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${link.iconClass}`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[text-decoration-color] group-hover:underline group-hover:decoration-primary/50">
            {link.title}
          </div>
          <div className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
            {link.description}
          </div>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </Link>
    );
  };

  return (
    <div className="relative space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10 xl:px-12">
      <a
        href="#admin-dashboard-main"
        className="sr-only focus:fixed focus:left-4 focus:top-24 focus:z-[200] focus:inline-flex focus:h-auto focus:w-auto focus:items-center focus:overflow-visible focus:whitespace-normal focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to dashboard content
      </a>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Welcome back,{" "}
            <span className="font-medium text-foreground">
              {session?.user?.nickname || session?.user?.name || "Admin"}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 gap-2 sm:w-auto sm:min-w-[9rem]"
          disabled={loading || refreshing}
          onClick={() => void loadDashboard({ bypassCache: true })}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          Refresh data
        </Button>
      </header>

      <div id="admin-dashboard-main" tabIndex={-1} className="outline-none">

      {fatalError && (
        <Card className="rounded-xl border border-destructive/50 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm">{fatalError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={refreshing}
              onClick={() => void loadDashboard({ bypassCache: true })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSlotErrors && !fatalError && (
        <Card className="rounded-xl border border-amber-500/40 bg-amber-500/5 shadow-sm">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-amber-950 dark:text-amber-100">
              <p className="font-medium">Some figures could not be loaded.</p>
              <ul className="list-inside list-disc text-xs opacity-90">
                {slotErrors.players ? <li>{slotErrors.players}</li> : null}
                {slotErrors.moderation ? <li>{slotErrors.moderation}</li> : null}
                {slotErrors.rules ? <li>{slotErrors.rules}</li> : null}
              </ul>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={refreshing}
              onClick={() => void loadDashboard({ bypassCache: true })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mobile: 2×2 compact stats */}
      <section aria-label="Dashboard statistics" className="sm:hidden">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-[4.25rem] rounded-xl" />
            <Skeleton className="h-[4.25rem] rounded-xl" />
            <Skeleton className="h-[4.25rem] rounded-xl" />
            <Skeleton className="h-[4.25rem] rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-center text-xs tabular-nums">
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/80 px-2 py-2.5 shadow-sm">
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Users
                  className="h-3.5 w-3.5 shrink-0 text-blue-500/90"
                  aria-hidden
                />
                Players
              </span>
              <span className="text-base font-semibold text-foreground">
                {slotErrors.players ? "—" : stats.totalPlayers}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/80 px-2 py-2.5 shadow-sm">
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Shield
                  className="h-3.5 w-3.5 shrink-0 text-red-500/90"
                  aria-hidden
                />
                Bans
              </span>
              <span className="text-base font-semibold text-foreground">
                {slotErrors.moderation ? "—" : stats.activeBans}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/80 px-2 py-2.5 shadow-sm">
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Book
                  className="h-3.5 w-3.5 shrink-0 text-green-500/90"
                  aria-hidden
                />
                Rules
              </span>
              <span className="text-base font-semibold text-foreground">
                {slotErrors.rules ? "—" : stats.totalRules}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/80 px-2 py-2.5 shadow-sm">
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Activity
                  className="h-3.5 w-3.5 shrink-0 text-purple-500/90"
                  aria-hidden
                />
                Actions
              </span>
              <span className="text-base font-semibold text-foreground">
                {slotErrors.moderation ? "—" : stats.recentModerationActions}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Stats cards (tablet+) */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-md">
          <div
            className="pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-2xl"
            aria-hidden
          />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Players
            </CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2">
              <Users className="h-4 w-4 text-blue-500/90 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            {loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {slotErrors.players ? "—" : stats.totalPlayers}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-red-500/30 hover:shadow-md">
          <div
            className="pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-2xl"
            aria-hidden
          />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Bans
            </CardTitle>
            <div className="rounded-xl bg-red-500/10 p-2">
              <Shield className="h-4 w-4 text-red-500/90 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            {loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {slotErrors.moderation ? "—" : stats.activeBans}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md">
          <div
            className="pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-2xl"
            aria-hidden
          />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rules
            </CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <Book className="h-4 w-4 text-emerald-500/90 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            {loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {slotErrors.rules ? "—" : stats.totalRules}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-violet-500/30 hover:shadow-md">
          <div
            className="pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-2xl"
            aria-hidden
          />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Moderation actions
            </CardTitle>
            <div className="rounded-xl bg-violet-500/10 p-2">
              <Activity className="h-4 w-4 text-violet-500/90 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            {loading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {slotErrors.moderation ? "—" : stats.recentModerationActions}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="admin-quick-links-heading">
        <h2
          id="admin-quick-links-heading"
          className="mb-3 text-lg mt-4  font-semibold tracking-tight text-foreground sm:mb-4 sm:text-xl"
        >
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {coreQuickLinks.map(renderLinkCard)}
        </div>
      </section>

      <section aria-labelledby="admin-more-tools-heading">
        <h2
          id="admin-more-tools-heading"
          className="mb-3 text-lg mt-4 font-semibold tracking-tight text-foreground sm:mb-4 sm:text-xl"
        >
          More tools
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {crossLinks.map(renderLinkCard)}
        </div>
      </section>

      <Card className="overflow-hidden mt-4 rounded-2xl border border-border/60 bg-card/80 shadow-sm">
        <CardHeader className="flex flex-col gap-2 px-4 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
          <div>
            <CardTitle className="text-lg font-semibold sm:text-xl">
              Recent activity
            </CardTitle>
            <CardDescription>
              Latest entries from the moderation log (newest first).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
            <Link href="/admin/moderation?tab=recent">View full log</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : slotErrors.moderation ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
              <AlertCircle
                className="h-8 w-8 text-muted-foreground"
                aria-hidden
              />
              <p className="max-w-sm text-sm text-muted-foreground">
                Recent actions could not be loaded.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={refreshing}
                onClick={() => void loadDashboard({ bypassCache: true })}
              >
                Retry
              </Button>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center sm:py-12">
              <p className="text-sm text-muted-foreground">
                No moderation entries yet. Open{" "}
                <Link
                  href="/admin/moderation"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Moderation
                </Link>{" "}
                when actions are recorded.
              </p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Recent moderation log entries">
              {recentLogs.map((log) => (
                <li key={log._id}>
                  <Link
                    href="/admin/moderation?tab=recent"
                    className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/10 px-3 py-3 transition-colors hover:bg-muted/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
                  >
                    <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
                      <AvatarImage
                        src={log.playerProfilePicture || undefined}
                        alt={log.playerName}
                      />
                      <AvatarFallback className="text-xs">
                        {log.playerName?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {log.playerName}
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {formatModerationActionLabel(
                            log.action,
                            log.duration,
                          )}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {log.reason}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                      <time dateTime={log.timestamp}>
                        {formatTimeAgo(new Date(log.timestamp))}
                      </time>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-[opacity,transform] group-hover:opacity-100 sm:opacity-0 sm:group-hover:translate-x-0.5 sm:group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      </div>
    </div>
  );
}
