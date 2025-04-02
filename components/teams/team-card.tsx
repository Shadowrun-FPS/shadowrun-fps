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
  scrimmageWins?: number;
  scrimmageLosses?: number;
  tournamentWins?: number;
  isUserTeam?: boolean;
  teamElo?: number; // Use the original name to avoid confusion
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
  scrimmageWins = 0,
  scrimmageLosses = 0,
  tournamentWins = 0,
  isUserTeam = false,
  teamElo, // Use the original name
}: TeamCardProps) {
  const { data: session } = useSession();

  // Find the captain
  const captain = members.find((member) => member.role === "captain");
  const captainName = captain?.discordNickname || "Unknown";

  // Count active members
  const activeMembersCount = members.filter(
    (member) => member.role !== "substitute"
  ).length;

  return (
    <Card
      className={cn(
        "transition-all hover:bg-accent",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <div className="px-3 py-1 text-sm font-medium rounded-md bg-accent/80 text-foreground">
            {teamElo?.toLocaleString() || "N/A"} ELO
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {description || "Top ranked competitive team"}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Captain */}
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">Captain</div>
              <div className="text-sm text-muted-foreground">{captainName}</div>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-muted-foreground" />
            <div>
              <div className="font-medium">Members</div>
              <div className="text-sm text-muted-foreground">
                {activeMembersCount} players
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scrimmage Record:</span>
              <span>
                {wins || 0}-{losses || 0}
              </span>
            </div>
            {tournamentWins > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tournament Wins:</span>
                <span>{tournamentWins}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 pt-2">
        {userTeam && _id && !isUserTeam ? (
          <ChallengeTeamDialog
            team={{
              _id,
              name,
              tag,
              captain: captain || members[0],
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
          <Link href={`/tournaments/teams/${_id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
