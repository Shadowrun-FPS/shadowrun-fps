import { Button } from "@/components/ui/button";
import type { QueueState, Player, TeamSize } from "@/components/queue-system";
import { calculateBalancedTeams } from "@/lib/team-balancer";
import { useState, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { QueuePlayerRow } from "@/components/queue-system";

interface QueueCardProps {
  tier: string;
  teamSize: TeamSize;
  queue: QueueState;
  onLeave: () => void;
  isUserQueued: boolean;
}

export default function QueueCard({
  tier,
  teamSize,
  queue,
  onLeave,
  isUserQueued,
}: QueueCardProps) {
  const { data: session } = useSession();
  const [isBanned, setIsBanned] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Get the first maxPlayers for the match
  const matchPlayers = queue.players.slice(0, queue.maxPlayers);

  // Check if user is mod or admin
  const isModOrAdmin =
    session?.user?.roles?.some((role) =>
      ["admin", "moderator", "founder"].includes(role)
    ) || false;

  const handlePlayerKicked = (playerId: string) => {
    // Refresh queue data or implement local state update
    console.log(`Player ${playerId} was kicked`);
  };

  // Calculate teams based on available players
  const { teamA, teamB } =
    matchPlayers.length >= queue.maxPlayers
      ? calculateBalancedTeams(matchPlayers, teamSize)
      : { teamA: [], teamB: [] };

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const response = await fetch("/api/user/status");
        if (response.ok) {
          const data = await response.json();
          setIsBanned(data.isBanned || false);
          console.log("Ban status check:", data.isBanned);
        }
      } catch (error) {
        console.error("Failed to fetch ban status:", error);
      }
    };

    if (session?.user) {
      checkBanStatus();
    }
  }, [session]);

  const renderTeam = (team: Player[], teamName: string, teamSize: TeamSize) => {
    // Determine how many players per team based on team size
    const playersPerTeam =
      teamSize === "1v1"
        ? 1
        : teamSize === "2v2"
        ? 2
        : teamSize === "5v5"
        ? 5
        : 4;

    return (
      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-400">{teamName}</h4>
        <div className="space-y-2">
          {team.map((player) => (
            <div
              key={player.id}
              className="queue-player-row"
              onClick={(e) => e.stopPropagation()}
            >
              <QueuePlayerRow
                player={player}
                queueId={`${teamSize}-${tier}`}
                isModOrAdmin={!!isModOrAdmin}
                onKick={handlePlayerKicked}
              />
            </div>
          ))}
          {team.length < playersPerTeam &&
            Array.from({ length: playersPerTeam - team.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 opacity-50">
                <span className="text-lg">👤</span>
                <span className="text-sm">Waiting...</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="block w-full"
        data-no-context-menu-propagation="true"
      >
        <div className="h-full bg-[#111827] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">
                {teamSize} {tier.charAt(0).toUpperCase() + tier.slice(1)} Queue
              </h3>
              <p className="text-sm text-gray-400">ranked</p>
            </div>
            <div>
              <p className="text-sm font-medium">Team Size: {teamSize}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {renderTeam(teamA, "Team 1", teamSize)}
            {renderTeam(teamB, "Team 2", teamSize)}
          </div>

          <div className="flex gap-4">
            {!isUserQueued && !isBanned ? (
              <Button
                variant="secondary"
                className="flex-1 bg-[#1e293b] hover:bg-[#2d3c52] text-white"
                disabled={queue.players.length < queue.maxPlayers}
              >
                View Match
              </Button>
            ) : isBanned ? (
              <Button variant="destructive" disabled className="flex-1">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Account Banned
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="flex-1 bg-[#1e293b] hover:bg-[#2d3c52] text-white"
                onClick={onLeave}
              >
                Leave
              </Button>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            navigator.clipboard.writeText(`${teamSize}-${tier}`);
          }}
        >
          Copy Queue ID
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
