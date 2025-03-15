import { calculateTeamElo, formatEloScore } from "@/lib/elo-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define interfaces for team data structure
interface TeamMember {
  id?: string;
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string;
  elo: number;
  role?: string;
  joinedAt?: Date;
}

interface Team {
  _id?: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt?: Date;
  // Add other properties as needed
}

// Update the component to use the interface
function TeamStatsCard({ team }: { team: Team }) {
  // Extract member ELOs from your team data
  const memberElos = team.members.map((member) => member.elo);

  // Calculate team ELO for a standard 4-person team
  const teamElo = calculateTeamElo(memberElos, 4);

  return (
    <div className="...">
      <div className="flex items-center">
        <svg className="..." />
        <span className="text-2xl font-bold">{formatEloScore(teamElo)}</span>
      </div>
      {/* Rest of your component */}
    </div>
  );
}

export { TeamStatsCard };
