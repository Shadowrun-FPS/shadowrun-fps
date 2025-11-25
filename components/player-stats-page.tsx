"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ChevronLeft,
  Medal,
  ArrowLeft,
  Crown,
  TrendingUp,
  Award,
  Share2,
  Copy,
  Check,
  Star,
  Target,
  Flame,
  Activity,
  TrendingDown,
  ExternalLink,
  Calendar,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { useSession } from "next-auth/react";
import { getRankByElo, getRankProgress, getEloToNextRank } from "@/lib/rank-utils";
import { useRouter } from "next/navigation";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { toast } from "@/components/ui/use-toast";

// Format date to Month DD, YYYY (or Month DD if same year)
const formatDate = (dateString: string | number | Date, alwaysShowYear: boolean = false) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  // Show year if it's different from current year, or if alwaysShowYear is true
  const showYear = alwaysShowYear || dateYear !== currentYear;
  
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {}),
  });
};

interface PlayerProps {
  player: {
    _id: string;
    discordId?: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    roles?: Array<{ id: number; name: string; color: string }>;
    stats: Array<{
      lastMatchElo: number;
      teamSize: number;
      elo: number;
      wins: number;
      losses: number;
      lastMatchDate: string;
      globalRank?: number;
    }>;
    lastActive?: string;
    banExpiry?: Date | string | null;
  };
}

export default function PlayerStatsPage({ player }: PlayerProps) {
  const { data: session } = useSession();
  const [currentDate] = useState(new Date());
  const router = useRouter();
  
  // New state for additional data
  const [teamsInfo, setTeamsInfo] = useState<any[]>([]);
  const [leaderboardPositions, setLeaderboardPositions] = useState<Record<string, any>>({});
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState(true);

  // Filter stats to only include objects with teamSize
  const validStats = useMemo(
    () => player.stats.filter((stat) => typeof stat.teamSize === "number"),
    [player.stats]
  );

  // Create stats by team size for easier access, filtering out inactive ones (>30 days)
  const statsByTeamSize = useMemo(
    () => ({
      "1v1":
        validStats.find((stat) => {
          if (stat.teamSize !== 1) return false;
          // Check if last match date is within 30 days
          if (!stat.lastMatchDate) return false;
          const lastMatch = new Date(stat.lastMatchDate);
          const daysSinceLastMatch = Math.floor(
            (currentDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLastMatch <= 30;
        }) || null,
      "2v2":
        validStats.find((stat) => {
          if (stat.teamSize !== 2) return false;
          if (!stat.lastMatchDate) return false;
          const lastMatch = new Date(stat.lastMatchDate);
          const daysSinceLastMatch = Math.floor(
            (currentDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLastMatch <= 30;
        }) || null,
      "4v4":
        validStats.find((stat) => {
          if (stat.teamSize !== 4) return false;
          if (!stat.lastMatchDate) return false;
          const lastMatch = new Date(stat.lastMatchDate);
          const daysSinceLastMatch = Math.floor(
            (currentDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLastMatch <= 30;
        }) || null,
      "5v5":
        validStats.find((stat) => {
          if (stat.teamSize !== 5) return false;
          if (!stat.lastMatchDate) return false;
          const lastMatch = new Date(stat.lastMatchDate);
          const daysSinceLastMatch = Math.floor(
            (currentDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLastMatch <= 30;
        }) || null,
    }),
    [validStats, currentDate]
  );

  // Find the latest match date across all team sizes
  const getLatestMatchDate = () => {
    const dates = validStats
      .map((stat) => stat.lastMatchDate)
      .filter(Boolean)
      .map((date) => new Date(date).getTime());

    if (dates.length === 0) return player.lastActive || null;

    const latestDate = new Date(Math.max(...dates));
    return latestDate.toISOString();
  };

  const calculateTotalMatches = () => {
    return Object.values(statsByTeamSize).reduce((total, stats) => {
      if (!stats) return total; // Skip if stats is null
      return total + Number(stats.wins || 0) + Number(stats.losses || 0);
    }, 0);
  };

  const totalMatches = calculateTotalMatches();

  // Check if player is #1 in any team size
  const topRankedTeamSizes = validStats
    .filter((stat) => stat.globalRank === 1)
    .map((stat) => `${stat.teamSize}v${stat.teamSize}`);

  const isTopPlayer = topRankedTeamSizes.length > 0;

  // Check if user has mod access
  const hasModAccess =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles &&
      (session?.user?.roles.includes("admin") ||
        session?.user?.roles.includes("moderator") ||
        session?.user?.roles.includes("founder")));

  // Get previous page name for back button
  const [previousPageName, setPreviousPageName] = useState<string | null>(null);

  useEffect(() => {
    // Try to get referrer from document
    const referrer = document.referrer;
    if (referrer) {
      try {
        const url = new URL(referrer);
        const pathname = url.pathname;
        
        // Map common routes to friendly names
        const routeNames: Record<string, string> = {
          "/": "Home",
          "/tournaments": "Tournaments",
          "/tournaments/rankings": "Team Rankings",
          "/tournaments/teams": "Teams",
          "/tournaments/scrimmages": "Scrimmages",
          "/matches": "Matches",
          "/matches/queues": "Queues",
          "/matches/history": "Match History",
          "/leaderboard": "Leaderboard",
          "/admin": "Admin",
          "/admin/players": "Admin Players",
        };

        // Check for exact matches first
        if (routeNames[pathname]) {
          setPreviousPageName(routeNames[pathname]);
        } else if (pathname.startsWith("/tournaments/teams/")) {
          setPreviousPageName("Team Page");
        } else if (pathname.startsWith("/tournaments/rankings")) {
          setPreviousPageName("Team Rankings");
        } else if (pathname.startsWith("/leaderboard")) {
          setPreviousPageName("Leaderboard");
        } else if (pathname.startsWith("/admin")) {
          setPreviousPageName("Admin");
        } else if (pathname === "/" || pathname === "") {
          setPreviousPageName("Home");
        } else {
          // Extract a readable name from the path
          const segments = pathname.split("/").filter(Boolean);
          if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            setPreviousPageName(
              lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
            );
          }
        }
      } catch (e) {
        // Invalid URL, keep null
      }
    }
  }, []);

  // Function to handle going back to previous page
  const handleBack = () => {
    router.back();
  };

  // Calculate achievements
  const highestElo = Math.max(...validStats.map((s) => s.elo || 0), 0);
  const totalWins = Object.values(statsByTeamSize).reduce(
    (sum, stats) => sum + (stats?.wins || 0),
    0
  );
  const totalLosses = Object.values(statsByTeamSize).reduce(
    (sum, stats) => sum + (stats?.losses || 0),
    0
  );
  const overallWinRate = totalMatches > 0 
    ? Math.round((totalWins / totalMatches) * 100) 
    : 0;

  // Share functionality
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Fetch additional data
  useEffect(() => {
    if (!player.discordId) return;

    const fetchAdditionalData = async () => {
      setLoadingAdditionalData(true);
      try {
        // Fetch all teams for this player
        const teamRes = await fetch(`/api/players/${player.discordId}/team`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          // API now returns teams array, sorted with 4v4 first, then by size
          setTeamsInfo(teamData.teams || []);
        }

        // Fetch leaderboard positions for each active team size
        const positions: Record<string, any> = {};
        for (const [mode, stats] of Object.entries(statsByTeamSize)) {
          if (stats) {
            const teamSize = stats.teamSize;
            const posRes = await fetch(
              `/api/players/${player.discordId}/leaderboard-position?teamSize=${teamSize}`
            );
            if (posRes.ok) {
              const posData = await posRes.json();
              positions[mode] = posData;
            }
          }
        }
        setLeaderboardPositions(positions);

        // Fetch match history
        const matchesRes = await fetch(
          `/api/players/${player.discordId}/matches?limit=20`
        );
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatchHistory(matchesData.matches || []);
        }

      } catch (error) {
        console.error("Error fetching additional data:", error);
      } finally {
        setLoadingAdditionalData(false);
      }
    };

    fetchAdditionalData();
  }, [player.discordId, statsByTeamSize]);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-1 py-4 mx-auto max-w-screen-xl sm:px-3 md:px-6 lg:px-8 xl:px-12 sm:py-6 md:py-8 lg:py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex gap-2 items-center text-sm hover:bg-muted/50"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            {previousPageName ? `Back to ${previousPageName}` : "Back"}
          </Button>
        </div>

        {/* Hero Section with player info */}
        <PlayerContextMenu player={player} disabled={!hasModAccess}>
          <Card className="relative overflow-hidden mb-6 sm:mb-8 border-2 bg-gradient-to-br from-card via-card to-muted/30 shadow-xl cursor-context-menu">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            
            <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
              <div className="flex flex-col gap-6 items-center sm:flex-row sm:items-start sm:gap-8">
                {/* Avatar with enhanced styling */}
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
                  <div className="relative overflow-hidden w-28 h-28 rounded-full border-2 border-primary/30 shadow-lg ring-2 ring-primary/10 sm:h-32 sm:w-32 md:h-36 md:w-36">
                    <Image
                      src={player.discordProfilePicture || "/placeholder.svg"}
                      alt={
                        player.discordNickname ||
                        player.discordUsername ||
                        "Player"
                      }
                      fill
                      className="object-cover"
                    />
                  </div>
                  {isTopPlayer && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-bounce" />
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Player info section */}
                <div className="flex-1 text-center sm:text-left w-full">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                        {player.discordNickname ||
                          player.discordUsername ||
                          "Unknown Player"}
                      </h1>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {player.roles?.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className="border-2 font-semibold shadow-md"
                            style={{
                              backgroundColor: role.color === "red" 
                                ? "rgba(239, 68, 68, 0.2)" 
                                : role.color === "purple"
                                ? "rgba(99, 102, 241, 0.2)"
                                : "rgba(234, 179, 8, 0.2)",
                              color: role.color === "red"
                                ? "rgb(254, 202, 202)"
                                : role.color === "purple"
                                ? "rgb(199, 210, 254)"
                                : "rgb(254, 240, 138)",
                              borderColor: role.color === "red"
                                ? "rgba(239, 68, 68, 0.5)"
                                : role.color === "purple"
                                ? "rgba(99, 102, 241, 0.5)"
                                : "rgba(234, 179, 8, 0.5)",
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
                      className="border-2 shadow-md hover:shadow-lg transition-all"
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

                  {/* Quick stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                    <div className="flex flex-col items-center sm:items-start p-2 sm:p-2.5 md:p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Highest ELO</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {highestElo.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Win Rate</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {overallWinRate}%
                      </span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total Matches</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {totalMatches}
                      </span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Last Active</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(getLatestMatchDate() || "N/A")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </PlayerContextMenu>

        {/* ELO Stats Cards in 2x2 Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 sm:gap-6">
          {Object.entries(statsByTeamSize).map(([mode, stats]) => {
            if (!stats) return null; // Skip if no stats for this mode or inactive

            const rank = getRankByElo(stats.elo);
            const winRate = Math.round(
              (Number(stats.wins || 0) /
                (Number(stats.wins || 0) + Number(stats.losses || 0) || 1)) *
                100
            );
            const eloChange = stats.elo - (stats.lastMatchElo || stats.elo);
            const isTopRanked = stats.globalRank === 1;
            const matches = Number(stats.wins || 0) + Number(stats.losses || 0);

            return (
              <Card
                key={mode}
                className="relative overflow-hidden border-2 border-border bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm transition-all duration-300 group hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01]"
              >
                {/* Subtle background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isTopRanked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 rounded-full blur-3xl" />
                )}

                <CardHeader className="relative z-10 p-3 pb-2 sm:p-4 md:p-6 border-b border-border/50">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="p-2 rounded-lg bg-muted/50 border border-border">
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
                            <span className="text-xs font-semibold text-yellow-400">#1 Global</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-md" />
                      <Image
                        src={`/rankedicons/${rank.name.toLowerCase()}.png`}
                        alt={rank.name}
                        fill
                        className="object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 p-3 pt-3 sm:p-4 md:p-6">
                  <div className="flex gap-3 items-end mb-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                      {stats.elo.toLocaleString()}
                    </div>
                    {eloChange !== 0 && (
                      <div className="flex items-center mb-2">
                        {eloChange > 0 ? (
                          <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-400">
                            <ArrowUp className="h-3 w-3 mr-1" />+{eloChange}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-red-400">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {Math.abs(eloChange)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rank progress */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-foreground">{rank.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {rank.name === "Obsidian"
                          ? "MAX"
                          : rank.name === "Diamond"
                          ? "→ Obsidian"
                          : rank.name === "Platinum"
                          ? "→ Diamond"
                          : rank.name === "Gold"
                          ? "→ Platinum"
                          : rank.name === "Silver"
                          ? "→ Gold"
                          : "→ Silver"}
                      </span>
                    </div>
                    <Progress
                      value={getRankProgress(stats.elo, rank.name)}
                      className="h-3 bg-muted border border-border/50"
                    />
                    {/* ELO to next rank */}
                    {(() => {
                      const { eloNeeded, nextRank } = getEloToNextRank(stats.elo);
                      if (nextRank === null) {
                        return (
                          <div className="mt-2 text-xs text-muted-foreground text-center">
                            Maximum rank achieved
                          </div>
                        );
                      }
                      // Always show ELO needed if there's a next rank
                      if (nextRank) {
                        return (
                          <div className="mt-2 text-xs text-muted-foreground text-center font-medium">
                            {eloNeeded} ELO until {nextRank}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Leaderboard position */}
                    {leaderboardPositions[mode]?.position && (
                      <div className="mt-2 text-xs text-center">
                        <Badge variant="outline" className="text-xs">
                          <Medal className="w-3 h-3 mr-1" />
                          #{leaderboardPositions[mode].position}
                          {leaderboardPositions[mode].percentile && (
                            <span className="ml-1">
                              (Top {leaderboardPositions[mode].percentile}%)
                            </span>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">
                        {matches}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Matches
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">
                        {stats.wins}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Wins
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-border text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">
                        {stats.losses}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Losses
                      </div>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Win Rate</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {winRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 bg-primary"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* If no stats were found */}
        {Object.values(statsByTeamSize).every((stat) => stat === null) && (
          <Card className="border-2">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <div className="relative p-4 rounded-full bg-muted mb-4 inline-block">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                No Active Ratings
              </h2>
              <p className="text-sm text-muted-foreground">
                This player hasn&apos;t played any ranked matches in the last 30 days.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Information Section */}
        {teamsInfo.length > 0 && (
          <Card className="mt-6 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamsInfo.map((teamInfo) => {
                  const teamSizeLabel = teamInfo.teamSize === 2 ? "2v2" : teamInfo.teamSize === 3 ? "3v3" : teamInfo.teamSize === 4 ? "4v4" : teamInfo.teamSize === 5 ? "5v5" : `${teamInfo.teamSize}v${teamInfo.teamSize}`;
                  return (
                    <div key={teamInfo._id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <Link
                            href={`/tournaments/teams/${teamInfo._id}`}
                            className="text-xl sm:text-2xl font-bold hover:text-primary transition-colors flex items-baseline gap-2"
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
                          <div className="text-xl sm:text-2xl font-bold">{teamInfo.teamElo?.toLocaleString() || 0}</div>
                          <div className="text-xs text-muted-foreground">Team ELO</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold">
                            {teamInfo.wins || 0} - {teamInfo.losses || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Record</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold">{teamInfo.tournamentWins || 0}</div>
                          <div className="text-xs text-muted-foreground">Tournament Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl font-bold">{teamInfo.memberCount || 0}/{teamInfo.teamSize || 4}</div>
                          <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match History */}
        {matchHistory.length > 0 && (
          <Card className="mt-6 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchHistory.slice(0, 10).map((match) => (
                  <div
                    key={match._id}
                    className={`p-3 sm:p-4 rounded-lg border-2 ${
                      match.result === "win"
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={match.result === "win" ? "default" : "destructive"}
                          >
                            {match.result === "win" ? "Win" : "Loss"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {match.teamSize}v{match.teamSize}
                          </span>
                          {match.map && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {match.map}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">
                            {match.playerTeam.score} - {match.opponentTeam.score}
                          </span>
                          {match.eloChange !== 0 && (
                            <span
                              className={`ml-2 ${
                                match.eloChange > 0 ? "text-green-400" : "text-red-400"
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
        )}

      </div>
    </div>
  );
}
