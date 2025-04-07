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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { TournamentMatch, Team } from "@/types/tournament";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        return <Badge className="bg-blue-600">UPCOMING</Badge>;
      case "live":
        // Handle live status
        return <Badge className="bg-yellow-600">IN PROGRESS</Badge>;
      case "in_progress":
        // Use separate case for type safety
        return <Badge className="bg-yellow-600">IN PROGRESS</Badge>;
      case "completed":
        return <Badge className="bg-green-600">COMPLETED</Badge>;
      case "cancelled":
        return <Badge className="bg-red-600">CANCELLED</Badge>;
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
    setCurrentMapIndex(mapIndex);
    // Pre-fill existing scores if available
    if (match?.mapScores?.[mapIndex]) {
      setTeamAScore(match.mapScores[mapIndex].team1Score || 0);
      setTeamBScore(match.mapScores[mapIndex].team2Score || 0);
    } else {
      setTeamAScore(0);
      setTeamBScore(0);
    }
    setScoreSubmitDialogOpen(true);
  };

  // Enhanced score submission function to prevent draws
  const handleSubmitScore = async () => {
    if (!match) return;

    // Validate scores - one team must win (no draws allowed)
    if (teamAScore === teamBScore) {
      toast({
        title: "Invalid Score",
        description: "Scores cannot be equal - one team must win the map.",
        variant: "destructive",
      });
      return;
    }

    // The winning team must have exactly 6 points
    if (teamAScore !== 6 && teamBScore !== 6) {
      toast({
        title: "Invalid Score",
        description: "The winning team must have exactly 6 points.",
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

    // Existing submission logic continues...
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
            winner: teamAScore === 6 ? 1 : 2,
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
              "Your score doesn't match your opponent's submission. Please verify the score with your opponent.",
            variant: "destructive",
          });
          // Reset the form but keep the dialog open
          setTeamAScore(0);
          setTeamBScore(0);
          setScoreSubmitLoading(false);
          return;
        }

        throw new Error(errorData.error || "Failed to submit score");
      }

      // Get updated match data
      await fetchMatchData();

      toast({
        title: "Score Submitted",
        description: "The map score has been successfully submitted.",
      });

      // Check if match is now complete (one team has 2 wins)
      const updatedMatch = await response.json();
      const team1Wins =
        updatedMatch.mapScores?.filter(
          (s: { winner: number }) => s.winner === 1
        ).length || 0;
      const team2Wins =
        updatedMatch.mapScores?.filter(
          (s: { winner: number }) => s.winner === 2
        ).length || 0;

      if (team1Wins >= 2 || team2Wins >= 2) {
        const winningTeam =
          team1Wins >= 2 ? updatedMatch.teamA?.name : updatedMatch.teamB?.name;
        toast({
          title: "Match Complete!",
          description: `${winningTeam} has won the match! The bracket will be updated automatically.`,
        });
      }

      setScoreSubmitDialogOpen(false);
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
      console.log("Current URL:", url);

      // Extract the match ID from the URL
      const matchIdRegex = /\/matches\/([^\/]+)$/;
      const match = url.match(matchIdRegex);

      if (match && match[1] && match[1] !== "%5BmatchId%5D") {
        console.log("Successfully extracted match ID from URL:", match[1]);
        return match[1];
      }

      // Try another approach - split the URL by "matches/" and take the last part
      const parts = url.split("matches/");
      if (parts.length > 1 && parts[1] !== "%5BmatchId%5D") {
        console.log("Extracted match ID from split URL:", parts[1]);
        return parts[1];
      }
    }

    console.error("Could not extract match ID from URL");
    return null;
  }, []);

  // Update fetchMatchData to remove mock data and only use database
  const fetchMatchData = useCallback(async () => {
    try {
      // Get the match ID directly from the URL
      const matchId = getMatchIdFromUrl();

      if (!matchId) {
        console.error("Could not determine match ID");
        setError("Invalid match ID");
        setLoading(false);
        return;
      }

      console.log(`Fetching match with ID: ${matchId}`);

      // Now use the extracted ID for the API call
      const response = await fetch(`/api/tournaments/match/${matchId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API returned ${response.status}: ${errorText}`);
        throw new Error("Failed to fetch match");
      }

      const data = await response.json();

      if (!data.match) {
        console.error("No match found with ID:", matchId);
        setError("Match not found");
        return;
      }

      console.log(`Retrieved match:`, data.match);
      setMatch(data.match);
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
          console.error("Could not determine match ID");
          setError("Invalid match ID");
          setLoading(false);
          return;
        }

        console.log(`Fetching match with ID: ${matchId}`);

        // Now use the extracted ID for the API call
        const response = await fetch(`/api/tournaments/match/${matchId}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API returned ${response.status}: ${errorText}`);
          throw new Error("Failed to fetch match");
        }

        const data = await response.json();

        if (!data.match) {
          console.error("No match found with ID:", matchId);
          setError("Match not found");
          return;
        }

        console.log(`Retrieved match:`, data.match);
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

  // Add this function to handle admin winner selection
  const handleAdminSetWinner = async (teamNumber: number) => {
    if (!match) return;

    setAdminSettingWinner(true);

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
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Handle case where match is not found
  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
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
    <div className="flex items-center gap-3 mb-3">
      <div className="relative w-10 h-10">
        {member.discordProfilePicture ? (
          <Image
            src={member.discordProfilePicture}
            alt={member.discordNickname || member.discordUsername}
            width={40}
            height={40}
            className="object-cover rounded-full"
            unoptimized
          />
        ) : (
          <UserCircle className="w-10 h-10 text-gray-500" />
        )}
      </div>
      <div>
        <div className="font-medium">
          {member.discordNickname || member.discordUsername}
        </div>
        <div className="text-sm text-gray-400">
          {isCaptain ? "Captain" : "Member"} • ELO: {member.elo}
        </div>
      </div>
    </div>
  );

  // Only render the UI when match data is available
  return (
    <main className="container py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/tournaments")}
          aria-label="Back to Tournaments"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">Tournament Match</h1>
        {match?.status && (
          <div className="ml-4">{getStatusBadge(match.status)}</div>
        )}
      </div>

      {/* Handle loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Handle error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="mb-4 text-2xl font-bold">Match not found</h2>
          <p className="mb-8 text-gray-500">
            The match you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push("/tournaments")}>
            Back to Tournaments
          </Button>
        </div>
      )}

      {/* Only render match content if we have match data and no errors */}
      {match && !loading && !error && (
        <>
          <div className="p-6 mb-6 border rounded-lg bg-card">
            <h2 className="mb-4 text-xl font-semibold">Tournament Match</h2>
            <div className="mb-2">
              <span className="text-gray-400">Match ID:</span>{" "}
              {match.tournamentMatchId}
            </div>

            <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
              <div>
                <span className="text-gray-400">Round</span>
                <div>Round {roundNumber}</div>
              </div>
              <div>
                <span className="text-gray-400">Match</span>
                <div>Match {matchNumber}</div>
              </div>
            </div>
          </div>

          {/* Teams Section - Added optional chaining for null safety */}
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
            {/* Team A */}
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{match.teamA?.name}</h2>
                <Badge className="bg-blue-600">TEAM 1</Badge>
              </div>
              <div className="mb-4 text-sm text-gray-400">
                Tag: {match.teamA?.tag} • Team ELO: {match.teamA?.teamElo}
              </div>

              <div className="mt-4">
                <h3 className="mb-3 text-lg font-medium">Team Members</h3>

                {/* Captain with null check */}
                {match.teamA?.captain && (
                  <MemberAvatar member={match.teamA.captain} isCaptain={true} />
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

            {/* Team B */}
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{match.teamB?.name}</h2>
                <Badge className="bg-red-600">TEAM 2</Badge>
              </div>
              <div className="mb-4 text-sm font-medium text-gray-400">
                Tag: {match.teamB?.tag} • Team ELO: {match.teamB?.teamElo}
              </div>

              <div className="mt-4">
                <h3 className="mb-3 text-lg font-medium">Team Members</h3>

                {/* Captain with null check */}
                {match.teamB?.captain && (
                  <MemberAvatar member={match.teamB.captain} isCaptain={true} />
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
          </div>

          {/* Admin Controls Section - Only visible to admins */}
          {session?.user?.isAdmin && (
            <div className="p-6 mb-6 border rounded-lg bg-card border-amber-500">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 mr-2 text-amber-500" />
                <h2 className="text-xl font-semibold">Admin Controls</h2>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">
                    Set Match Winner
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        adminSettingWinner || match.status === "completed"
                      }
                      onClick={() => handleAdminSetWinner(1)}
                    >
                      <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                      {match.teamA?.name} Wins
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        adminSettingWinner || match.status === "completed"
                      }
                      onClick={() => handleAdminSetWinner(2)}
                    >
                      <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                      {match.teamB?.name} Wins
                    </Button>
                  </div>
                </div>

                {match.status === "completed" && (
                  <div className="ml-auto">
                    <Badge
                      variant="outline"
                      className="text-green-500 border-green-800 bg-green-800/20"
                    >
                      Match Completed
                    </Badge>
                  </div>
                )}
              </div>

              {adminSettingWinner && (
                <div className="flex items-center mt-4 text-sm text-amber-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting match winner...
                </div>
              )}
            </div>
          )}

          {/* Maps Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Match Maps</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {match.maps &&
                match.maps.map((map, index) => (
                  <div
                    key={index}
                    className="overflow-hidden border rounded-lg bg-card"
                  >
                    {/* Map Image */}
                    <div className="relative h-48">
                      <Image
                        src={getMapImage(map.mapName)}
                        alt={map.mapName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Map Info */}
                    <div className="p-4">
                      <h3 className="text-xl font-medium">{map.mapName}</h3>
                      <p className="text-gray-400">{map.gameMode}</p>

                      {/* Scores with null safety */}
                      <div className="mt-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span>{match.teamA?.name}</span>
                          <span className="text-2xl font-bold">
                            {match.mapScores?.[index]?.team1Score || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{match.teamB?.name}</span>
                          <span className="text-2xl font-bold">
                            {match.mapScores?.[index]?.team2Score || 0}
                          </span>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="flex justify-between mt-4">
                        <div className="flex items-center gap-1 text-sm">
                          {match.mapScores?.[index]?.submittedByTeamA ===
                          true ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span>Team 1 Verified</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {match.mapScores?.[index]?.submittedByTeamB ===
                          true ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span>Team 2 Verified</span>
                        </div>
                      </div>

                      {/* Submit Score Button - Only enabled if previous maps are scored */}
                      {(match.status === "live" ||
                        // Use type assertion to avoid TypeScript error
                        (match.status as any) === "in_progress" ||
                        process.env.NODE_ENV === "development") && (
                        <Button
                          className="w-full mt-4"
                          onClick={() => openScoreSubmitDialog(index)}
                          disabled={!canSubmitMapScore(index)}
                        >
                          {canSubmitMapScore(index)
                            ? "Submit Score"
                            : "Score Previous Maps First"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Score Submission Dialog */}
          <Dialog
            open={scoreSubmitDialogOpen}
            onOpenChange={setScoreSubmitDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Map Score</DialogTitle>
                <DialogDescription>
                  Enter the final score for{" "}
                  {match?.maps?.[currentMapIndex]?.mapName || "this map"}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamAScore">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamBScore">
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
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setScoreSubmitDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitScore}
                  disabled={scoreSubmitLoading}
                >
                  {scoreSubmitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Score"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </main>
  );
}
