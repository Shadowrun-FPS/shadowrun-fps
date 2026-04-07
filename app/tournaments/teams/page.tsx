import { fetchTeamsDirectoryData } from "@/lib/teams-directory-data";
import { TeamsDirectoryWithGate } from "@/components/teams/teams-directory-with-gate";

export default async function TeamsPage() {
  const { teams, tournaments } = await fetchTeamsDirectoryData();

  return (
    <TeamsDirectoryWithGate initialTeams={teams} initialTournaments={tournaments} />
  );
}
