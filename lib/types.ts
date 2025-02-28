export type EloTier = "low" | "medium" | "high"
export type TeamSize = "1v1" | "2v2" | "4v4" | "5v5"

export interface Player {
  id: string
  name: string
  elo: number
  avatar: string
}

export interface QueueState {
  tier: EloTier
  teamSize: TeamSize
  players: Player[]
  status: "waiting" | "ready"
  maxPlayers: number
}

