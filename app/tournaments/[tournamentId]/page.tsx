"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { TournamentBracket } from "@/components/tournament/bracket";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/navbar";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const socket = io(process.env.NEXT_PUBLIC_APP_URL!);

interface Round {
  matches: Array<{
    team1: string;
    team2: string;
    winner?: string;
    score1: number;
    score2: number;
  }>;
}

interface Tournament {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  prizePool: string | number;
  teams: Array<{
    teamId: string;
    name: string;
    tag: string;
  }>;
  matches?: Array<{
    roundIndex: number;
    matchIndex: number;
    team1: {
      id: string;
      name: string;
      score: number;
    };
    team2: {
      id: string;
      name: string;
      score: number;
    };
    winner?: string;
  }>;
  bracket?: {
    rounds: Round[];
  };
}

interface TournamentParams {
  tournamentId: string;
}

export default function TournamentPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTournament = async () => {
      if (!params?.tournamentId) return;

      try {
        const response = await fetch(`/api/tournaments/${params.tournamentId}`);
        const data = await response.json();
        setTournament(data);
      } catch (error) {
        console.error("Failed to fetch tournament:", error);
      }
    };

    fetchTournament();
  }, [params?.tournamentId]);

  useEffect(() => {
    if (!params?.tournamentId) return;

    // Join tournament room
    socket.emit("join-tournament", params.tournamentId);

    // Listen for tournament updates
    socket.on("tournament-update", (updatedTournament) => {
      setTournament(updatedTournament);
      toast({
        title: "Tournament Updated",
        description: "The bracket has been updated with new results.",
      });
    });

    return () => {
      socket.off("tournament-update");
      socket.emit("leave-tournament", params.tournamentId);
    };
  }, [params?.tournamentId, toast]);

  const handleMatchUpdate = async (
    roundIndex: number,
    matchIndex: number,
    score1: number,
    score2: number
  ) => {
    if (!params?.tournamentId) return;

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/matches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundIndex, matchIndex, score1, score2 }),
        }
      );

      if (!response.ok) throw new Error("Failed to update match");

      const updatedTournament = await response.json();
      setTournament(updatedTournament);

      // Emit update to all clients
      socket.emit("tournament-update", {
        tournamentId: params.tournamentId,
        tournament: updatedTournament,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match results",
        variant: "destructive",
      });
    }
  };

  if (!tournament) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container px-4 py-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <p className="mt-2 text-muted-foreground">{tournament.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium">{tournament.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Date</span>
                  <span className="font-medium">
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Prize Pool</span>
                  <span className="font-medium">{tournament.prizePool}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teams</span>
                  <span className="font-medium">
                    {tournament.teams?.length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bracket */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <TournamentBracket
                rounds={tournament.bracket?.rounds || []}
                onMatchClick={(roundIndex, matchIndex) => {
                  // Implement match update dialog here
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
