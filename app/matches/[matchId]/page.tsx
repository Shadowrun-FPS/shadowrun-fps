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
import {
  AlertCircle,
  CheckCircle2,
  Trophy,
  Clock,
  ArrowLeft,
  CheckCircle,
  Play,
  X,
  Users,
  MapPin,
  Award,
  CalendarIcon,
  ClockIcon,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { PlayerContextMenu } from "@/components/moderation/player-context-menu";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { TeamCard } from "@/components/match/team-card";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { cn } from "@/lib/utils";

interface MatchPlayer {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  discordProfilePicture?: string;
  elo: number;
  initialElo: number;
  finalElo: number;
  eloChange: number;
}

interface MatchMap {
  mapName: string;
  gameMode: string;
  selected: boolean;
  mapImage?: string;
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
  scoresVerified?: boolean;
  scoresMismatch?: boolean;
  team1SubmittedByTeam1Score?: number | null;
  team2SubmittedByTeam1Score?: number | null;
  team1SubmittedByTeam2Score?: number | null;
  team2SubmittedByTeam2Score?: number | null;
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

// First, add an interface for the score discrepancy state
interface ScoreDiscrepancy {
  mapIndex: number;
  message: string;
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
  // Remove "(Small)" or "(small)" variant suffix - these maps use the same image as their regular variant
  let cleanedName = mapName.replace(/\s*\([Ss]mall\)\s*/gi, "");
  
  // Convert map names to lowercase, remove spaces, and add the map_ prefix with .png extension
  return `map_${cleanedName.toLowerCase().replace(/\s+/g, "")}.png`;
};

function EloChange({ initial, final }: { initial: number; final: number }) {
  // Guard against undefined/null values
  if (!initial || !final) return null;

  const change = final - initial;
  const isPositive = change > 0;

  return (
    <span
      className={`ml-2 text-sm font-mono ${
        isPositive ? "text-green-500" : "text-red-500"
      }`}
    >
      ({isPositive ? "+" : ""}
      {change})
    </span>
  );
}

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
  const [scoreDiscrepancy, setScoreDiscrepancy] =
    useState<ScoreDiscrepancy | null>(null);

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

  // Update the fetchMatchData function - use deduplication
  const fetchMatchData = useCallback(async () => {
    try {
      // ✅ Use deduplication to prevent duplicate calls
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<any>(`/api/matches/${params.matchId}`, {
        ttl: 10000, // Cache for 10 seconds (match data changes frequently)
      });
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
  const handleSubmitScore = async (formData: ScoreFormValues) => {
    try {
      setSubmitting(true);
      const response: Response = await fetch(
        `/api/matches/${params.matchId}/score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.resetStatus) {
          // Handle score mismatch - show error and reset form
          setScoreDiscrepancy({
            mapIndex: responseData.mapIndex,
            message: responseData.error,
          });
          // Reset the form for this map
          setScoreDialog(false);
          setTeam1Score("");
          setTeam2Score("");
        } else {
          toast({
            title: "Error",
            description: responseData.error || "Failed to submit score",
            variant: "destructive",
          });
        }
        return;
      }

      // Success handling
      setScoreDiscrepancy(null);
      toast({
        title: "Success",
        description: "Score submitted successfully",
      });
      setMatch(responseData.match);
      setScoreDialog(false);
      setTeam1Score("");
      setTeam2Score("");
    } catch (error) {
      console.error("Error submitting score:", error);
      toast({
        title: "Error",
        description: "Failed to submit score",
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
        // ✅ Use deduplication
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<any>(`/api/matches/${params.matchId}`, {
          ttl: 10000, // Cache for 10 seconds
        });
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
            // ✅ Refresh match data using deduplication
            const { deduplicatedFetch } = await import("@/lib/request-deduplication");
            const refreshedMatch = await deduplicatedFetch<any>(
              `/api/matches/${params.matchId}`,
              { ttl: 10000 }
            );
            setMatch(refreshedMatch);
          }
        } catch (error) {
          console.error("Failed to update match status:", error);
        }
      }
    };

    updateMatchStatus();
  }, [match, userTeam, params.matchId]);

  // Update the socket connection (with graceful error handling)
  useEffect(() => {
    if (!session?.user) return;

    let socket: any;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 2; // Reduced attempts
    let shouldReconnect = true;

    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          {
            path: "/api/socketio",
            reconnection: shouldReconnect,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 5000,
            timeout: 5000, // Reduced timeout
            transports: ["polling", "websocket"],
            autoConnect: true,
          }
        );

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
          reconnectAttempts = 0;
          socket.emit("join-match", params.matchId);
        });

        socket.on("connect_error", (error: any) => {
          reconnectAttempts++;
          console.warn("Socket connection error:", error.message);
          
          // Disable reconnection after max attempts or if server returns 501
          if (reconnectAttempts >= maxReconnectAttempts || error.message?.includes("501")) {
            shouldReconnect = false;
            socket.disconnect();
            console.log("Socket.IO not available, disabling real-time updates");
          }
        });

        socket.on("disconnect", (reason: string) => {
          // Don't reconnect if server is not implemented
          if (reason === "io server disconnect" || reason === "transport close") {
            shouldReconnect = false;
            console.log("Socket.IO server unavailable, using polling instead");
          }
        });

        socket.on("match:update", (updatedMatch: any) => {
          if (updatedMatch.matchId === params.matchId) {
            setMatch(updatedMatch);
          }
        });
      } catch (error) {
        console.warn("Socket.IO not available, continuing without real-time updates:", error);
        // Silently fail - the page will work without real-time updates
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [params.matchId, session?.user]);

  // Add this helper function here, inside the component
  const canSubmitMapScore = (mapIndex: number) => {
    if (!match || !match.mapScores) return mapIndex === 0;

    // First map can always be scored
    if (mapIndex === 0) return true;

    // For subsequent maps, check if previous maps have verified scores
    for (let i = 0; i < mapIndex; i++) {
      const previousMapScore = match.mapScores[i];
      if (!previousMapScore || !previousMapScore.scoresVerified) {
        // Check if both teams have submitted scores (alternative to verified)
        if (
          !previousMapScore?.submittedByTeam1 ||
          !previousMapScore?.submittedByTeam2
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Helper for status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            COMPLETED
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 gap-1.5 animate-pulse">
            <Play className="w-3 h-3" />
            IN PROGRESS
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 gap-1.5">
            <ClockIcon className="w-3 h-3" />
            DRAFT
          </Badge>
        );
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Match not found</h1>
          <p className="mt-2">
            The match you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button asChild className="mt-4">
            <Link href="/matches">Back to Matches</Link>
          </Button>
        </div>
      </div>
    );
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
    <FeatureGate feature="matches">
      <main className="min-h-screen bg-background">
        <div className="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex gap-3 items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Match Details
                  </h1>
                  {getStatusBadge(match.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {match.eloTier} Queue • {match.teamSize}v{match.teamSize} • {match.type}
                </p>
                <div className="flex gap-4 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {format(new Date(match.createdAt), "MMM d, yyyy, h:mm a")}
                    </span>
                  </div>
                  {match.completedAt && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {format(
                          new Date(match.completedAt),
                          "MMM d, yyyy, h:mm a"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Only render match content if we have match data and no errors */}
          {match && !loading && (
            <>
              {/* Teams Section - Modern Card Design */}
              <div className="grid grid-cols-1 gap-4 mb-6 sm:gap-6 lg:grid-cols-2">
                {/* Team 1 */}
                <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start pb-4 mb-4 border-b">
                      <div className="flex-1 min-w-0">
                        <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                          {getTeamName(1)}
                        </h2>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {team1Elo.toLocaleString()} ELO
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 shrink-0">TEAM 1</Badge>
                    </div>

                    <div className="mt-4">
                      <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                        <Users className="w-4 h-4" />
                        Team Members
                      </h3>

                      {team1.map((player) => (
                        <div
                          key={player.discordId}
                          className="flex gap-3 items-center p-2 mb-3 rounded-lg transition-colors hover:bg-muted/50"
                        >
                          <div className="relative w-10 h-10 shrink-0">
                            {player.discordProfilePicture ? (
                              <Image
                                src={player.discordProfilePicture}
                                alt={player.discordNickname || player.discordUsername}
                                width={40}
                                height={40}
                                className="object-cover rounded-full border-2 border-background"
                                unoptimized
                              />
                            ) : (
                              <div className="flex justify-center items-center w-10 h-10 rounded-full border-2 bg-muted border-background">
                                <UserCircle className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {player.discordNickname || player.discordUsername}
                            </div>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                              {player.elo && (
                                <span className="truncate">
                                  ELO: {player.elo.toLocaleString()}
                                </span>
                              )}
                              {match.status === "completed" && (
                                <EloChange
                                  initial={player.initialElo}
                                  final={player.finalElo}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Team 2 */}
                <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start pb-4 mb-4 border-b">
                      <div className="flex-1 min-w-0">
                        <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                          {getTeamName(2)}
                        </h2>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {team2Elo.toLocaleString()} ELO
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-red-600 shrink-0">TEAM 2</Badge>
                    </div>

                    <div className="mt-4">
                      <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                        <Users className="w-4 h-4" />
                        Team Members
                      </h3>

                      {team2.map((player) => (
                        <div
                          key={player.discordId}
                          className="flex gap-3 items-center p-2 mb-3 rounded-lg transition-colors hover:bg-muted/50"
                        >
                          <div className="relative w-10 h-10 shrink-0">
                            {player.discordProfilePicture ? (
                              <Image
                                src={player.discordProfilePicture}
                                alt={player.discordNickname || player.discordUsername}
                                width={40}
                                height={40}
                                className="object-cover rounded-full border-2 border-background"
                                unoptimized
                              />
                            ) : (
                              <div className="flex justify-center items-center w-10 h-10 rounded-full border-2 bg-muted border-background">
                                <UserCircle className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {player.discordNickname || player.discordUsername}
                            </div>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                              {player.elo && (
                                <span className="truncate">
                                  ELO: {player.elo.toLocaleString()}
                                </span>
                              )}
                              {match.status === "completed" && (
                                <EloChange
                                  initial={player.initialElo}
                                  final={player.finalElo}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Maps Section */}
              <div className="mb-8">
                <div className="flex gap-2 items-center mb-6">
                  <div className="p-2 rounded-md border bg-primary/10 border-primary/20">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Match Maps</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {match.maps.map((map, index) => {
                // Only hide third map if it wasn't played (match ended 2-0)
                const team1Wins =
                  match.mapScores?.filter((s) => s.winner === 1).length || 0;
                const team2Wins =
                  match.mapScores?.filter((s) => s.winner === 2).length || 0;

                if (
                  index === 2 &&
                  !match.mapScores?.[index]?.winner &&
                  (team1Wins === 2 || team2Wins === 2)
                ) {
                  return null;
                }

                // Update to use fixed team names instead of dynamic ones
                const team1Name = "Team 1";
                const team2Name = "Team 2";

                const mapScore = match.mapScores?.[index];
                const winner = mapScore?.winner;
                const isTeam1Winner = winner === 1;
                const isTeam2Winner = winner === 2;

                return (
                  <Card
                    key={index}
                    className={cn(
                      "overflow-hidden transition-all hover:shadow-lg",
                      isTeam1Winner && "border-blue-500/50 bg-blue-500/5",
                      isTeam2Winner && "border-red-500/50 bg-red-500/5"
                    )}
                  >
                    {/* Map Image */}
                    <div className="relative h-40 sm:h-48">
                      <Image
                        src={
                          map.mapImage
                            ? map.mapImage
                            : `/maps/${formatMapNameForImage(map.mapName)}`
                        }
                        alt={map.mapName}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        loading={index === 0 ? undefined : "lazy"}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                        unoptimized
                      />
                      {winner && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            className={cn(
                              "gap-1",
                              isTeam1Winner && "bg-blue-600",
                              isTeam2Winner && "bg-red-600"
                            )}
                          >
                            <Award className="w-3 h-3" />
                            {isTeam1Winner
                              ? getTeamName(1)
                              : getTeamName(2)}{" "}
                            Won
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Map Info */}
                    <div className="p-4 sm:p-5">
                      <div className="mb-4">
                        <h3 className="mb-1 text-lg font-bold sm:text-xl">
                          {map.mapName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {map.gameMode}
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="p-3 mb-4 rounded-lg bg-muted/50">
                        {mapScore?.scoresVerified || winner ? (
                          <>
                            <div
                              className={cn(
                                "flex items-center justify-between mb-2 p-2 rounded",
                                isTeam1Winner && "bg-blue-500/10"
                              )}
                            >
                              <span className="flex-1 text-sm font-medium truncate">
                                {getTeamName(1)}
                              </span>
                              <span className="ml-2 text-2xl font-bold shrink-0">
                                {mapScore?.team1Score || 0}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center justify-between p-2 rounded",
                                isTeam2Winner && "bg-red-500/10"
                              )}
                            >
                              <span className="flex-1 text-sm font-medium truncate">
                                {getTeamName(2)}
                              </span>
                              <span className="ml-2 text-2xl font-bold shrink-0">
                                {mapScore?.team2Score || 0}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              {mapScore?.submittedByTeam1 || mapScore?.submittedByTeam2
                                ? "Waiting for verification"
                                : "No scores yet"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Verification Status */}
                      <div className="flex justify-between mb-4 text-xs">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded",
                            mapScore?.submittedByTeam1 && mapScore?.scoresVerified
                              ? "text-green-500 bg-green-500/10"
                              : mapScore?.submittedByTeam1 && !mapScore?.scoresVerified
                              ? "text-yellow-500 bg-yellow-500/10"
                              : "text-muted-foreground bg-muted"
                          )}
                        >
                          {mapScore?.submittedByTeam1 && mapScore?.scoresVerified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : mapScore?.submittedByTeam1 && !mapScore?.scoresVerified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Team 1
                            {mapScore?.submittedByTeam1 && !mapScore?.scoresVerified && " (Submitted)"}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded",
                            mapScore?.submittedByTeam2 && mapScore?.scoresVerified
                              ? "text-green-500 bg-green-500/10"
                              : mapScore?.submittedByTeam2 && !mapScore?.scoresVerified
                              ? "text-yellow-500 bg-yellow-500/10"
                              : "text-muted-foreground bg-muted"
                          )}
                        >
                          {mapScore?.submittedByTeam2 && mapScore?.scoresVerified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : mapScore?.submittedByTeam2 && !mapScore?.scoresVerified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Team 2
                            {mapScore?.submittedByTeam2 && !mapScore?.scoresVerified && " (Submitted)"}
                          </span>
                        </div>
                      </div>

                      {/* Submit Score Button */}
                      {userTeam &&
                        !match.mapScores?.[index]?.winner &&
                        !match.mapScores?.[index]?.[
                          `submittedByTeam${userTeam}`
                        ] &&
                        match.status !== "completed" && (
                          <Button
                            className="w-full h-9 text-sm"
                            onClick={() => handleOpenScoreDialog(index)}
                            disabled={!canSubmitMapScore(index)}
                            variant={
                              canSubmitMapScore(index) ? "default" : "outline"
                            }
                          >
                            {canSubmitMapScore(index) ? (
                              <>
                                Submit Score
                                <ChevronRight className="ml-2 w-4 h-4" />
                              </>
                            ) : (
                              "Score Previous Maps First"
                            )}
                          </Button>
                        )}
                    </div>
                  </Card>
                );
                })}
                </div>
              </div>

              {/* Score Submission Dialog */}
              <Dialog open={scoreDialog} onOpenChange={setScoreDialog}>
                <DialogContent className="sm:max-w-[500px] p-6">
                  <DialogHeader className="pb-4 space-y-3 border-b">
                    <div className="flex gap-3 items-center">
                      <div className="p-2 rounded-lg border bg-primary/10 border-primary/20">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-2xl font-bold">
                          Submit Map Score
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                          Enter the final score for{" "}
                          <span className="font-semibold">
                            {match?.maps[selectedMapIndex]?.mapName || "this map"}
                          </span>
                          <br />
                          <span className="block mt-1 text-xs text-muted-foreground">
                            First to 6 wins. Both teams must submit matching
                            scores.
                          </span>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="team1Score"
                        className="text-sm font-semibold"
                      >
                        {getTeamName(1)} Score
                      </Label>
                      <Input
                        id="team1Score"
                        type="number"
                        min="0"
                        max="6"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="team2Score"
                        className="text-sm font-semibold"
                      >
                        {getTeamName(2)} Score
                      </Label>
                      <Input
                        id="team2Score"
                        type="number"
                        min="0"
                        max="6"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setScoreDialog(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleSubmitScore({
                          mapIndex: selectedMapIndex,
                          team1Score: parseInt(team1Score),
                          team2Score: parseInt(team2Score),
                          submittingTeam: userTeam,
                        })
                      }
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Score
                          <ChevronRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </main>
    </FeatureGate>
  );
}
