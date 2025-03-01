"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Navbar } from "@/components/navbar";
import { formatDate } from "@/lib/date-utils";
import { getRankFromElo } from "@/lib/ranks";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Link from "next/link";
import Image from "next/image";

interface Player {
  discordId: string;
  discordNickname: string;
  elo: number;
  rank: string; // Diamond, Platinum, etc.
}

interface Team {
  players: Player[];
  teamElo: number;
  wins: number;
}

interface Map {
  name: string;
  number: number;
  gameMode: "Attrition" | "Extraction" | "Raid";
  team1Score?: number;
  team2Score?: number;
  scoredBy?: {
    team1?: string;
    team2?: string;
    verifiedAt?: number;
  };
}

interface Match {
  _id: string;
  matchId: string;
  title: string;
  type: string;
  status: string;
  eloTier: string;
  teamSize: number;
  createdBy: string;
  createdAt: number;
  completedAt?: number;
  team1: Team;
  team2: Team;
  firstPick?: number;
  pickType?: "side" | "server";
  maps: Array<{
    name: string;
    number: number;
    gameMode: "Attrition" | "Extraction" | "Raid";
    team1Score?: number;
    team2Score?: number;
    scoredBy?: {
      team1?: string;
      team2?: string;
      verifiedAt?: number;
    };
  }>;
}

// Add type definitions for the status details
interface StatusDetails {
  label: string;
  color: string;
  textColor: string;
}

interface StatusMap {
  [key: string]: StatusDetails;
}

const getMapImage = (mapName: string) => {
  // Remove spaces and special characters, convert to lowercase
  const formattedName = mapName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `/maps/map_${formattedName}.png`;
};

const getStatusDetails = (status: string): StatusDetails => {
  const statusMap: StatusMap = {
    completed: {
      label: "COMPLETED",
      color: "bg-[#00B894] hover:bg-[#00A187]",
      textColor: "text-white",
    },
    "in-progress": {
      label: "IN PROGRESS",
      color: "bg-[#0984E3] hover:bg-[#0876CC]",
      textColor: "text-white",
    },
    "ready-check": {
      label: "READY CHECK",
      color: "bg-[#00CEC9] hover:bg-[#00BBB6]",
      textColor: "text-white",
    },
  };

  return (
    statusMap[status.toLowerCase()] || {
      label: status.toUpperCase(),
      color: "bg-gray-500 hover:bg-gray-600",
      textColor: "text-white",
    }
  );
};

const getCompletionTime = (match: Match) => {
  if (match.completedAt) {
    return new Date(match.completedAt).getTime();
  }

  if (!match.maps?.length) return null;

  const allMapsScored = match.maps.every(
    (map) =>
      map.scoredBy?.team1 && map.scoredBy?.team2 && map.scoredBy?.verifiedAt
  );

  if (!allMapsScored) return null;

  // Get the latest verification timestamp
  const lastVerification = Math.max(
    ...match.maps.map((map) => map.scoredBy?.verifiedAt || 0)
  );

  return lastVerification > 0 ? lastVerification : null;
};

const capitalizeEloTier = (tier: string) => {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
};

export default function MatchDetailsPage() {
  const params = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async (id: string) => {
      try {
        const response = await fetch(`/api/matches/${id}`);
        const data = await response.json();
        setMatch(data);
      } catch (error) {
        console.error("Failed to fetch match:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if we have a valid matchId
    const matchId = params?.matchId;
    if (matchId) {
      fetchMatch(matchId);
    }
  }, [params?.matchId]); // Safe optional chaining in dependency array

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!match || !params?.matchId) {
    return <div>Match not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <main className="container p-4 mx-auto sm:py-8">
        {/* Title section */}
        <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-[#00A8FC] sm:text-2xl">
            Match Details
          </h1>
          <Badge
            className={`self-start transition-colors duration-200 sm:self-auto ${
              getStatusDetails(match.status).color
            } ${getStatusDetails(match.status).textColor}`}
          >
            {getStatusDetails(match.status).label}
          </Badge>
        </div>

        <div className="p-4 rounded-lg bg-[#0F1318] sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {match.teamSize}v{match.teamSize}{" "}
              {capitalizeEloTier(match.eloTier)} Queue
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Match ID: {match.matchId}
            </p>
          </div>

          {/* Match info grid - make it stack on mobile */}
          <div className="grid gap-4 mb-8 sm:grid-cols-2">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="font-medium">Ranked</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Team Size</p>
                  <p className="font-medium">
                    {match.teamSize}v{match.teamSize}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400">ELO Tier</p>
                  <p className="font-medium">
                    {capitalizeEloTier(match.eloTier)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Launched By</p>
                  <p className="font-medium">{match.createdBy}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Created</span>
              <span>
                {format(new Date(match.createdAt), "MMM dd, yyyy, h:mm a")}
              </span>
            </div>
            {match.status.toLowerCase() === "completed" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Completed</span>
                <span>
                  {format(
                    new Date(getCompletionTime(match) || match.createdAt),
                    "MMM dd, yyyy, h:mm a"
                  )}
                </span>
              </div>
            )}
          </div>

          {match.firstPick && (
            <div className="p-4 mb-8 rounded bg-[#1A1F25] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00CEC9]/10 to-transparent" />
              <div className="relative flex items-center gap-2">
                <span className="text-sm font-medium text-[#00CEC9]">
                  First Pick
                </span>
                <span>
                  Team {match.firstPick} picks {match.pickType || "side"} first
                </span>
              </div>
            </div>
          )}

          {/* Teams section - stack on mobile */}
          <div className="grid gap-4 mb-8 sm:gap-6 md:grid-cols-2">
            {[match.team1, match.team2].map((team, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg bg-[#1A1F25] ${
                  team.wins >
                  (index === 0 ? match.team2.wins : match.team1.wins)
                    ? "ring-2 ring-[#00CEC9] ring-opacity-50"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Team {index + 1}</h3>
                    {team.wins > 0 && <span className="text-xl">🏆</span>}
                  </div>
                  <span className="text-sm text-gray-400">
                    Team ELO: {team.teamElo}
                  </span>
                </div>
                <div className="space-y-3">
                  {team.players.map((player) => (
                    <div
                      key={player.discordId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full" />
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <span className="hover:text-[#00CEC9] transition-colors cursor-default">
                              {player.discordNickname}
                            </span>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48 bg-[#1A1F25] border-[#2D3436]">
                            <ContextMenuItem
                              disabled
                              className="flex items-center gap-2 text-yellow-400 hover:bg-[#2D3436] hover:text-yellow-400 cursor-not-allowed"
                            >
                              <span className="text-lg">⚠️</span>
                              Warn Player
                            </ContextMenuItem>
                            <ContextMenuItem
                              disabled
                              className="flex items-center gap-2 text-red-400 hover:bg-[#2D3436] hover:text-red-400 cursor-not-allowed"
                            >
                              <span className="text-lg">🚫</span>
                              Ban Player
                            </ContextMenuItem>
                            <ContextMenuItem
                              disabled
                              className="flex items-center gap-2 text-gray-400 hover:bg-[#2D3436] hover:text-gray-400 cursor-not-allowed"
                            >
                              <span className="text-lg">📝</span>
                              Report Player
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                      <div className="grid grid-cols-[auto_minmax(80px,auto)] items-center gap-4">
                        {/* Rank with fixed width container */}
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <Image
                            src={getRankFromElo(player.elo).icon}
                            alt={getRankFromElo(player.elo).name}
                            width={20}
                            height={20}
                            className="object-contain"
                            unoptimized
                          />
                          <span
                            className={`text-sm ${
                              getRankFromElo(player.elo).name === "Diamond"
                                ? "text-blue-400"
                                : getRankFromElo(player.elo).name === "Obsidian"
                                ? "text-purple-400"
                                : getRankFromElo(player.elo).name === "Platinum"
                                ? "text-yellow-400"
                                : getRankFromElo(player.elo).name === "Gold"
                                ? "text-amber-400"
                                : "text-gray-400"
                            }`}
                          >
                            {getRankFromElo(player.elo).name}
                          </span>
                        </div>
                        {/* ELO */}
                        <span className="text-sm text-muted-foreground">
                          ELO: {player.elo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="secondary">{team.wins} Wins</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Match Results */}
          <div className="rounded-lg bg-[#1A1F25]">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold">Match Results</h3>
              <p className="text-sm text-gray-400">Best of 3 series</p>
            </div>
            <div className="p-4 sm:p-6">
              {/* Overall Score */}
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <span className="text-4xl font-bold">{match.team1.wins}</span>
                  <div className="text-sm text-gray-400">Team 1</div>
                </div>
                <span className="text-gray-400">vs</span>
                <div className="text-center">
                  <span className="text-4xl font-bold">{match.team2.wins}</span>
                  <div className="text-sm text-gray-400">Team 2</div>
                </div>
              </div>

              {/* Maps with improved design */}
              <div className="grid grid-cols-3 gap-4">
                {match.maps.map((map, index) => (
                  <div
                    key={index}
                    className={`overflow-hidden rounded-lg ${
                      map.number === 3 ? "bg-[#2D3436]" : "bg-[#1A1F25]"
                    }`}
                  >
                    <div className="relative">
                      <Image
                        src={getMapImage(map.name)}
                        alt={map.name}
                        width={640}
                        height={360}
                        className="object-cover w-full aspect-video"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#00CEC9]">
                            {map.gameMode}
                          </span>
                          <span className="text-xs text-gray-400">
                            Map {map.number}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-medium">{map.name}</h4>
                      </div>
                    </div>
                    {map.team1Score !== undefined && (
                      <div className="p-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-center">
                            <span className="text-3xl font-bold">
                              {map.team1Score}
                            </span>
                          </div>
                          <span className="text-lg text-gray-400">vs</span>
                          <div className="text-center">
                            <span className="text-3xl font-bold">
                              {map.team2Score}
                            </span>
                          </div>
                        </div>
                        {map.scoredBy && (
                          <div className="pt-3 mt-3 border-t border-gray-800">
                            <div className="mb-2 text-xs text-center text-gray-400">
                              Scored By
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="text-xs">
                                {map.scoredBy.team1}
                              </div>
                              <div className="text-xs">
                                {map.scoredBy.team2}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
