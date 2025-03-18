"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  MapPin,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

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
  maps?: any[];
}

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname?: string;
  discordProfilePicture?: string;
  elo?: number;
}

function TeamCard({ team, teamNumber, title, matchStatus }: any) {
  if (!team) return null;

  return (
    <Card className="bg-[#111827] border-[#1f2937]">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Badge
            variant={teamNumber === 1 ? "default" : "destructive"}
            className="uppercase"
          >
            Team {teamNumber}
          </Badge>
        </div>

        <div className="mt-4 space-y-4">
          {team.members?.map((member: TeamMember) => (
            <div key={member.discordId} className="flex items-center gap-3">
              {member.discordProfilePicture ? (
                <Image
                  src={member.discordProfilePicture}
                  alt={member.discordUsername}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  {member.discordUsername?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div>
                <p className="text-white">
                  {member.discordNickname || member.discordUsername}
                </p>
                {member.elo && (
                  <p className="text-xs text-gray-400">ELO: {member.elo}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TournamentMatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<number | null>(null);
  const [scoreDialog, setScoreDialog] = useState(false);
  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  // Get team names
  const getTeamName = (teamNumber: number) => {
    if (teamNumber === 1 && match?.teamA) {
      return match.teamA.name;
    } else if (teamNumber === 2 && match?.teamB) {
      return match.teamB.name;
    }
    return `Team ${teamNumber}`;
  };

  // Function to handle opening the score submission dialog
  const handleOpenScoreDialog = (mapIndex: number) => {
    setSelectedMapIndex(mapIndex);
    setTeam1Score("");
    setTeam2Score("");
    setScoreDialog(true);
  };

  // Fetch the match data
  const fetchMatchData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/tournaments/matches/${params.matchId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch match: ${response.statusText}`);
      }
      const data = await response.json();
      setMatch(data);
      return data;
    } catch (error) {
      console.error("Error fetching match data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch match data",
        variant: "destructive",
      });
      throw error;
    }
  }, [params.matchId]);

  // Submit map scores
  const handleSubmitScore = async () => {
    if (!team1Score || !team2Score) {
      toast({
        title: "Error",
        description: "Please enter scores for both teams",
        variant: "destructive",
      });
      return;
    }

    const team1ScoreNum = parseInt(team1Score);
    const team2ScoreNum = parseInt(team2Score);

    if (isNaN(team1ScoreNum) || isNaN(team2ScoreNum)) {
      toast({
        title: "Error",
        description: "Scores must be numbers",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/tournaments/matches/${params.matchId}/scores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapIndex: selectedMapIndex,
            scores: {
              team1Score: team1ScoreNum,
              team2Score: team2ScoreNum,
              submittedByTeam: userTeam,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit scores");
      }

      toast({
        title: "Success",
        description: "Scores submitted successfully",
      });

      setScoreDialog(false);
      fetchMatchData();
    } catch (error) {
      console.error("Error submitting scores:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit scores",
        variant: "destructive",
      });
    }
  };

  // Check if the current user is in one of the teams
  useEffect(() => {
    if (match && session?.user?.id) {
      const discordId = session.user.id;

      // Check team A
      if (match.teamA?.members?.some((m: any) => m.discordId === discordId)) {
        setUserTeam(1);
        return;
      }

      // Check team B
      if (match.teamB?.members?.some((m: any) => m.discordId === discordId)) {
        setUserTeam(2);
        return;
      }

      setUserTeam(null);
    }
  }, [match, session]);

  // Initial data fetch
  useEffect(() => {
    if (!params.matchId) return;

    setLoading(true);
    fetchMatchData()
      .then(() => setLoading(false))
      .catch((error) => {
        console.error("Error in match fetch:", error);
        setLoading(false);
        // Create basic placeholder data for development
        if (process.env.NODE_ENV === "development") {
          setMatch({
            tournamentMatchId: params.matchId as string,
            tournamentId: "test-tournament",
            status: "upcoming",
            teamA: { name: "Team A", tag: "TA" },
            teamB: { name: "Team B", tag: "TB" },
            maps: [
              { mapName: "Sanctuary", gameMode: "Extraction" },
              { mapName: "Foundation", gameMode: "Attrition" },
              { mapName: "Exchange", gameMode: "Capture the Flag" },
            ],
            mapScores: [],
          } as any);
        }
      });
  }, [params.matchId, fetchMatchData]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Match not found</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container p-4 pt-3 mx-auto">
        <Button
          variant="outline"
          size="sm"
          className="bg-[#1e293b] text-gray-300 hover:bg-[#334155] border-[#334155]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return
        </Button>
      </div>

      <main className="container p-4 mx-auto mt-2 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-400">Tournament Match</h1>
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
                : "Upcoming"}
            </Badge>
          )}
        </div>

        <div className="relative mb-6">
          <Card className="bg-[#111827] border-[#1f2937]">
            <CardContent className="p-6">
              <h2 className="mb-2 text-xl font-semibold text-white">
                Tournament Match
              </h2>
              <p className="mb-4 text-sm text-gray-400">
                Match ID: {match.tournamentMatchId}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-gray-400 mb-1">Round</p>
                  <p className="text-white">Round {match.roundIndex + 1}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Match</p>
                  <p className="text-white">Match {match.matchIndex + 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TeamCard
            team={match.teamA}
            teamNumber={1}
            title={getTeamName(1)}
            matchStatus={match.status}
          />
          <TeamCard
            team={match.teamB}
            teamNumber={2}
            title={getTeamName(2)}
            matchStatus={match.status}
          />
        </div>

        {/* Match Results Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Match Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {match.maps &&
              match.maps.map((map, index) => (
                <Card key={index} className="bg-[#111827] border-[#1f2937]">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="mb-2">
                          <h4 className="text-lg font-medium text-white">
                            {map.mapName}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {map.gameMode}
                          </p>
                        </div>

                        {/* Score display */}
                        <div className="mt-2">
                          <div className="flex justify-between mb-2">
                            <span className="text-white">{getTeamName(1)}</span>
                            <span
                              className={`text-xl font-bold ${
                                match.mapScores?.[index]?.winner === 1
                                  ? "text-blue-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {match.mapScores?.[index]?.team1Score || "0"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white">{getTeamName(2)}</span>
                            <span
                              className={`text-xl font-bold ${
                                match.mapScores?.[index]?.winner === 2
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {match.mapScores?.[index]?.team2Score || "0"}
                            </span>
                          </div>
                        </div>

                        {/* Only show Submit Score button if user's team hasn't verified yet */}
                        {userTeam &&
                          !match.mapScores?.[index]?.winner &&
                          !match.mapScores?.[index]?.[
                            `submittedByTeam${userTeam}`
                          ] && (
                            <Button
                              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleOpenScoreDialog(index)}
                            >
                              Submit Score
                            </Button>
                          )}

                        {/* Show verification status */}
                        <div className="flex justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {match.mapScores?.[index]?.submittedByTeam1 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span>
                              Team 1{" "}
                              {match.mapScores?.[index]?.submittedByTeam1
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.mapScores?.[index]?.submittedByTeam2 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span>
                              Team 2{" "}
                              {match.mapScores?.[index]?.submittedByTeam2
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </main>

      {/* Score Submission Dialog */}
      <Dialog open={scoreDialog} onOpenChange={setScoreDialog}>
        <DialogContent className="bg-[#1e293b] text-white border-[#334155]">
          <DialogHeader>
            <DialogTitle>Submit Map Score</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm">
                  {getTeamName(1)} Score
                </label>
                <Input
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="bg-[#111827] border-[#334155] text-white"
                  type="number"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm">
                  {getTeamName(2)} Score
                </label>
                <Input
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="bg-[#111827] border-[#334155] text-white"
                  type="number"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitScore}>Submit Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
