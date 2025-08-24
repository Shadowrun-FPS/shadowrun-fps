"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayerContextMenu } from "@/components/player-context-menu";
import { useSession } from "next-auth/react";
import { getRankByElo, getRankProgress } from "@/lib/rank-utils";
import { useRouter } from "next/navigation";
import { SECURITY_CONFIG } from "@/lib/security-config";

// Format date to Month DD, YYYY
const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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

  // Filter stats to only include objects with teamSize
  const validStats = player.stats.filter(
    (stat) => typeof stat.teamSize === "number"
  );

  // Create stats by team size for easier access, filtering out inactive ones (>30 days)
  const statsByTeamSize = {
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
  };

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

  // Function to handle going back to previous page
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-3 min-h-screen text-gray-100 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex gap-2 items-center text-sm"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Header with player info */}
        <PlayerContextMenu player={player} disabled={!hasModAccess}>
          <div className="overflow-hidden relative mb-6 bg-gradient-to-r rounded-xl border border-gray-700 backdrop-blur-sm sm:mb-8 from-gray-800/90 to-gray-900/90 cursor-context-menu">
            <div className="absolute inset-0 bg-gradient-to-r via-transparent from-indigo-500/10 to-cyan-500/10" />

            <div className="flex relative z-10 flex-col gap-4 items-center p-4 sm:p-6 md:p-8 sm:gap-6">
              {/* Top section with avatar and name */}
              <div className="flex flex-col gap-4 items-center w-full sm:flex-row sm:items-start sm:gap-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full opacity-70 blur-sm" />
                  <div className="overflow-hidden relative w-24 h-24 rounded-full border-2 border-gray-700 shadow-lg sm:h-28 sm:w-28 md:h-32 md:w-32">
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
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 sm:text-3xl md:text-4xl">
                      {player.discordNickname ||
                        player.discordUsername ||
                        "Unknown Player"}
                    </h1>

                    <div className="flex flex-wrap gap-2 justify-center mt-2 sm:justify-start sm:mt-0">
                      {player.roles?.map((role) => (
                        <Badge
                          key={role.id}
                          variant="outline"
                          className={`bg-${
                            role.color === "red"
                              ? "red"
                              : role.color === "purple"
                              ? "indigo"
                              : "yellow"
                          }-500/20 text-${
                            role.color === "red"
                              ? "red"
                              : role.color === "purple"
                              ? "indigo"
                              : "yellow"
                          }-300 border-${
                            role.color === "red"
                              ? "red"
                              : role.color === "purple"
                              ? "indigo"
                              : "yellow"
                          }-500/30 hover:bg-${
                            role.color === "red"
                              ? "red"
                              : role.color === "purple"
                              ? "indigo"
                              : "yellow"
                          }-500/30`}
                        >
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom section with badges and stats */}
              <div className="flex flex-col gap-4 justify-between items-stretch w-full sm:flex-row">
                {/* Last Match section */}
                <div className="flex items-center flex-1 gap-2 px-3 py-1.5  rounded-lg">
                  <Clock className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm text-gray-300">
                    Last Match: {formatDate(getLatestMatchDate() || "N/A")}
                  </span>
                </div>

                {/* Total Matches section */}
                <div className="flex items-center justify-end flex-1 gap-3 px-3 py-1.5 rounded-lg">
                  <div className="text-right">
                    <div className="text-sm text-gray-300">Total Matches</div>
                    <div className="text-xl font-bold text-cyan-300">
                      {totalMatches}
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-10 h-10 rounded-full bg-cyan-500/20">
                    <Zap className="w-5 h-5 text-cyan-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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

            return (
              <Card
                key={mode}
                className="overflow-hidden border-gray-700 backdrop-blur-sm transition-all duration-300 bg-gray-800/80 group hover:border-gray-600 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br transition-all duration-300 pointer-events-none from-gray-700/30 to-gray-800/30 group-hover:from-gray-700/40 group-hover:to-gray-800/40" />
                <CardHeader className="relative z-10 p-4 pb-2 sm:p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      {mode === "1v1" && (
                        <User className="w-5 h-5 text-indigo-300" />
                      )}
                      {mode === "2v2" && (
                        <UserPlus className="w-5 h-5 text-blue-300" />
                      )}
                      {mode === "4v4" && (
                        <Users className="w-5 h-5 text-green-300" />
                      )}
                      {mode === "5v5" && (
                        <Users2 className="w-5 h-5 text-yellow-300" />
                      )}
                      <CardTitle className="text-base font-bold text-gray-100 sm:text-lg">
                        {mode} Rating
                      </CardTitle>
                    </div>
                    <div className="relative w-10 h-10">
                      <Image
                        src={`/rankedicons/${rank.name.toLowerCase()}.png`}
                        alt={rank.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 p-4 pt-0 sm:p-6">
                  <div className="flex gap-2 items-end mb-4">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 sm:text-5xl">
                      {stats.elo}
                    </div>
                    <div className="flex items-center mb-1">
                      {eloChange > 0 ? (
                        <span className="flex items-center text-sm text-green-300">
                          <ArrowUp className="h-3 w-3 mr-0.5" />+{eloChange}
                        </span>
                      ) : eloChange < 0 ? (
                        <span className="flex items-center text-sm text-red-300">
                          <ArrowDown className="h-3 w-3 mr-0.5" />
                          {Math.abs(eloChange)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300"></span>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between mb-1 text-xs text-gray-200">
                      <span>{rank.name}</span>
                      <span>
                        {rank.name === "Obsidian"
                          ? "MAX"
                          : rank.name === "Diamond"
                          ? "Obsidian"
                          : rank.name === "Platinum"
                          ? "Diamond"
                          : rank.name === "Gold"
                          ? "Platinum"
                          : rank.name === "Silver"
                          ? "Gold"
                          : "Silver"}
                      </span>
                    </div>
                    <Progress
                      value={getRankProgress(stats.elo, rank.name)}
                      className="h-2 bg-gray-700"
                      indicatorClassName={rank.color.replace("bg-", "")}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-gray-700/70">
                      <div className="text-lg font-semibold">
                        {Number(stats.wins || 0) + Number(stats.losses || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Matches
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-700/70">
                      <div className="text-xs text-gray-300 sm:text-sm">
                        Wins
                      </div>
                      <div className="text-lg font-semibold text-green-300 sm:text-xl">
                        {stats.wins}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-700/70">
                      <div className="text-xs text-gray-300 sm:text-sm">
                        Losses
                      </div>
                      <div className="text-lg font-semibold text-red-300 sm:text-xl">
                        {stats.losses}
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 mt-4 rounded-lg bg-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300 sm:text-sm">
                        Win Rate
                      </span>
                      <span
                        className={`font-medium ${
                          winRate > 60
                            ? "text-green-300"
                            : winRate < 40
                            ? "text-red-300"
                            : "text-blue-300"
                        }`}
                      >
                        {winRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* If no stats were found */}
        {Object.values(statsByTeamSize).every((stat) => stat === null) && (
          <div className="p-8 text-center rounded-xl border border-gray-700 bg-gray-800/60">
            <h2 className="text-xl font-semibold text-gray-100">
              No Active Ratings
            </h2>
            <p className="mt-2 text-gray-300">
              This player hasn&apos;t played any ranked matches in the last 30
              days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
