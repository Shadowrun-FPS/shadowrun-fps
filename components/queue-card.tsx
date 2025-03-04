import { Button } from "@/components/ui/button"
import type { QueueState, Player, TeamSize } from "@/components/queue-system"
import { calculateBalancedTeams } from "@/lib/team-balancer"

interface QueueCardProps {
  tier: string
  teamSize: TeamSize
  queue: QueueState
  onLeave: () => void
  isUserQueued: boolean
}

export default function QueueCard({ tier, teamSize, queue, onLeave, isUserQueued }: QueueCardProps) {
  // Get the first maxPlayers for the match
  const matchPlayers = queue.players.slice(0, queue.maxPlayers)

  // Calculate teams based on available players
  const { teamA, teamB } =
    matchPlayers.length >= queue.maxPlayers ? calculateBalancedTeams(matchPlayers, teamSize) : { teamA: [], teamB: [] }

  const renderTeam = (team: Player[], teamName: string, teamSize: TeamSize) => {
    // Determine how many players per team based on team size
    const playersPerTeam = teamSize === "1v1" ? 1 : teamSize === "2v2" ? 2 : teamSize === "5v5" ? 5 : 4

    return (
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">{teamName}</h4>
        <div className="space-y-2">
          {team.map((player) => (
            <div key={player.id} className="flex items-center gap-2">
              <span className="text-lg">{player.avatar}</span>
              <span className="text-sm">{player.name}</span>
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
    )
  }

  return (
    <div className="h-full bg-[#111827] rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
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
        <Button
          variant={isUserQueued ? "destructive" : "secondary"}
          className={isUserQueued ? "flex-1" : "flex-1 bg-[#1e293b] hover:bg-[#2d3c52] text-white"}
          onClick={onLeave}
        >
          {isUserQueued ? "Leave" : "Join"}
        </Button>
        <Button
          variant="secondary"
          className="flex-1 bg-[#1e293b] hover:bg-[#2d3c52] text-white"
          disabled={queue.players.length < queue.maxPlayers}
        >
          View Match
        </Button>
      </div>
    </div>
  )
}

