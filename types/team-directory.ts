import type { Team } from "./index";

/** Team row as returned by `/api/teams` plus client-side tournament registration hints */
export interface TeamListing extends Team {
  tournaments?: string[];
  tournamentWins?: number;
}

/** Tournament summary for teams directory / filters */
export interface TournamentListing {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  teamSize: number;
  registrationDeadline?: string;
  status: "upcoming" | "active" | "completed";
  registeredTeams?: (string | { _id: string })[];
  maxTeams?: number;
  format?: string;
}
