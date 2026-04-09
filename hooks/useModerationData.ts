"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { usePusherInvalidate } from "@/hooks/usePusherInvalidate";
import { isPlayerUnbanned } from "@/lib/moderation-is-player-unbanned";
import { safeLog } from "@/lib/security";
import {
  MODERATION_LOG_PUSHER_CHANNEL,
  MODERATION_LOG_PUSHER_EVENT,
} from "@/lib/moderation-log-realtime-constants";
import { formatModerationLogDateParts } from "@/lib/moderation-log-date";
import { playerHistoryHref } from "@/lib/safe-return-to";
import type { AdminModerationLog, AdminModerationLogsApiResponse } from "@/types/moderation-log";
import type {
  Dispute,
  ModerationFilterType,
  ModerationTabValue,
  ActiveBansSortKey,
  RecentActionsSortKey,
  UnbanConfirmPayload,
} from "@/types/moderation";
import { MODERATION_TABS } from "@/types/moderation";

function isTabValue(t: string | null): t is ModerationTabValue {
  return !!t && (MODERATION_TABS as readonly string[]).includes(t);
}

function isFilterValue(t: string | null): t is ModerationFilterType {
  return (
    t === "all" ||
    t === "warnings" ||
    t === "bans" ||
    t === "active" ||
    t === "queue_removals"
  );
}

export function compareModerationText(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function logTimestampMs(log: AdminModerationLog) {
  return new Date(log.timestamp).getTime();
}

export function recentActionTypeRank(action: string) {
  if (action === "warn") return 0;
  if (action === "queue_remove_player") return 1;
  if (action === "ban") return 2;
  if (action === "unban") return 3;
  return 99;
}

export function isPermanentBanDuration(duration: string | undefined) {
  const d = (duration ?? "").trim().toLowerCase();
  return !d || d === "permanent" || d === "perm";
}

export function unbanTypedNameMatches(typed: string, expectedPlayerName: string) {
  return typed.trim() === expectedPlayerName.trim();
}

export function formatModerationDetailDate(iso: string) {
  return formatModerationLogDateParts(iso);
}

export interface ModerationData {
  loading: boolean;
  logs: AdminModerationLog[];
  activeActions: AdminModerationLog[];
  disputes: Dispute[];
  stats: { warnings: number; activeBans: number; totalActions: number };
  activeTab: ModerationTabValue;
  filter: ModerationFilterType;
  searchQuery: string;
  activeSearchQuery: string;
  activeBansSort: { key: ActiveBansSortKey; dir: "asc" | "desc" };
  recentActionsSort: { key: RecentActionsSortKey; dir: "asc" | "desc" };
  filteredActiveBans: AdminModerationLog[];
  sortedFilteredActiveBans: AdminModerationLog[];
  filteredRecentActions: AdminModerationLog[];
  sortedFilteredRecentActions: AdminModerationLog[];
  unbanConfirm: UnbanConfirmPayload | null;
  unbanTypedPlayerName: string;
  unbanInProgressId: string | null;
  detailLog: AdminModerationLog | null;
  detailOpen: boolean;
  selectedDispute: Dispute | null;
  disputeDialogOpen: boolean;
  showScrollToOverviewContentCue: boolean;
  /** Pre-computed: returns true if the given ban action is no longer active */
  isUnbanned: (action: AdminModerationLog) => boolean;
  setSearchQuery: (q: string) => void;
  setActiveSearchQuery: (q: string) => void;
  setUnbanTypedPlayerName: (v: string) => void;
  setUnbanConfirm: (v: UnbanConfirmPayload | null) => void;
  setDetailLog: (v: AdminModerationLog | null) => void;
  setDetailOpen: (v: boolean) => void;
  setDisputeDialogOpen: (v: boolean) => void;
  scrollToOverviewMainContent: () => void;
  onTabChange: (value: string) => void;
  onFilterChange: (value: ModerationFilterType) => void;
  cycleActiveBansSort: (key: ActiveBansSortKey) => void;
  cycleRecentActionsSort: (key: RecentActionsSortKey) => void;
  openUnbanConfirm: (
    playerId: string,
    playerName: string,
    extra?: { reason?: string; durationLabel?: string },
  ) => void;
  performUnban: () => Promise<void>;
  handleViewDispute: (dispute: Dispute) => void;
  handleDisputeResolved: () => void;
  handleViewHistory: (action: AdminModerationLog) => void;
  refetch: (opts?: { bypassCache?: boolean }) => void;
}

export interface ModerationRefs {
  pageRootRef: React.RefObject<HTMLDivElement | null>;
  overviewBelowStatsRef: React.RefObject<HTMLElement>;
}

export function useModerationData(refs: ModerationRefs): ModerationData {
  const { pageRootRef, overviewBelowStatsRef } = refs;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminModerationLog[]>([]);
  const [activeTab, setActiveTab] = useState<ModerationTabValue>("overview");
  const [activeActions, setActiveActions] = useState<AdminModerationLog[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ModerationFilterType>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    warnings: 0,
    activeBans: 0,
    totalActions: 0,
  });
  const [showScrollToOverviewContentCue, setShowScrollToOverviewContentCue] =
    useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [detailLog, setDetailLog] = useState<AdminModerationLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [unbanConfirm, setUnbanConfirm] = useState<UnbanConfirmPayload | null>(null);
  const [unbanTypedPlayerName, setUnbanTypedPlayerName] = useState("");
  const [unbanInProgressId, setUnbanInProgressId] = useState<string | null>(null);
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
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: defaultDir };
    });
  }, []);

  const cycleRecentActionsSort = useCallback((key: RecentActionsSortKey) => {
    setRecentActionsSort((prev) => {
      const defaultDir = key === "date" ? "desc" : "asc";
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: defaultDir };
    });
  }, []);

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

  // Use a ref so fetchData is always current without being a dependency of the Pusher effect.
  // This prevents the Pusher connection from disconnecting/reconnecting on every render.
  const fetchDataRef = useRef<(opts?: { bypassCache?: boolean }) => Promise<void>>(
    async () => {},
  );

  const fetchData = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      try {
        setLoading(true);
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const logsUrl = "/api/admin/moderation-logs?limit=3000&skip=0";
        const [raw, disputesResponse] = await Promise.all([
          deduplicatedFetch<AdminModerationLogsApiResponse | AdminModerationLog[]>(
            logsUrl,
            { ttl: 30000, useCache: !options?.bypassCache },
          ),
          fetch("/api/moderation/disputes"),
        ]);

        if (disputesResponse.ok) {
          const dj = (await disputesResponse.json()) as { disputes?: Dispute[] };
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
              const currentTimestamp = new Date(log.timestamp).getTime();
              const existing = unbanMap.get(log.playerId);
              if (!existing || currentTimestamp > existing) {
                unbanMap.set(log.playerId, currentTimestamp);
              }
            }
          });
          const activeBansFiltered = data.filter((log) => {
            if (log.action !== "ban") return false;
            const banTimestamp = new Date(log.timestamp).getTime();
            const unbanTimestamp = unbanMap.get(log.playerId);
            if (unbanTimestamp && unbanTimestamp > banTimestamp) return false;
            if (log.expiry && new Date(log.expiry) < new Date()) return false;
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

  // Keep the ref in sync with the latest fetchData without triggering Pusher re-subscription
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabValue(tab)) setActiveTab(tab);
    const f = searchParams.get("filter");
    if (isFilterValue(f)) setFilter(f);
    const q = searchParams.get("q");
    if (q !== null) setSearchQuery(q);
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
    (next: { filter?: ModerationFilterType; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "recent");
      if (next.filter !== undefined) params.set("filter", next.filter);
      if (next.q !== undefined) {
        if (next.q === "") params.delete("q");
        else params.set("q", next.q);
      }
      const nextQs = params.toString();
      if (nextQs === searchParams.toString()) return;
      router.replace(`${pathname}?${nextQs}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (activeTab !== "recent") return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "recent");
      if (searchQuery === "") params.delete("q");
      else params.set("q", searchQuery);
      const nextQs = params.toString();
      if (nextQs === searchParams.toString()) return;
      router.replace(`${pathname}?${nextQs}`, { scroll: false });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery, activeTab, pathname, router, searchParams]);

  // Fix: use usePusherInvalidate which uses the ref pattern internally.
  // This means Pusher subscribes once and never disconnects/reconnects on re-renders.
  usePusherInvalidate(
    MODERATION_LOG_PUSHER_CHANNEL,
    MODERATION_LOG_PUSHER_EVENT,
    () => void fetchDataRef.current({ bypassCache: true }),
  );

  // Pre-compute latest unban timestamp per player — avoids O(n²) in sort/filter memos
  const unbanTimestampMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      if (log.action === "unban" && log.playerId) {
        const t = new Date(log.timestamp).getTime();
        const prev = map.get(log.playerId) ?? 0;
        if (t > prev) map.set(log.playerId, t);
      }
    }
    return map;
  }, [logs]);

  const isUnbanned = useCallback(
    (action: AdminModerationLog): boolean => {
      if (action.action === "ban" && typeof action.banIsActive === "boolean") {
        return !action.banIsActive;
      }
      const lastUnban = unbanTimestampMap.get(action.playerId) ?? 0;
      return lastUnban > new Date(action.timestamp).getTime();
    },
    [unbanTimestampMap],
  );

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
          cmp = compareModerationText(a.duration || "Permanent", b.duration || "Permanent");
          break;
        case "moderator":
          cmp = compareModerationText(a.moderatorName ?? "", b.moderatorName ?? "");
          break;
        case "date":
          cmp = logTimestampMs(a) - logTimestampMs(b);
          break;
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
      filtered = filtered.filter((action) => action.action === "queue_remove_player");
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
          cmp = compareModerationText(a.moderatorName ?? "", b.moderatorName ?? "");
          break;
        case "date":
          cmp = logTimestampMs(a) - logTimestampMs(b);
          break;
      }
      if (cmp !== 0) return mul * cmp;
      return logTimestampMs(b) - logTimestampMs(a);
    });
  }, [filteredRecentActions, recentActionsSort]);

  const onTabChange = useCallback(
    (value: string) => {
      if (!isTabValue(value)) return;
      setActiveTab(value);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onFilterChange = useCallback(
    (value: ModerationFilterType) => {
      setFilter(value);
      if (activeTab === "recent") syncRecentTabToUrl({ filter: value });
    },
    [activeTab, syncRecentTabToUrl],
  );

  const openUnbanConfirm = useCallback(
    (
      playerId: string,
      playerName: string,
      extra?: { reason?: string; durationLabel?: string },
    ) => {
      setUnbanConfirm({ playerId, playerName, reason: extra?.reason, durationLabel: extra?.durationLabel });
    },
    [],
  );

  const performUnban = useCallback(async () => {
    const pending = unbanConfirm;
    if (!pending) return;
    const { playerId, playerName } = pending;
    if (!unbanTypedNameMatches(unbanTypedPlayerName, playerName)) {
      toast({
        variant: "destructive",
        title: "Name does not match",
        description: "Type the player name exactly as shown (including spaces) to confirm.",
      });
      return;
    }
    try {
      setUnbanInProgressId(playerId);
      const response = await fetch(`/api/admin/players/${playerId}/unban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Ban removed by administrator" }),
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
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
        description: error instanceof Error ? error.message : "Failed to unban player",
      });
    } finally {
      setUnbanInProgressId(null);
    }
  }, [unbanConfirm, unbanTypedPlayerName, toast, fetchData]);

  const handleDisputeResolved = useCallback(() => {
    void fetchData({ bypassCache: true });
    setDisputeDialogOpen(false);
  }, [fetchData]);

  const handleViewDispute = useCallback((dispute: Dispute) => {
    let typedStatus: "pending" | "approved" | "denied" = "pending";
    if (dispute.status === "approved" || dispute.status === "denied") {
      typedStatus = dispute.status;
    }
    const actionType = dispute.moderationAction.type as string;
    const fixedType = actionType === "warn" ? "warning" : dispute.moderationAction.type;
    setSelectedDispute({
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
    });
    setDisputeDialogOpen(true);
  }, []);

  const handleViewHistory = useCallback(
    (action: AdminModerationLog) => {
      router.push(playerHistoryHref(action.playerId, pathname, searchParams));
    },
    [router, pathname, searchParams],
  );

  return {
    loading,
    logs,
    activeActions,
    disputes,
    stats,
    activeTab,
    filter,
    searchQuery,
    activeSearchQuery,
    activeBansSort,
    recentActionsSort,
    filteredActiveBans,
    sortedFilteredActiveBans,
    filteredRecentActions,
    sortedFilteredRecentActions,
    unbanConfirm,
    unbanTypedPlayerName,
    unbanInProgressId,
    detailLog,
    detailOpen,
    selectedDispute,
    disputeDialogOpen,
    showScrollToOverviewContentCue,
    isUnbanned,
    setSearchQuery,
    setActiveSearchQuery,
    setUnbanTypedPlayerName,
    setUnbanConfirm,
    setDetailLog,
    setDetailOpen,
    setDisputeDialogOpen,
    scrollToOverviewMainContent,
    onTabChange,
    onFilterChange,
    cycleActiveBansSort,
    cycleRecentActionsSort,
    openUnbanConfirm,
    performUnban,
    handleViewDispute,
    handleDisputeResolved,
    handleViewHistory,
    refetch: (opts) => void fetchData(opts),
  };
}
