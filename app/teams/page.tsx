"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trophy, Star, ChevronRight, Settings } from "lucide-react";

interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  role: "captain" | "member" | "substitute";
  elo: { [key: string]: number };
  joinedAt: Date;
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  captain: TeamMember;
  members: TeamMember[];
  wins: number;
  losses: number;
  calculatedElo: number;
  winRatio: number;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }

        const data = await response.json();

        // Ensure data is an array
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        setTeams(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load teams"
        );
        toast({
          title: "Error",
          description: "Failed to load teams",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [toast]);

  const isTeamCaptain = (team: Team) => {
    return session?.user?.id === team.captain.discordId;
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">No teams found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card
            key={team._id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    {team.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{team.tag}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">
                    #{teams.indexOf(team) + 1}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{team.calculatedElo}</p>
                  <p className="text-xs text-muted-foreground">Team ELO</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {team.wins}/{team.losses}
                  </p>
                  <p className="text-xs text-muted-foreground">W/L</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {(team.winRatio * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-medium">
                    {team.captain.discordNickname ||
                      team.captain.discordUsername}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <p className="text-sm text-muted-foreground">
                    {team.members.length} Members
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = `/teams/${team._id}`)}
              >
                View Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
