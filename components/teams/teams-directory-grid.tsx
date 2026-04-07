"use client";

import { TeamCard } from "@/components/teams/team-card";
import type { TeamMember as MongoTeamMember } from "@/types/mongodb";
import type { TeamListing } from "@/types";

type TeamsDirectoryGridProps = {
  teams: TeamListing[];
  userTeams: TeamListing[];
};

export function TeamsDirectoryGrid({ teams, userTeams }: TeamsDirectoryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {teams.map((team) => {
        const teamSize = team.teamSize || 4;
        const matchingUserTeam = userTeams.find(
          (ut) => (ut.teamSize || 4) === teamSize && ut._id !== team._id
        );
        return (
          <TeamCard
            key={team._id}
            _id={team._id}
            name={team.name}
            tag={team.tag}
            description={team.description}
            members={team.members as MongoTeamMember[]}
            wins={team.wins || 0}
            losses={team.losses || 0}
            tournamentWins={team.tournamentWins || 0}
            userTeam={matchingUserTeam || null}
            isUserTeam={userTeams.some((ut) => ut._id === team._id)}
            teamElo={team.teamElo}
            teamSize={team.teamSize}
          />
        );
      })}
    </div>
  );
}
