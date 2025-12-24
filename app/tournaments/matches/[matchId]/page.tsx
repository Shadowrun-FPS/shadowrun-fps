"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  UserCircle,
  X,
  CalendarIcon,
  ClockIcon,
  Shield,
  Trophy,
  Users,
  MapPin,
  Award,
  Play,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { TournamentMatch, Team } from "@/types/tournament";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TournamentMatchPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [tournamentName, setTournamentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Define hooks at the top level to avoid conditional hook errors
  const [scoreSubmitDialogOpen, setScoreSubmitDialogOpen] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [scoreSubmitLoading, setScoreSubmitLoading] = useState(false);
  const [startingMatch, setStartingMatch] = useState(false);
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [adminSettingWinner, setAdminSettingWinner] = useState(false);
  const [adminConfirmDialogOpen, setAdminConfirmDialogOpen] = useState(false);
  const [pendingWinnerTeam, setPendingWinnerTeam] = useState<number | null>(
    null
  );

  // Check which team the user belongs to with proper null checks
  const checkUserTeamMembership = useCallback(
    (match: TournamentMatch) => {
      if (!session?.user?.id) return null;

      // Check if user is in team A with null safety
      const isInTeamA =
        match.teamA?.members?.some(
          (member) => member.discordId === session.user?.id
        ) || false;

      // Check if user is in team B with null safety
      const isInTeamB =
        match.teamB?.members?.some(
          (member) => member.discordId === session.user?.id
        ) || false;

      if (isInTeamA) return "teamA";
      if (isInTeamB) return "teamB";
      return null;
    },
    [session]
  );

  // Helper for map images
  const getMapImage = (mapName: string) => {
    // Convert map name to a format that matches our image filenames
    // Also, normalize spaces & handle special case for Nerve Center (Small)
    const formattedMapName = mapName
      .toLowerCase()
      .replace(/\s+\(small\)/, "") // Remove (Small) from the name first
      .replace(/\s+/g, ""); // Remove all spaces completely

    // Return the correct path without "public" prefix
    return `/maps/map_${formattedMapName}.png`;
  };

  // Helper for status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case "upcoming":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 gap-1.5">
            <ClockIcon className="w-3 h-3" />
            UPCOMING
          </Badge>
        );
      case "live":
      case "in_progress":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 gap-1.5 animate-pulse">
            <Play className="w-3 h-3" />
            IN PROGRESS
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            COMPLETED
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 gap-1.5">
            <X className="w-3 h-3" />
            CANCELLED
          </Badge>
        );
      default:
        return <Badge>{status.toUpperCase()}</Badge>;
    }
  };

  // Function to check if previous maps have been scored
  const canSubmitMapScore = (mapIndex: number) => {
    if (!match || !match.mapScores) return false;

    // Map 0 (first map) can always be scored
    if (mapIndex === 0) return true;

    // For subsequent maps, check if previous maps have winners
    for (let i = 0; i < mapIndex; i++) {
      const previousMapScore = match.mapScores[i];
      if (!previousMapScore || previousMapScore.winner === null) {
        return false;
      }
    }

    return true;
  };

  // Function to open score submission dialog
  const openScoreSubmitDialog = (mapIndex: number) => {
    if (!match || !session?.user?.id) return;

    // Determine which team the user belongs to
    const userTeam = checkUserTeamMembership(match);
    if (!userTeam) {
      toast({
        title: "Unauthorized",
        description:
          "You must be a member of one of the teams to submit scores.",
        variant: "destructive",
      });
      return;
    }

    setCurrentMapIndex(mapIndex);
    const mapScore = match.mapScores?.[mapIndex];

    // If the user's team has already submitted, pre-fill with their submission
    // Otherwise, check if the other team has submitted and show their score
    if (
      userTeam === "teamA" &&
      mapScore?.submittedByTeamA &&
      mapScore?.teamASubmittedScore
    ) {
      setTeamAScore(mapScore.teamASubmittedScore.team1Score || 0);
      setTeamBScore(mapScore.teamASubmittedScore.team2Score || 0);
    } else if (
      userTeam === "teamB" &&
      mapScore?.submittedByTeamB &&
      mapScore?.teamBSubmittedScore
    ) {
      setTeamAScore(mapScore.teamBSubmittedScore.team1Score || 0);
      setTeamBScore(mapScore.teamBSubmittedScore.team2Score || 0);
    } else if (
      mapScore?.team1Score &&
      mapScore?.team2Score &&
      mapScore?.winner
    ) {
      // Scores are confirmed - show confirmed scores
      setTeamAScore(mapScore.team1Score || 0);
      setTeamBScore(mapScore.team2Score || 0);
    } else {
      // No submission yet - start fresh
      setTeamAScore(0);
      setTeamBScore(0);
    }
    setScoreSubmitDialogOpen(true);
  };

  // Enhanced score submission function to prevent draws
  const handleSubmitScore = async () => {
    if (!match || !session?.user?.id) return;

    // Determine which team the user belongs to
    const userTeam = checkUserTeamMembership(match);
    if (!userTeam) {
      toast({
        title: "Unauthorized",
        description:
          "You must be a member of one of the teams to submit scores.",
        variant: "destructive",
      });
      return;
    }

    // Validate scores - one team must win (no draws allowed)
    if (teamAScore === teamBScore) {
      toast({
        title: "Invalid Score",
        description:
          "Scores cannot be equal - one team must win the map (first to 6).",
        variant: "destructive",
      });
      return;
    }

    // The winning team must have exactly 6 points
    if (teamAScore !== 6 && teamBScore !== 6) {
      toast({
        title: "Invalid Score",
        description:
          "The winning team must have exactly 6 points (first to 6).",
        variant: "destructive",
      });
      return;
    }

    // Ensure the losing team has less than 6 points
    if (teamAScore === 6 && teamBScore >= 6) {
      toast({
        title: "Invalid Score",
        description: "The losing team must have less than 6 points.",
        variant: "destructive",
      });
      return;
    }

    if (teamBScore === 6 && teamAScore >= 6) {
      toast({
        title: "Invalid Score",
        description: "The losing team must have less than 6 points.",
        variant: "destructive",
      });
      return;
    }

    setScoreSubmitLoading(true);

    try {
      const response = await fetch(
        `/api/tournaments/match/${match.tournamentMatchId}/score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapIndex: currentMapIndex,
            team1Score: teamAScore,
            team2Score: teamBScore,
            submittedByTeam: userTeam, // Send which team is submitting
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Check if this is a score mismatch error
        if (errorData.error === "score_mismatch") {
          toast({
            title: "Score Mismatch",
            description:
              "Your score doesn't match your opponent's submission. Both scores have been reset. Please verify the score with your opponent and resubmit.",
            variant: "destructive",
          });
          // Reset the form and refresh match data
          setTeamAScore(0);
          setTeamBScore(0);
          await fetchMatchData(); // Refresh to get reset scores
          setScoreSubmitLoading(false);
          return;
        }

        throw new Error(errorData.error || "Failed to submit score");
      }

      const result = await response.json();

      // Get updated match data to show the latest scores
      await fetchMatchData();

      // Check if both teams have now submitted
      const currentMapScore = match.mapScores?.[currentMapIndex];
      const bothSubmitted = result.bothTeamsSubmitted;

      if (bothSubmitted) {
        toast({
          title: "Score Confirmed",
          description:
            "Both teams have submitted matching scores. The map result is confirmed.",
        });

        // Check if match is now complete (one team has 2 wins)
        const team1Wins =
          result.mapScores?.filter((s: { winner: number }) => s.winner === 1)
            .length || 0;
        const team2Wins =
          result.mapScores?.filter((s: { winner: number }) => s.winner === 2)
            .length || 0;

        if (team1Wins >= 2 || team2Wins >= 2) {
          const winningTeam =
            team1Wins >= 2 ? match.teamA?.name : match.teamB?.name;
          toast({
            title: "Match Complete!",
            description: `${winningTeam} has won the match! The bracket will be updated automatically.`,
          });
        }

        setScoreSubmitDialogOpen(false);
      } else {
        toast({
          title: "Score Submitted",
          description:
            "Your score has been submitted. Waiting for the opposing team to submit their score.",
        });
        // Keep dialog open if only one team has submitted
        // The UI will update via polling to show the other team's submission status
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      toast({
        title: "Error",
        description: "Failed to submit the score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScoreSubmitLoading(false);
    }
  };

  // Replace the getMatchIdFromPath function with this more robust version:
  const getMatchIdFromUrl = useCallback(() => {
    // Direct extraction from window.location if available
    if (typeof window !== "undefined") {
      // Get the current URL
      const url = window.location.href;

      // Extract the match ID from the URL
      const matchIdRegex = /\/matches\/([^\/]+)$/;
      const match = url.match(matchIdRegex);

      if (match && match[1] && match[1] !== "%5BmatchId%5D") {
        return match[1];
      }

      // Try another approach - split the URL by "matches/" and take the last part
      const parts = url.split("matches/");
      if (parts.length > 1 && parts[1] !== "%5BmatchId%5D") {
        return parts[1];
      }
    }

    return null;
  }, []);

  // Update fetchMatchData to remove mock data and only use database
  const fetchMatchData = useCallback(async () => {
    try {
      // Get the match ID directly from the URL
      const matchId = getMatchIdFromUrl();

      if (!matchId) {
        setError("Invalid match ID");
        setLoading(false);
        return;
      }

      // Now use the extracted ID for the API call
      const response = await fetch(`/api/tournaments/match/${matchId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch match");
      }

      const data = await response.json();

      if (!data.match) {
        setError("Match not found");
        return;
      }

      setMatch(data.match);
      setTournamentName(data.tournamentName || null);
      setTeamAId(data.match.teamA?.teamId);
      setTeamBId(data.match.teamB?.teamId);
    } catch (error) {
      console.error("Error fetching match:", error);
      setError("Failed to load match");
    } finally {
      setLoading(false);
    }
  }, [getMatchIdFromUrl]);

  // Fetch match data on mount
  useEffect(() => {
    const fetchMatch = async () => {
      setLoading(true);
      try {
        // Get the match ID directly from the URL
        const matchId = getMatchIdFromUrl();

        if (!matchId) {
          setError("Invalid match ID");
          setLoading(false);
          return;
        }

        // Now use the extracted ID for the API call
        const response = await fetch(`/api/tournaments/match/${matchId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch match");
        }

        const data = await response.json();

        if (!data.match) {
          setError("Match not found");
          return;
        }

        setMatch(data.match);
        setTeamAId(data.match.teamA?.teamId);
        setTeamBId(data.match.teamB?.teamId);
      } catch (error) {
        console.error("Error fetching match:", error);
        setError("Failed to load match");
      } finally {
        setLoading(false);
      }
    };

    // Run the fetch on mount
    fetchMatch();
  }, [getMatchIdFromUrl]);

  // Poll for match updates when match is live (to show when one team submits)
  useEffect(() => {
    if (!match || match.status === "completed" || match.status === "upcoming") {
      return;
    }

    const pollInterval = setInterval(() => {
      // Only poll if page is visible
      if (!document.hidden) {
        fetchMatchData();
      }
    }, 10000); // Poll every 10 seconds (increased from 3 seconds to reduce rate limiting)

    return () => clearInterval(pollInterval);
  }, [match, fetchMatchData]);

  // Function to open confirmation dialog
  const openAdminConfirmDialog = (teamNumber: number) => {
    setPendingWinnerTeam(teamNumber);
    setAdminConfirmDialogOpen(true);
  };

  // Add this function to handle admin winner selection
  const handleAdminSetWinner = async (teamNumber: number) => {
    if (!match) return;

    setAdminSettingWinner(true);
    setAdminConfirmDialogOpen(false);

    try {
      const response = await fetch(
        `/api/tournaments/match/${match.tournamentMatchId}/admin-set-winner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winningTeam: teamNumber,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set match winner");
      }

      const result = await response.json();

      toast({
        title: "Winner Set",
        description: `${result.winningTeam} has been set as the match winner.`,
      });

      // Refresh the match data
      await fetchMatchData();
    } catch (error) {
      console.error("Error setting match winner:", error);
      toast({
        title: "Error",
        description: "Failed to set the match winner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdminSettingWinner(false);
      setPendingWinnerTeam(null);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Handle case where match is not found
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
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Extract match details
  const roundNumber = parseInt(
    match.tournamentMatchId.split("-R")[1]?.split("-")[0] || "1"
  );
  const matchNumber = parseInt(match.tournamentMatchId.split("-M")[1] || "1");

  // Helper for team member display
  const MemberAvatar = ({
    member,
    isCaptain,
  }: {
    member: any;
    isCaptain: boolean;
  }) => (
    <div className="flex gap-3 items-center p-2 mb-3 rounded-lg transition-colors hover:bg-muted/50">
      <div className="relative w-10 h-10 shrink-0">
        {member.discordProfilePicture ? (
          <Image
            src={member.discordProfilePicture}
            alt={member.discordNickname || member.discordUsername}
            width={40}
            height={40}
            className="object-cover rounded-full border-2 border-background"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="flex justify-center items-center w-10 h-10 rounded-full border-2 bg-muted border-background">
            <UserCircle className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {isCaptain && (
          <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-4 h-4 rounded-full border-2 bg-primary border-background">
            <Award className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {member.discordNickname || member.discordUsername}
        </div>
        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          {isCaptain && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              Captain
            </Badge>
          )}
          {member.elo && (
            <span className="truncate">ELO: {member.elo.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );

  // Only render the UI when match data is available
  return (
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
            {tournamentName && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  // Extract tournament ID from matchId (format: tournamentId-R1-M1)
                  const tournamentId = match?.tournamentMatchId?.split("-R")[0];
                  if (tournamentId) {
                    router.push(`/tournaments/${tournamentId}`);
                  }
                }}
              >
                <Trophy className="mr-2 w-4 h-4" />
                <span className="hidden sm:inline">Tournament</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-3 items-center">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Tournament Match
                </h1>
                {match?.status && getStatusBadge(match.status)}
              </div>
              {tournamentName && (
                <p className="text-sm text-muted-foreground">
                  {tournamentName}
                </p>
              )}
              <div className="flex gap-4 items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>Round {roundNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  <span>Match {matchNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Only render match content if we have match data and no errors */}
        {match && !loading && !error && (
          <>
            {/* Teams Section - Modern Card Design */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:gap-6 lg:grid-cols-2">
              {/* Team A */}
              <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start pb-4 mb-4 border-b">
                    <div className="flex-1 min-w-0">
                      {match.teamA?._id ? (
                        <Link
                          href={`/tournaments/teams/${match.teamA._id}`}
                          className="flex gap-2 items-center mb-1 text-xl font-bold truncate transition-colors sm:text-2xl hover:text-primary"
                        >
                          {match.teamA.name || "Team A"}
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                        </Link>
                      ) : (
                        <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                          {match.teamA?.name || "Team A"}
                        </h2>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        {match.teamA?.tag && (
                          <Badge variant="outline" className="text-xs">
                            [{match.teamA.tag}]
                          </Badge>
                        )}
                        {match.teamA?.teamElo && (
                          <Badge variant="secondary" className="text-xs">
                            {match.teamA.teamElo.toLocaleString()} ELO
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-blue-600 shrink-0">TEAM 1</Badge>
                  </div>

                  <div className="mt-4">
                    <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                      <Users className="w-4 h-4" />
                      Team Members
                    </h3>

                    {/* Captain with null check */}
                    {match.teamA?.captain && (
                      <MemberAvatar
                        member={match.teamA.captain}
                        isCaptain={true}
                      />
                    )}

                    {/* Other members with null checks */}
                    {match.teamA?.members &&
                      match.teamA.members
                        .filter(
                          (m) => m.discordId !== match.teamA?.captain?.discordId
                        )
                        .map((member) => (
                          <MemberAvatar
                            key={member.discordId}
                            member={member}
                            isCaptain={false}
                          />
                        ))}
                  </div>
                </div>
              </Card>

              {/* Team B */}
              <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start pb-4 mb-4 border-b">
                    <div className="flex-1 min-w-0">
                      {match.teamB?._id ? (
                        <Link
                          href={`/tournaments/teams/${match.teamB._id}`}
                          className="flex gap-2 items-center mb-1 text-xl font-bold truncate transition-colors sm:text-2xl hover:text-primary"
                        >
                          {match.teamB.name || "Team B"}
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                        </Link>
                      ) : (
                        <h2 className="mb-1 text-xl font-bold truncate sm:text-2xl">
                          {match.teamB?.name || "Team B"}
                        </h2>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        {match.teamB?.tag && (
                          <Badge variant="outline" className="text-xs">
                            [{match.teamB.tag}]
                          </Badge>
                        )}
                        {match.teamB?.teamElo && (
                          <Badge variant="secondary" className="text-xs">
                            {match.teamB.teamElo.toLocaleString()} ELO
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-red-600 shrink-0">TEAM 2</Badge>
                  </div>

                  <div className="mt-4">
                    <h3 className="flex gap-2 items-center mb-3 text-sm font-semibold">
                      <Users className="w-4 h-4" />
                      Team Members
                    </h3>

                    {/* Captain with null check */}
                    {match.teamB?.captain && (
                      <MemberAvatar
                        member={match.teamB.captain}
                        isCaptain={true}
                      />
                    )}

                    {/* Other members with null checks */}
                    {match.teamB?.members &&
                      match.teamB.members
                        .filter(
                          (m) => m.discordId !== match.teamB?.captain?.discordId
                        )
                        .map((member) => (
                          <MemberAvatar
                            key={member.discordId}
                            member={member}
                            isCaptain={false}
                          />
                        ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Admin Controls Section - Only visible to admins */}
            {session?.user?.isAdmin && (
              <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
                <div className="p-4 sm:p-6">
                  <div className="flex gap-3 items-center mb-4">
                    <div className="p-2 rounded-md border bg-amber-500/10 border-amber-500/20">
                      <Shield className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-lg font-semibold sm:text-xl">
                      Admin Controls
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Set Match Winner
                      </h3>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            adminSettingWinner || match.status === "completed"
                          }
                          onClick={() => openAdminConfirmDialog(1)}
                          className="flex-1 sm:flex-initial"
                        >
                          <Trophy className="mr-2 w-4 h-4 text-amber-500" />
                          {match.teamA?.name || "Team A"} Wins
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            adminSettingWinner || match.status === "completed"
                          }
                          onClick={() => openAdminConfirmDialog(2)}
                          className="flex-1 sm:flex-initial"
                        >
                          <Trophy className="mr-2 w-4 h-4 text-amber-500" />
                          {match.teamB?.name || "Team B"} Wins
                        </Button>
                      </div>
                    </div>

                    {match.status === "completed" && (
                      <div className="sm:ml-auto">
                        <Badge
                          variant="outline"
                          className="text-green-500 border-green-500/50 bg-green-500/10"
                        >
                          <CheckCircle className="mr-1 w-3 h-3" />
                          Match Completed
                        </Badge>
                      </div>
                    )}
                  </div>

                  {adminSettingWinner && (
                    <div className="flex items-center mt-4 text-sm text-amber-500">
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Setting match winner...
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Maps Section */}
            <div className="mb-8">
              <div className="flex gap-2 items-center mb-6">
                <div className="p-2 rounded-md border bg-primary/10 border-primary/20">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">Match Maps</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {match.maps &&
                  match.maps.map((map, index) => {
                    const mapScore = match.mapScores?.[index];
                    const winner = mapScore?.winner;
                    const isTeamAWinner = winner === 1;
                    const isTeamBWinner = winner === 2;

                    return (
                      <Card
                        key={index}
                        className={cn(
                          "overflow-hidden transition-all hover:shadow-lg",
                          isTeamAWinner && "border-blue-500/50 bg-blue-500/5",
                          isTeamBWinner && "border-red-500/50 bg-red-500/5"
                        )}
                      >
                        {/* Map Image */}
                        <div className="relative h-40 sm:h-48">
                          <Image
                            src={getMapImage(map.mapName)}
                            alt={map.mapName}
                            fill
                            className="object-cover"
                            loading="lazy"
                            unoptimized
                          />
                          {winner && (
                            <div className="absolute top-2 right-2">
                              <Badge
                                className={cn(
                                  "gap-1",
                                  isTeamAWinner && "bg-blue-600",
                                  isTeamBWinner && "bg-red-600"
                                )}
                              >
                                <Award className="w-3 h-3" />
                                {isTeamAWinner
                                  ? match.teamA?.name || "Team A"
                                  : match.teamB?.name || "Team B"}{" "}
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

                          {/* Scores - Only show when both teams have submitted matching scores (winner is set) */}
                          <div className="p-3 mb-4 rounded-lg bg-muted/50">
                            {mapScore?.winner ? (
                              <>
                                <div
                                  className={cn(
                                    "flex items-center justify-between mb-2 p-2 rounded",
                                    isTeamAWinner && "bg-blue-500/10"
                                  )}
                                >
                                  <span className="flex-1 text-sm font-medium truncate">
                                    {match.teamA?.name || "Team A"}
                                  </span>
                                  <span className="ml-2 text-2xl font-bold shrink-0">
                                    {mapScore.team1Score || 0}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded",
                                    isTeamBWinner && "bg-red-500/10"
                                  )}
                                >
                                  <span className="flex-1 text-sm font-medium truncate">
                                    {match.teamB?.name || "Team B"}
                                  </span>
                                  <span className="ml-2 text-2xl font-bold shrink-0">
                                    {mapScore.team2Score || 0}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="py-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                  {mapScore?.submittedByTeamA &&
                                  mapScore?.submittedByTeamB
                                    ? "Scores submitted - awaiting confirmation"
                                    : mapScore?.submittedByTeamA ||
                                      mapScore?.submittedByTeamB
                                    ? "Waiting for both teams to submit scores"
                                    : "No scores submitted yet"}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Verification Status - Only show checkmarks when scores are confirmed */}
                          <div className="flex justify-between mb-4 text-xs">
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded",
                                mapScore?.submittedByTeamA && mapScore?.winner
                                  ? "text-green-500 bg-green-500/10"
                                  : mapScore?.submittedByTeamA &&
                                    !mapScore?.winner
                                  ? "text-yellow-500 bg-yellow-500/10"
                                  : "text-muted-foreground bg-muted"
                              )}
                            >
                              {mapScore?.submittedByTeamA &&
                              mapScore?.winner ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : mapScore?.submittedByTeamA &&
                                !mapScore?.winner ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>
                                Team 1
                                {mapScore?.submittedByTeamA &&
                                  !mapScore?.winner &&
                                  " (Submitted)"}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded",
                                mapScore?.submittedByTeamB && mapScore?.winner
                                  ? "text-green-500 bg-green-500/10"
                                  : mapScore?.submittedByTeamB &&
                                    !mapScore?.winner
                                  ? "text-yellow-500 bg-yellow-500/10"
                                  : "text-muted-foreground bg-muted"
                              )}
                            >
                              {mapScore?.submittedByTeamB &&
                              mapScore?.winner ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : mapScore?.submittedByTeamB &&
                                !mapScore?.winner ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>
                                Team 2
                                {mapScore?.submittedByTeamB &&
                                  !mapScore?.winner &&
                                  " (Submitted)"}
                              </span>
                            </div>
                          </div>

                          {/* Submit Score Button - Only enabled if previous maps are scored, match is not completed, and this map's scores aren't confirmed */}
                          {match.status !== "completed" &&
                            (match.status === "live" ||
                              (match.status as any) === "in_progress" ||
                              match.status === "upcoming" ||
                              process.env.NODE_ENV === "development") &&
                            !mapScore?.winner && (
                              <Button
                                className="w-full h-9 text-sm"
                                onClick={() => openScoreSubmitDialog(index)}
                                disabled={!canSubmitMapScore(index)}
                                variant={
                                  canSubmitMapScore(index)
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {canSubmitMapScore(index) ? (
                                  <>
                                    {mapScore?.submittedByTeamA &&
                                    checkUserTeamMembership(match) === "teamA"
                                      ? "Resubmit Score"
                                      : mapScore?.submittedByTeamB &&
                                        checkUserTeamMembership(match) ===
                                          "teamB"
                                      ? "Resubmit Score"
                                      : "Submit Score"}
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

            {/* Admin Winner Confirmation Dialog */}
            <AlertDialog
              open={adminConfirmDialogOpen}
              onOpenChange={setAdminConfirmDialogOpen}
            >
              <AlertDialogContent className="sm:max-w-[500px] px-4 sm:px-6 py-4 sm:py-6">
                <AlertDialogHeader className="pb-4 space-y-3 border-b">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 rounded-lg border bg-amber-500/10 border-amber-500/20">
                      <Shield className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <AlertDialogTitle className="text-2xl font-bold">
                        Confirm Match Winner
                      </AlertDialogTitle>
                      <AlertDialogDescription className="mt-1">
                        Are you sure you want to set{" "}
                        <span className="font-semibold">
                          {pendingWinnerTeam === 1
                            ? match?.teamA?.name || "Team A"
                            : match?.teamB?.name || "Team B"}
                        </span>{" "}
                        as the match winner?
                        <br />
                        <span className="block mt-2 text-xs text-muted-foreground">
                          This action will mark the match as completed and
                          automatically progress the tournament bracket.
                        </span>
                      </AlertDialogDescription>
                    </div>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 pt-4 border-t sm:flex-row">
                  <AlertDialogCancel
                    onClick={() => {
                      setPendingWinnerTeam(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (pendingWinnerTeam !== null) {
                        handleAdminSetWinner(pendingWinnerTeam);
                      }
                    }}
                    disabled={adminSettingWinner}
                    className="w-full bg-amber-500 sm:w-auto hover:bg-amber-600"
                  >
                    {adminSettingWinner ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Setting Winner...
                      </>
                    ) : (
                      <>
                        <Trophy className="mr-2 w-4 h-4" />
                        Confirm Winner
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Score Submission Dialog */}
            <Dialog
              open={scoreSubmitDialogOpen}
              onOpenChange={setScoreSubmitDialogOpen}
            >
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
                          {match?.maps?.[currentMapIndex]?.mapName ||
                            "this map"}
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
                  {match?.mapScores?.[currentMapIndex]?.submittedByTeamA &&
                    match?.mapScores?.[currentMapIndex]?.submittedByTeamB &&
                    !match?.mapScores?.[currentMapIndex]?.winner && (
                      <div className="p-3 rounded-lg border bg-red-500/10 border-red-500/20">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          ⚠️ Score Mismatch Detected
                        </p>
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          The scores submitted by both teams do not match. Both
                          teams must resubmit matching scores.
                        </p>
                      </div>
                    )}
                  {((match?.mapScores?.[currentMapIndex]?.submittedByTeamA &&
                    checkUserTeamMembership(match) === "teamB" &&
                    !match?.mapScores?.[currentMapIndex]?.submittedByTeamB) ||
                    (match?.mapScores?.[currentMapIndex]?.submittedByTeamB &&
                      checkUserTeamMembership(match) === "teamA" &&
                      !match?.mapScores?.[currentMapIndex]
                        ?.submittedByTeamA)) && (
                    <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        ℹ️ The opposing team has submitted their score. Please
                        submit your score to confirm. Scores will only be
                        displayed once both teams submit matching scores.
                      </p>
                    </div>
                  )}
                  {match?.mapScores?.[currentMapIndex]?.winner && (
                    <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/20">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ Scores confirmed. Both teams submitted matching
                        scores.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="teamAScore"
                      className="text-sm font-semibold"
                    >
                      {match?.teamA?.name || "Team A"} Score
                    </Label>
                    <Input
                      id="teamAScore"
                      type="number"
                      min="0"
                      max="6"
                      value={teamAScore}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTeamAScore(parseInt(e.target.value) || 0)
                      }
                      className="h-11"
                      disabled={
                        match?.mapScores?.[currentMapIndex]?.winner !== null &&
                        match?.mapScores?.[currentMapIndex]?.winner !==
                          undefined
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="teamBScore"
                      className="text-sm font-semibold"
                    >
                      {match?.teamB?.name || "Team B"} Score
                    </Label>
                    <Input
                      id="teamBScore"
                      type="number"
                      min="0"
                      max="6"
                      value={teamBScore}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTeamBScore(parseInt(e.target.value) || 0)
                      }
                      className="h-11"
                      disabled={
                        match?.mapScores?.[currentMapIndex]?.winner !== null &&
                        match?.mapScores?.[currentMapIndex]?.winner !==
                          undefined
                      }
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setScoreSubmitDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitScore}
                    disabled={
                      scoreSubmitLoading ||
                      (match?.mapScores?.[currentMapIndex]?.winner !== null &&
                        match?.mapScores?.[currentMapIndex]?.winner !==
                          undefined)
                    }
                    className="w-full sm:w-auto"
                  >
                    {scoreSubmitLoading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : match?.mapScores?.[currentMapIndex]?.winner ? (
                      "Score Confirmed"
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
  );
}
