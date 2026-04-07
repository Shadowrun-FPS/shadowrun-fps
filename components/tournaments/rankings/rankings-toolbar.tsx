import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardHeader } from "@/components/ui/card";
import type { RankingsSortDirection, RankingsSortOption } from "@/types/rankings";

type RankingsToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availableTeamSizes: number[];
  selectedTeamSize: string;
  onTeamSizeChange: (value: string) => void;
  sortBy: RankingsSortOption;
  sortDirection: RankingsSortDirection;
  onMobileSortChange: (sortBy: RankingsSortOption, dir: RankingsSortDirection) => void;
};

export function RankingsToolbar({
  searchQuery,
  onSearchChange,
  availableTeamSizes,
  selectedTeamSize,
  onTeamSizeChange,
  sortBy,
  sortDirection,
  onMobileSortChange,
}: RankingsToolbarProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams, tags, or captains..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-2 pl-9"
          />
        </div>
        {availableTeamSizes.length > 0 ? (
          <div className="sm:w-[200px]">
            <Select value={selectedTeamSize} onValueChange={onTeamSizeChange}>
              <SelectTrigger className="h-10 w-full border-2">
                <SelectValue placeholder="Team size" />
              </SelectTrigger>
              <SelectContent>
                {availableTeamSizes.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}v{size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="lg:hidden">
          <Select
            value={`${sortBy}-${sortDirection}`}
            onValueChange={(value) => {
              const [newSortBy, newSortDirection] = value.split("-") as [
                RankingsSortOption,
                RankingsSortDirection,
              ];
              onMobileSortChange(newSortBy, newSortDirection);
            }}
          >
            <SelectTrigger className="h-10 w-full border-2 sm:w-[200px]">
              <SelectValue placeholder="Sort by…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elo-desc">Team ELO (high → low)</SelectItem>
              <SelectItem value="elo-asc">Team ELO (low → high)</SelectItem>
              <SelectItem value="wins-desc">Record (most wins)</SelectItem>
              <SelectItem value="wins-asc">Record (least wins)</SelectItem>
              <SelectItem value="winRatio-desc">Win rate (highest)</SelectItem>
              <SelectItem value="winRatio-asc">Win rate (lowest)</SelectItem>
              <SelectItem value="tournamentWins-desc">Tourn. wins (most)</SelectItem>
              <SelectItem value="tournamentWins-asc">Tourn. wins (least)</SelectItem>
              <SelectItem value="members-desc">Members (most)</SelectItem>
              <SelectItem value="members-asc">Members (least)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  );
}
