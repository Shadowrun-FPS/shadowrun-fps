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

  // Find the captain
  const captain = members.find((member) => member.role === "captain");
  const captainName = captain?.discordNickname || "Unknown";

  // Count active members
  const activeMembersCount = members.filter(
    (member) => member.role !== "substitute"
  ).length;

  // Get team sizes (default to 4 if not specified)
  const targetTeamSize = teamSize || 4;
  const userTeamSize = userTeam?.teamSize || 4;

  // Check if user's team is full
  const userTeamMemberCount = userTeam?.members?.filter(
    (m: TeamMember) => m.role !== "substitute"
  ).length || 0;
  const hasFullTeam = userTeamMemberCount >= userTeamSize;

  // Check if the team being viewed is full
  const targetTeamHasFullTeam = activeMembersCount >= targetTeamSize;

  // Teams must have matching sizes to challenge
  const teamSizesMatch = targetTeamSize === userTeamSize;

  // Determine tooltip text based on team membership status (simplified)
  const challengeTooltip = !teamSizesMatch
    ? `Team sizes must match. Your team is ${userTeamSize}v${userTeamSize}, but this team is ${targetTeamSize}v${targetTeamSize}.`
    : !hasFullTeam
    ? `Your team needs ${userTeamSize} members to challenge other teams`
    : !targetTeamHasFullTeam
    ? `This team needs ${targetTeamSize} members to be challenged`
    : "Challenge this team";

  // Determine if challenge button should be disabled
  const disableChallenge = !teamSizesMatch || !hasFullTeam || !targetTeamHasFullTeam;

  return (
    <Card
      className={cn(
        "transition-all hover:bg-accent",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-h-[3rem] line-clamp-2 break-words flex-1">
            {name}
          </CardTitle>
          <div className="px-3 py-1 text-sm font-medium rounded-md bg-accent/80 text-foreground shrink-0">
            {teamElo?.toLocaleString() || "N/A"} ELO
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem] line-clamp-2">
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
        {isUserTeam ? (
          // For user's own team, show "Manage Team" if captain, otherwise "View Details"
          (() => {
            const isCaptain = userTeam?.captain?.discordId === session?.user?.id;
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
          <>
            {userTeam && _id ? (
              teamSizesMatch && hasFullTeam && targetTeamHasFullTeam ? (
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={true}
                        aria-label={challengeTooltip}
                      >
                        <Swords className="w-4 h-4 mr-2" />
                        Challenge
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{challengeTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        // Only open challenge dialog if both teams have full rosters and matching sizes
                        if (teamSizesMatch && hasFullTeam && targetTeamHasFullTeam) {
                          // Existing code to open challenge dialog
                        }
                      }}
                      disabled={disableChallenge}
                      aria-label={challengeTooltip}
                    >
                      <Swords className="w-4 h-4 mr-2" />
                      Challenge
                    </Button>
                  </TooltipTrigger>
                  {disableChallenge && (
                    <TooltipContent>
                      <p>{challengeTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link href={`/tournaments/teams/${_id}`}>View Details</Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
