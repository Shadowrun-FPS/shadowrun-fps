"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Swords } from "lucide-react";
import type { MongoTeam, TeamMember } from "@/types/mongodb";
import { cn } from "@/lib/utils";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";

interface TeamCardProps {
  _id?: string;
  name: string;
  tag: string;
  members: TeamMember[];
  wins?: number;
  losses?: number;
  onClick?: () => void;
  description?: string;
  userTeam?: any;
}

export function TeamCard({
  _id,
  name,
  tag,
  members,
  wins = 0,
  losses = 0,
  onClick,
  description = "",
  userTeam,
}: TeamCardProps) {
  const { data: session } = useSession();
  const isCaptain = session?.user?.id === members[0]?.discordId;

  // Calculate team ELO based on top 4 active players
  const teamElo = members
    .filter((member) => member.role !== "substitute") // Exclude substitutes
    .map((member) => Number(member.elo?.["4v4"]) || 1500) // Convert to number, fallback to 1500
    .sort((a, b) => b - a) // Sort in descending order
    .slice(0, 4) // Take top 4 active players
    .reduce((sum, elo) => sum + elo, 0); // Sum them up

  const averageElo = Math.round(teamElo / 4);
  const captainName =
    members[0]?.discordNickname ||
    members[0]?.discordUsername ||
    "Stock Captain";
  const activeMembersCount = members.filter(
    (m) => m.role !== "substitute"
  ).length;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{name}</CardTitle>
            <p className="text-sm text-muted-foreground">[{tag}]</p>
          </div>
          <div className="px-3 py-1 text-sm font-medium rounded-md bg-accent/80 text-foreground">
            {averageElo} ELO
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {description || "Top ranked competitive team"}
        </p>
      </CardHeader>

      <CardContent className="flex-grow pb-2">
        <div className="flex flex-col space-y-4">
          {/* Captain */}
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">Captain</div>
              <div className="text-sm text-muted-foreground">{captainName}</div>
            </div>
          </div>

          {/* Members - explicitly positioned below captain */}
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">Members</div>
              <div className="text-sm text-muted-foreground">
                {activeMembersCount} players
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 pt-2">
        {userTeam && _id ? (
          <ChallengeTeamDialog
            team={{
              _id,
              name,
              tag,
              captain: members[0],
              members,
            }}
            userTeam={userTeam}
          />
        ) : (
          <Button size="sm" variant="outline" className="h-8" disabled>
            <Swords className="w-5 h-5 mr-2" />
            Challenge
          </Button>
        )}

        <Button variant="outline" size="sm" className="h-8" asChild>
          <Link href={`/tournaments/teams/${tag}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
