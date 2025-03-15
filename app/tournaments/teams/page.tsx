"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { Trophy, Users, Star, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import router from "next/router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import { toast } from "@/components/ui/use-toast";

interface Team {
  _id: string;
  name: string;
  tag: string;
  description: string;
  captain: {
    discordId: string;
    discordNickname: string;
  };
  members: {
    discordId: string;
    discordNickname: string;
    role: string;
  }[];
  teamElo: number;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");
        const data = await response.json();
        setTeams(data);

        // Find user's team with optional chaining
        const userTeam = data.find((team: Team) =>
          team.members.some((member) => member.discordId === session?.user?.id)
        );
        setMyTeam(userTeam || null);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Failed to load teams",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchTeams();
  }, [session?.user?.id]);

  const handleManageTeam = (teamId: string) => {
    router.push(`/tournaments/teams/${teamId}/manage`);
  };

  const TeamCard = ({
    team,
    isMyTeam = false,
  }: {
    team: Team;
    isMyTeam?: boolean;
  }) => (
    <Card
      key={team._id}
      className="overflow-hidden transition-colors border-l-4 hover:bg-muted/50 border-l-primary/10 hover:border-l-primary/20"
    >
      <div className="relative flex-1 p-6 overflow-hidden transition-all duration-300 rounded-t-lg shadow-md group bg-card">
        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent group-hover:opacity-100" />

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
              <span className="text-sm font-semibold text-muted-foreground">
                [{team.tag}]
              </span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-semibold">{team.teamElo}</span>
              </div>
            </div>
          </div>

          <p className="mb-6 text-muted-foreground">{team.description}</p>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-medium">Captain</span>
              </div>
              <span className="text-muted-foreground">
                {team.captain.discordNickname}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Members</span>
              </div>
              <span className="text-muted-foreground">
                {team.members.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t rounded-b-lg shadow-md bg-card">
        <div className="flex items-center justify-end gap-2">
          {!isMyTeam && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-colors hover:bg-accent"
                    disabled
                  >
                    Challenge
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Coming Soon!</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Link
            href={`/tournaments/teams/${team._id.toString()}`}
            className="inline-flex items-center justify-center"
          >
            <Button
              variant="outline"
              size="sm"
              className="transition-colors hover:bg-accent"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );

  return (
    <FeatureGate feature="teams">
      <TooltipProvider>
        <div className="min-h-screen">
          <main className="container px-4 py-8 mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Teams</h1>
              <CreateTeamForm />
            </div>

            {myTeam && (
              <>
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold">My Team</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <TeamCard team={myTeam} isMyTeam={true} />
                  </div>
                </div>
                <Separator className="my-8" />
              </>
            )}

            <div>
              <h2 className="mb-4 text-xl font-semibold">Other Teams</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(teams) ? (
                  teams
                    .filter((team) => !myTeam || team._id !== myTeam._id)
                    .map((team) => <TeamCard key={team._id} team={team} />)
                ) : (
                  <div>No teams found</div>
                )}
              </div>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </FeatureGate>
  );
}
