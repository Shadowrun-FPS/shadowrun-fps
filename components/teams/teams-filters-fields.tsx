"use client";

import { useId } from "react";
import { Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TournamentListing } from "@/types";
import type { TeamsPageTeamStatus } from "@/lib/teams-page-url";

type TeamsFiltersFieldsProps = {
  tournaments: TournamentListing[];
  selectedTournament: string;
  onTournamentChange: (value: string) => void;
  selectedTeamSize: string;
  onTeamSizeChange: (value: string) => void;
  teamStatus: TeamsPageTeamStatus;
  onTeamStatusChange: (value: TeamsPageTeamStatus) => void;
};

export function TeamsFiltersFields({
  tournaments,
  selectedTournament,
  onTournamentChange,
  selectedTeamSize,
  onTeamSizeChange,
  teamStatus,
  onTeamStatusChange,
}: TeamsFiltersFieldsProps) {
  const uid = useId();
  const ridAll = `${uid}-all`;
  const ridFull = `${uid}-full`;
  const ridOpen = `${uid}-open`;

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold" htmlFor={`${uid}-tournament`}>
          <span className="relative rounded-md border border-primary/20 bg-primary/10 p-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden />
          </span>
          Tournament
          {selectedTournament !== "all" ? (
            <Badge variant="secondary" className="ml-auto text-xs">
              Active
            </Badge>
          ) : null}
        </label>
        <Select value={selectedTournament} onValueChange={onTournamentChange}>
          <SelectTrigger
            id={`${uid}-tournament`}
            className="h-11 w-full border-2 transition-colors focus:border-primary/50"
          >
            <SelectValue placeholder="All Tournaments">
              {selectedTournament === "all"
                ? "All Tournaments"
                : tournaments.find((t) => t._id === selectedTournament)?.name ||
                  "Select tournament..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All Tournaments</SelectItem>
            {tournaments
              .filter((tournament) => {
                if (selectedTeamSize !== "all") {
                  const tournamentTeamSize = tournament.teamSize || 4;
                  if (tournamentTeamSize !== parseInt(selectedTeamSize, 10)) {
                    return false;
                  }
                }
                return true;
              })
              .map((tournament) => (
                <SelectItem key={tournament._id} value={tournament._id}>
                  {tournament.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold" htmlFor={`${uid}-size`}>
          <span className="relative rounded-md border border-primary/20 bg-primary/10 p-1.5">
            <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
          </span>
          Team Size
          {selectedTeamSize !== "4" ? (
            <Badge variant="secondary" className="ml-auto text-xs">
              Active
            </Badge>
          ) : null}
        </label>
        <Select value={selectedTeamSize} onValueChange={onTeamSizeChange}>
          <SelectTrigger
            id={`${uid}-size`}
            className="h-11 border-2 transition-colors focus:border-primary/50"
          >
            <SelectValue placeholder="All Team Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Sizes</SelectItem>
            <SelectItem value="2">2v2 (2 players)</SelectItem>
            <SelectItem value="3">3v3 (3 players)</SelectItem>
            <SelectItem value="4">4v4 (4 players)</SelectItem>
            <SelectItem value="5">5v5 (5 players)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative rounded-md border border-primary/20 bg-primary/10 p-1.5">
            <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
          </span>
          Team Status
          {teamStatus !== "all" ? (
            <Badge variant="secondary" className="ml-auto text-xs">
              Active
            </Badge>
          ) : null}
        </span>
        <RadioGroup
          value={teamStatus}
          onValueChange={(value) => onTeamStatusChange(value as TeamsPageTeamStatus)}
          className="flex flex-col gap-3"
        >
          <div
            className={`group flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-3 transition-all ${
              teamStatus === "all"
                ? "border-primary/40 bg-primary/10 shadow-sm"
                : "border-transparent hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <RadioGroupItem value="all" id={ridAll} />
            <label htmlFor={ridAll} className="flex-1 cursor-pointer text-sm font-medium">
              All Teams
            </label>
          </div>
          <div
            className={`group flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-3 transition-all ${
              teamStatus === "full"
                ? "border-primary/40 bg-primary/10 shadow-sm"
                : "border-transparent hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <RadioGroupItem value="full" id={ridFull} />
            <label htmlFor={ridFull} className="flex-1 cursor-pointer text-sm font-medium">
              Full Teams
            </label>
          </div>
          <div
            className={`group flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-3 transition-all ${
              teamStatus === "open"
                ? "border-primary/40 bg-primary/10 shadow-sm"
                : "border-transparent hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <RadioGroupItem value="open" id={ridOpen} />
            <label htmlFor={ridOpen} className="flex-1 cursor-pointer text-sm font-medium">
              Teams Looking for Members
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
