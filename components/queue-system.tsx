"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Users } from "lucide-react";
import QueueCard from "@/components/queue-card";
import { useMatchStore } from "@/lib/store";
import { calculateBalancedTeams } from "@/lib/team-balancer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type EloTier = "low" | "medium" | "high";
export type TeamSize = "1v1" | "2v2" | "4v4" | "5v5";
export type QueueStatus = "waiting" | "ready" | "in-progress";

export interface Player {
  id: string;
  name: string;
  elo: number;
  avatar?: string;
}

export interface QueueState {
  tier: EloTier;
  teamSize: TeamSize;
  players: Player[];
  status: QueueStatus;
  maxPlayers: number;
}

export default function QueueSystem() {
  const { toast } = useToast();
  const { addMatch } = useMatchStore();
  const [activeTeamSize, setActiveTeamSize] = useState<TeamSize>("4v4");
  const [currentTier, setCurrentTier] = useState<EloTier>("medium");
  const [isUserQueued, setIsUserQueued] = useState<Record<string, boolean>>({});

  // Initialize queue states for all combinations of team sizes and tiers
  const [queues, setQueues] = useState<
    Record<TeamSize, Record<EloTier, QueueState>>
  >({
    "1v1": {
      low: {
        tier: "low",
        teamSize: "1v1",
        players: [],
        status: "waiting",
        maxPlayers: 2,
      },
      medium: {
        tier: "medium",
        teamSize: "1v1",
        players: [],
        status: "waiting",
        maxPlayers: 2,
      },
      high: {
        tier: "high",
        teamSize: "1v1",
        players: [],
        status: "waiting",
        maxPlayers: 2,
      },
    },
    "2v2": {
      low: {
        tier: "low",
        teamSize: "2v2",
        players: [],
        status: "waiting",
        maxPlayers: 4,
      },
      medium: {
        tier: "medium",
        teamSize: "2v2",
        players: [],
        status: "waiting",
        maxPlayers: 4,
      },
      high: {
        tier: "high",
        teamSize: "2v2",
        players: [],
        status: "waiting",
        maxPlayers: 4,
      },
    },
    "4v4": {
      low: {
        tier: "low",
        teamSize: "4v4",
        players: [],
        status: "waiting",
        maxPlayers: 8,
      },
      medium: {
        tier: "medium",
        teamSize: "4v4",
        players: [],
        status: "waiting",
        maxPlayers: 8,
      },
      high: {
        tier: "high",
        teamSize: "4v4",
        players: [],
        status: "waiting",
        maxPlayers: 8,
      },
    },
    "5v5": {
      low: {
        tier: "low",
        teamSize: "5v5",
        players: [],
        status: "waiting",
        maxPlayers: 10,
      },
      medium: {
        tier: "medium",
        teamSize: "5v5",
        players: [],
        status: "waiting",
        maxPlayers: 10,
      },
      high: {
        tier: "high",
        teamSize: "5v5",
        players: [],
        status: "waiting",
        maxPlayers: 10,
      },
    },
  });

  // Wrap mockPlayers in useMemo to prevent recreation on every render
  const mockPlayers = useMemo<Record<EloTier, Player[]>>(
    () => ({
      low: [
        { id: "1", name: "S10Gmz", elo: 900, avatar: "🧙" },
        { id: "2", name: "Player2", elo: 950, avatar: "🧝" },
        { id: "3", name: "Player3", elo: 1000, avatar: "🧙‍♀️" },
        { id: "4", name: "Player4", elo: 1050, avatar: "🧝‍♀️" },
        { id: "5", name: "Player5", elo: 1100, avatar: "🧙" },
        { id: "6", name: "Player6", elo: 1150, avatar: "🧝" },
        { id: "7", name: "Player7", elo: 1200, avatar: "🧙‍♀️" },
        { id: "8", name: "Player8", elo: 1250, avatar: "🧝‍♀️" },
        { id: "9", name: "Player9", elo: 1300, avatar: "🧙" },
        { id: "10", name: "Player10", elo: 1350, avatar: "🧝" },
        { id: "11", name: "Player11", elo: 1400, avatar: "🧙‍♀️" },
        { id: "12", name: "Player12", elo: 1450, avatar: "🧝‍♀️" },
      ],
      medium: [
        { id: "13", name: "BumJamas", elo: 1500, avatar: "🧙" },
        { id: "14", name: "Skeebum", elo: 1550, avatar: "🧝" },
        { id: "15", name: "VertigoSR", elo: 1600, avatar: "🧙‍♀️" },
        { id: "16", name: "Shadowrun Girl", elo: 1650, avatar: "🧝‍♀️" },
        { id: "17", name: "Niddlez", elo: 1700, avatar: "🧙" },
        { id: "18", name: "ManaMyxtery", elo: 1750, avatar: "🧝" },
        { id: "19", name: "TrooperSuper12", elo: 1800, avatar: "🧙‍♀️" },
        { id: "20", name: "Sinful Hollowz", elo: 1650, avatar: "🧝‍♀️" },
        { id: "21", name: "MedPlayer1", elo: 1700, avatar: "🧙" },
        { id: "22", name: "MedPlayer2", elo: 1750, avatar: "🧝" },
        { id: "23", name: "MedPlayer3", elo: 1800, avatar: "🧙‍♀️" },
        { id: "24", name: "MedPlayer4", elo: 1850, avatar: "🧝‍♀️" },
      ],
      high: [
        { id: "25", name: "HighPlayer1", elo: 2000, avatar: "🧙" },
        { id: "26", name: "HighPlayer2", elo: 2050, avatar: "🧝" },
        { id: "27", name: "HighPlayer3", elo: 2100, avatar: "🧙‍♀️" },
        { id: "28", name: "HighPlayer4", elo: 2150, avatar: "🧝‍♀️" },
        { id: "29", name: "HighPlayer5", elo: 2200, avatar: "🧙" },
        { id: "30", name: "HighPlayer6", elo: 2250, avatar: "🧝" },
        { id: "31", name: "HighPlayer7", elo: 2300, avatar: "🧙‍♀️" },
        { id: "32", name: "HighPlayer8", elo: 2350, avatar: "🧝‍♀️" },
        { id: "33", name: "HighPlayer9", elo: 2400, avatar: "🧙" },
        { id: "34", name: "HighPlayer10", elo: 2450, avatar: "🧝" },
        { id: "35", name: "HighPlayer11", elo: 2500, avatar: "🧙‍♀️" },
        { id: "36", name: "HighPlayer12", elo: 2550, avatar: "🧝‍♀️" },
      ],
    }),
    []
  ); // Empty dependency array since data is static

  const toggleQueue = useCallback(
    (teamSize: TeamSize, tier: EloTier) => {
      const queueKey = `${teamSize}-${tier}`;

      setQueues((prev) => {
        const currentQueue = prev[teamSize][tier];
        const updatedPlayers = isUserQueued[queueKey]
          ? currentQueue.players.filter((p) => p.name !== "You")
          : [
              ...currentQueue.players,
              {
                id: `user-${Date.now()}`,
                name: "You",
                elo: tier === "low" ? 1000 : tier === "medium" ? 1500 : 2000,
                avatar: "👤",
              },
            ];

        const updatedQueue = {
          ...currentQueue,
          players: updatedPlayers,
          status:
            updatedPlayers.length >= currentQueue.maxPlayers
              ? "ready"
              : "waiting",
        };

        // Check if we have enough players to start a match
        if (
          updatedPlayers.length >= currentQueue.maxPlayers &&
          currentQueue.status !== "ready"
        ) {
          const matchPlayers = updatedPlayers.slice(0, currentQueue.maxPlayers);
          const teams = calculateBalancedTeams(matchPlayers, teamSize);

          // Add match to history
          setTimeout(() => {
            const matchId = `match-${Date.now()}`;
            addMatch({
              id: matchId,
              status: "Queue",
              eloTier: tier,
              teamSize: teamSize,
              winner: "Pending",
              date: new Date().toISOString(),
              teams,
              maps: [
                {
                  name: "Lobby",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
                {
                  name: "Nerve Center",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
                {
                  name: "Power Station",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
              ],
            });

            // Show toast notification
            toast({
              title: "Queue is ready!",
              description: `${
                tier.charAt(0).toUpperCase() + tier.slice(1)
              } tier ${teamSize} match is ready to start.`,
              variant: "default",
            });

            // Redirect to match page
            window.location.href = `/match/${matchId}`;
          }, 1000);
        }

        return {
          ...prev,
          [teamSize]: {
            ...prev[teamSize],
            [tier]: updatedQueue,
          },
        };
      });

      setIsUserQueued((prev) => ({
        ...prev,
        [queueKey]: !prev[queueKey],
      }));
    },
    [isUserQueued, addMatch, toast]
  );

  const simulateQueue = useCallback(
    (teamSize: TeamSize, tier: EloTier) => {
      // For demonstration, add random players from our mock data
      const availablePlayers = mockPlayers[tier].filter(
        (p) => !queues[teamSize][tier].players.some((qp) => qp.id === p.id)
      );

      if (availablePlayers.length === 0) return;

      const randomIndex = Math.floor(Math.random() * availablePlayers.length);
      const playerToAdd = availablePlayers[randomIndex];

      setQueues((prev) => {
        const updatedPlayers = [...prev[teamSize][tier].players, playerToAdd];
        const maxPlayers = prev[teamSize][tier].maxPlayers;

        // Check if we have enough players to start a match
        if (
          updatedPlayers.length >= maxPlayers &&
          prev[teamSize][tier].status !== "ready"
        ) {
          // Get the first maxPlayers for the match
          const matchPlayers = updatedPlayers.slice(0, maxPlayers);

          // Create balanced teams
          const teams = calculateBalancedTeams(matchPlayers, teamSize);

          // Add match to history
          setTimeout(() => {
            const matchId = `match-${Date.now()}`;
            addMatch({
              id: matchId,
              status: "Queue",
              eloTier: tier,
              teamSize: teamSize,
              winner: "Pending",
              date: new Date().toISOString(),
              teams,
              maps: [
                {
                  name: "Lobby",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
                {
                  name: "Nerve Center",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
                {
                  name: "Power Station",
                  teamAScore: 0,
                  teamBScore: 0,
                  reported: false,
                },
              ],
            });

            // Show toast notification
            toast({
              title: "Queue is ready!",
              description: `${
                tier.charAt(0).toUpperCase() + tier.slice(1)
              } tier ${teamSize} match is ready to start.`,
              variant: "default",
            });
          }, 1000);

          return {
            ...prev,
            [teamSize]: {
              ...prev[teamSize],
              [tier]: {
                ...prev[teamSize][tier],
                players: updatedPlayers,
                status: "ready",
              },
            },
          };
        }

        return {
          ...prev,
          [teamSize]: {
            ...prev[teamSize],
            [tier]: {
              ...prev[teamSize][tier],
              players: updatedPlayers,
            },
          },
        };
      });
    },
    [queues, addMatch, toast, mockPlayers]
  );

  // Pre-fill one of the queues for preview
  useEffect(() => {
    const preFilledPlayers = mockPlayers.medium.slice(0, 8);
    setQueues((prev) => ({
      ...prev,
      "4v4": {
        ...prev["4v4"],
        medium: {
          ...prev["4v4"].medium,
          players: preFilledPlayers,
          status: "ready",
        },
      },
    }));

    // Create a match for the pre-filled queue
    const matchId = `match-${Date.now()}`;
    const teams = calculateBalancedTeams(preFilledPlayers, "4v4");
    addMatch({
      id: matchId,
      status: "Queue",
      eloTier: "medium",
      teamSize: "4v4",
      winner: "Pending",
      date: new Date().toISOString(),
      teams,
      maps: [
        { name: "Lobby", teamAScore: 0, teamBScore: 0, reported: false },
        { name: "Nerve Center", teamAScore: 0, teamBScore: 0, reported: false },
        {
          name: "Power Station",
          teamAScore: 0,
          teamBScore: 0,
          reported: false,
        },
      ],
    });
  }, [addMatch, mockPlayers.medium]);

  // Simulate players joining queues
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    Object.keys(queues).forEach((teamSize) => {
      Object.keys(queues[teamSize as TeamSize]).forEach((tier) => {
        const interval = setInterval(() => {
          if (Math.random() > 0.7) {
            simulateQueue(teamSize as TeamSize, tier as EloTier);
          }
        }, 5000);

        intervals.push(interval);
      });
    });

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [queues, simulateQueue]);

  // Add this to your queue system initialization
  useEffect(() => {
    // Check ban status on mount
    const checkBanStatus = async () => {
      try {
        const response = await fetch("/api/user/status");
        if (response.ok) {
          const data = await response.json();
          if (data.isBanned) {
            console.log("[QUEUE-SYSTEM] User is banned, removing from queues");
            // Remove user from any active queues
            const allQueues = { ...queues };
            Object.keys(allQueues).forEach((qId) => {
              leaveQueue(qId);
            });

            // Show ban notification
            toast({
              title: "Account Banned",
              description: data.banExpiry
                ? `You cannot join queues until ${new Date(
                    data.banExpiry
                  ).toLocaleString()}.`
                : "Your account is permanently banned from matchmaking.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("[QUEUE-SYSTEM] Failed to check ban status:", error);
      }
    };

    checkBanStatus();
  }, [queues, toast]);

  const leaveQueue = async (queueId: string) => {
    try {
      console.log(`Leaving queue ${queueId}`);
      const response = await fetch(`/api/queue/${queueId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error leaving queue:", errorData);
        return;
      }

      // Update local state while handling the nested structure
      setQueues((prev) => {
        const updatedQueues = { ...prev };

        // Parse queueId to get teamSize and tier (assuming format like "1v1-high")
        const [teamSize, tier] = queueId.split("-") as [TeamSize, EloTier];

        if (updatedQueues[teamSize] && updatedQueues[teamSize][tier]) {
          // Now we're correctly accessing the QueueState object
          updatedQueues[teamSize][tier].players = updatedQueues[teamSize][
            tier
          ].players.filter((p: { name: string }) => p.name !== "You");

          updatedQueues[teamSize][tier].status = "waiting";
        }

        return updatedQueues;
      });

      console.log(`Successfully left queue ${queueId}`);
    } catch (error) {
      console.error(`Failed to leave queue ${queueId}:`, error);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Ranked Matchmaking</h1>

      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <Button
            variant={activeTeamSize === "1v1" ? "default" : "outline"}
            onClick={() => setActiveTeamSize("1v1")}
            className={
              activeTeamSize === "1v1"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
            }
          >
            1v1
          </Button>
          <Button
            variant={activeTeamSize === "2v2" ? "default" : "outline"}
            onClick={() => setActiveTeamSize("2v2")}
            className={
              activeTeamSize === "2v2"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
            }
          >
            2v2
          </Button>
          <Button
            variant={activeTeamSize === "4v4" ? "default" : "outline"}
            onClick={() => setActiveTeamSize("4v4")}
            className={
              activeTeamSize === "4v4"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
            }
          >
            4v4
          </Button>
          <Button
            variant={activeTeamSize === "5v5" ? "default" : "outline"}
            onClick={() => setActiveTeamSize("5v5")}
            className={
              activeTeamSize === "5v5"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
            }
          >
            5v5
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Fixed Queue Box */}
          <div className="col-span-1 bg-[#111827] rounded-lg p-6">
            <h2 className="mb-4 text-xl font-semibold">Queues</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded hover:bg-[#1a2234]">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">high</p>
                    <p className="text-sm text-gray-400">1800-2500</p>
                  </div>
                </div>
                <Button
                  variant={
                    isUserQueued[`${activeTeamSize}-high`]
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    isUserQueued[`${activeTeamSize}-high`]
                      ? ""
                      : "bg-[#1e293b] hover:bg-[#2d3c52] text-white"
                  }
                  onClick={() => toggleQueue(activeTeamSize, "high")}
                >
                  {isUserQueued[`${activeTeamSize}-high`] ? "Leave" : "Queue"}{" "}
                  {queues[activeTeamSize].high.players.length}/
                  {queues[activeTeamSize].high.maxPlayers}+
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 rounded hover:bg-[#1a2234]">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">medium</p>
                    <p className="text-sm text-gray-400">1200-1800</p>
                  </div>
                </div>
                <Button
                  variant={
                    isUserQueued[`${activeTeamSize}-medium`]
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    isUserQueued[`${activeTeamSize}-medium`]
                      ? ""
                      : "bg-[#1e293b] hover:bg-[#2d3c52] text-white"
                  }
                  onClick={() => toggleQueue(activeTeamSize, "medium")}
                >
                  {isUserQueued[`${activeTeamSize}-medium`] ? "Leave" : "Queue"}{" "}
                  {queues[activeTeamSize].medium.players.length}/
                  {queues[activeTeamSize].medium.maxPlayers}+
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 rounded hover:bg-[#1a2234]">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">low</p>
                    <p className="text-sm text-gray-400">800-1400</p>
                  </div>
                </div>
                <Button
                  variant={
                    isUserQueued[`${activeTeamSize}-low`]
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    isUserQueued[`${activeTeamSize}-low`]
                      ? ""
                      : "bg-[#1e293b] hover:bg-[#2d3c52] text-white"
                  }
                  onClick={() => toggleQueue(activeTeamSize, "low")}
                >
                  {isUserQueued[`${activeTeamSize}-low`] ? "Leave" : "Queue"}{" "}
                  {queues[activeTeamSize].low.players.length}/
                  {queues[activeTeamSize].low.maxPlayers}+
                </Button>
              </div>
            </div>
          </div>

          {/* Carousel for Queue Cards */}
          <div className="col-span-3">
            <Carousel className="w-full">
              <CarouselContent>
                {["low", "medium", "high"].map((tier) => (
                  <CarouselItem key={tier} className="md:basis-1/3">
                    <QueueCard
                      tier={tier as EloTier}
                      teamSize={activeTeamSize}
                      queue={queues[activeTeamSize][tier as EloTier]}
                      onLeave={() =>
                        toggleQueue(activeTeamSize, tier as EloTier)
                      }
                      isUserQueued={
                        isUserQueued[`${activeTeamSize}-${tier}`] || false
                      }
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                <CarouselPrevious className="static" />
                <CarouselNext className="static" />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}
