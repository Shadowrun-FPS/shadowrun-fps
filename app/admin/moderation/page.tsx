"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  useMemo,
} from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Check,
  ChevronDown,
  Eye,
  Filter,
  History,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  Scale,
  Shield,
  Unlock,
  UserMinus,
} from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { DisputeReviewDialog } from "@/components/dispute-review-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { playerHistoryHref } from "@/lib/safe-return-to";
import {
  MODERATION_LOG_PUSHER_CHANNEL,
  MODERATION_LOG_PUSHER_EVENT,
} from "@/lib/moderation-log-realtime-constants";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import { isPlayerUnbanned } from "@/lib/moderation-is-player-unbanned";
import { safeLog } from "@/lib/security";
import type {
  AdminModerationLog,
  AdminModerationLogsApiResponse,
} from "@/types/moderation-log";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  desktopNavControlClass,
  desktopNavRailClass,
} from "@/components/navbar";

/** Matches `desktopNavRouteActiveClass` for Radix Tabs `data-[state=active]` */
const moderationDesktopTabActiveClass =
  "data-[state=active]:bg-background/95 data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/20 dark:data-[state=active]:bg-background/45 dark:data-[state=active]:ring-primary/30 data-[state=active]:hover:bg-background/95 dark:data-[state=active]:hover:bg-background/45";

interface Dispute {
  _id: string;
  moderationLogId: string;
  playerDiscordId: string;
  playerName: string;
  playerId: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  moderationAction: {
    _id: string;
    type: "warning" | "temp_ban" | "perm_ban" | "unban";
    playerId: string;
    playerName: string;
    reason: string;
    duration: string;
    active: boolean;
    moderatorId: string;
    moderatorName: string;
    timestamp: string;
  };
}

type FilterType =
  | "all"
  | "warnings"
  | "bans"
  | "active"
  | "queue_removals";

const VALID_TABS = ["overview", "active", "recent", "disputes"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(t: string | null): t is TabValue {
  return !!t && VALID_TABS.includes(t as TabValue);
}

function isFilterValue(t: string | null): t is FilterType {
  return (
    t === "all" ||
    t === "warnings" ||
    t === "bans" ||
    t === "active" ||
    t === "queue_removals"
  );
}

function LogDateCell({ iso }: { iso: string }) {
  const parts = formatModerationLogDateParts(iso);
  return (
    <time
      dateTime={parts.dateTimeAttr}
      className="tabular-nums"
      title={parts.secondary || undefined}
    >
      {parts.primary}
    </time>
  );
}

function isPermanentBanDuration(duration: string | undefined) {
  const d = (duration ?? "").trim().toLowerCase();
  return !d || d === "permanent" || d === "perm";
}

function unbanTypedNameMatches(typed: string, expectedPlayerName: string) {
  return typed.trim() === expectedPlayerName.trim();
}

/** Matches maroon `privileged` tokens in globals.css */
const unbanTriggerClassName =
  "border border-privileged/80 bg-privileged text-privileged-foreground shadow-sm hover:bg-privileged/88 hover:text-privileged-foreground active:bg-privileged/80 focus-visible:ring-privileged/40";

type UnbanConfirmPayload = {
  playerId: string;
  playerName: string;
  reason?: string;
  durationLabel?: string;
};

type ActiveBansSortKey = "player" | "reason" | "duration" | "moderator" | "date";
type RecentActionsSortKey =
  | "type"
  | "player"
  | "reason"
  | "moderator"
  | "date";

function compareModerationText(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function logTimestampMs(log: AdminModerationLog) {
  return new Date(log.timestamp).getTime();
}

function recentActionTypeRank(action: string) {
  if (action === "warn") return 0;
  if (action === "queue_remove_player") return 1;
  if (action === "ban") return 2;
  if (action === "unban") return 3;
  return 99;
}

function ModerationSortableTh({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sortKey === columnKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="-mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onSort(columnKey)}
        aria-sort={
          active
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <span className="truncate">{label}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

const PENDING_DISPUTES_OVERVIEW_EMPTY_VARIANTS = [
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

function ModerationPanelContent() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminModerationLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [activeActions, setActiveActions] = useState<AdminModerationLog[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    warnings: 0,
    activeBans: 0,
    totalActions: 0,
  });
  const pageRootRef = useRef<HTMLDivElement>(null);
  const overviewBelowStatsRef = useRef<HTMLElement>(null);
  const [showScrollToOverviewContentCue, setShowScrollToOverviewContentCue] =
    useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [detailLog, setDetailLog] = useState<AdminModerationLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [unbanConfirm, setUnbanConfirm] = useState<UnbanConfirmPayload | null>(
    null,
  );
  const [unbanTypedPlayerName, setUnbanTypedPlayerName] = useState("");
  const [unbanInProgressId, setUnbanInProgressId] = useState<string | null>(
    null,
  );
  const [activeBansSort, setActiveBansSort] = useState<{
    key: ActiveBansSortKey;
    dir: "asc" | "desc";
  }>({ key: "date", dir: "desc" });
  const [recentActionsSort, setRecentActionsSort] = useState<{
    key: RecentActionsSortKey;
    dir: "asc" | "desc";
  }>({ key: "date", dir: "desc" });

  useEffect(() => {
    setUnbanTypedPlayerName("");
  }, [unbanConfirm]);

  const cycleActiveBansSort = useCallback((key: ActiveBansSortKey) => {
    setActiveBansSort((prev) => {
      const defaultDir = key === "date" ? "desc" : "asc";
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: defaultDir };
    });
  }, []);

  const cycleRecentActionsSort = useCallback((key: RecentActionsSortKey) => {
    setRecentActionsSort((prev) => {
      const defaultDir = key === "date" ? "desc" : "asc";
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: defaultDir };
    });
  }, []);

  const pendingDisputesOverviewEmptyCopy = useMemo(() => {
    const seed = pathname.length + searchParams.toString().length;
    return PENDING_DISPUTES_OVERVIEW_EMPTY_VARIANTS[
      seed % PENDING_DISPUTES_OVERVIEW_EMPTY_VARIANTS.length
    ];
  }, [pathname, searchParams]);

  const scrollToOverviewMainContent = useCallback(() => {
    const el = overviewBelowStatsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* focus may fail if ref unmounted */
      }
    }, 350);
  }, []);

  const fetchData = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      try {
        setLoading(true);

        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const logsUrl = "/api/admin/moderation-logs?limit=3000&skip=0";
        const [raw, disputesResponse] = await Promise.all([
          deduplicatedFetch<
            AdminModerationLogsApiResponse | AdminModerationLog[]
          >(logsUrl, {
            ttl: 30000,
            useCache: options?.bypassCache ? false : true,
          }),
          fetch("/api/moderation/disputes"),
        ]);

        if (disputesResponse.ok) {
          const dj = (await disputesResponse.json()) as {
            disputes?: Dispute[];
          };
          setDisputes(Array.isArray(dj.disputes) ? dj.disputes : []);
        } else {
          setDisputes([]);
        }

        if (Array.isArray(raw)) {
          const data = raw;
          setLogs(data);

          const unbanMap = new Map<string, number>();
          data.forEach((log) => {
            if (log.action === "unban" && log.playerId) {
              const existingTimestamp = unbanMap.get(log.playerId);
              const currentTimestamp = new Date(log.timestamp).getTime();
              if (!existingTimestamp || currentTimestamp > existingTimestamp) {
                unbanMap.set(log.playerId, currentTimestamp);
              }
            }
          });

          const activeBansFiltered = data.filter((log) => {
            if (log.action !== "ban") return false;
            const banTimestamp = new Date(log.timestamp).getTime();
            const unbanTimestamp = unbanMap.get(log.playerId);
            if (unbanTimestamp && unbanTimestamp > banTimestamp) {
              return false;
            }
            if (log.expiry && new Date(log.expiry) < new Date()) {
              return false;
            }
            return true;
          });

          setActiveActions(activeBansFiltered);
          setStats({
            warnings: data.filter((log) => log.action === "warn").length,
            activeBans: activeBansFiltered.length,
            totalActions: data.length,
          });
        } else {
          const env = raw;
          setLogs(env.logs);
          setActiveActions(env.activeBans ?? []);
          setStats(env.stats);
        }

        setLoading(false);
      } catch (error) {
        safeLog.error("Moderation panel fetch failed", error);
        toast({
          variant: "destructive",
          title: "Could not load moderation data",
          description: "Try again in a moment.",
        });
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabValue(tab)) {
      setActiveTab(tab);
    }
    const f = searchParams.get("filter");
    if (isFilterValue(f)) {
      setFilter(f);
    }
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const listEl = overviewBelowStatsRef.current;
    const rootEl = pageRootRef.current;
    if (!listEl || !rootEl || typeof window === "undefined") {
      setShowScrollToOverviewContentCue(false);
      return;
    }

    const mobileMq = window.matchMedia("(max-width: 639px)");

    const updateScrollCue = () => {
      if (!mobileMq.matches || activeTab !== "overview") {
        setShowScrollToOverviewContentCue(false);
        return;
      }
      const rect = listEl.getBoundingClientRect();
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setShowScrollToOverviewContentCue(rect.top > vh - 8);
    };

    updateScrollCue();

    const ro = new ResizeObserver(updateScrollCue);
    ro.observe(listEl);
    ro.observe(rootEl);
    window.addEventListener("scroll", updateScrollCue, { passive: true });
    window.addEventListener("resize", updateScrollCue);
    mobileMq.addEventListener("change", updateScrollCue);
    window.visualViewport?.addEventListener("resize", updateScrollCue);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updateScrollCue);
      window.removeEventListener("resize", updateScrollCue);
      mobileMq.removeEventListener("change", updateScrollCue);
      window.visualViewport?.removeEventListener("resize", updateScrollCue);
    };
  }, [loading, activeTab]);

  const syncRecentTabToUrl = useCallback(
    (next: { filter?: FilterType; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "recent");
      if (next.filter !== undefined) {
        params.set("filter", next.filter);
      }
      if (next.q !== undefined) {
        if (next.q === "") {
          params.delete("q");
        } else {
          params.set("q", next.q);
        }
      }
      const nextQs = params.toString();
      if (nextQs === searchParams.toString()) {
        return;
      }
      router.replace(`${pathname}?${nextQs}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
        void fetchData({ bypassCache: true });
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
  }, [fetchData]);

  const onTabChange = (value: string) => {
    if (!isTabValue(value)) return;
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onFilterChange = (value: FilterType) => {
    setFilter(value);
    if (activeTab === "recent") {
      syncRecentTabToUrl({ filter: value });
    }
  };

  useEffect(() => {
    if (activeTab !== "recent") return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "recent");
      if (searchQuery === "") {
        params.delete("q");
      } else {
        params.set("q", searchQuery);
      }
      const nextQs = params.toString();
      if (nextQs === searchParams.toString()) {
        return;
      }
      router.replace(`${pathname}?${nextQs}`, { scroll: false });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery, activeTab, pathname, router, searchParams]);

  const filteredActiveBans = useMemo(() => {
    const q = activeSearchQuery.trim().toLowerCase();
    if (!q) return activeActions;
    return activeActions.filter(
      (action) =>
        action.playerName?.toLowerCase().includes(q) ||
        action.moderatorName?.toLowerCase().includes(q) ||
        action.reason?.toLowerCase().includes(q),
    );
  }, [activeActions, activeSearchQuery]);

  const sortedFilteredActiveBans = useMemo(() => {
    const mul = activeBansSort.dir === "asc" ? 1 : -1;
    return [...filteredActiveBans].sort((a, b) => {
      let cmp = 0;
      switch (activeBansSort.key) {
        case "player":
          cmp = compareModerationText(a.playerName ?? "", b.playerName ?? "");
          break;
        case "reason":
          cmp = compareModerationText(a.reason ?? "", b.reason ?? "");
          break;
        case "duration":
          cmp = compareModerationText(
            a.duration || "Permanent",
            b.duration || "Permanent",
          );
          break;
        case "moderator":
          cmp = compareModerationText(
            a.moderatorName ?? "",
            b.moderatorName ?? "",
          );
          break;
        case "date":
          cmp = logTimestampMs(a) - logTimestampMs(b);
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return mul * cmp;
      return logTimestampMs(b) - logTimestampMs(a);
    });
  }, [filteredActiveBans, activeBansSort]);

  const filteredRecentActions = useMemo(() => {
    let filtered = logs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (action) =>
          action.playerName?.toLowerCase().includes(query) ||
          action.moderatorName?.toLowerCase().includes(query) ||
          action.reason?.toLowerCase().includes(query),
      );
    }

    if (filter === "warnings") {
      filtered = filtered.filter((action) => action.action === "warn");
    } else if (filter === "bans") {
      filtered = filtered.filter((action) => action.action === "ban");
    } else if (filter === "queue_removals") {
      filtered = filtered.filter(
        (action) => action.action === "queue_remove_player",
      );
    } else if (filter === "active") {
      filtered = filtered.filter(
        (action) =>
          action.action === "ban" &&
          (!action.expiry || new Date(action.expiry) > new Date()) &&
          !isPlayerUnbanned(logs, action.playerId, action),
      );
    }

    return filtered;
  }, [logs, searchQuery, filter]);

  const sortedFilteredRecentActions = useMemo(() => {
    const mul = recentActionsSort.dir === "asc" ? 1 : -1;
    return [...filteredRecentActions].sort((a, b) => {
      let cmp = 0;
      switch (recentActionsSort.key) {
        case "type":
          cmp =
            recentActionTypeRank(a.action) - recentActionTypeRank(b.action) ||
            compareModerationText(a.action, b.action);
          break;
        case "player":
          cmp = compareModerationText(a.playerName ?? "", b.playerName ?? "");
          break;
        case "reason":
          cmp = compareModerationText(a.reason ?? "", b.reason ?? "");
          break;
        case "moderator":
          cmp = compareModerationText(
            a.moderatorName ?? "",
            b.moderatorName ?? "",
          );
          break;
        case "date":
          cmp = logTimestampMs(a) - logTimestampMs(b);
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return mul * cmp;
      return logTimestampMs(b) - logTimestampMs(a);
    });
  }, [filteredRecentActions, recentActionsSort]);

  const openUnbanConfirm = (
    playerId: string,
    playerName: string,
    extra?: { reason?: string; durationLabel?: string },
  ) => {
    setUnbanConfirm({
      playerId,
      playerName,
      reason: extra?.reason,
      durationLabel: extra?.durationLabel,
    });
  };

  const performUnban = async () => {
    const pending = unbanConfirm;
    if (!pending) return;
    const { playerId, playerName } = pending;
    if (!unbanTypedNameMatches(unbanTypedPlayerName, playerName)) {
      toast({
        variant: "destructive",
        title: "Name does not match",
        description:
          "Type the player name exactly as shown (including spaces) to confirm.",
      });
      return;
    }
    try {
      setUnbanInProgressId(playerId);

      const response = await fetch(`/api/admin/players/${playerId}/unban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Ban removed by administrator",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unban player");
      }

      toast({
        title: "Player Unbanned",
        description: `${playerName} has been unbanned successfully.`,
      });

      setUnbanConfirm(null);
      await fetchData({ bypassCache: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to unban player",
      });
    } finally {
      setUnbanInProgressId(null);
    }
  };

  const handleDisputeResolved = () => {
    void fetchData({ bypassCache: true });
    setDisputeDialogOpen(false);
  };

  const handleViewDispute = (dispute: Dispute) => {
    // Ensure the status is one of the expected values
    let typedStatus: "pending" | "approved" | "denied" = "pending";
    if (dispute.status === "approved" || dispute.status === "denied") {
      typedStatus = dispute.status;
    }

    // Fix the type comparison issue by using a type assertion
    // This allows us to handle potential API inconsistencies
    const actionType = dispute.moderationAction.type as string;
    const fixedType =
      actionType === "warn" ? "warning" : dispute.moderationAction.type;

    const disputeWithCorrectTypes = {
      ...dispute,
      playerId: dispute.playerId || dispute.playerDiscordId,
      status: typedStatus,
      moderationAction: {
        ...dispute.moderationAction,
        type: fixedType as "warning" | "temp_ban" | "perm_ban" | "unban",
        playerId: dispute.moderationAction.playerId || dispute.playerDiscordId,
        playerName: dispute.moderationAction.playerName || dispute.playerName,
        duration: dispute.moderationAction.duration || "N/A",
        active:
          typeof dispute.moderationAction.active === "boolean"
            ? dispute.moderationAction.active
            : true,
      },
    };

    setSelectedDispute(disputeWithCorrectTypes);
    setDisputeDialogOpen(true);
  };

  // Add a function to get the tab label
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "overview":
        return "Overview";
      case "active":
        return "Active Bans";
      case "recent":
        return "Recent Actions";
      case "disputes":
        return "Disputes";
      default:
        return "Overview";
    }
  };

  function handleViewHistory(action: AdminModerationLog): void {
    router.push(
      playerHistoryHref(action.playerId, pathname, searchParams),
    );
  }

  return (
    <div
      ref={pageRootRef}
      className="space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:space-y-8 lg:px-8 lg:py-10 xl:px-12"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Moderation Panel
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage player warnings, bans, and disputes
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchData({ bypassCache: true })}
          disabled={loading}
          className="shrink-0 gap-2 self-stretch sm:self-center sm:min-h-10"
          title="Refresh data"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        {/* Improved Tabs with better styling */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Mobile: Dropdown, Desktop: TabsList */}
          <div className="hidden md:block">
            <TabsList
              className={cn(
                "h-auto w-full min-h-0 justify-start gap-0.5 bg-transparent p-0 text-muted-foreground",
                desktopNavRailClass
              )}
            >
              <TabsTrigger
                value="overview"
                className={cn(
                  desktopNavControlClass,
                  moderationDesktopTabActiveClass
                )}
              >
                <LayoutDashboard
                  className="mr-2 h-4 w-4 shrink-0 opacity-90"
                  aria-hidden
                />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className={cn(
                  desktopNavControlClass,
                  moderationDesktopTabActiveClass
                )}
              >
                <Ban className="mr-2 h-4 w-4 shrink-0 opacity-90" aria-hidden />
                Active Bans
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className={cn(
                  desktopNavControlClass,
                  moderationDesktopTabActiveClass
                )}
              >
                <History
                  className="mr-2 h-4 w-4 shrink-0 opacity-90"
                  aria-hidden
                />
                Recent Actions
              </TabsTrigger>
              <TabsTrigger
                value="disputes"
                className={cn(
                  desktopNavControlClass,
                  moderationDesktopTabActiveClass
                )}
              >
                <Shield
                  className="mr-2 h-4 w-4 shrink-0 opacity-90"
                  aria-hidden
                />
                Disputes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile: Dropdown Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between min-h-[44px]"
                >
                  {getTabLabel(activeTab)}
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[min(16rem,calc(100vw-2rem))]">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onTabChange("overview")}
                >
                  <LayoutDashboard
                    className="h-4 w-4 shrink-0 opacity-90"
                    aria-hidden
                  />
                  Overview
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onTabChange("active")}
                >
                  <Ban className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Active Bans
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onTabChange("recent")}
                >
                  <History className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Recent Actions
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onTabChange("disputes")}
                >
                  <Shield className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Disputes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="space-y-6 sm:space-y-8">
            {/* Mobile: compact stats + scroll cue */}
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
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <AlertTriangle
                          className="h-3.5 w-3.5 shrink-0 text-amber-500"
                          aria-hidden
                        />
                        Warnings
                      </span>
                      <span className="font-semibold text-foreground">
                        {stats.warnings}
                      </span>
                    </div>
                    <div
                      className="w-px shrink-0 self-stretch bg-border/60"
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Ban
                          className="h-3.5 w-3.5 shrink-0 text-red-500"
                          aria-hidden
                        />
                        Bans
                      </span>
                      <span className="font-semibold text-foreground">
                        {stats.activeBans}
                      </span>
                    </div>
                    <div
                      className="w-px shrink-0 self-stretch bg-border/60"
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Activity
                          className="h-3.5 w-3.5 shrink-0 text-blue-500"
                          aria-hidden
                        />
                        Actions
                      </span>
                      <span className="font-semibold text-foreground">
                        {stats.totalActions}
                      </span>
                    </div>
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
                    <span className="text-[11px] font-medium">
                      Activity below
                    </span>
                    <ChevronDown
                      className="h-5 w-5 animate-bounce"
                      aria-hidden
                    />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Stats Cards (tablet+) */}
            <div className="hidden gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              <Card className="relative overflow-hidden border-2 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium text-foreground">
                    Warnings issued
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.warnings}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.warnings > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {stats.warnings === 1
                      ? "1 warn action logged"
                      : `${stats.warnings} warn actions logged`}
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium text-foreground">
                    Active Bans
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.activeBans}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.activeBans > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {stats.activeBans} active bans
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                  <CardTitle className="text-sm sm:text-base font-medium text-foreground">
                    Total Actions
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalActions}
                  </div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      stats.totalActions > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {stats.totalActions} total actions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Actions and Pending Disputes */}
            <section
              ref={overviewBelowStatsRef}
              id="admin-moderation-overview-main"
              tabIndex={-1}
              aria-label="Recent actions and pending disputes"
              className="scroll-mt-4 outline-none sm:scroll-mt-6"
            >
              <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-7">
                <Card className="flex h-full min-h-0 flex-col border-2 bg-gradient-to-br from-background to-muted/20 lg:col-span-4">
                  <CardHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-base sm:text-lg font-semibold">
                      Recent Actions
                    </CardTitle>
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
                              <p className="min-w-0 text-sm font-medium leading-snug">
                                {action.playerName}
                              </p>
                              <time
                                className="justify-self-end text-xs leading-snug text-muted-foreground tabular-nums"
                                dateTime={action.timestamp}
                              >
                                {formatTimeAgo(new Date(action.timestamp))}
                              </time>
                              <p className="min-w-0 text-xs leading-snug text-muted-foreground">
                                {detailLabel}
                              </p>
                              <div className="flex items-center justify-self-end [&_svg]:shrink-0">
                                {action.action === "warn" ? (
                                  <AlertTriangle
                                    className="h-4 w-4 text-amber-500"
                                    aria-hidden
                                  />
                                ) : action.action === "queue_remove_player" ? (
                                  <UserMinus
                                    className="h-4 w-4 text-muted-foreground"
                                    aria-hidden
                                  />
                                ) : action.action === "ban" ? (
                                  <Badge
                                    variant={
                                      isPlayerUnbanned(logs, action.playerId, action)
                                        ? "outline"
                                        : "destructive"
                                    }
                                    className="whitespace-nowrap text-[10px] sm:text-xs"
                                  >
                                    {isPlayerUnbanned(logs, action.playerId, action)
                                      ? "Unbanned"
                                      : "Ban"}
                                  </Badge>
                                ) : (
                                  <Check
                                    className="h-4 w-4 text-green-500"
                                    aria-hidden
                                  />
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
                <Card className="flex h-full min-h-0 flex-col border-2 bg-gradient-to-br from-background to-muted/20 lg:col-span-3">
                  <CardHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-base sm:text-lg font-semibold">
                      Pending Disputes
                    </CardTitle>
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
                              <p className="text-sm font-medium">
                                {dispute.playerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Disputing{" "}
                                {dispute.moderationAction.type === "warning"
                                  ? "Warning"
                                  : "Ban"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDispute(dispute)}
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
                          <p className="text-sm font-semibold text-foreground">
                            {pendingDisputesOverviewEmptyCopy.title}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {pendingDisputesOverviewEmptyCopy.body}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground/80">
                          No pending disputes right now.
                        </p>
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

        <TabsContent value="active" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Active Bans
                </h2>
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

              {/* Desktop view (hidden on small screens) */}
              <div className="hidden md:block">
                <Table
                  wrapperClassName="rounded-xl border border-border/60 bg-card/30 shadow-sm"
                  className="min-w-[640px]"
                >
                  <TableCaption className="sr-only">
                    Active bans: players currently banned; use Unban to restore
                    access after confirmation.
                  </TableCaption>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <ModerationSortableTh
                        label="Player"
                        columnKey="player"
                        sortKey={activeBansSort.key}
                        sortDir={activeBansSort.dir}
                        onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)}
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Reason"
                        columnKey="reason"
                        sortKey={activeBansSort.key}
                        sortDir={activeBansSort.dir}
                        onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)}
                        className="min-w-[8rem] max-w-[18rem]"
                      />
                      <ModerationSortableTh
                        label="Duration"
                        columnKey="duration"
                        sortKey={activeBansSort.key}
                        sortDir={activeBansSort.dir}
                        onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)}
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Moderator"
                        columnKey="moderator"
                        sortKey={activeBansSort.key}
                        sortDir={activeBansSort.dir}
                        onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)}
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Date"
                        columnKey="date"
                        sortKey={activeBansSort.key}
                        sortDir={activeBansSort.dir}
                        onSort={(k) => cycleActiveBansSort(k as ActiveBansSortKey)}
                        className="whitespace-nowrap"
                      />
                      <TableHead className="w-[1%] whitespace-nowrap text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActiveBans.length > 0 ? (
                      sortedFilteredActiveBans.map((action) => (
                        <TableRow key={action._id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={action.playerProfilePicture || undefined}
                                  alt={action.playerName}
                                />
                                <AvatarFallback>
                                  {action.playerName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="max-w-[10rem] truncate sm:max-w-[14rem]">
                                {action.playerName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[18rem]">
                            <span
                              className="line-clamp-2 text-muted-foreground"
                              title={action.reason}
                            >
                              {action.reason}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isPermanentBanDuration(action.duration)
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="font-normal tabular-nums"
                            >
                              {action.duration || "Permanent"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex max-w-[12rem] items-center gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage
                                  src={
                                    action.moderatorProfilePicture || undefined
                                  }
                                  alt={action.moderatorName}
                                />
                                <AvatarFallback>
                                  {action.moderatorName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 truncate">
                                {action.moderatorName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <LogDateCell iso={action.timestamp} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openUnbanConfirm(
                                  action.playerId,
                                  action.playerName,
                                  {
                                    reason: action.reason,
                                    durationLabel:
                                      action.duration || "Permanent",
                                  },
                                )
                              }
                              disabled={
                                isPlayerUnbanned(logs, action.playerId, action) ||
                                unbanInProgressId === action.playerId
                              }
                              className={cn(
                                "min-h-[44px] sm:min-h-0",
                                unbanTriggerClassName,
                              )}
                            >
                              {unbanInProgressId === action.playerId ? (
                                <Loader2
                                  className="h-4 w-4 shrink-0 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Unlock
                                  className="h-4 w-4 shrink-0"
                                  aria-hidden
                                />
                              )}
                              Unban
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : activeActions.length > 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No active bans match your search
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No active bans found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/tablet view (shown only on small screens) */}
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
                              <AvatarImage
                                src={action.playerProfilePicture || undefined}
                                alt={action.playerName}
                              />
                              <AvatarFallback>
                                {action.playerName?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">
                                {action.playerName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatTimeAgo(new Date(action.timestamp))}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              action.action === "warn"
                                ? "warning"
                                : isPlayerUnbanned(logs, action.playerId, action)
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {action.action === "warn"
                              ? "Warning"
                              : isPlayerUnbanned(logs, action.playerId, action)
                                ? "Unbanned"
                                : "Ban"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-2 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">
                              Reason:
                            </p>
                            <p className="line-clamp-2">{action.reason}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">
                              Moderator:
                            </p>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={
                                    action.moderatorProfilePicture || undefined
                                  }
                                  alt={action.moderatorName}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {action.moderatorName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <p>{action.moderatorName}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">
                              Duration:
                            </p>
                            <Badge
                              variant={
                                isPermanentBanDuration(action.duration)
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="mt-0.5 font-normal tabular-nums"
                            >
                              {action.duration || "Permanent"}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openUnbanConfirm(
                                action.playerId,
                                action.playerName,
                                {
                                  reason: action.reason,
                                  durationLabel:
                                    action.duration || "Permanent",
                                },
                              )
                            }
                            disabled={
                              isPlayerUnbanned(logs, action.playerId, action) ||
                              unbanInProgressId === action.playerId
                            }
                            className={cn(
                              "min-h-[44px] min-w-[7.5rem] sm:min-h-0",
                              unbanTriggerClassName,
                            )}
                          >
                            {unbanInProgressId === action.playerId ? (
                              <Loader2
                                className="h-4 w-4 shrink-0 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Unlock
                                className="h-4 w-4 shrink-0"
                                aria-hidden
                              />
                            )}
                            Unban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : activeActions.length > 0 ? (
                  <div className="flex flex-col justify-center items-center h-24 text-center">
                    <p className="text-muted-foreground">
                      No active bans match your search
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center h-24 text-center">
                    <p className="text-muted-foreground">
                      No active bans found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                <Select
                  value={filter}
                  onValueChange={(value) =>
                    onFilterChange(value as FilterType)
                  }
                >
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
                    <SelectItem value="queue_removals">
                      Queue removals
                    </SelectItem>
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

              <div className="hidden md:block">
                <Table
                  wrapperClassName="rounded-xl border border-border/60 bg-card/30 shadow-sm"
                  className="min-w-[720px]"
                >
                  <TableCaption className="sr-only">
                    Recent moderation actions loaded from the server, newest
                    first. Open the actions menu on a row for details, history,
                    or unban.
                  </TableCaption>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <ModerationSortableTh
                        label="Type"
                        columnKey="type"
                        sortKey={recentActionsSort.key}
                        sortDir={recentActionsSort.dir}
                        onSort={(k) =>
                          cycleRecentActionsSort(k as RecentActionsSortKey)
                        }
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Player"
                        columnKey="player"
                        sortKey={recentActionsSort.key}
                        sortDir={recentActionsSort.dir}
                        onSort={(k) =>
                          cycleRecentActionsSort(k as RecentActionsSortKey)
                        }
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Reason"
                        columnKey="reason"
                        sortKey={recentActionsSort.key}
                        sortDir={recentActionsSort.dir}
                        onSort={(k) =>
                          cycleRecentActionsSort(k as RecentActionsSortKey)
                        }
                        className="min-w-[8rem] max-w-[18rem]"
                      />
                      <ModerationSortableTh
                        label="Moderator"
                        columnKey="moderator"
                        sortKey={recentActionsSort.key}
                        sortDir={recentActionsSort.dir}
                        onSort={(k) =>
                          cycleRecentActionsSort(k as RecentActionsSortKey)
                        }
                        className="whitespace-nowrap"
                      />
                      <ModerationSortableTh
                        label="Date"
                        columnKey="date"
                        sortKey={recentActionsSort.key}
                        sortDir={recentActionsSort.dir}
                        onSort={(k) =>
                          cycleRecentActionsSort(k as RecentActionsSortKey)
                        }
                        className="whitespace-nowrap"
                      />
                      <TableHead className="w-[1%] whitespace-nowrap text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFilteredRecentActions.map((action) => (
                      <TableRow key={action._id}>
                        <TableCell className="whitespace-nowrap">
                          {action.action === "warn" ? (
                            <Badge variant="warning">Warning</Badge>
                          ) : action.action === "queue_remove_player" ? (
                            <Badge variant="secondary">Queue removal</Badge>
                          ) : (
                            <Badge
                              variant={
                                isPlayerUnbanned(logs, action.playerId, action)
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {isPlayerUnbanned(logs, action.playerId, action)
                                ? "Unbanned"
                                : "Ban"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage
                                src={action.playerProfilePicture || undefined}
                                alt={action.playerName}
                              />
                              <AvatarFallback>
                                {action.playerName?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="max-w-[10rem] truncate sm:max-w-[14rem]">
                              {action.playerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          <span
                            className="line-clamp-2 text-muted-foreground"
                            title={action.reason}
                          >
                            {action.reason}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex max-w-[12rem] items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage
                                src={
                                  action.moderatorProfilePicture || undefined
                                }
                                alt={action.moderatorName}
                              />
                              <AvatarFallback>
                                {action.moderatorName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 truncate">
                              {action.moderatorName}
                            </span>
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
                              <DropdownMenuItem
                                onClick={() => {
                                  setDetailLog(action);
                                  setDetailOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewHistory(action)}
                              >
                                <History className="mr-2 w-4 h-4" />
                                View Player History
                              </DropdownMenuItem>
                              {action.action === "ban" && (
                                <DropdownMenuItem
                                  className="text-privileged focus:bg-privileged/15 focus:text-privileged-foreground"
                                  onClick={() =>
                                    openUnbanConfirm(
                                      action.playerId,
                                      action.playerName,
                                      {
                                        reason: action.reason,
                                        durationLabel:
                                          action.duration || "Permanent",
                                      },
                                    )
                                  }
                                  disabled={
                                    isPlayerUnbanned(
                                      logs,
                                      action.playerId,
                                      action,
                                    ) || unbanInProgressId === action.playerId
                                  }
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
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No actions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile view for recent actions */}
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
                            <AvatarImage
                              src={action.playerProfilePicture || undefined}
                              alt={action.playerName}
                            />
                            <AvatarFallback>
                              {action.playerName?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{action.playerName}</p>
                            <p className="text-sm text-muted-foreground">
                              <LogDateCell iso={action.timestamp} />
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            action.action === "warn"
                              ? "warning"
                              : action.action === "queue_remove_player"
                                ? "secondary"
                                : isPlayerUnbanned(logs, action.playerId, action)
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {action.action === "warn"
                            ? "Warning"
                            : action.action === "queue_remove_player"
                              ? "Queue removal"
                              : isPlayerUnbanned(logs, action.playerId, action)
                                ? "Unbanned"
                                : "Ban"}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm">{action.reason}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={action.moderatorProfilePicture || undefined}
                              alt={action.moderatorName}
                            />
                            <AvatarFallback className="text-[8px]">
                              {action.moderatorName?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-muted-foreground">
                            By {action.moderatorName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center p-0 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
                            title="Details"
                            onClick={() => {
                              setDetailLog(action);
                              setDetailOpen(true);
                            }}
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
                              onClick={() =>
                                openUnbanConfirm(
                                  action.playerId,
                                  action.playerName,
                                  {
                                    reason: action.reason,
                                    durationLabel:
                                      action.duration || "Permanent",
                                  },
                                )
                              }
                              disabled={
                                isPlayerUnbanned(
                                  logs,
                                  action.playerId,
                                  action,
                                ) || unbanInProgressId === action.playerId
                              }
                            >
                              {unbanInProgressId === action.playerId ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin"
                                  aria-hidden
                                />
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
                  <div className="py-8 text-center text-muted-foreground">
                    No actions found
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="disputes" className="mt-0">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length > 0 ? (
              disputes.map((dispute) => (
                <Card
                  key={dispute._id}
                  className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20"
                >
                  <CardContent className="pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-base sm:text-lg">
                            {dispute.playerName}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            Submitted{" "}
                            {formatTimeAgo(new Date(dispute.createdAt))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDispute(dispute)}
                          className="min-h-[44px] sm:min-h-0"
                        >
                          Review
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dispute Reason:</p>
                        <p className="text-sm">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Original Action:</p>
                        <p className="text-sm">
                          {dispute.moderationAction.type === "warning"
                            ? "Warning"
                            : "Ban"}{" "}
                          by {dispute.moderationAction.moderatorName}
                        </p>
                        <p className="text-sm">
                          {dispute.moderationAction.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col justify-center items-center h-48 text-center">
                <Shield className="mb-4 w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">No pending disputes</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!unbanConfirm}
        onOpenChange={(open) => {
          if (!open && unbanInProgressId === null) {
            setUnbanConfirm(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-[min(100vw-2rem,28rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this ban?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  This restores access for{" "}
                  <span className="font-medium text-foreground">
                    {unbanConfirm?.playerName ?? "this player"}
                  </span>
                  . The unban is recorded in the moderation log.
                </p>
                {unbanConfirm?.durationLabel ? (
                  <p>
                    <span className="font-medium text-foreground">
                      Ban duration:{" "}
                    </span>
                    {unbanConfirm.durationLabel}
                  </p>
                ) : null}
                {unbanConfirm?.reason ? (
                  <p className="min-w-0">
                    <span className="font-medium text-foreground">
                      Original reason:{" "}
                    </span>
                    <span className="line-clamp-4 break-words">
                      {unbanConfirm.reason}
                    </span>
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {unbanConfirm ? (
            <div className="space-y-2">
              <Label
                htmlFor="moderation-unban-confirm-name"
                className="text-left text-sm font-medium text-foreground"
              >
                Type the player name to confirm
              </Label>
              <Input
                id="moderation-unban-confirm-name"
                name="unban-confirm-player-name"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={unbanTypedPlayerName}
                onChange={(e) => setUnbanTypedPlayerName(e.target.value)}
                placeholder="Match spelling and spacing exactly"
                disabled={unbanInProgressId !== null}
                className="font-mono text-sm"
                autoFocus
                aria-invalid={
                  unbanTypedPlayerName.length > 0 &&
                  !unbanTypedNameMatches(
                    unbanTypedPlayerName,
                    unbanConfirm.playerName,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Must match exactly (case-sensitive). This reduces mistaken
                unbans on busy rosters.
              </p>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unbanInProgressId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                unbanInProgressId !== null ||
                !unbanConfirm ||
                !unbanTypedNameMatches(
                  unbanTypedPlayerName,
                  unbanConfirm.playerName,
                )
              }
              className={cn(
                "gap-2 border border-privileged/80 bg-privileged text-privileged-foreground shadow-sm hover:bg-privileged/88 hover:text-privileged-foreground",
              )}
              onClick={(e) => {
                e.preventDefault();
                void performUnban();
              }}
            >
              {unbanInProgressId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  Unbanning…
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 shrink-0" />
                  Confirm unban
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailLog(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Moderation entry</SheetTitle>
            <SheetDescription>
              {detailLog
                ? `${detailLog.action} · ${detailLog.playerName}`
                : "Details"}
            </SheetDescription>
          </SheetHeader>
          {detailLog ? (
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">When</p>
                <div className="mt-0.5">
                  <LogDateCell iso={detailLog.timestamp} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    formatModerationLogDateParts(detailLog.timestamp).relative
                  }
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Player</p>
                <p>{detailLog.playerName}</p>
                <p className="break-all text-xs text-muted-foreground">
                  ID: {detailLog.playerId}
                  {detailLog.playerDiscordId
                    ? ` · Discord: ${detailLog.playerDiscordId}`
                    : ""}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Moderator</p>
                <p>{detailLog.moderatorName}</p>
                <p className="break-all text-xs text-muted-foreground">
                  {detailLog.moderatorDiscordId ?? detailLog.moderatorId}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Reason</p>
                <p className="whitespace-pre-wrap">{detailLog.reason}</p>
              </div>
              {(detailLog.duration || detailLog.expiry) && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Duration / expiry
                  </p>
                  <p>
                    {detailLog.duration ?? "—"}
                    {detailLog.expiry
                      ? ` · expires ${formatModerationLogDateParts(detailLog.expiry).primary}`
                      : ""}
                  </p>
                </div>
              )}
              {detailLog.action === "ban" &&
                typeof detailLog.banIsActive === "boolean" && (
                  <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <p>
                      {detailLog.banIsActive
                        ? "Still active"
                        : "No longer active (unbanned or expired)"}
                    </p>
                  </div>
                )}
              <p className="break-all text-xs text-muted-foreground">
                Log ID: {detailLog._id}
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {selectedDispute && (
        <DisputeReviewDialog
          dispute={selectedDispute}
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          onDisputeResolved={handleDisputeResolved}
        />
      )}
    </div>
  );
}

export default function ModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModerationPanelContent />
    </Suspense>
  );
}