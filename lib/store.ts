"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Player,
  TeamSize as QueueTeamSize,
} from "@/components/queue-system";

export type MatchStatus =
  | "Queue"
  | "Ready-Check"
  | "In-Progress"
  | "Complete"
  | "Canceled";
export type EloTier = "low" | "medium" | "high";
export type TeamSize = QueueTeamSize;
export type Winner = "Lineage" | "RNA Corp" | "Pending";

export interface MapResult {
  name: string;
  teamAScore: number;
  teamBScore: number;
  reported: boolean;
  teamAReported?: boolean;
  teamBReported?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  eloTier: EloTier;
  teamSize: TeamSize;
  winner: Winner;
  date: string;
  teams?: {
    teamA: Player[];
    teamB: Player[];
  };
  maps?: MapResult[];
}

interface MatchStore {
  matches: Match[];
  addMatch: (match: Match) => void;
  updateMatch: (id: string, match: Partial<Match>) => void;
  updateMapScore: (
    matchId: string,
    mapIndex: number,
    teamAScore: number,
    teamBScore: number,
    team: "A" | "B"
  ) => void;
  clearMatches: () => void;
}

// Create a store with initial match history data
export const useMatchStore = create<MatchStore>()(
  persist(
    (set) => ({
      matches: [
        {
          id: "match-1",
          status: "Complete",
          eloTier: "low",
          teamSize: "4v4",
          winner: "Lineage",
          date: "2024-06-10T18:27:00Z",
        },
        {
          id: "match-2",
          status: "Complete",
          eloTier: "low",
          teamSize: "5v5",
          winner: "Lineage",
          date: "2024-06-09T18:27:00Z",
        },
        {
          id: "match-3",
          status: "Ready-Check",
          eloTier: "medium",
          teamSize: "2v2",
          winner: "RNA Corp",
          date: "2024-06-08T18:27:00Z",
        },
        {
          id: "match-4",
          status: "In-Progress",
          eloTier: "medium",
          teamSize: "5v5",
          winner: "Lineage",
          date: "2024-06-07T18:27:00Z",
        },
        {
          id: "match-5",
          status: "Complete",
          eloTier: "high",
          teamSize: "5v5",
          winner: "RNA Corp",
          date: "2024-06-06T18:27:00Z",
        },
        {
          id: "match-6",
          status: "Canceled",
          eloTier: "low",
          teamSize: "2v2",
          winner: "RNA Corp",
          date: "2024-06-05T18:27:00Z",
        },
        {
          id: "match-7",
          status: "In-Progress",
          eloTier: "medium",
          teamSize: "2v2",
          winner: "Lineage",
          date: "2024-06-04T18:27:00Z",
        },
        {
          id: "match-8",
          status: "Complete",
          eloTier: "high",
          teamSize: "4v4",
          winner: "RNA Corp",
          date: "2024-06-03T18:27:00Z",
        },
        {
          id: "match-9",
          status: "Complete",
          eloTier: "low",
          teamSize: "4v4",
          winner: "Lineage",
          date: "2024-06-02T18:27:00Z",
        },
        {
          id: "match-10",
          status: "Canceled",
          eloTier: "low",
          teamSize: "1v1",
          winner: "RNA Corp",
          date: "2024-06-01T18:27:00Z",
        },
      ],
      addMatch: (match) =>
        set((state) => ({
          matches: [match, ...state.matches],
        })),
      updateMatch: (id, updatedMatch) =>
        set((state) => ({
          matches: state.matches.map((match) =>
            match.id === id ? { ...match, ...updatedMatch } : match
          ),
        })),
      updateMapScore: (matchId, mapIndex, teamAScore, teamBScore, team) =>
        set((state) => ({
          matches: state.matches.map((match) => {
            if (match.id === matchId && match.maps) {
              const updatedMaps = [...match.maps];
              updatedMaps[mapIndex] = {
                ...updatedMaps[mapIndex],
                teamAScore:
                  team === "A" ? teamAScore : updatedMaps[mapIndex].teamAScore,
                teamBScore:
                  team === "B" ? teamBScore : updatedMaps[mapIndex].teamBScore,
                [`team${team}Reported`]: true,
              };

              // Check if both teams have reported
              if (
                updatedMaps[mapIndex].teamAReported &&
                updatedMaps[mapIndex].teamBReported
              ) {
                updatedMaps[mapIndex].reported = true;
              }

              // Check if match is complete (all maps reported)
              const allMapsReported = updatedMaps.every((map) => map.reported);
              let winner: Winner = "Pending";

              if (allMapsReported) {
                // Count wins for each team
                let teamAWins = 0;
                let teamBWins = 0;

                updatedMaps.forEach((map) => {
                  if (map.teamAScore > map.teamBScore) teamAWins++;
                  else if (map.teamBScore > map.teamAScore) teamBWins++;
                });

                // Determine winner (best of 3)
                if (teamAWins > teamBWins) winner = "Lineage";
                else if (teamBWins > teamAWins) winner = "RNA Corp";
              }

              return {
                ...match,
                maps: updatedMaps,
                status: allMapsReported ? "Complete" : match.status,
                winner: allMapsReported ? winner : match.winner,
              };
            }
            return match;
          }),
        })),
      clearMatches: () => set({ matches: [] }),
    }),
    {
      name: "match-history-storage",
    }
  )
);

interface StoreState {
  // Add your state types here
  currentQueue: string | null;
  setCurrentQueue: (queueId: string | null) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentQueue: null,
      setCurrentQueue: (queueId) => set({ currentQueue: queueId }),
    }),
    {
      name: "shadowrun-store",
    }
  )
);
