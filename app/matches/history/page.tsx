"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Match {
  _id: string;
  team1Score: number;
  team2Score: number;
  team1Players: string[];
  team2Players: string[];
  status: "pending" | "confirmed" | "disputed";
  createdAt: Date;
  playerStats: Record<
    string,
    { kills: number; deaths: number; assists: number }
  >;
}

export default function MatchHistoryPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!session?.user) return;

    const fetchMatches = async () => {
      const response = await fetch(`/api/matches?playerId=${session.user.id}`);
      const data = await response.json();
      setMatches(data);
    };

    fetchMatches();
  }, [session]);

  const getMatchResult = (match: Match) => {
    if (!session?.user) return "Unknown";
    const isTeam1 = match.team1Players.includes(session.user.id);
    const team1Won = match.team1Score > match.team2Score;
    return isTeam1
      ? team1Won
        ? "Victory"
        : "Defeat"
      : team1Won
      ? "Defeat"
      : "Victory";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-500";
      case "disputed":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return match.status === "pending";
    if (activeTab === "disputed") return match.status === "disputed";
    return match.status === "confirmed";
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold">Match History</h1>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Matches</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="disputed">Disputed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <Card key={match._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {match.team1Score} - {match.team2Score}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(match.createdAt), "PPp")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          getMatchResult(match) === "Victory"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {getMatchResult(match)}
                      </p>
                      <p className={`text-sm ${getStatusColor(match.status)}`}>
                        {match.status.charAt(0).toUpperCase() +
                          match.status.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Team 1
                      </p>
                      {match.team1Players.map((player) => (
                        <div
                          key={player}
                          className="flex justify-between text-sm"
                        >
                          <span>{player}</span>
                          <span>
                            {match.playerStats[player]?.kills}/
                            {match.playerStats[player]?.deaths}/
                            {match.playerStats[player]?.assists}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Team 2
                      </p>
                      {match.team2Players.map((player) => (
                        <div
                          key={player}
                          className="flex justify-between text-sm"
                        >
                          <span>{player}</span>
                          <span>
                            {match.playerStats[player]?.kills}/
                            {match.playerStats[player]?.deaths}/
                            {match.playerStats[player]?.assists}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {match.status === "pending" && (
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {}}>
                        Dispute
                      </Button>
                      <Button onClick={() => {}}>Confirm</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
