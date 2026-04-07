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
import { Badge } from "@/components/ui/badge";
import type { MongoTeam, TeamMember } from "@/types/mongodb";
import { cn } from "@/lib/utils";
import { useFeatureFlag } from "@/lib/use-feature-flag";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  tournamentWins?: number;
  isUserTeam?: boolean;
  teamElo?: number; // Use the original name to avoid confusion
  teamSize?: number;
}

export function TeamCard({
  _id,
  name,
  tag,
  members,
  wins = 0,
  losses = 0,
  onClick,
  description,
  userTeam,
  tournamentWins = 0,
  isUserTeam = false,
  teamElo, // Use the original name
  teamSize,
}: TeamCardProps) {
  const { data: session } = useSession();
  const scrimmageEnabled = useFeatureFlag("scrimmage");

  // Find the captain
  const captain = members.find((member) => member.role === "captain");
  const captainName = captain?.discordNickname || "Unknown";

  // Count active members
  const activeMembersCount = members.filter(
    (member) => member.role !== "substitute",
  ).length;

  // Get team sizes (default to 4 if not specified)
  const targetTeamSize = teamSize || 4;
  const userTeamSize = userTeam?.teamSize || 4;

  // Check if user's team is full
  const userTeamMemberCount =
    userTeam?.members?.filter((m: TeamMember) => m.role !== "substitute")
      .length || 0;
  const hasFullTeam = userTeamMemberCount >= userTeamSize;

  // Check if the team being viewed is full
  const targetTeamHasFullTeam = activeMembersCount >= targetTeamSize;

  // Teams must have matching sizes to challenge
  const teamSizesMatch = targetTeamSize === userTeamSize;

  const canChallenge =
    Boolean(_id) &&
    scrimmageEnabled &&
    teamSizesMatch &&
    hasFullTeam &&
    targetTeamHasFullTeam;

  const challengeTooltip = !scrimmageEnabled
    ? "Scrimmages are currently disabled."
    : !_id
      ? "This team cannot be challenged right now."
      : !teamSizesMatch
        ? `Team sizes must match. Your team is ${userTeamSize}v${userTeamSize}, but this team is ${targetTeamSize}v${targetTeamSize}.`
        : !userTeam || !hasFullTeam
          ? userTeam
            ? `Your team needs ${userTeamSize} members to challenge other teams.`
            : "Join or create a full team to challenge others."
          : !targetTeamHasFullTeam
            ? `This team needs ${targetTeamSize} members to be challenged.`
            : "Challenge this team";

  return (
    <Card
      className={cn(
        /* No scale on hover: carousel (overflow-hidden) clips scaled cards and borders */
        "h-full border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:border-primary/40 hover:shadow-xl",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-h-[3rem] line-clamp-2 break-words flex-1 text-lg font-bold sm:text-xl">
            {name}
          </CardTitle>
          <Badge
            variant="secondary"
            className="shrink-0 text-xs font-semibold sm:text-sm"
          >
            {teamElo?.toLocaleString() || "N/A"} ELO
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem] line-clamp-2">
          {description || "Top ranked competitive team"}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Captain */}
          <div className="flex items-center">
            <Shield
              className="mr-2 h-5 w-5 shrink-0 text-primary"
              aria-hidden
            />
            <div>
              <div className="font-medium">Captain</div>
              <div className="text-sm text-muted-foreground">{captainName}</div>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <div className="font-medium">Members</div>
              <div className="text-sm text-muted-foreground">
                {activeMembersCount} players
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-border/50 pt-4 text-sm">
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
        {isUserTeam ? (
          // For user's own team, show "Manage Team" if captain, otherwise "View Details"
          (() => {
            const isCaptain =
              userTeam?.captain?.discordId === session?.user?.id;
            return (
              <Button
                variant="outline"
                size="sm"
                className="h-8 col-span-2"
                asChild
              >
                <Link href={`/tournaments/teams/${_id}`}>
                  {isCaptain ? "Manage Team" : "View Details"}
                </Link>
              </Button>
            );
          })()
        ) : (
          // For other teams, show Challenge and View Details buttons
          <TooltipProvider delayDuration={300}>
            <>
              {_id ? (
                canChallenge && userTeam ? (
                  <ChallengeTeamDialog
                    team={{
                      _id,
                      name,
                      tag,
                      captain: captain || members[0],
                      members,
                      teamSize: targetTeamSize,
                    }}
                    userTeam={userTeam}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex min-w-0 w-full cursor-not-allowed">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="pointer-events-none h-8 w-full"
                          disabled
                          aria-label={challengeTooltip}
                        >
                          <Swords className="mr-2 h-4 w-4" aria-hidden />
                          Challenge
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{challengeTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex min-w-0 w-full cursor-not-allowed">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="pointer-events-none h-8 w-full"
                        disabled
                        aria-label={challengeTooltip}
                      >
                        <Swords className="mr-2 h-4 w-4" aria-hidden />
                        Challenge
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{challengeTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href={`/tournaments/teams/${_id}`}>View Details</Link>
              </Button>
            </>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
