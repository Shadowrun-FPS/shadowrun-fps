import type { TeamListing, TournamentListing } from "@/types";
import type { TeamsPageSort } from "@/lib/teams-page-url";

export type DirectoryFilterOptions = {
  selectedTournament: string;
  tournaments: TournamentListing[];
  selectedTeamSize: string;
  teamStatus: "all" | "full" | "open";
  searchQuery: string;
};

export function filterDirectoryTeams(
  teams: TeamListing[],
  userTeamIds: Set<string>,
  options: DirectoryFilterOptions
): TeamListing[] {
  const { selectedTournament, tournaments, selectedTeamSize, teamStatus, searchQuery } =
    options;

  return teams
    .filter((team) => !userTeamIds.has(team._id))
    .filter((team) => {
      if (selectedTournament !== "all") {
        const isRegistered =
          (team.tournaments && team.tournaments.includes(selectedTournament)) ||
          tournaments.some(
            (tournament) =>
              tournament._id === selectedTournament &&
              tournament.registeredTeams &&
              tournament.registeredTeams.some((regTeam) => {
                const regTeamId =
                  typeof regTeam === "object" && regTeam && "_id" in regTeam
                    ? (regTeam as { _id: string })._id
                    : regTeam;
                return regTeamId === team._id || regTeamId === team._id.toString();
              })
          );
        if (!isRegistered) return false;
      }

      if (selectedTeamSize !== "all") {
        const teamSize = team.teamSize || 4;
        if (teamSize !== parseInt(selectedTeamSize, 10)) return false;
      }

      if (teamStatus !== "all") {
        const teamSize = team.teamSize || 4;
        const isFull = (team.members?.length || 0) >= teamSize;
        if (teamStatus === "full" && !isFull) return false;
        if (teamStatus === "open" && isFull) return false;
      }

      if (searchQuery) {
        const lowercaseSearch = searchQuery.toLowerCase();
        return (
          (team.name && team.name.toLowerCase().includes(lowercaseSearch)) ||
          (team.tag && team.tag.toLowerCase().includes(lowercaseSearch)) ||
          (team.description &&
            team.description.toLowerCase().includes(lowercaseSearch)) ||
          (team.captain?.discordNickname &&
            team.captain.discordNickname.toLowerCase().includes(lowercaseSearch))
        );
      }

      return true;
    });
}

export function sortDirectoryTeams(
  teams: TeamListing[],
  sortBy: TeamsPageSort,
  order: "asc" | "desc"
): TeamListing[] {
  const mult = order === "asc" ? 1 : -1;
  return [...teams].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "elo") {
      comparison = (a.teamElo || 0) - (b.teamElo || 0);
    } else if (sortBy === "winRatio") {
      const aWins = Number(a.wins || 0);
      const aLosses = Number(a.losses || 0);
      const aTotal = aWins + aLosses;
      const aWinRatio = aTotal > 0 ? aWins / aTotal : 0;
      const bWins = Number(b.wins || 0);
      const bLosses = Number(b.losses || 0);
      const bTotal = bWins + bLosses;
      const bWinRatio = bTotal > 0 ? bWins / bTotal : 0;
      comparison = aWinRatio - bWinRatio;
    } else if (sortBy === "wins") {
      comparison = (a.wins || 0) - (b.wins || 0);
    } else if (sortBy === "losses") {
      comparison = (a.losses || 0) - (b.losses || 0);
    } else if (sortBy === "name") {
      comparison = (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
    }
    return mult * comparison;
  });
}
