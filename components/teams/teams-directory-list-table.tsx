"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeTeamDialog } from "@/components/teams/challenge-team-dialog";
import type { TeamListing } from "@/types";

type TeamsDirectoryListTableProps = {
  teams: TeamListing[];
  userTeams: TeamListing[];
};

export function TeamsDirectoryListTable({ teams, userTeams }: TeamsDirectoryListTableProps) {
  const { data: session } = useSession();

  const teamsBySize = teams.reduce(
    (acc, team) => {
      const teamSize = team.teamSize || 4;
      if (!acc[teamSize]) acc[teamSize] = [];
      acc[teamSize].push(team);
      return acc;
    },
    {} as Record<number, TeamListing[]>
  );

  const sortedSizes = Object.keys(teamsBySize)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto rounded-lg border-2">
      <table className="w-full border-collapse" aria-label="All teams directory">
        <caption className="sr-only">
          Competitive teams with captain, roster size, ELO, and links to view or challenge.
        </caption>
        <thead>
          <tr className="border-b-2 border-border bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80">
            <th className="p-3 text-left text-xs font-semibold sm:p-4 sm:text-sm">Team</th>
            <th className="hidden p-3 text-left text-xs font-semibold sm:table-cell sm:p-4 sm:text-sm">
              Captain
            </th>
            <th className="p-3 text-left text-xs font-semibold sm:p-4 sm:text-sm">Members</th>
            <th className="hidden p-3 text-left text-xs font-semibold md:table-cell md:p-4 md:text-sm">
              ELO
            </th>
            <th className="p-3 text-right text-xs font-semibold sm:p-4 sm:text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedSizes.map((teamSize) => (
            <React.Fragment key={teamSize}>
              <tr className="border-b-2 border-border bg-muted/40">
                <td colSpan={5} className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {teamSize === 2
                        ? "2v2"
                        : teamSize === 3
                          ? "3v3"
                          : teamSize === 4
                            ? "4v4"
                            : teamSize === 5
                              ? "5v5"
                              : `${teamSize}v${teamSize}`}{" "}
                      ({teamSize} players)
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {teamsBySize[teamSize].length}{" "}
                      {teamsBySize[teamSize].length === 1 ? "team" : "teams"}
                    </span>
                  </div>
                </td>
              </tr>
              {teamsBySize[teamSize].map((team) => (
                <tr
                  key={team._id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="p-3 sm:p-4">
                    <div className="whitespace-nowrap text-sm font-semibold sm:text-base">
                      {team.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      [{team.tag}]
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                      {team.members.find(
                        (m) =>
                          m.role === "captain" || m.discordId === team.captain?.discordId
                      )?.discordNickname ||
                        team.captain?.discordNickname ||
                        "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                      ELO: {team.teamElo?.toLocaleString() || "N/A"}
                    </div>
                  </td>
                  <td className="hidden p-3 sm:table-cell sm:p-4">
                    <div className="text-sm">
                      {team.members.find(
                        (m) =>
                          m.role === "captain" || m.discordId === team.captain?.discordId
                      )?.discordNickname ||
                        team.captain?.discordNickname ||
                        "—"}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" aria-hidden />
                      <span className="text-sm font-medium sm:text-base">
                        {team.members?.length || 0}/{teamSize}
                      </span>
                    </div>
                  </td>
                  <td className="hidden p-3 md:table-cell md:p-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" aria-hidden />
                      <span className="text-sm font-medium sm:text-base">
                        {team.teamElo?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
                      <Button variant="outline" size="sm" asChild className="h-9 text-xs sm:h-10 sm:text-sm">
                        <Link href={`/tournaments/teams/${team.tag}`}>View</Link>
                      </Button>
                      {(() => {
                        const userTeamAsCaptain = userTeams.find(
                          (ut) =>
                            ut._id !== team._id &&
                            (ut.teamSize || 4) === teamSize &&
                            session?.user?.id === ut?.captain?.discordId
                        );
                        return userTeamAsCaptain ? (
                          <ChallengeTeamDialog
                            team={{
                              _id: team._id,
                              name: team.name,
                              tag: team.tag,
                              captain: team.captain as {
                                discordId: string;
                                discordNickname: string;
                                discordProfilePicture: string;
                              },
                              members: team.members as {
                                discordId: string;
                                discordNickname: string;
                                discordProfilePicture: string;
                                role: string;
                              }[],
                              teamSize: team.teamSize,
                            }}
                            userTeam={userTeamAsCaptain}
                            disabled={team.members.length < (team.teamSize || 4)}
                          />
                        ) : null;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
