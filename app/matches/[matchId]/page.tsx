"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Trophy } from "lucide-react";

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
  const params = useParams();
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

  // Determine which team the current user is on
  const userTeam = useMemo(() => {
    if (!match || !session?.user?.id) return null;

    if (match.team1.some((p) => p.discordId === session.user.id)) return 1;
    if (match.team2.some((p) => p.discordId === session.user.id)) return 2;

    return null;
  }, [match, session]);

  // Function to handle opening the score submission dialog
  const handleOpenScoreDialog = (mapIndex: number) => {
    setSelectedMapIndex(mapIndex);
    setTeam1Score("");
    setTeam2Score("");
    setScoreDialog(true);
  };

  // Function to submit scores
  const handleSubmitScore = async () => {
    if (!match || !userTeam) return;

    const team1ScoreNum = parseInt(team1Score);
    const team2ScoreNum = parseInt(team2Score);

    // Validate scores
    if (isNaN(team1ScoreNum) || isNaN(team2ScoreNum)) {
      toast({
        title: "Invalid scores",
        description: "Please enter valid numbers for both team scores",
        variant: "destructive",
      });
      return;
    }

    if (team1ScoreNum > 6 || team2ScoreNum > 6) {
      toast({
        title: "Invalid scores",
        description: "Scores cannot exceed 6 rounds",
        variant: "destructive",
      });
      return;
    }

    if (team1ScoreNum === team2ScoreNum) {
      toast({
        title: "Invalid scores",
        description: "Scores cannot be tied",
        variant: "destructive",
      });
      return;
    }

    if (team1ScoreNum < 0 || team2ScoreNum < 0) {
      toast({
        title: "Invalid scores",
        description: "Scores cannot be negative",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/matches/${match.matchId}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mapIndex: selectedMapIndex,
          team1Score: team1ScoreNum,
          team2Score: team2ScoreNum,
          submittingTeam: userTeam,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit score");
      }

      const data = await response.json();

      // Close dialog and refresh match data
      setScoreDialog(false);

      // Show success message
      toast({
        title: "Score submitted",
        description: data.message,
      });

      // Refresh match data
      const refreshResponse = await fetch(`/api/matches/${match.matchId}`);
      if (refreshResponse.ok) {
        const refreshedMatch = await refreshResponse.json();
        setMatch(refreshedMatch);
      }

      // If match is completed, redirect to queue page after a delay
      if (data.matchCompleted) {
        toast({
          title: "Match completed",
          description: `Team ${data.winner} wins the match!`,
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/matches/queues");
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit score",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
          const response = await fetch(`/api/matches/${match.matchId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "in_progress",
            }),
          });

          if (response.ok) {
            // Refresh match data
            const refreshResponse = await fetch(
              `/api/matches/${match.matchId}`
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
  }, [match, userTeam]);

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

  const isCurrentUserInMatch =
    session?.user &&
    [...team1, ...team2].some((p) => p.discordId === session.user.id);

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

                    <div className="p-4 bg-[#1f2937] rounded-lg">
                      <h4 className="mb-4 text-lg font-semibold text-white">
                        Map Score
                      </h4>

                      <div className="flex items-center justify-center mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Team 1</p>
                          <p className="text-3xl font-bold text-white">6</p>
                        </div>
                        <div className="mx-4 text-sm text-gray-400">VS</div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Team 2</p>
                          <p className="text-3xl font-bold text-white">3</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-2 text-sm text-gray-400">
                            Scored By
                          </p>
                          <div className="p-2 bg-[#111827] rounded-lg">
                            <p className="text-sm text-gray-300">Team 1</p>
                            <p className="font-medium text-white">BumJamas</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm text-gray-400">
                            Scored By
                          </p>
                          <div className="p-2 bg-[#111827] rounded-lg">
                            <p className="text-sm text-gray-300">Team 2</p>
                            <p className="font-medium text-white">VertigoSR</p>
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

                    {match.mapScores?.[index]?.winner && (
                      <div
                        className={`absolute top-2 left-2 px-3 py-1 text-sm font-medium text-white rounded-full ${
                          match.mapScores[index].winner === 1
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      >
                        {match.mapScores[index].winner === 1
                          ? `${
                              match.team1[0]?.discordNickname?.split(" ")[0] ||
                              "Team 1"
                            }&apos;s Devils Won`
                          : `${
                              match.team2[0]?.discordNickname?.split(" ")[0] ||
                              "Team 2"
                            }&apos;s Devils Won`}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-2">
                      <h4 className="font-medium text-white">{map.mapName}</h4>
                      <p className="text-sm text-gray-400">{map.gameMode}</p>
                    </div>

                    <div className="mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-gray-400">
                            {match.team1[0]?.discordNickname?.split(" ")[0] ||
                              "Team 1"}
                            &apos;s Devils
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {match.mapScores?.[index]?.team1Score || "0"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            {match.team2[0]?.discordNickname?.split(" ")[0] ||
                              "Team 2"}
                            &apos;s Devils
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {match.mapScores?.[index]?.team2Score || "0"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                        <div className="flex items-center">
                          {match.mapScores?.[index]?.submittedByTeam1 ? (
                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                          )}
                          <span>
                            Team A{" "}
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
                            Team B{" "}
                            {match.mapScores?.[index]?.submittedByTeam2
                              ? "Verified"
                              : "Pending"}
                          </span>
                        </div>
                      </div>

                      {userTeam && match.status === "in_progress" && (
                        <Button
                          className="w-full mt-3 bg-[#3b82f6] hover:bg-[#2563eb]"
                          onClick={() => handleOpenScoreDialog(index)}
                        >
                          Submit Score
                        </Button>
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
          <DialogContent className="bg-[#1f2937] text-white border-[#3b82f6]">
            <DialogHeader>
              <DialogTitle>Submit Map Score</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid items-center grid-cols-3 gap-4">
                <Label htmlFor="team1Score" className="text-right">
                  Team 1 Score
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
                  Team 2 Score
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
                onClick={handleSubmitScore}
                disabled={submitting}
                className="bg-[#3b82f6] hover:bg-[#2563eb]"
              >
                {submitting ? "Submitting..." : "Submit Score"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add a match status section at the bottom */}
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
                  <p className="text-sm text-gray-400">Winner</p>
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    <p className="text-lg font-semibold text-white">
                      {match.winner === 1
                        ? `${
                            match.team1[0]?.discordNickname?.split(" ")[0] ||
                            "Team 1"
                          }&apos;s Devils`
                        : `${
                            match.team2[0]?.discordNickname?.split(" ")[0] ||
                            "Team 2"
                          }&apos;s Devils`}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-white">
                    {match.winner === 1
                      ? `2 - ${
                          match.mapScores?.filter((m) => m.winner === 2)
                            .length || 0
                        }`
                      : `${
                          match.mapScores?.filter((m) => m.winner === 1)
                            .length || 0
                        } - 2`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
