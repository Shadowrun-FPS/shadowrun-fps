"use client";

import { Filter, Search, Users, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TournamentsOverviewFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  formatFilter: string;
  onFormatChange: (value: string) => void;
  teamSizeFilter: string;
  onTeamSizeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onClearAll: () => void;
  showClearAll: boolean;
};

export function TournamentsOverviewFilters({
  searchTerm,
  onSearchChange,
  formatFilter,
  onFormatChange,
  teamSizeFilter,
  onTeamSizeChange,
  statusFilter,
  onStatusChange,
  onClearAll,
  showClearAll,
}: TournamentsOverviewFiltersProps) {
  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm sm:mb-8">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2">
              <Filter className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Search & filters
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs sm:text-sm">
                Find tournaments by name, format, size, or status
              </CardDescription>
            </div>
          </div>
          {showClearAll ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-9 gap-2 text-xs sm:text-sm"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear all
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search tournaments..."
            className="h-11 pl-9 pr-11"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tournaments by name or description"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full p-1.5 touch-manipulation hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select value={formatFilter} onValueChange={onFormatChange}>
            <SelectTrigger className="relative h-11 w-full pl-10 pr-3">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <SelectValue placeholder="Format">
                {formatFilter === "all"
                  ? "Format"
                  : formatFilter === "single_elimination"
                    ? "Single elim"
                    : "Double elim"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              <SelectItem value="single_elimination">
                Single elimination
              </SelectItem>
              <SelectItem value="double_elimination">
                Double elimination
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={teamSizeFilter} onValueChange={onTeamSizeChange}>
            <SelectTrigger className="relative h-11 w-full pl-10 pr-3">
              <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <SelectValue placeholder="Team size">
                {teamSizeFilter === "all"
                  ? "Team size"
                  : `${teamSizeFilter}v${teamSizeFilter}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              <SelectItem value="1">1v1</SelectItem>
              <SelectItem value="2">2v2</SelectItem>
              <SelectItem value="3">3v3</SelectItem>
              <SelectItem value="4">4v4</SelectItem>
              <SelectItem value="5">5v5</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="relative h-11 w-full pl-10 pr-3">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <SelectValue placeholder="Status">
                {statusFilter === "all"
                  ? "Status"
                  : statusFilter.charAt(0).toUpperCase() +
                    statusFilter.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
