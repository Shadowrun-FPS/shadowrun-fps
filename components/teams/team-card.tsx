"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MongoTeam, TeamMember } from "@/types/mongodb";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  name: string;
  tag: string;
  members: TeamMember[];
  wins?: number;
  losses?: number;
  onClick?: () => void;
}

export function TeamCard({
  name,
  tag,
  members,
  wins = 0,
  losses = 0,
  onClick,
}: TeamCardProps) {
  const { data: session } = useSession();
  const isCaptain = session?.user?.id === members[0].discordId;

  // Calculate team ELO based on top 4 active players
  const teamElo = members
    .filter((member) => member.role !== "substitute") // Exclude substitutes
    .map((member) => Number(member.elo?.["4v4"]) || 1500) // Convert to number, fallback to 1500
    .sort((a, b) => b - a) // Sort in descending order
    .slice(0, 4) // Take top 4 active players
    .reduce((sum, elo) => sum + elo, 0); // Sum them up

  const averageElo = Math.round(teamElo / 4);
  const winRatio =
    wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <Card
      className={cn(
        "transition-all hover:bg-accent cursor-pointer",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {isCaptain ? (
            <Button asChild>
              <Link href={`/tournaments/teams/${tag}`}>Manage Team</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/tournaments/teams/${tag}`}>View Details</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Captain: {members[0].discordNickname || members[0].discordUsername}
          </p>
          <p className="text-sm text-muted-foreground">
            Team ELO: {teamElo.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Average ELO: {averageElo}
          </p>
          <p className="text-sm text-muted-foreground">
            Win Ratio: {winRatio}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
