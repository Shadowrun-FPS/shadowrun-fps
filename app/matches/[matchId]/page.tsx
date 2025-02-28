"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ReadyCheck } from "@/components/match/ready-check";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMatchStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface Match {
  _id: string;
  status: string;
  type: string;
  gameType: string;
  eloTier: string;
  teamSize: string;
  createdBy: string;
  date: string;
  readyPlayers: Record<string, boolean>;
  scores?: {
    team1: number;
    team2: number;
  };
  team1: {
    players: Array<{
      discordId: string;
      name: string;
      avatar: string;
    }>;
  };
  team2: {
    players: Array<{
      discordId: string;
      name: string;
      avatar: string;
    }>;
  };
  players: Array<{
    discordId: string;
    discordNickname: string;
    team: 1 | 2;
    stats?: {
      kills: number;
      deaths: number;
      assists: number;
    };
  }>;
  maps: Array<{
    name: string;
    teamAScore: number;
    teamBScore: number;
    reported: boolean;
  }>;
}

interface MatchPlayer {
  discordId: string;
  discordNickname: string;
  elo: number;
  team: 1 | 2;
  stats?: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

interface Player {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  elo: number;
}

interface MatchParams {
  matchId: string;
}

function balanceTeams(players: MatchPlayer[]): MatchPlayer[] {
  // Sort players by ELO
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);
  const balancedPlayers = [...sortedPlayers];

  // Assign teams using snake draft pattern (1,2,2,1,1,2,2,1)
  const teamSize = players.length / 2;
  for (let i = 0; i < players.length; i++) {
    const snakePosition = i < teamSize * 2 ? i : players.length - 1 - i;
    balancedPlayers[i].team = snakePosition % 2 === 0 ? 1 : 2;
  }

  return balancedPlayers;
}

export default function MatchPage() {
  const { data: session } = useSession();
  const params = useParams();
  const { matches, updateMapScore } = useMatchStore();
  const { toast } = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState<{
    [key: string]: { teamA: number; teamB: number };
  }>({});

  // Move mockMatch inside useEffect or use useMemo
  const mockMatch = useMemo(
    () => ({
      id: "a5f0aa32-4e03-4fa8-afa8-c00b7b99f786",
      status: "queue",
      type: "ranked",
      eloTier: "medium",
      teamSize: "4",
      createdBy: "grimz",
      date: new Date().toISOString(),
      teams: {
        teamA: [
          { id: "1", name: "BumJamas", avatar: "👨‍🚀" },
          { id: "2", name: "Niddlez", avatar: "🧙‍♂️" },
          { id: "3", name: "Skeebum", avatar: "🦹‍♂️" },
          { id: "4", name: "Sinful Hollowz", avatar: "🧝‍♂️" },
        ],
        teamB: [
          { id: "5", name: "VertigoSR", avatar: "🧙‍♀️" },
          { id: "6", name: "ManaMyxtery", avatar: "🦹‍♀️" },
          { id: "7", name: "Shadowrun Girl", avatar: "🧝‍♀️" },
          { id: "8", name: "TrooperSuper12", avatar: "👩‍🚀" },
        ],
      },
      maps: [
        { name: "Lobby", teamAScore: 3, teamBScore: 4, reported: false },
        { name: "Nerve Center", teamAScore: 4, teamBScore: 4, reported: false },
        {
          name: "Power Station",
          teamAScore: 0,
          teamBScore: 0,
          reported: false,
        },
      ],
    }),
    []
  );

  useEffect(() => {
    const fetchMatch = async () => {
      if (!params?.matchId) return;

      try {
        const response = await fetch(`/api/matches/${params.matchId}`);
        const data = await response.json();
        setMatch(data);
      } catch (error) {
        console.error("Failed to fetch match:", error);
      }
    };

    fetchMatch();
  }, [params?.matchId]);

  if (!match || !session?.user) return null;

  const isPlayerInMatch = [...match.team1.players, ...match.team2.players].some(
    (p) => p.discordId === session.user.id
  );

  if (!isPlayerInMatch) return <div>You are not part of this match</div>;

  const team1 = match.players.filter((p) => p.team === 1);
  const team2 = match.players.filter((p) => p.team === 2);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container px-4 py-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {match.gameType} {match.eloTier} Match
          </h1>
          <p className="mt-2 text-muted-foreground">
            Status: {match.status.replace("_", " ").toUpperCase()}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team1.map((player) => (
                  <div
                    key={player.discordId}
                    className="flex items-center justify-between"
                  >
                    <span>{player.discordNickname}</span>
                    {match.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {match.readyPlayers[player.discordId] ? (
                          <span className="text-green-500">Ready</span>
                        ) : (
                          <span className="text-yellow-500">Not Ready</span>
                        )}
                        {player.discordId === session.user.id && (
                          <ReadyCheck
                            matchId={match._id}
                            playerId={player.discordId}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team2.map((player) => (
                  <div
                    key={player.discordId}
                    className="flex items-center justify-between"
                  >
                    <span>{player.discordNickname}</span>
                    {match.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {match.readyPlayers[player.discordId] ? (
                          <span className="text-green-500">Ready</span>
                        ) : (
                          <span className="text-yellow-500">Not Ready</span>
                        )}
                        {player.discordId === session.user.id && (
                          <ReadyCheck
                            matchId={match._id}
                            playerId={player.discordId}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {match.maps && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {match.maps.map((map, index: number) => (
                    <div
                      key={index}
                      className="p-4 text-center rounded-lg bg-muted/50"
                    >
                      <p className="font-medium">{map.name}</p>
                      {match.status === "completed" && match.scores && (
                        <p className="mt-2 text-sm">
                          {index === 0
                            ? `${match.scores.team1} - ${match.scores.team2}`
                            : "Not Played"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
