"use client";

import { useEffect, useRef, useMemo, useReducer } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";

// Updated interfaces to better match MongoDB data
interface Team {
  _id: string;
  name: string;
  tag?: string;
  seed?: number;
}

interface Match {
  matchId: string;
  teamA?: Team;
  teamB?: Team;
  scores: {
    teamA: number;
    teamB: number;
  };
  winner?: "teamA" | "teamB" | "draw";
  status: "upcoming" | "live" | "completed";
  tournamentMatchId?: string;
}

interface Round {
  name: string;
  matches: Match[];
}

interface TournamentBracketProps {
  rounds: Round[];
  currentRound: number;
  onPreviousRound: () => void;
  onNextRound: () => void;
}

// Create interfaces for our components
interface TeamDisplayProps {
  team: {
    _id: string;
    name: string;
    tag?: string;
    seed?: number;
  };
  isWinner: boolean;
  score?: number;
}

// Define the TeamDisplay component
const TeamDisplay = ({ team, isWinner, score }: TeamDisplayProps) => (
  <div
    className={`flex items-center justify-between w-full ${
      isWinner ? "text-green-500" : ""
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
        {team.seed || "?"}
      </span>
      <div>
        <span className="font-semibold">{team.name}</span>
        {team.tag && (
          <span className="ml-2 text-xs text-muted-foreground">{team.tag}</span>
        )}
      </div>
    </div>
    <span className="text-xl font-bold">
      {score !== undefined ? score : "-"}
    </span>
  </div>
);

// Define the TeamPlaceholder component
const TeamPlaceholder = () => (
  <div className="flex items-center w-full gap-3">
    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
      ?
    </span>
    <Skeleton className="w-32 h-5" />
    <span className="ml-auto">
      <Skeleton className="w-8 h-5" />
    </span>
  </div>
);

export function TournamentBracket({
  rounds,
  currentRound,
  onPreviousRound,
  onNextRound,
}: TournamentBracketProps) {
  const { toast } = useToast();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const currentRoundData = rounds[currentRound] || {
    name: "Round 1",
    matches: [],
  };
  const hasNextRound = currentRound < rounds.length - 1;
  const hasPreviousRound = currentRound > 0;

  // Enhance the hasTeams check to better detect when teams are removed
  const hasTeams = useMemo(() => {
    // No matches, no teams
    if (!currentRoundData.matches.length) return false;

    // Count valid teams (not null or undefined) in all matches
    const matchesWithTeams = currentRoundData.matches.filter((match) => {
      // Both teams need to be present and have names
      return match.teamA?.name && match.teamB?.name;
    });

    // Only show actual teams when all matches have teams
    return matchesWithTeams.length === currentRoundData.matches.length;
  }, [currentRoundData.matches]);

  // Track tournament state updates
  useEffect(() => {
    // Reset hasTeams if the tournament is updated
    if (
      currentRoundData.matches.some(
        (match) =>
          (match.teamA === null && match.teamB !== null) ||
          (match.teamA !== null && match.teamB === null)
      )
    ) {
      // Force re-render to show skeletons when a team is removed
      forceUpdate();
    }
  }, [currentRoundData.matches]);

  // Add a check if the tournament is seeded
  const isProperlySeeded =
    currentRoundData.matches.length > 0 &&
    currentRoundData.matches.every(
      (match) => (match.teamA && match.teamB) || (!match.teamA && !match.teamB)
    );

  // Add this check in the bracket component to detect invalid matchups
  // This will be in your useEffect or match rendering section
  useEffect(() => {
    // Check for duplicate teams in matchups
    const teamIds = new Set();
    const duplicates = currentRoundData.matches.some((match) => {
      if (match.teamA && match.teamB) {
        // Check if team is matched against itself
        if (match.teamA._id === match.teamB._id) {
          return true;
        }

        // Check if team appears in multiple matches
        if (teamIds.has(match.teamA._id) || teamIds.has(match.teamB._id)) {
          return true;
        }

        teamIds.add(match.teamA._id);
        teamIds.add(match.teamB._id);
      }
      return false;
    });

    if (duplicates) {
      console.error("Tournament has duplicate team assignments");
      // Force showing skeletons when there are duplicate teams
      forceUpdate();
    }
  }, [currentRoundData.matches]);

  // Update the renderRoundMatches function to handle the type issue
  const renderRoundMatches = (round: number) => {
    // Calculate how many matches should be in each round based on bracket size
    const totalRounds = rounds.length;

    // Calculate number of matches for this specific round
    // Starting with total teams (2^totalRounds), divide by 2^(round+1)
    const matchesInRound = Math.pow(2, totalRounds - 1 - round);

    return (
      <div className="space-y-4">
        {Array.from({ length: matchesInRound }).map((_, matchIndex) => {
          const matchKey = `${round + 1}-${matchIndex + 1}`;

          // Use type assertion to fix the type error
          // First get the match from the rounds data structure
          const matchData = rounds[round]?.matches?.[matchKey as any];

          // Then cast it to Match type to avoid TypeScript errors
          const match = matchData as Match | undefined;

          return (
            <div key={matchIndex} className="relative">
              <div className="overflow-hidden border rounded-lg bg-card">
                {/* First team */}
                <div className="flex items-center p-3 border-b border-gray-700">
                  {match?.teamA ? (
                    <TeamDisplay
                      team={match.teamA}
                      isWinner={match.winner === "teamA"}
                      score={match.scores?.teamA}
                    />
                  ) : (
                    <TeamPlaceholder />
                  )}
                </div>

                {/* Second team */}
                <div className="flex items-center p-3">
                  {match?.teamB ? (
                    <TeamDisplay
                      team={match.teamB}
                      isWinner={match.winner === "teamB"}
                      score={match.scores?.teamB}
                    />
                  ) : (
                    <TeamPlaceholder />
                  )}
                </div>
              </div>

              {/* Waiting for teams message if neither team is set */}
              {!match?.teamA && !match?.teamB && (
                <div className="mt-2 text-sm text-center text-gray-400">
                  Waiting for teams...
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousRound}
          disabled={!hasPreviousRound}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Round
        </Button>

        <h3 className="text-lg font-semibold">{currentRoundData.name}</h3>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextRound}
          disabled={!hasNextRound}
          className="flex items-center gap-1"
        >
          Next Round <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Update the display logic */}
      {!hasTeams || !isProperlySeeded ? (
        renderRoundMatches(currentRound)
      ) : (
        <div className="space-y-4">
          {currentRoundData.matches.map((match, idx) => (
            <div
              key={match.matchId}
              className="overflow-hidden border rounded-lg bg-card"
            >
              <div className="flex flex-col">
                {/* Match header with match number and status */}
                <div className="flex justify-between px-4 py-2 text-sm bg-muted/50">
                  <span className="font-semibold">Match {idx + 1}</span>
                  <div>
                    {match.status === "upcoming" && (
                      <Badge variant="outline">Upcoming</Badge>
                    )}
                    {match.status === "live" && (
                      <Badge variant="destructive">Live</Badge>
                    )}
                    {match.status === "completed" && (
                      <Badge variant="success">Completed</Badge>
                    )}
                  </div>
                </div>

                {/* Team A */}
                <div
                  className={`flex items-center justify-between p-3 border-b ${
                    match.winner === "teamA"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
                      {match.teamA ? (
                        <span className="flex items-center justify-center">
                          {match.teamA.seed ? (
                            <span title={`Seed #${match.teamA.seed}`}>
                              {match.teamA.seed}
                            </span>
                          ) : (
                            "1"
                          )}
                        </span>
                      ) : (
                        "?"
                      )}
                    </span>
                    {match.teamA ? (
                      <div>
                        <span className="font-semibold">
                          {match.teamA.name}
                        </span>
                        {match.teamA.tag && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {match.teamA.tag}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">TBD</span>
                    )}
                  </div>
                  <span className="text-xl font-bold">
                    {match.scores.teamA}
                  </span>
                </div>

                {/* Team B */}
                <div
                  className={`flex items-center justify-between p-3 ${
                    match.winner === "teamB"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
                      {match.teamB ? (
                        <span className="flex items-center justify-center">
                          {match.teamB.seed ? (
                            <span title={`Seed #${match.teamB.seed}`}>
                              {match.teamB.seed}
                            </span>
                          ) : (
                            "2"
                          )}
                        </span>
                      ) : (
                        "?"
                      )}
                    </span>
                    {match.teamB ? (
                      <div>
                        <span className="font-semibold">
                          {match.teamB.name}
                        </span>
                        {match.teamB.tag && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {match.teamB.tag}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">TBD</span>
                    )}
                  </div>
                  <span className="text-xl font-bold">
                    {match.scores.teamB}
                  </span>
                </div>

                {/* Match footer with link to match details */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                  <span className="text-xs text-muted-foreground">
                    {match.status === "upcoming" && "Match not started"}
                    {match.status === "live" && "Match in progress"}
                    {match.status === "completed" && "Match completed"}
                  </span>

                  {(match.teamA || match.teamB) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild={!!match.tournamentMatchId}
                      className="text-xs"
                      onClick={(e) => {
                        if (!match.tournamentMatchId) {
                          e.preventDefault();
                          toast({
                            title: "Match not available",
                            description:
                              "This match will be available after the tournament is launched.",
                          });
                        }
                      }}
                    >
                      {match.tournamentMatchId ? (
                        <Link
                          href={`/tournaments/matches/${match.tournamentMatchId}`}
                        >
                          View Match
                        </Link>
                      ) : (
                        <span>View Match</span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
