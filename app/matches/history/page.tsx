"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate, formatCalendarDate } from "@/lib/date-utils";

interface Match {
  _id: string;
  gameType: string;
  teamSize: number;
  eloTier: string;
  anonymous: boolean;
  matchId: string;
  status: string;
  createdBy: string;
  createdAt: number;
  maps: Array<any>;
  players: Array<any>;
  title: string;
  results: Array<{
    scores: {
      team1: {
        rounds: number;
        team: string;
      };
      team2: {
        rounds: number;
        team: string;
      };
    };
    scoredBy: string;
    team: string | null;
    map: number;
  }>;
}

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [eloTier, setEloTier] = useState("all");
  const [teamSize, setTeamSize] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const fetchMatches = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        status,
        eloTier,
        teamSize,
        ...(playerSearch && { playerSearch }),
        ...(date && { date: date.toISOString() }),
      });

      const response = await fetch(`/api/matches?${params}`);
      const data = await response.json();
      setMatches(data.matches || []);
      setTotalPages(data.pages);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      setMatches([]);
    }
  }, [currentPage, status, eloTier, teamSize, playerSearch, date]);

  const resetPage = useCallback(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage]);

  useEffect(() => {
    resetPage();
    void fetchMatches();
  }, [playerSearch, status, eloTier, teamSize, date, fetchMatches, resetPage]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  const filteredMatches = Array.isArray(matches)
    ? matches.filter((match) => {
        const matchesPlayer = playerSearch
          ? match.players?.some(
              (player) =>
                player.discordNickname
                  .toLowerCase()
                  .includes(playerSearch.toLowerCase()) ||
                player.discordId === playerSearch
            )
          : true;

        const matchesStatus = status === "all" || match.status === status;
        const matchesElo = eloTier === "all" || match.eloTier === eloTier;
        const matchesSize =
          teamSize === "all" || match.teamSize === parseInt(teamSize.charAt(0));

        return matchesPlayer && matchesStatus && matchesElo && matchesSize;
      })
    : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete":
        return "text-green-500";
      case "cancelled":
        return "text-red-500";
      case "in-progress":
        return "text-blue-500";
      case "pending":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    if (status.includes("-")) {
      return status
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("-");
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatEloTier = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "low":
        return "Low";
      case "mid":
        return "Mid";
      case "high":
        return "High";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Match History</h1>
        <div className="text-sm text-muted-foreground">
          {filteredMatches.length} results found
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search by player name or ID..."
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queue">Queue</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="ready-check">Ready Check</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={eloTier} onValueChange={setEloTier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ELO tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="mid">Mid</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teamSize} onValueChange={setTeamSize}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Team Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Match Sizes</SelectItem>
            <SelectItem value="2v2">2v2</SelectItem>
            <SelectItem value="4v4">4v4</SelectItem>
            <SelectItem value="5v5">5v5</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {date ? formatCalendarDate(date) : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          onClick={() => {
            setPlayerSearch("");
            setStatus("all");
            setEloTier("all");
            setTeamSize("all");
            setDate(undefined);
          }}
        >
          Clear
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/50">
          <div>Status</div>
          <div>ELO Tier</div>
          <div>Team Size</div>
          <div>Winner</div>
          <div>Date and Time</div>
        </div>

        <div className="divide-y">
          {filteredMatches.map((match) => (
            <div key={match._id} className="grid grid-cols-5 gap-4 p-4 text-sm">
              <div className={getStatusColor(match.status)}>
                {formatStatus(match.status)}
              </div>
              <div>{formatEloTier(match.eloTier)}</div>
              <div>{`${match.teamSize}v${match.teamSize}`}</div>
              <div className={match.results?.[0]?.team ? "text-blue-500" : ""}>
                {match.results?.[0]?.team || "-"}
              </div>
              <div className="flex items-center justify-between">
                <span>{formatDate(match.createdAt)}</span>
                <Link href={`/matches/${match.matchId}`}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="sr-only">View match details</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
