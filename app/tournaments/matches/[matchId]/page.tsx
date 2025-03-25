"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  UserCircle,
  ChevronLeft,
  Trophy,
  CheckCircle,
  Timer,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getRankIconPath } from "@/lib/ranks";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
import { Socket } from "socket.io-client";

interface TournamentMatch {
  tournamentMatchId: string;
  tournamentId: string;
  roundIndex: number;
  matchIndex: number;
  teamA: any;
  teamB: any;
  mapScores?: any[];
  status: "upcoming" | "in_progress" | "completed";
  createdAt: string;
  maps?: Array<{
    mapName: string;
    image?: string;
    gameMode?: string;
  }>;
  winner?: "teamA" | "teamB";
  team1Score?: number;
  team2Score?: number;
  firstPick?: "teamA" | "teamB";
  tournament?: {
    name: string;
    format: string;
    _id: string;
  };
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  teamElo?: number;
  createdAt?: string;
  members?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string | null;
    discordProfilePicture: string | null;
    elo: number;
    role?: string;
  }[];
  captain?: {
    discordId: string;
    discordUsername: string;
    discordNickname: string | null;
    discordProfilePicture: string | null;
    elo: number;
  };
}

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  elo?: number;
  eloChange?: number;
  role?: string;
}

// Function to normalize map names for image paths
const normalizeMapName = (mapName: string | undefined): string => {
  if (!mapName) return "default";

  // Remove (Small) and other variants, replace spaces
  return mapName
    .toLowerCase()
    .replace(/\s+\(small\)/i, "")
    .replace(/\s+/g, "");
};

// Add team ELO calculation function
const calculateTeamElo = (members: TeamMember[] | undefined): number => {
  if (!members || !Array.isArray(members) || members.length === 0) return 0;

  return members.reduce((total, player) => {
    return total + (player.elo || 0);
  }, 0);
};

export default function TournamentMatchDetailPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [teamAScores, setTeamAScores] = useState<Record<number, string>>({});
  const [teamBScores, setTeamBScores] = useState<Record<number, string>>({});
  const [teamASubmitted, setTeamASubmitted] = useState<boolean[]>([]);
  const [teamBSubmitted, setTeamBSubmitted] = useState<boolean[]>([]);
  const [scoreDiscrepancy, setScoreDiscrepancy] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [startTournamentDialogOpen, setStartTournamentDialogOpen] =
    useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState<number | null>(null);
  const [adminControlsVisible, setAdminControlsVisible] = useState(false);

  // Mock socket for now (will be replaced by the real socket provider)
  // This avoids TypeScript errors while we complete the implementation
  const socket = {
    on: (event: string, callback: Function) => {},
    off: (event: string) => {},
    emit: (event: string, data: any) => {},
  } as unknown as Socket;

  const isAdmin =
    session?.user?.roles?.includes("admin") ||
    session?.user?.id === "238329746671271936";

  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the match data with tournament details
      const response = await fetch(`/api/tournament-match/${matchId}`);

      if (!response.ok) {
        throw new Error("Failed to load match data");
      }

      let matchData = await response.json();

      // If tournament is just an ID, fetch the full tournament
      if (
        matchData.tournamentId &&
        (!matchData.tournament || typeof matchData.tournament === "string")
      ) {
        const tournamentResponse = await fetch(
          `/api/tournament/${matchData.tournamentId}`
        );
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          matchData.tournament = {
            name: tournamentData.name,
            format: tournamentData.format,
            _id: tournamentData._id,
          };
        }
      }

      setMatch(matchData);
      setDebugInfo(JSON.stringify(matchData, null, 2));
    } catch (error) {
      console.error("Error loading match:", error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const pathParts = window.location.pathname.split("/");
        let matchId = pathParts[pathParts.length - 1];

        setDebugInfo(`Raw match ID from URL: ${matchId}`);

        if (matchId === "%5BmatchId%5D" || matchId === "[matchId]") {
          setError("Invalid match ID (parameter placeholder)");
          setLoading(false);
          return;
        }

        console.log("Attempting to fetch match with ID:", matchId);
        await loadMatch(matchId);
      } catch (error: any) {
        console.error("Error fetching match:", error);
        setError(error?.message || "Failed to load match data");
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, []);

  // Function to submit match scores to the database
  const submitMatchScores = async (
    mapIndex: number,
    teamAScore: number,
    teamBScore: number
  ) => {
    if (!match) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/tournament-match/${match.tournamentMatchId}/score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mapIndex,
            teamAScore,
            teamBScore,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit scores");
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);

      toast({
        title: "Scores submitted",
        description: `Updated scores for ${match.maps?.[mapIndex]?.mapName}`,
      });

      setSubmitDialogOpen(false);
    } catch (error) {
      console.error("Error submitting scores:", error);
      toast({
        title: "Error",
        description: "Failed to submit scores",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Function to advance a team to the next round
  const advanceTeam = async (teamId: string) => {
    if (!match?.tournamentId || !teamId) {
      toast({
        title: "Error",
        description: "Missing team or tournament information",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/tournament/${match.tournamentId}/advance-team`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.tournamentMatchId,
            winnerId: teamId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to advance team");
      }

      toast({
        title: "Team advanced",
        description: "Team has been advanced to the next round",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error advancing team:", error);
      toast({
        title: "Error",
        description: "Failed to advance team",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Add the submitScores function
  const submitScores = () => {
    if (currentMapIndex === null || !match) {
      toast({
        title: "Error",
        description: "No map selected for score submission",
        variant: "destructive",
      });
      return;
    }

    const teamAScore = parseInt(teamAScores[currentMapIndex] || "0");
    const teamBScore = parseInt(teamBScores[currentMapIndex] || "0");

    // Validate scores
    if (teamAScore > 6 || teamBScore > 6) {
      toast({
        title: "Invalid scores",
        description: "Maximum score per map is 6 rounds",
        variant: "destructive",
      });
      return;
    }

    // Don't allow both teams to have 6 rounds
    if (teamAScore === 6 && teamBScore === 6) {
      toast({
        title: "Invalid scores",
        description: "Both teams cannot have 6 rounds",
        variant: "destructive",
      });
      return;
    }

    submitMatchScores(currentMapIndex, teamAScore, teamBScore);
  };

  // Add the startTournament function
  const startTournament = async () => {
    try {
      if (!match?.tournamentId) return;

      const response = await fetch(
        `/api/tournament/${match.tournamentId}/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start tournament");
      }

      toast({
        title: "Tournament started",
        description: "All Round 1 matches are now in progress",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to start tournament",
        variant: "destructive",
      });
    }
  };

  // Function to update match status
  const updateMatchStatus = async (
    status: "upcoming" | "in_progress" | "completed"
  ) => {
    try {
      if (!match?.tournamentMatchId) return;

      const response = await fetch(
        `/api/tournament-match/${match.tournamentMatchId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update match status");
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);

      toast({
        title: "Status updated",
        description: `Match status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating match status:", error);
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    }
  };

  // Function to manually advance team
  const manuallyAdvanceTeam = () => {
    setConfirmDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Back to Tournaments</span>
        </div>
        <div className="space-y-4">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="h-24" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Link
          href="/tournaments"
          className="flex items-center mb-4 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Tournaments
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="p-8 text-center">
              <h2 className="mb-4 text-xl font-bold text-red-500">
                Error Loading Match
              </h2>
              <p className="mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container py-6">
        <Link
          href="/tournaments"
          className="flex items-center mb-4 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Tournaments
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="p-8 text-center">
              <p>No match data found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total scores
  const totalTeamAScore =
    match.mapScores?.reduce(
      (sum: number, map: any) => sum + (Number(map.teamAScore) || 0),
      0
    ) || 0;
  const totalTeamBScore =
    match.mapScores?.reduce(
      (sum: number, map: any) => sum + (Number(map.teamBScore) || 0),
      0
    ) || 0;

  function handleSubmitScore(index: number): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="container py-6">
      <Link
        href="/tournaments"
        className="flex items-center mb-4 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Return
      </Link>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : match ? (
        <>
          {/* Match Details Header */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-blue-400">
              Match Details
            </h1>

            {/* Tournament Info Card */}
            <div className=" border border-[#1f2937] rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Tournament Match</h2>
                <Badge
                  className={
                    match.status === "completed"
                      ? "bg-green-500"
                      : match.status === "in_progress"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }
                >
                  {match.status.toUpperCase()}
                </Badge>
              </div>

              <p className="mb-6 text-sm text-muted-foreground">
                Match ID: {match.tournamentMatchId}
              </p>

              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tournament</p>
                  <p>{match.tournament?.name || "Unknown"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Round</p>
                  <p>
                    Round{" "}
                    {match.roundIndex !== undefined
                      ? match.roundIndex + 1
                      : "?"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p>4v4</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Format</p>
                  <p>
                    {match.tournament?.format
                      ? match.tournament.format
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Unknown"}
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Created:{" "}
                      {match.createdAt
                        ? format(
                            new Date(match.createdAt),
                            "MMM d, yyyy, h:mm a"
                          )
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1f2937] pt-4 mt-4">
                <div className="flex items-center mb-2">
                  <Trophy className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">First Pick</span>
                </div>
                <p className="ml-6 text-sm">
                  {match.firstPick === "teamA"
                    ? `${match.teamA?.name || "Team A"}`
                    : match.firstPick === "teamB"
                    ? `${match.teamB?.name || "Team B"}`
                    : `Team ${Math.random() < 0.5 ? "1" : "2"}`}{" "}
                  picks side or server first.
                </p>
              </div>
            </div>
          </div>

          {/* Team Cards */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
            {/* Team A */}
            <div className=" border border-[#1f2937] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {match.teamA?.name || "Team 1"}
                  </h3>
                </div>
                {match.teamA?.seed !== undefined && (
                  <Badge variant="secondary">Seed: {match.teamA?.seed}</Badge>
                )}
              </div>

              <div className="space-y-2">
                {Array.isArray(match.teamA?.members) &&
                match.teamA.members.length > 0 ? (
                  match.teamA.members.map((player: TeamMember) => (
                    <div
                      key={player.discordId}
                      className="flex items-center justify-between p-2 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-[#2a3547]">
                          {player.discordProfilePicture ? (
                            <AvatarImage
                              src={player.discordProfilePicture}
                              alt={player.discordUsername}
                            />
                          ) : (
                            <AvatarFallback>
                              <UserCircle className="w-5 h-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <Link
                            href={`/player/stats?playerName=${encodeURIComponent(
                              player.discordUsername
                            )}`}
                            className="text-white hover:underline"
                          >
                            {player.discordNickname || player.discordUsername}
                            {player.role === "captain" && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Captain
                              </Badge>
                            )}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No team members</p>
                )}
              </div>
            </div>

            {/* Team B */}
            <div className=" border border-[#1f2937] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {match.teamB?.name || "Team 2"}
                  </h3>
                </div>
                {match.teamB?.seed !== undefined && (
                  <Badge variant="secondary">Seed: {match.teamB?.seed}</Badge>
                )}
              </div>

              <div className="space-y-2">
                {Array.isArray(match.teamB?.members) &&
                match.teamB.members.length > 0 ? (
                  match.teamB.members.map((player: TeamMember) => (
                    <div
                      key={player.discordId}
                      className="flex items-center justify-between p-2 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-[#2a3547]">
                          {player.discordProfilePicture ? (
                            <AvatarImage
                              src={player.discordProfilePicture}
                              alt={player.discordUsername}
                            />
                          ) : (
                            <AvatarFallback>
                              <UserCircle className="w-5 h-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <Link
                            href={`/player/stats?playerName=${encodeURIComponent(
                              player.discordUsername
                            )}`}
                            className="text-white hover:underline"
                          >
                            {player.discordNickname || player.discordUsername}
                            {player.role === "captain" && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Captain
                              </Badge>
                            )}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No team members</p>
                )}
              </div>
            </div>
          </div>

          {/* Maps Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold">Maps</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {match.maps?.map((map, index) => (
                <Card key={index} className="overflow-hidden">
                  {/* Map Winner Banner (if applicable) */}
                  {match.mapScores?.[index] && (
                    <div
                      className={`text-center py-1 text-white ${
                        Number(match.mapScores[index].teamAScore) >
                        Number(match.mapScores[index].teamBScore)
                          ? "bg-red-500"
                          : Number(match.mapScores[index].teamBScore) >
                            Number(match.mapScores[index].teamAScore)
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {Number(match.mapScores[index].teamAScore) >
                      Number(match.mapScores[index].teamBScore)
                        ? `${match.teamA?.name} Won`
                        : Number(match.mapScores[index].teamBScore) >
                          Number(match.mapScores[index].teamAScore)
                        ? `${match.teamB?.name} Won`
                        : "Tie"}
                    </div>
                  )}

                  {/* Map Image */}
                  <div className="relative h-40">
                    <Image
                      src={`/maps/map_${normalizeMapName(map.mapName)}.png`}
                      alt={map.mapName || `Map ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/default_map.png";
                      }}
                    />
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold">{map.mapName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {map.gameMode}
                      </p>
                    </div>

                    {/* Map Score (if available) */}
                    {match.mapScores?.[index] ? (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="text-lg font-bold">
                            {match.mapScores[index].teamAScore}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.teamA?.name}
                          </div>
                        </div>
                        <div className="text-center text-muted-foreground">
                          vs
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-lg font-bold">
                            {match.mapScores[index].teamBScore}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.teamB?.name}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Score Submission Button for Admins */
                      isAdmin && (
                        <Button
                          className="w-full mt-2"
                          onClick={() => handleSubmitScore(index)}
                        >
                          Submit Scores
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="p-4 mb-8 border border-blue-800 rounded-lg bg-blue-900/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-blue-400">
                  Admin Controls
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setAdminControlsVisible(!adminControlsVisible)}
                >
                  {adminControlsVisible ? "Hide Controls" : "Show Controls"}
                </Button>
              </div>

              {adminControlsVisible && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">
                        Match Status
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            match.status === "upcoming" ? "default" : "outline"
                          }
                          onClick={() => updateMatchStatus("upcoming")}
                        >
                          Upcoming
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            match.status === "in_progress"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => updateMatchStatus("in_progress")}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            match.status === "completed" ? "default" : "outline"
                          }
                          onClick={() => updateMatchStatus("completed")}
                        >
                          Completed
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-semibold">
                        Tournament Actions
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStartTournamentDialogOpen(true)}
                        >
                          Start Tournament
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => manuallyAdvanceTeam()}
                        >
                          Advance Winner
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Quick Score Entry
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {match.maps?.map((map, index) => (
                        <Card key={index} className="p-2">
                          <div className="mb-1 font-medium">{map.mapName}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="mb-1 text-xs text-muted-foreground">
                                {match.teamA?.name}
                              </p>
                              <Input
                                type="number"
                                min="0"
                                max="6"
                                value={teamAScores[index] || ""}
                                onChange={(e) =>
                                  setTeamAScores({
                                    ...teamAScores,
                                    [index]: e.target.value,
                                  })
                                }
                                className="h-8"
                              />
                            </div>
                            <div>
                              <p className="mb-1 text-xs text-muted-foreground">
                                {match.teamB?.name}
                              </p>
                              <Input
                                type="number"
                                min="0"
                                max="6"
                                value={teamBScores[index] || ""}
                                onChange={(e) =>
                                  setTeamBScores({
                                    ...teamBScores,
                                    [index]: e.target.value,
                                  })
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={() => {
                              setCurrentMapIndex(index);
                              setSubmitDialogOpen(true);
                            }}
                          >
                            Submit
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score Submission Dialog */}
          <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Map Score</DialogTitle>
              </DialogHeader>

              {currentMapIndex !== null && match?.maps?.[currentMapIndex] && (
                <div className="space-y-4">
                  <p>
                    Please enter the scores for{" "}
                    {match.maps[currentMapIndex].mapName ||
                      `Map ${currentMapIndex + 1}`}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 text-sm">
                        {match.teamA?.name || "Team A"}
                      </p>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={teamAScores[currentMapIndex] || ""}
                        onChange={(e) =>
                          setTeamAScores({
                            ...teamAScores,
                            [currentMapIndex]: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm">
                        {match.teamB?.name || "Team B"}
                      </p>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={teamBScores[currentMapIndex] || ""}
                        onChange={(e) =>
                          setTeamBScores({
                            ...teamBScores,
                            [currentMapIndex]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSubmitDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={submitScores} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="p-4 text-center">
          <p>No match data available</p>
        </div>
      )}

      {/* Confirm Advancement Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advance Team</AlertDialogTitle>
            <AlertDialogDescription>
              Which team should advance to the next round?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              onClick={() => advanceTeam(match?.teamA?._id)}
              className="flex-1"
            >
              {match?.teamA?.name || "Team A"}
            </Button>
            <Button
              onClick={() => advanceTeam(match?.teamB?._id)}
              className="flex-1"
            >
              {match?.teamB?.name || "Team B"}
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Tournament Dialog */}
      <AlertDialog
        open={startTournamentDialogOpen}
        onOpenChange={setStartTournamentDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              This will update all Round 1 matches to &quot;In Progress&quot;.
              Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startTournament}>
              Start Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Score Discrepancy Dialog */}
      <AlertDialog open={scoreDiscrepancy} onOpenChange={setScoreDiscrepancy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              Score Discrepancy
            </AlertDialogTitle>
            <AlertDialogDescription>
              The scores submitted by both teams don&apos;t match. Please
              coordinate and resubmit the correct scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setScoreDiscrepancy(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
