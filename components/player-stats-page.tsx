"use client";

import {
  Fragment,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Trophy,
  Users,
  User,
  UserPlus,
  Users2,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Medal,
  ArrowLeft,
  Crown,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Target,
  ExternalLink,
  Calendar,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { useSession } from "next-auth/react";
import {
  getRankByElo,
  getRankProgress,
  getEloToNextRank,
} from "@/lib/rank-utils";
import { useRouter } from "next/navigation";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { isFeatureEnabled } from "@/lib/features";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import {
  formatTeamSizeLabel,
  getPrimaryTeamStat,
} from "@/lib/player-primary-stat";
import { lastMatchTime } from "@/lib/merge-db2-four-vs-four";
import type {
  PlayerProfile,
  PlayerStatEntry,
  ProfileBundle,
  TeamInfo,
  MatchHistoryEntry,
  EloTrendPoint,
} from "@/types/player";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Queue cards (and profile-bundle ?teamSizes=) only include modes with a match within this many days. */
const RATING_ACTIVITY_WINDOW_DAYS = 90;

const formatDate = (
  dateString: string | number | Date,
  alwaysShowYear = false
) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const showYear = alwaysShowYear || date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {}),
  });
};

// ---------------------------------------------------------------------------
// EloSparkline — simple inline SVG line from trend data
// ---------------------------------------------------------------------------

function EloSparkline({
  values,
}: {
  values: number[];
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const pad = 2;

  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isRising = values[values.length - 1] >= values[0];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`w-full h-7 mt-2 ${
        isRising ? "text-emerald-500/50" : "text-rose-500/50"
      }`}
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section skeleton helpers
// ---------------------------------------------------------------------------

function TeamsSectionSkeleton() {
  return (
    <Card className="mt-6 rounded-2xl border-border shadow-sm">
      <CardHeader className="border-b border-border/50">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function MatchHistorySectionSkeleton() {
  return (
    <Card className="mt-6 rounded-2xl border-border shadow-sm">
      <CardHeader className="border-b border-border/50">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerProps {
  player: PlayerProfile;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlayerStatsPage({ player }: PlayerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queueParam = searchParams?.get("queue");

  // Bundle state — replaces individual teamsInfo / leaderboardPositions / matchHistory
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(true);

  // Sharing
  const [copied, setCopied] = useState(false);

  // Sticky summary bar
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Per-mode card refs for ?queue= deep linking
  const queueRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------

  const validStats = useMemo<PlayerStatEntry[]>(
    () => player.stats.filter((s) => typeof s.teamSize === "number"),
    [player.stats]
  );

  const statsByTeamSize = useMemo(() => {
    const now = Date.now();
    const withinActivityWindow = (s: PlayerStatEntry, teamSize: number) => {
      if (s.teamSize !== teamSize) return false;
      const t = lastMatchTime(s.lastMatchDate);
      if (t == null) return false;
      return (
        Math.floor((now - t) / 86_400_000) <= RATING_ACTIVITY_WINDOW_DAYS
      );
    };
    return {
      "1v1": validStats.find((s) => withinActivityWindow(s, 1)) ?? null,
      "2v2": validStats.find((s) => withinActivityWindow(s, 2)) ?? null,
      "4v4": validStats.find((s) => withinActivityWindow(s, 4)) ?? null,
      "5v5": validStats.find((s) => withinActivityWindow(s, 5)) ?? null,
    };
  }, [validStats]);

  const visibleStatsCount = Object.values(statsByTeamSize).filter(Boolean).length;

  const primaryTeamSizeForSticky = useMemo(
    () => getPrimaryTeamStat(validStats)?.teamSize ?? null,
    [validStats]
  );

  const stickyOtherRecentModes = useMemo(() => {
    if (primaryTeamSizeForSticky == null) return [];
    const keys = ["1v1", "2v2", "4v4", "5v5"] as const;
    return keys
      .map((key) => {
        const stat = statsByTeamSize[key];
        if (!stat || stat.teamSize === primaryTeamSizeForSticky) return null;
        return { key, elo: stat.elo };
      })
      .filter(
        (x): x is { key: (typeof keys)[number]; elo: number } => x != null
      );
  }, [statsByTeamSize, primaryTeamSizeForSticky]);

  const headerStats = useMemo(() => {
    const primary = getPrimaryTeamStat(validStats);
    if (!primary) return { modeLabel: null, elo: 0, winRate: 0, total: 0 };
    const wins = Number(primary.wins || 0);
    const losses = Number(primary.losses || 0);
    const total = wins + losses;
    return {
      modeLabel: formatTeamSizeLabel(primary.teamSize),
      elo: Math.max(0, Number(primary.elo || 0)),
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      total,
    };
  }, [validStats]);

  const primaryHeaderSuffix = headerStats.modeLabel
    ? ` (${headerStats.modeLabel})`
    : "";

  const primaryRank = useMemo(
    () => (headerStats.elo > 0 ? getRankByElo(headerStats.elo) : null),
    [headerStats.elo]
  );

  const getLatestMatchDate = useCallback(() => {
    const times = validStats
      .map((s) => lastMatchTime(s.lastMatchDate))
      .filter((t): t is number => t != null);
    if (!times.length) return player.lastActive ?? null;
    return new Date(Math.max(...times)).toISOString();
  }, [validStats, player.lastActive]);

  const topRankedTeamSizes = validStats
    .filter((s) => s.globalRank === 1)
    .map((s) => `${s.teamSize}v${s.teamSize}`);
  const isTopPlayer = topRankedTeamSizes.length > 0;

  const hasModAccess =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator") ||
        session.user.roles.includes("founder")));

  // ---------------------------------------------------------------------------
  // Back button label
  // ---------------------------------------------------------------------------

  const [previousPageName, setPreviousPageName] = useState<string | null>(null);

  useEffect(() => {
    const referrer = document.referrer;
    if (!referrer) return;
    try {
      const { pathname } = new URL(referrer);
      const routeNames: Record<string, string> = {
        "/": "Home",
        "/tournaments": "Tournaments",
        "/tournaments/rankings": "Team Rankings",
        "/tournaments/teams": "Teams",
        "/matches": "Matches",
        "/matches/queues": "Queues",
        "/matches/history": "Match History",
        "/leaderboard": "Leaderboard",
        "/admin": "Admin",
        "/admin/players": "Admin Players",
      };
      if (routeNames[pathname]) {
        setPreviousPageName(routeNames[pathname]);
      } else if (pathname.startsWith("/tournaments/teams/")) {
        setPreviousPageName("Team Page");
      } else if (pathname.startsWith("/leaderboard")) {
        setPreviousPageName("Leaderboard");
      } else if (pathname.startsWith("/admin")) {
        setPreviousPageName("Admin");
      } else {
        const seg = pathname.split("/").filter(Boolean).pop();
        if (seg)
          setPreviousPageName(
            seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")
          );
      }
    } catch {
      // Invalid URL
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Profile bundle fetch — replaces three separate client fetches
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!player.discordId) {
      setLoadingBundle(false);
      return;
    }

    const activeSizes = Object.values(statsByTeamSize)
      .filter(Boolean)
      .map((s) => s!.teamSize)
      .join(",");

    const controller = new AbortController();
    setLoadingBundle(true);

    const url = `/api/players/${player.discordId}/profile-bundle${
      activeSizes ? `?teamSizes=${activeSizes}` : ""
    }`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setBundle(data as ProfileBundle))
      .catch((err) => {
        if (err.name !== "AbortError") {
          logger.error("Failed to fetch profile bundle", err);
        }
      })
      .finally(() => setLoadingBundle(false));

    return () => controller.abort();
  }, [player.discordId, statsByTeamSize]);

  // ---------------------------------------------------------------------------
  // Sticky summary bar — when hero clears the fixed banner + header (ClientLayout spacer: 103 / 113px)
  // ---------------------------------------------------------------------------
  // IntersectionObserver alone was unreliable here (ref timing vs. first paint); scroll + rect is stable.

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const headerContentThreshold = () =>
      window.matchMedia("(min-width: 640px)").matches ? 113 : 103;

    const updateSticky = () => {
      const rect = hero.getBoundingClientRect();
      setShowStickyBar(rect.bottom < headerContentThreshold());
    };

    updateSticky();
    window.addEventListener("scroll", updateSticky, { passive: true });
    window.addEventListener("resize", updateSticky, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateSticky);
      window.removeEventListener("resize", updateSticky);
    };
  }, [player.discordId]);

  // ---------------------------------------------------------------------------
  // ?queue= deep-link scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!queueParam) return;
    const el = queueRefs.current[queueParam];
    if (!el) return;
    const timer = setTimeout(
      () => el.scrollIntoView({ behavior: "smooth", block: "center" }),
      350
    );
    return () => clearTimeout(timer);
  }, [queueParam, bundle]);

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again", variant: "destructive" });
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const name =
      player.discordNickname ?? player.discordUsername ?? "Player";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${name} — Shadowrun FPS Stats`,
          text: `Check out ${name}'s stats on Shadowrun FPS!`,
          url,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // Fall through to clipboard
      }
    }
    await copyToClipboard(url);
  }, [player.discordNickname, player.discordUsername, copyToClipboard]);

  // ---------------------------------------------------------------------------
  // Derived bundle data
  // ---------------------------------------------------------------------------

  const teamsInfo = bundle?.teams ?? [];
  const leaderboardPositions = bundle?.leaderboardPositions ?? {};
  const matchHistory = bundle?.matches ?? [];
  const eloTrends = bundle?.eloTrends ?? {};

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky summary bar */}
      {showStickyBar && (
        <div className="fixed top-[103px] sm:top-[113px] left-0 right-0 z-40 flex min-h-[4rem] flex-col border-b border-border/60 bg-background/95 pt-1 shadow-sm backdrop-blur-md sm:min-h-[4.25rem] sm:pt-1.5">
          {/* Grows so the row below sits on the bottom edge (justify-end/mt-auto are unreliable with only min-height on the parent). */}
          <div className="min-h-0 min-w-0 flex-1 shrink" aria-hidden />
          <div className="w-full pb-2 sm:pb-2.5">
            <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center content-center gap-x-3 gap-y-2 px-4 sm:px-6 lg:px-8">
              <div className="relative h-8 w-8 shrink-0 rounded-full border border-border/50 overflow-hidden bg-muted ring-0">
                <Image
                  src={player.discordProfilePicture ?? "/placeholder.svg"}
                  alt={player.discordNickname ?? player.discordUsername ?? "Player"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <span className="font-semibold text-sm text-foreground truncate">
                {player.discordNickname ?? player.discordUsername ?? "Unknown"}
              </span>
              {primaryRank && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span className="text-foreground font-medium">
                    {headerStats.elo.toLocaleString()}
                  </span>
                  <span>{primaryRank.name}</span>
                  <span className="opacity-40">·</span>
                  <span>{headerStats.winRate}% WR</span>
                  {primaryHeaderSuffix && (
                    <span className="text-xs opacity-60">{primaryHeaderSuffix}</span>
                  )}
                </div>
              )}
              {stickyOtherRecentModes.length > 0 && (
                <div className="hidden md:flex items-center flex-wrap gap-x-1 gap-y-0.5 text-xs text-muted-foreground border-l border-border/60 pl-3 ml-0.5">
                  {stickyOtherRecentModes.map(({ key, elo }, index) => (
                    <Fragment key={key}>
                      {index > 0 ? (
                        <span className="text-muted-foreground/40 px-0.5" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <span className="whitespace-nowrap">
                        <span className="font-medium tabular-nums text-foreground/90">
                          {elo.toLocaleString()}
                        </span>
                        <span className="opacity-70 ml-0.5">({key})</span>
                      </span>
                    </Fragment>
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-[2rem]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="shrink-0 rounded-lg"
                aria-label="Share profile"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-1 py-4 mx-auto max-w-screen-xl sm:px-3 md:px-6 lg:px-8 xl:px-12 sm:py-6 md:py-8 lg:py-10">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex gap-2 items-center text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            {previousPageName ? `Back to ${previousPageName}` : "Back"}
          </Button>
        </div>

        {/* Hero card */}
        <div ref={heroRef}>
          <PlayerContextMenu player={player} disabled={!hasModAccess}>
            <Card className="relative overflow-hidden mb-6 sm:mb-8 rounded-2xl border-border shadow-sm cursor-context-menu">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

              <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col gap-6 items-center sm:flex-row sm:items-start sm:gap-8">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-primary/20 rounded-full opacity-50 blur-xl group-hover:opacity-70 transition-opacity" />
                    <div className="relative overflow-hidden w-28 h-28 rounded-full border border-border shadow-sm ring-1 ring-border/50 sm:h-32 sm:w-32 md:h-36 md:w-36">
                      <Image
                        src={player.discordProfilePicture ?? "/placeholder.svg"}
                        alt={
                          player.discordNickname ??
                          player.discordUsername ??
                          "Player"
                        }
                        fill
                        sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
                        className="object-cover"
                        priority
                      />
                    </div>
                    {isTopPlayer && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <div className="relative">
                          <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-bounce motion-reduce:animate-none" />
                          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 text-center sm:text-left w-full">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                          {player.discordNickname ??
                            player.discordUsername ??
                            "Unknown Player"}
                        </h1>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {player.roles?.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="border-border font-medium rounded-lg"
                              style={{
                                backgroundColor:
                                  role.color === "red"
                                    ? "rgba(239,68,68,0.2)"
                                    : role.color === "purple"
                                    ? "rgba(99,102,241,0.2)"
                                    : "rgba(234,179,8,0.2)",
                                color:
                                  role.color === "red"
                                    ? "rgb(254,202,202)"
                                    : role.color === "purple"
                                    ? "rgb(199,210,254)"
                                    : "rgb(254,240,138)",
                                borderColor:
                                  role.color === "red"
                                    ? "rgba(239,68,68,0.5)"
                                    : role.color === "purple"
                                    ? "rgba(99,102,241,0.5)"
                                    : "rgba(234,179,8,0.5)",
                              }}
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="rounded-xl border-border hover:bg-muted/30 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Bento hero metrics — ELO is the featured tile */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
                      {/* Featured ELO tile */}
                      <div className="col-span-2 sm:col-span-1 flex flex-col items-center sm:items-start p-3 rounded-xl bg-primary/10 border border-primary/25">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-primary/70" />
                          <span className="text-xs text-muted-foreground">
                            Highest ELO{primaryHeaderSuffix}
                          </span>
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          {headerStats.elo.toLocaleString()}
                        </span>
                        {primaryRank && (
                          <span className="text-xs text-primary/70 mt-0.5 font-medium">
                            {primaryRank.name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Win Rate{primaryHeaderSuffix}
                          </span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                          {headerStats.winRate}%
                        </span>
                      </div>

                      <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Matches{primaryHeaderSuffix}
                          </span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                          {headerStats.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Last Active
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(getLatestMatchDate() ?? "N/A")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PlayerContextMenu>
        </div>

        {/* ELO stat cards */}
        <div
          className={`grid gap-4 sm:gap-6 ${
            visibleStatsCount === 1
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          {Object.entries(statsByTeamSize).map(([mode, stats]) => {
            if (!stats) return null;

            const rank = getRankByElo(stats.elo);
            const wins = Number(stats.wins || 0);
            const losses = Number(stats.losses || 0);
            const matches = wins + losses;
            const winRate = Math.round((wins / (matches || 1)) * 100);
            const eloChange = stats.elo - (stats.lastMatchElo || stats.elo);
            const isTopRanked = stats.globalRank === 1;
            const lbPos = leaderboardPositions[mode];

            // Sparkline: pre-match ELOs from trends + current ELO as final point
            const trendElos = (eloTrends[mode] ?? []).map(
              (t: EloTrendPoint) => t.elo
            );
            const sparklineData =
              trendElos.length > 0 ? [...trendElos, stats.elo] : [];

            return (
              <Card
                key={mode}
                ref={(el) => {
                  queueRefs.current[mode] = el;
                }}
                className={`relative overflow-hidden rounded-2xl border-border shadow-sm transition-all duration-300 group hover:shadow-md ${
                  queueParam === mode
                    ? "ring-2 ring-primary/50 shadow-primary/10"
                    : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isTopRanked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-amber-600/5 rounded-full blur-3xl" />
                )}

                <CardHeader className="relative z-10 p-3 pb-2 sm:p-4 md:p-6 border-b border-border/50">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="p-2 rounded-xl bg-muted/30 border border-border/50">
                        {mode === "1v1" && (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                        {mode === "2v2" && (
                          <UserPlus className="w-5 h-5 text-muted-foreground" />
                        )}
                        {mode === "4v4" && (
                          <Users className="w-5 h-5 text-muted-foreground" />
                        )}
                        {mode === "5v5" && (
                          <Users2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold sm:text-xl">
                          {mode} Rating
                        </CardTitle>
                        {isTopRanked && (
                          <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs font-semibold text-yellow-400">
                              #1 Global
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                      <Image
                        src={`/rankedicons/${rank.name.toLowerCase()}.png`}
                        alt={rank.name}
                        fill
                        sizes="56px"
                        className="object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 p-3 pt-3 sm:p-4 md:p-6">
                  {/* ELO + change badge */}
                  <div className="flex gap-3 items-end mb-2">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                      {stats.elo.toLocaleString()}
                    </div>
                    {eloChange !== 0 && (
                      <div className="flex items-center mb-2">
                        {eloChange > 0 ? (
                          <Badge
                            variant="outline"
                            className="rounded-lg bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />+{eloChange}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-lg bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                          >
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {Math.abs(eloChange)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sparkline */}
                  {!loadingBundle && sparklineData.length >= 2 && (
                    <EloSparkline values={sparklineData} />
                  )}

                  {/* Rank progress */}
                  <div className="mb-6 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {rank.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const { nextRank } = getEloToNextRank(stats.elo);
                          return nextRank ? `→ ${nextRank}` : "MAX";
                        })()}
                      </span>
                    </div>
                    <Progress
                      value={getRankProgress(stats.elo, rank.name)}
                      className="h-2.5 bg-muted/50 rounded-full border-0"
                    />
                    {(() => {
                      const { eloNeeded, nextRank } = getEloToNextRank(
                        stats.elo
                      );
                      if (nextRank === null)
                        return (
                          <p className="mt-2 text-xs text-muted-foreground text-center">
                            Maximum rank achieved
                          </p>
                        );
                      return (
                        <p className="mt-2 text-xs text-muted-foreground text-center font-medium">
                          {eloNeeded} ELO until {nextRank}
                        </p>
                      );
                    })()}

                    {/* Leaderboard position */}
                    {lbPos?.position && (
                      <div className="mt-2 text-xs text-center">
                        <Badge
                          variant="outline"
                          className="text-xs rounded-lg border-border/50 bg-muted/20"
                        >
                          <Medal className="w-3 h-3 mr-1" />
                          #{lbPos.position}
                          {lbPos.percentile && (
                            <span className="ml-1">
                              (Top {lbPos.percentile}%)
                            </span>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Wins / losses / matches */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">
                        {matches}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Matches
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                      <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.wins}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Wins
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                      <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
                        {stats.losses}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Losses
                      </div>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Win Rate</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {winRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full bg-primary/80"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No active stats */}
        {Object.values(statsByTeamSize).every((s) => s === null) && (
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <div className="relative p-4 rounded-2xl bg-muted/30 border border-border/50 mb-4 inline-block">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">
                No Active Ratings
              </h2>
              <p className="text-sm text-muted-foreground">
                This player hasn&apos;t played any ranked matches in the last{" "}
                {RATING_ACTIVITY_WINDOW_DAYS} days.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Teams section */}
        {isFeatureEnabled("teams") &&
          (loadingBundle ? (
            <TeamsSectionSkeleton />
          ) : teamsInfo.length > 0 ? (
            <Card className="mt-6 rounded-2xl border-border shadow-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teamsInfo.map((teamInfo: TeamInfo) => {
                    const teamSizeLabel = `${teamInfo.teamSize}v${teamInfo.teamSize}`;
                    return (
                      <div
                        key={teamInfo._id}
                        className="flex flex-col lg:flex-row mt-4 lg:items-center lg:justify-between gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-baseline gap-2 mb-1">
                            <Link
                              href={`/tournaments/teams/${teamInfo._id}`}
                              className="text-xl sm:text-2xl font-bold hover:text-primary hover:underline underline-offset-2 transition-colors flex items-baseline gap-2"
                            >
                              <span>{teamInfo.name}</span>
                              {teamInfo.tag && (
                                <span className="text-base sm:text-lg text-muted-foreground font-normal">
                                  [{teamInfo.tag}]
                                </span>
                              )}
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative top-0.5" />
                            </Link>
                            <Badge variant="secondary" className="text-xs">
                              {teamSizeLabel}
                            </Badge>
                            {teamInfo.isCaptain && (
                              <Badge variant="outline" className="text-xs">
                                Captain
                              </Badge>
                            )}
                          </div>
                          {teamInfo.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {teamInfo.description}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">
                              {teamInfo.teamElo?.toLocaleString() ?? 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Team ELO
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">
                              {teamInfo.wins} - {teamInfo.losses}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Record
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">
                              {teamInfo.tournamentWins}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Tournament Wins
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">
                              {teamInfo.memberCount}/{teamInfo.teamSize}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Members
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null)}

        {/* Match history */}
        {loadingBundle ? (
          <MatchHistorySectionSkeleton />
        ) : matchHistory.length > 0 ? (
          <Card className="mt-6 rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchHistory.slice(0, 10).map((match: MatchHistoryEntry) => (
                  <div
                    key={match._id}
                    className={`p-3 sm:p-4 rounded-xl border ${
                      match.result === "win"
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-rose-500/10 border-rose-500/20"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              match.result === "win" ? "default" : "destructive"
                            }
                          >
                            {match.result === "win" ? "Win" : "Loss"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {match.teamSize}v{match.teamSize}
                          </span>
                          {match.map && match.map !== "Unknown" && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {match.map}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">
                            {match.playerTeam.score} -{" "}
                            {match.opponentTeam.score}
                          </span>
                          {match.eloChange !== 0 && (
                            <span
                              className={`ml-2 ${
                                match.eloChange > 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {match.eloChange > 0 ? "+" : ""}
                              {match.eloChange} ELO
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(match.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
