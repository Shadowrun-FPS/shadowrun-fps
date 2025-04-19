import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { PlayerContextMenu } from "@/components/player-context-menu";

export interface TournamentTeamCardProps {
  team: any;
  label: string;
  showScore?: boolean;
  score?: number;
  matchStatus?: "upcoming" | "completed" | "in_progress";
}

export function TournamentTeamCard({
  team,
  label,
  showScore = false,
  score = 0,
  matchStatus,
}: TournamentTeamCardProps) {
  // Handle different team structures
  const teamMembers = team?.members || [];

  // Calculate total team ELO
  const teamElo = Array.isArray(teamMembers)
    ? teamMembers.reduce((total, player) => total + (player.elo || 0), 0)
    : 0;

  const isMatchCompleted = matchStatus === "completed";

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold">{team?.name || label}</h3>
          <Badge variant="outline" className="mt-1">
            Team ELO: {teamElo}
          </Badge>
        </div>
        {showScore && <div className="text-2xl font-bold">{score}</div>}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.isArray(teamMembers) && teamMembers.length > 0 ? (
          teamMembers.map((member, idx) => (
            <div
              key={member.discordId || idx}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/40"
            >
              <Avatar className="w-8 h-8">
                {member.discordProfilePicture ? (
                  <AvatarImage
                    src={member.discordProfilePicture}
                    alt={member.discordUsername}
                  />
                ) : null}
                <AvatarFallback>
                  <UserCircle className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <PlayerContextMenu player={member}>
                  <Link
                    href={`/player/stats?playerName=${encodeURIComponent(
                      member.discordUsername
                    )}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {member.discordNickname || member.discordUsername}
                  </Link>
                </PlayerContextMenu>
                <div className="text-xs text-muted-foreground">
                  ELO: {member.elo || "N/A"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No team members</div>
        )}
      </div>
    </div>
  );
}
