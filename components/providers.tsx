"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

// Types
export type Player = {
  id: string
  name: string
  email?: string
}

export type Team = {
  id: string
  name: string
  members: Player[]
  ranking?: number
  wins: number
  losses: number
}

export type Tournament = {
  id: string
  name: string
  date: Date
  format: "Round Robin" | "Single Elimination" | "Double Elimination"
  bracket: "Open" | "Closed"
  eloRange: string
  teamSize: number
  maxTeams: number
  teams: Team[]
  status: "upcoming" | "in-progress" | "completed"
}

export type Scrimmage = {
  id: string
  challenger: Team
  challenged: Team
  status: "pending" | "accepted" | "declined" | "completed"
  date?: Date
  result?: {
    winnerTeamId: string
    score: string
  }
}

export type Invitation = {
  id: string
  teamId: string
  playerId: string
  status: "pending" | "accepted" | "declined"
}

// Context type
type AppContextType = {
  currentUser: Player | null
  teams: Team[]
  tournaments: Tournament[]
  scrimmages: Scrimmage[]
  invitations: Invitation[]
  addTeam: (team: Omit<Team, "id" | "wins" | "losses">) => void
  addTournament: (tournament: Omit<Tournament, "id" | "teams" | "status">) => void
  addScrimmage: (scrimmage: Omit<Scrimmage, "id" | "status">) => void
  addInvitation: (invitation: Omit<Invitation, "id" | "status">) => void
  updateInvitation: (id: string, status: "accepted" | "declined") => void
  updateScrimmage: (
    id: string,
    status: "accepted" | "declined" | "completed",
    result?: { winnerTeamId: string; score: string },
  ) => void
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Sample data
const sampleUser: Player = {
  id: "user1",
  name: "Current User",
  email: "user@example.com",
}

const samplePlayers: Player[] = [
  { id: "p1", name: "Alex Johnson" },
  { id: "p2", name: "Sam Smith" },
  { id: "p3", name: "Jordan Lee" },
  { id: "p4", name: "Casey Morgan" },
  { id: "p5", name: "Taylor Swift" },
  { id: "p6", name: "Jamie Wilson" },
  { id: "p7", name: "Riley Cooper" },
  { id: "p8", name: "Quinn Davis" },
]

const sampleTeams: Team[] = [
  {
    id: "team1",
    name: "Alpha Squad",
    members: [sampleUser, samplePlayers[0], samplePlayers[1], samplePlayers[2]],
    ranking: 1,
    wins: 12,
    losses: 2,
  },
  {
    id: "team2",
    name: "Beta Bombers",
    members: [samplePlayers[3], samplePlayers[4], samplePlayers[5], samplePlayers[6]],
    ranking: 2,
    wins: 10,
    losses: 4,
  },
  {
    id: "team3",
    name: "Gamma Gladiators",
    members: [samplePlayers[7], samplePlayers[0], samplePlayers[1], samplePlayers[2]],
    ranking: 3,
    wins: 8,
    losses: 6,
  },
]

const sampleTournaments: Tournament[] = [
  {
    id: "t1",
    name: "Summer Championship",
    date: new Date(2025, 5, 15),
    format: "Round Robin",
    bracket: "Open",
    eloRange: "Everyone (0-3000)",
    teamSize: 4,
    maxTeams: 8,
    teams: [sampleTeams[0], sampleTeams[1]],
    status: "upcoming",
  },
]

// Provider component
export function Providers({ children }: { children: React.ReactNode }) {
  const [currentUser] = useState<Player>(sampleUser)
  const [teams, setTeams] = useState<Team[]>(sampleTeams)
  const [tournaments, setTournaments] = useState<Tournament[]>(sampleTournaments)
  const [scrimmages, setScrimmages] = useState<Scrimmage[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])

  const addTeam = (team: Omit<Team, "id" | "wins" | "losses">) => {
    const newTeam = {
      ...team,
      id: `team${teams.length + 1}`,
      wins: 0,
      losses: 0,
    }
    setTeams([...teams, newTeam])
  }

  const addTournament = (tournament: Omit<Tournament, "id" | "teams" | "status">) => {
    const newTournament = {
      ...tournament,
      id: `t${tournaments.length + 1}`,
      teams: [],
      status: "upcoming" as const,
    }
    setTournaments([...tournaments, newTournament])
  }

  const addScrimmage = (scrimmage: Omit<Scrimmage, "id" | "status">) => {
    const newScrimmage = {
      ...scrimmage,
      id: `s${scrimmages.length + 1}`,
      status: "pending" as const,
    }
    setScrimmages([...scrimmages, newScrimmage])
  }

  const addInvitation = (invitation: Omit<Invitation, "id" | "status">) => {
    const newInvitation = {
      ...invitation,
      id: `i${invitations.length + 1}`,
      status: "pending" as const,
    }
    setInvitations([...invitations, newInvitation])
  }

  const updateInvitation = (id: string, status: "accepted" | "declined") => {
    setInvitations(invitations.map((inv) => (inv.id === id ? { ...inv, status } : inv)))
  }

  const updateScrimmage = (
    id: string,
    status: "accepted" | "declined" | "completed",
    result?: { winnerTeamId: string; score: string },
  ) => {
    setScrimmages(scrimmages.map((scrim) => (scrim.id === id ? { ...scrim, status, result } : scrim)))
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        teams,
        tournaments,
        scrimmages,
        invitations,
        addTeam,
        addTournament,
        addScrimmage,
        addInvitation,
        updateInvitation,
        updateScrimmage,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within a Providers component")
  }
  return context
}

