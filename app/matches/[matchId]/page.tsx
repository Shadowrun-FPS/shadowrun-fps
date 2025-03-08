"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { PlayerContextMenu } from "@/components/moderation/player-context-menu";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";

interface MatchPlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  discordProfilePicture?: string;
  elo: number;
}

interface MatchMap {
  mapName: string;
  gameMode: string;
  selected: boolean;
}

interface MapScore {
  team1Score: number;
  team2Score: number;
  submittedByTeam1: boolean;
  submittedByTeam2: boolean;
  submittedByTeam1User?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
  };
  submittedByTeam2User?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
  };
  winner?: number;
}

interface Match {
  matchId: string;
  status: string;
  teamSize: number;
  eloTier: string;
  type: string;
  firstPick: number;
  createdAt: number;
  createdBy: {
    discordId: string;
    discordUsername: string;
    discordNickname: string;
  };
  maps: MatchMap[];
  team1: MatchPlayer[];
  team2: MatchPlayer[];
  eloDifference: number;
  winner?: number;
  completedAt?: number;
  mapScores?: MapScore[];
  team1Name?: string;
  team2Name?: string;
}

interface ScoreFormValues {
  mapIndex: number;
  team1Score: number;
  team2Score: number;
  submittingTeam: number | null;
}

// Helper function to get player rank badge
const getPlayerRankBadge = (elo: number) => {
  if (elo >= 2300) return "Obsidian";
  if (elo >= 1900) return "Diamond";
  if (elo >= 1500) return "Platinum";
  if (elo >= 1200) return "Gold";
  if (elo >= 900) return "Silver";
  return "Bronze";
};

// Helper function to get rank icon path
const getRankIconPath = (elo: number) => {
  const rank = getPlayerRankBadge(elo);
  return `/rankedicons/${rank.toLowerCase()}.png`;
};

// Helper function to get rank color
const getRankColor = (elo: number) => {
  if (elo >= 2300) return "purple"; // Obsidian
  if (elo >= 1900) return "blue"; // Diamond
  if (elo >= 1500) return "cyan"; // Platinum
  if (elo >= 1200) return "yellow"; // Gold
  if (elo >= 900) return "gray"; // Silver
  return "orange"; // Bronze
};

// Helper function to format map name for image path
const formatMapNameForImage = (mapName: string) => {
  // Convert map names to lowercase, remove spaces, and add the map_ prefix with .png extension
  return `map_${mapName.toLowerCase().replace(/\s+/g, "")}.png`;
};

export default function MatchDetailPage() {
  const { data: session } = useSession();
  const params = useParams() as { matchId: string };
  const router = useRouter();
  const { toast } = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map1");
  const [scoreDialog, setScoreDialog] = useState(false);
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add the getTeamName function inside the component
  const getTeamName = (teamNumber: number, isQueueMatch: boolean = true) => {
    if (!match) return `Team ${teamNumber}`;

    // For queue matches, use Team 1 and Team 2
    if (isQueueMatch) {
      return `Team ${teamNumber}`;
    }

    // For tournament matches, use custom team names if available
    if (teamNumber === 1 && match.team1Name) {
      return match.team1Name;
    }

    if (teamNumber === 2 && match.team2Name) {
      return match.team2Name;
    }

    // Fallback to using the first player's name
    if (teamNumber === 1 && match.team1 && match.team1.length > 0) {
      return `${
        match.team1[0].discordNickname?.split(" ")[0] || "Team 1"
      }'s Devils`;
    }

    if (teamNumber === 2 && match.team2 && match.team2.length > 0) {
      return `${
        match.team2[0].discordNickname?.split(" ")[0] || "Team 2"
      }'s Devils`;
    }

    // Final fallback
    return `Team ${teamNumber}`;
  };

  // Update the getUserTeam function
  const getUserTeam = () => {
    if (!session?.user?.id || !match) return null;

    const isInTeam1 =
      match.team1?.some(
        (player: MatchPlayer) => player.discordId === session?.user?.id
      ) || false;

    const isInTeam2 =
      match.team2?.some(
        (player: MatchPlayer) => player.discordId === session?.user?.id
      ) || false;

    if (isInTeam1) return 1;
    if (isInTeam2) return 2;
    return null;
  };

  // Add this near the top of your component
  const userTeam = getUserTeam();

  // Function to handle opening the score submission dialog
  const handleOpenScoreDialog = (mapIndex: number) => {
    setSelectedMapIndex(mapIndex);
    setTeam1Score("");
    setTeam2Score("");
    setScoreDialog(true);
  };

  // Update the fetchMatchData function
  const fetchMatchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${params.matchId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch match: ${response.statusText}`);
      }
      const data = await response.json();
      setMatch(data);
      return data; // Return the data for immediate use if needed
    } catch (error) {
      console.error("Error fetching match data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch match data",
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by caller if needed
    }
  }, [params.matchId, toast]);

  // Update the handleSubmitScore function
  const handleSubmitScore = async (data: ScoreFormValues) => {
    try {
      const response = await fetch(`/api/matches/${params.matchId}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit score");
      }

      // Show success toast
      toast({
        title: "Score Submitted",
        description: "Your score has been submitted successfully",
      });

      // Fetch updated match data
      await fetchMatchData();

      // Close the dialog
      setScoreDialog(false);
    } catch (error) {
      console.error("Error submitting score:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit score",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchMatch = async () => {
      if (!params?.matchId) return;

      try {
        const response = await fetch(`/api/matches/${params.matchId}`);
        if (!response.ok) throw new Error("Failed to fetch match");
        const data = await response.json();
        setMatch(data);
      } catch (error) {
        console.error("Error fetching match:", error);
        toast({
          title: "Error",
          description: "Failed to load match details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params?.matchId) {
      fetchMatch();
    }
  }, [params?.matchId, toast]);

  useEffect(() => {
    console.log("User team:", userTeam);
    console.log("Match status:", match?.status);
  }, [userTeam, match]);

  // Add a function to update the match status to "in_progress" if it's still in "draft" status
  useEffect(() => {
    const updateMatchStatus = async () => {
      if (match && match.status === "draft" && userTeam) {
        try {
          const response = await fetch(
            `/api/matches/${params.matchId}/status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "in_progress",
              }),
            }
          );

          if (response.ok) {
            // Refresh match data
            const refreshResponse = await fetch(
              `/api/matches/${params.matchId}`
            );
            if (refreshResponse.ok) {
              const refreshedMatch = await refreshResponse.json();
              setMatch(refreshedMatch);
            }
          }
        } catch (error) {
          console.error("Failed to update match status:", error);
        }
      }
    };

    updateMatchStatus();
  }, [match, userTeam, params.matchId]);

  // Update the socket connection
  useEffect(() => {
    if (!session?.user) return;

    let socket: any;

    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(
          process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
          {
            path: "/api/socketio",
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            transports: ["websocket", "polling"],
          }
        );

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
          // Join match room on connection
          socket.emit("join-match", params.matchId);
        });

        socket.on("match:update", (updatedMatch: any) => {
          console.log("Received match update:", updatedMatch);
          if (updatedMatch.matchId === params.matchId) {
            // Immediately update the UI with new match data
            setMatch((prevMatch) => {
              // Only update if the timestamp is newer
              if (
                !prevMatch ||
                updatedMatch.timestamp > (prevMatch as any).timestamp
              ) {
                return updatedMatch;
              }
              return prevMatch;
            });

            // Handle score mismatch
            if (
              updatedMatch.mapScores?.some(
                (score: any) => score?.scoresMismatch
              )
            ) {
              const mismatchMapIndex = updatedMatch.mapScores.findIndex(
                (score: any) => score?.scoresMismatch
              );

              // Reset UI state
              setScoreDialog(false);
              setTeam1Score("");
              setTeam2Score("");

              // Show mismatch toast
              toast({
                title: "⚠️ Score Mismatch Detected!",
                description: (
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-red-400">
                      Scores for Map {mismatchMapIndex + 1} did not match:
                    </p>
                    <div className="grid grid-cols-2 gap-4 p-2 mt-1 border rounded border-red-400/20 bg-red-400/10">
                      <div>
                        <p className="text-sm font-semibold">
                          Team 1 submitted:
                        </p>
                        <p className="text-sm">
                          {updatedMatch.mapScores[mismatchMapIndex]
                            ?.team1SubmittedByTeam1Score || "?"}{" "}
                          -{" "}
                          {updatedMatch.mapScores[mismatchMapIndex]
                            ?.team2SubmittedByTeam1Score || "?"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Team 2 submitted:
                        </p>
                        <p className="text-sm">
                          {updatedMatch.mapScores[mismatchMapIndex]
                            ?.team1SubmittedByTeam2Score || "?"}{" "}
                          -{" "}
                          {updatedMatch.mapScores[mismatchMapIndex]
                            ?.team2SubmittedByTeam2Score || "?"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 font-medium text-white">
                      {userTeam
                        ? "Please communicate with the other team and submit matching scores."
                        : "Waiting for teams to submit matching scores..."}
                    </p>
                  </div>
                ),
                variant: "destructive",
                duration: 10000,
              });

              // Show action required toast for players
              if (userTeam) {
                setTimeout(() => {
                  toast({
                    title: "Action Required",
                    description:
                      "Click 'Submit Score' when ready to enter new scores.",
                    variant: "default",
                    duration: 5000,
                  });
                }, 1000);
              }
            }
          }
        });

        // Handle connection errors
        socket.on("connect_error", (error: Error) => {
          console.error("Socket connection error:", error);
          toast({
            title: "Connection Error",
            description: "Trying to reconnect...",
            variant: "destructive",
          });
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("match:update");
        socket.close();
      }
    };
  }, [session?.user, params.matchId, toast, userTeam]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">Loading match details...</div>
    );
  }

  if (!match) {
    return <div className="flex justify-center p-8">Match not found</div>;
  }

  const team1 = match.team1;
  const team2 = match.team2;

  // Update the isCurrentUserInMatch check
  const isCurrentUserInMatch =
    session?.user?.id &&
    [...team1, ...team2].some((p) => p.discordId === session.user?.id);

  // Calculate team ELOs
  const team1Elo = team1.reduce((sum, player) => sum + player.elo, 0);
  const team2Elo = team2.reduce((sum, player) => sum + player.elo, 0);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <main className="container p-4 mx-auto mt-4 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-400">Match Details</h1>
          {match && (
            <Badge
              className={`px-3 py-1 text-xs font-medium uppercase ${
                match.status === "completed"
                  ? "bg-green-600"
                  : match.status === "in_progress"
                  ? "bg-blue-600"
                  : "bg-yellow-600"
              }`}
            >
              {match.status === "completed"
                ? "Completed"
                : match.status === "in_progress"
                ? "In Progress"
                : "Draft"}
            </Badge>
          )}
        </div>

        <div className="relative mb-6">
          <Card className="bg-[#111827] border-[#1f2937]">
            <CardContent className="p-6">
              <h2 className="mb-2 text-xl font-semibold text-white capitalize">
                {match.eloTier} Queue
              </h2>
              <p className="mb-4 text-sm text-gray-400">
                Match ID: {match.matchId}
              </p>

              {/* Match details grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="font-medium text-white">{match.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">ELO Tier</p>
                  <p className="font-medium text-white capitalize">
                    {match.eloTier}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Team Size</p>
                  <p className="font-medium text-white">
                    {match.teamSize}v{match.teamSize}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Launched By</p>
                  <p className="font-medium text-white">
                    {match.createdBy.discordNickname}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 mr-2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">Created</p>
                  <p className="ml-2 text-sm font-medium text-white">
                    {format(new Date(match.createdAt), "MMM d, yyyy, h:mm a")}
                  </p>
                </div>

                {match.completedAt && (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="ml-2 text-sm font-medium text-white">
                      {format(
                        new Date(match.completedAt),
                        "MMM d, yyyy, h:mm a"
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* First Pick */}
              <div className="p-4 mb-4 bg-[#0f172a] rounded-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-2 text-blue-400">
                    <Trophy size={20} />
                  </div>
                  <p className="text-sm font-medium text-blue-400">
                    First Pick
                  </p>
                </div>
                <p className="mt-1 text-white">
                  Team {match.firstPick} picks side or server first.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          {/* Team 1 */}
          <Card
            className={`bg-[#111827] border-[#1f2937] ${
              match.winner === 1 ? "border-l-4 border-l-[#3b82f6]" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-white">
                    Team 1 {match.winner === 1 && "🏆"}
                  </h3>
                  {match.firstPick === 1 && (
                    <Badge className="ml-2 bg-[#3b82f6]">First Pick</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Team ELO</p>
                  <p className="font-medium text-white">{team1Elo}</p>
                </div>
              </div>

              <div className="space-y-2">
                {team1.map((player) => (
                  <div
                    key={player.discordId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.discordId === session?.user?.id
                        ? "bg-[#1e3a8a] border border-[#3b82f6]"
                        : "bg-[#1f2937]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 mr-3 overflow-hidden bg-gray-700 rounded-full">
                        {player.discordProfilePicture ? (
                          <Image
                            src={player.discordProfilePicture}
                            alt={player.discordNickname || "Player"}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-white">
                            {(
                              player.discordNickname ||
                              player.discordUsername ||
                              ""
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <PlayerContextMenu
                        playerId={player.discordId}
                        playerName={
                          player.discordNickname ||
                          player.discordUsername ||
                          "Unknown Player"
                        }
                      >
                        <div>
                          <p className="font-medium text-white">
                            {player.discordNickname ||
                              player.discordUsername ||
                              "Unknown Player"}
                          </p>
                          <p className="text-xs text-gray-400">
                            ELO: {player.elo}
                          </p>
                        </div>
                      </PlayerContextMenu>
                    </div>
                    <div className="flex-shrink-0">
                      <Image
                        src={getRankIconPath(player.elo)}
                        alt={getPlayerRankBadge(player.elo)}
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {match.winner && (
                <div className="mt-4 text-center">
                  <Badge
                    className={`px-4 py-1 text-lg ${
                      match.winner === 1 ? "bg-[#3b82f6]" : "bg-gray-700"
                    }`}
                  >
                    {match.winner === 1 ? "2 Wins" : "1 Win"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team 2 */}
          <Card
            className={`bg-[#111827] border-[#1f2937] ${
              match.winner === 2 ? "border-l-4 border-l-[#3b82f6]" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-white">
                    Team 2 {match.winner === 2 && "🏆"}
                  </h3>
                  {match.firstPick === 2 && (
                    <Badge className="ml-2 bg-[#3b82f6]">First Pick</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Team ELO</p>
                  <p className="font-medium text-white">{team2Elo}</p>
                </div>
              </div>

              <div className="space-y-2">
                {team2.map((player) => (
                  <div
                    key={player.discordId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.discordId === session?.user?.id
                        ? "bg-[#1e3a8a] border border-[#3b82f6]"
                        : "bg-[#1f2937]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 mr-3 overflow-hidden bg-gray-700 rounded-full">
                        {player.discordProfilePicture ? (
                          <Image
                            src={player.discordProfilePicture}
                            alt={player.discordNickname || "Player"}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-white">
                            {(
                              player.discordNickname ||
                              player.discordUsername ||
                              ""
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <PlayerContextMenu
                        playerId={player.discordId}
                        playerName={
                          player.discordNickname ||
                          player.discordUsername ||
                          "Unknown Player"
                        }
                      >
                        <div>
                          <p className="font-medium text-white">
                            {player.discordNickname ||
                              player.discordUsername ||
                              "Unknown Player"}
                          </p>
                          <p className="text-xs text-gray-400">
                            ELO: {player.elo}
                          </p>
                        </div>
                      </PlayerContextMenu>
                    </div>
                    <div className="flex-shrink-0">
                      <Image
                        src={getRankIconPath(player.elo)}
                        alt={getPlayerRankBadge(player.elo)}
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {match.winner && (
                <div className="mt-4 text-center">
                  <Badge
                    className={`px-4 py-1 text-lg ${
                      match.winner === 2 ? "bg-[#3b82f6]" : "bg-gray-700"
                    }`}
                  >
                    {match.winner === 2 ? "2 Wins" : "1 Win"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Match Results Section */}
        {match.status === "completed" ? (
          <Card className="bg-[#111827] border-[#1f2937]">
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">
                Match Results
              </h3>
              <p className="mb-4 text-sm text-gray-400">Best of 3 series</p>

              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Team 1</p>
                  <p className="text-4xl font-bold text-white">2</p>
                </div>
                <div className="mx-4 text-sm text-gray-400">VS</div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Team 2</p>
                  <p className="text-4xl font-bold text-white">1</p>
                </div>
              </div>

              <Tabs defaultValue="map1" className="w-full">
                <TabsList className="w-full bg-[#1f2937]">
                  <TabsTrigger value="map1" className="flex-1">
                    Map 1
                  </TabsTrigger>
                  <TabsTrigger value="map2" className="flex-1">
                    Map 2
                  </TabsTrigger>
                  <TabsTrigger value="map3" className="flex-1">
                    Map 3
                  </TabsTrigger>
                </TabsList>

                {match.maps.map((map, index) => (
                  <TabsContent
                    key={index}
                    value={`map${index + 1}`}
                    className="mt-4"
                  >
                    <div className="relative w-full h-32 mb-3 overflow-hidden rounded-md">
                      <Image
                        src={`/maps/${formatMapNameForImage(map.mapName)}`}
                        alt={map.mapName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-3">
                        <p className="text-lg font-semibold text-white">
                          {map.mapName}
                        </p>
                        <p className="text-xs text-gray-300">{map.gameMode}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h2 className="mb-4 text-xl font-semibold text-white">
                        Map Score
                      </h2>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                          <div className="mb-1 text-gray-400">Team 1</div>
                          <div className="text-3xl font-bold text-white">
                            {match.mapScores?.[index]?.team1Score || 0}
                          </div>
                        </div>
                        <div className="text-gray-400">VS</div>
                        <div className="text-center">
                          <div className="mb-1 text-gray-400">Team 2</div>
                          <div className="text-3xl font-bold text-white">
                            {match.mapScores?.[index]?.team2Score || 0}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="mb-2 text-sm text-gray-400">
                            Scored By
                          </h3>
                          <div className="bg-[#1f2937] rounded p-3">
                            {match.mapScores?.[index]?.submittedByTeam1 ? (
                              <div className="text-white">
                                {match.mapScores[index].submittedByTeam1User
                                  ?.discordNickname || "Unknown"}
                              </div>
                            ) : (
                              <div className="text-gray-400">Pending</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-sm text-gray-400">
                            Scored By
                          </h3>
                          <div className="bg-[#1f2937] rounded p-3">
                            {match.mapScores?.[index]?.submittedByTeam2 ? (
                              <div className="text-white">
                                {match.mapScores[index].submittedByTeam2User
                                  ?.discordNickname || "Unknown"}
                              </div>
                            ) : (
                              <div className="text-gray-400">Pending</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          // Maps Section for in-progress matches
          <Card></Card>
        )}

        {/* Maps Section */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">
              Match Maps
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {match.maps.map((map, index) => (
                <Card
                  key={index}
                  className="overflow-hidden bg-[#1a2234] border-[#1f2937]"
                >
                  <div className="relative">
                    <div className="relative w-full h-40">
                      <Image
                        src={`/maps/${formatMapNameForImage(map.mapName)}`}
                        alt={map.mapName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Always show team names and scores at the top */}
                    <div className="absolute top-0 left-0 right-0 px-3 py-1 text-sm font-semibold text-center text-white bg-blue-600">
                      {match.mapScores?.[index]?.winner
                        ? `${getTeamName(match.mapScores[index].winner)} Won`
                        : `${getTeamName(1)} vs ${getTeamName(2)}`}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col">
                      <div className="mb-2">
                        <h4 className="text-lg font-medium text-white">
                          {map.mapName}
                        </h4>
                        <p className="text-sm text-gray-400">{map.gameMode}</p>
                      </div>

                      {/* Always show team names with scores */}
                      <div className="mt-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-white">{getTeamName(1)}</span>
                          <span className="text-xl font-bold text-blue-500">
                            {match.mapScores?.[index]?.team1Score || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white">{getTeamName(2)}</span>
                          <span className="text-xl font-bold text-red-500">
                            {match.mapScores?.[index]?.team2Score || "0"}
                          </span>
                        </div>

                        {/* Verification status section */}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                          <div className="flex items-center">
                            {match.mapScores?.[index]?.submittedByTeam1 ? (
                              <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                            )}
                            <span>
                              {getTeamName(1)}{" "}
                              {match.mapScores?.[index]?.submittedByTeam1
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {match.mapScores?.[index]?.submittedByTeam2 ? (
                              <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                            )}
                            <span>
                              {getTeamName(2)}{" "}
                              {match.mapScores?.[index]?.submittedByTeam2
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {userTeam &&
                        match.status === "in_progress" &&
                        !match.mapScores?.[index]?.winner &&
                        ((userTeam === 1 &&
                          !match.mapScores?.[index]?.submittedByTeam1) ||
                          (userTeam === 2 &&
                            !match.mapScores?.[index]?.submittedByTeam2)) && (
                          <Button
                            className="w-full mt-3 bg-[#3b82f6] hover:bg-[#2563eb]"
                            onClick={() => handleOpenScoreDialog(index)}
                          >
                            Submit Score
                          </Button>
                        )}

                      {userTeam &&
                        match.status === "in_progress" &&
                        !match.mapScores?.[index]?.winner &&
                        ((userTeam === 1 &&
                          match.mapScores?.[index]?.submittedByTeam1) ||
                          (userTeam === 2 &&
                            match.mapScores?.[index]?.submittedByTeam2)) && (
                          <div className="mt-3 text-sm text-center text-yellow-400">
                            Waiting for the other team to verify scores
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Submission Dialog */}
        <Dialog open={scoreDialog} onOpenChange={setScoreDialog}>
          <DialogContent className="bg-[#1a2234] border-[#3b82f6] text-white">
            <DialogHeader>
              <DialogTitle>Submit Score</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the final score for{" "}
                {match?.maps[selectedMapIndex]?.mapName || "this map"}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid items-center grid-cols-3 gap-4">
                <Label htmlFor="team1Score" className="text-right">
                  {getTeamName(1)} Score
                </Label>
                <Input
                  id="team1Score"
                  type="number"
                  min="0"
                  max="6"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="col-span-2 bg-[#111827] border-[#3b82f6]"
                />
              </div>
              <div className="grid items-center grid-cols-3 gap-4">
                <Label htmlFor="team2Score" className="text-right">
                  {getTeamName(2)} Score
                </Label>
                <Input
                  id="team2Score"
                  type="number"
                  min="0"
                  max="6"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="col-span-2 bg-[#111827] border-[#3b82f6]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setScoreDialog(false)}
                className="text-gray-300 border-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() =>
                  handleSubmitScore({
                    mapIndex: selectedMapIndex,
                    team1Score: parseInt(team1Score),
                    team2Score: parseInt(team2Score),
                    submittingTeam: userTeam,
                  })
                }
                disabled={submitting}
                className="bg-[#3b82f6] hover:bg-[#2563eb]"
              >
                {submitting
                  ? "Submitting..."
                  : `Submit Score for Team ${userTeam}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Match status section at the bottom */}
        {match.status === "completed" && (
          <Card className="mt-6 bg-[#111827] border-[#1f2937]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Match Status
                  </h3>
                  <Badge className="mt-2 bg-green-600">COMPLETED</Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Winner</div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-semibold text-white">
                      {getTeamName(match.winner || 1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {match.mapScores?.filter(
                      (score) => score?.winner === match.winner
                    ).length || 0}{" "}
                    -{" "}
                    {match.mapScores?.filter(
                      (score) => score?.winner !== match.winner && score?.winner
                    ).length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
