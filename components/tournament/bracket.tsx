"use client";

import { useEffect, useRef, useMemo, useReducer } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trophy, Clock, Play } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
const TeamDisplay = ({ team, isWinner, score }: TeamDisplayProps) => {
  const getSeedBadgeStyle = (seed?: number) => {
    if (!seed) return "bg-muted text-muted-foreground";
    if (seed === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (seed === 2) return "bg-gray-400/20 text-gray-300 border-gray-400/50";
    if (seed === 3) return "bg-amber-600/20 text-amber-500 border-amber-600/50";
    return "bg-muted text-muted-foreground border";
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between w-full transition-colors",
        isWinner && "text-green-500"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 w-7 h-7 p-0 text-xs font-bold rounded-full flex items-center justify-center",
            getSeedBadgeStyle(team.seed)
          )}
        >
          {team.seed || "?"}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{team.name}</div>
          {team.tag && (
            <div className="text-xs text-muted-foreground truncate">
              [{team.tag}]
            </div>
          )}
        </div>
      </div>
      <span className="text-2xl font-bold ml-4 shrink-0">
        {score !== undefined ? score : "-"}
      </span>
    </div>
  );
};

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

  // Update the renderRoundMatches function to use actual matches array
  const renderRoundMatches = (round: number) => {
    // Use the actual matches array from the round data, not a calculated formula
    // This ensures losers brackets show the correct number of matches
    const roundData = rounds[round];
    const matches = roundData?.matches || [];
    const matchesInRound = matches.length;

    // If no matches array exists, return empty
    if (matchesInRound === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No matches in this round</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {matches.map((match, matchIndex) => {
          return (
            <Card
              key={match.matchId || `match-${matchIndex}`}
              className={cn(
                "overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
                match.status === "live" && "ring-2 ring-primary/50"
              )}
            >
              <div className="flex flex-col h-full">
                {/* Match header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">Match {matchIndex + 1}</span>
                  </div>
                  <div>
                    {match.status === "upcoming" && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Upcoming
                      </Badge>
                    )}
                    {match.status === "live" && (
                      <Badge variant="destructive" className="gap-1 animate-pulse">
                        <Play className="w-3 h-3" />
                        Live
                      </Badge>
                    )}
                    {match.status === "completed" && (
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="w-3 h-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Teams section with fixed height */}
                <div className="flex-1 flex flex-col">
                  {/* Team A */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 border-b transition-colors min-h-[4.5rem]",
                      match.winner === "teamA" && "bg-green-500/10 border-green-500/30"
                    )}
                  >
                    {match.teamA ? (
                      <TeamDisplay
                        team={match.teamA}
                        isWinner={match.winner === "teamA"}
                        score={match.scores?.teamA}
                      />
                    ) : (
                      <TeamPlaceholder />
                    )}
                  </div>

                  {/* Team B */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 transition-colors min-h-[4.5rem]",
                      match.winner === "teamB" && "bg-green-500/10 border-green-500/30"
                    )}
                  >
                    {match.teamB ? (
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

                {/* Match footer - always at bottom */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {match.status === "upcoming" && (
                      <>
                        <Clock className="w-3 h-3" />
                        Match not started
                      </>
                    )}
                    {match.status === "live" && (
                      <>
                        <Play className="w-3 h-3" />
                        Match in progress
                      </>
                    )}
                    {match.status === "completed" && (
                      <>
                        <Trophy className="w-3 h-3" />
                        Match completed
                      </>
                    )}
                  </span>

                  {match.tournamentMatchId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs h-8"
                    >
                      <Link
                        href={`/tournaments/matches/${match.tournamentMatchId}`}
                        className="flex items-center gap-1"
                      >
                        View Match
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Round Navigation Header */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg border bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousRound}
          disabled={!hasPreviousRound}
          className="flex items-center gap-2 h-9"
        >
          <ChevronLeft className="w-4 h-4" /> 
          <span className="hidden sm:inline">Previous Round</span>
        </Button>

        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">{currentRoundData.name}</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextRound}
          disabled={!hasNextRound}
          className="flex items-center gap-2 h-9"
        >
          <span className="hidden sm:inline">Next Round</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Update the display logic */}
      {!hasTeams || !isProperlySeeded ? (
        renderRoundMatches(currentRound)
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {currentRoundData.matches.map((match, idx) => {
            const getSeedBadgeStyle = (seed?: number) => {
              if (!seed) return "bg-muted text-muted-foreground border";
              if (seed === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
              if (seed === 2) return "bg-gray-400/20 text-gray-300 border-gray-400/50";
              if (seed === 3) return "bg-amber-600/20 text-amber-500 border-amber-600/50";
              return "bg-muted text-muted-foreground border";
            };

            return (
              <Card
                key={match.matchId}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
                  match.status === "live" && "ring-2 ring-primary/50"
                )}
              >
                <div className="flex flex-col h-full">
                  {/* Match header with match number and status */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b shrink-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">Match {idx + 1}</span>
                    </div>
                    <div>
                      {match.status === "upcoming" && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Upcoming
                        </Badge>
                      )}
                      {match.status === "live" && (
                        <Badge variant="destructive" className="gap-1 animate-pulse">
                          <Play className="w-3 h-3" />
                          Live
                        </Badge>
                      )}
                      {match.status === "completed" && (
                        <Badge variant="secondary" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Teams section with fixed height */}
                  <div className="flex-1 flex flex-col">
                    {/* Team A */}
                    <div
                      className={cn(
                        "flex items-center justify-between p-4 border-b transition-colors min-h-[4.5rem]",
                        match.winner === "teamA" && "bg-green-500/10 border-green-500/30"
                      )}
                    >
                      {match.teamA ? (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 w-8 h-8 p-0 text-xs font-bold rounded-full flex items-center justify-center",
                                getSeedBadgeStyle(match.teamA.seed)
                              )}
                            >
                              {match.teamA.seed || "?"}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate text-sm sm:text-base">
                                {match.teamA.name}
                              </div>
                              {match.teamA.tag && (
                                <div className="text-xs text-muted-foreground truncate">
                                  [{match.teamA.tag}]
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-2xl font-bold ml-4 shrink-0">
                            {match.scores.teamA}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <Badge variant="outline" className="w-8 h-8 p-0 rounded-full">
                            ?
                          </Badge>
                          <span className="text-muted-foreground">TBD</span>
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div
                      className={cn(
                        "flex items-center justify-between p-4 transition-colors min-h-[4.5rem]",
                        match.winner === "teamB" && "bg-green-500/10 border-green-500/30"
                      )}
                    >
                      {match.teamB ? (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 w-8 h-8 p-0 text-xs font-bold rounded-full flex items-center justify-center",
                                getSeedBadgeStyle(match.teamB.seed)
                              )}
                            >
                              {match.teamB.seed || "?"}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate text-sm sm:text-base">
                                {match.teamB.name}
                              </div>
                              {match.teamB.tag && (
                                <div className="text-xs text-muted-foreground truncate">
                                  [{match.teamB.tag}]
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-2xl font-bold ml-4 shrink-0">
                            {match.scores.teamB}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <Badge variant="outline" className="w-8 h-8 p-0 rounded-full">
                            ?
                          </Badge>
                          <span className="text-muted-foreground">TBD</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match footer with link to match details - always at bottom */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {match.status === "upcoming" && (
                        <>
                          <Clock className="w-3 h-3" />
                          Match not started
                        </>
                      )}
                      {match.status === "live" && (
                        <>
                          <Play className="w-3 h-3" />
                          Match in progress
                        </>
                      )}
                      {match.status === "completed" && (
                        <>
                          <Trophy className="w-3 h-3" />
                          Match completed
                        </>
                      )}
                    </span>

                    {(match.teamA || match.teamB) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild={!!match.tournamentMatchId}
                        className="text-xs h-8"
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
                            className="flex items-center gap-1"
                          >
                            View Match
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="flex items-center gap-1">
                            View Match
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
