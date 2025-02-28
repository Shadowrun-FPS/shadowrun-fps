import type { Player, TeamSize } from "@/components/queue-system"

interface TeamBalance {
  teamA: Player[]
  teamB: Player[]
  eloDifference: number
}

/**
 * Calculates the most balanced teams possible from a pool of players
 * by minimizing the ELO difference between teams
 */
export function calculateBalancedTeams(players: Player[], teamSize: TeamSize): { teamA: Player[]; teamB: Player[] } {
  // Determine how many players per team based on team size
  const playersPerTeam = teamSize === "1v1" ? 1 : teamSize === "2v2" ? 2 : teamSize === "5v5" ? 5 : 4

  const totalPlayers = playersPerTeam * 2

  if (players.length < totalPlayers) {
    // If we don't have enough players, return empty teams
    return { teamA: [], teamB: [] }
  }

  // Get the required number of players for a match
  const matchPlayers = players.slice(0, totalPlayers)

  // Generate all possible team combinations
  const combinations = generateTeamCombinations(matchPlayers, playersPerTeam)

  // Find the most balanced team combination
  let bestBalance: TeamBalance = {
    teamA: [],
    teamB: [],
    eloDifference: Number.MAX_SAFE_INTEGER,
  }

  for (const combination of combinations) {
    const teamA = combination
    const teamB = matchPlayers.filter((p) => !teamA.includes(p))

    const teamAElo = teamA.reduce((sum, player) => sum + player.elo, 0)
    const teamBElo = teamB.reduce((sum, player) => sum + player.elo, 0)

    const eloDifference = Math.abs(teamAElo - teamBElo)

    if (eloDifference < bestBalance.eloDifference) {
      bestBalance = {
        teamA,
        teamB,
        eloDifference,
      }
    }
  }

  return {
    teamA: bestBalance.teamA,
    teamB: bestBalance.teamB,
  }
}

/**
 * Generates all possible combinations of N players from a pool of players
 */
function generateTeamCombinations(players: Player[], teamSize: number): Player[][] {
  const result: Player[][] = []

  // Helper function to generate combinations
  function backtrack(start: number, currentCombination: Player[]) {
    if (currentCombination.length === teamSize) {
      result.push([...currentCombination])
      return
    }

    for (let i = start; i < players.length; i++) {
      currentCombination.push(players[i])
      backtrack(i + 1, currentCombination)
      currentCombination.pop()
    }
  }

  backtrack(0, [])
  return result
}

