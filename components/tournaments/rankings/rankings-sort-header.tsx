import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { RankingsSortDirection, RankingsSortOption } from "@/types/rankings";

type RankingsSortHeaderProps = {
  sortBy: RankingsSortOption;
  sortDirection: RankingsSortDirection;
  onSort: (column: RankingsSortOption) => void;
};

function SortGlyph({
  column,
  sortBy,
  sortDirection,
}: {
  column: RankingsSortOption;
  sortBy: RankingsSortOption;
  sortDirection: RankingsSortDirection;
}) {
  if (sortBy !== column) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden />
  );
}

export function RankingsSortHeader({
  sortBy,
  sortDirection,
  onSort,
}: RankingsSortHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 hidden border-b bg-muted/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/60 lg:flex"
      role="row"
    >
      <div className="w-12 shrink-0" role="presentation" />
      <div className="min-w-0 max-w-[300px] flex-1" role="presentation" />
      <div
        className="ml-auto grid w-[600px] shrink-0 grid-cols-5 gap-4 text-sm font-semibold text-muted-foreground"
        role="presentation"
      >
        <button
          type="button"
          onClick={() => onSort("elo")}
          className="flex cursor-pointer items-center justify-end gap-1.5 transition-colors hover:text-foreground"
        >
          Team ELO
          <SortGlyph column="elo" sortBy={sortBy} sortDirection={sortDirection} />
        </button>
        <button
          type="button"
          onClick={() => onSort("wins")}
          className="flex cursor-pointer items-center justify-end gap-1.5 transition-colors hover:text-foreground"
        >
          Record
          <SortGlyph column="wins" sortBy={sortBy} sortDirection={sortDirection} />
        </button>
        <button
          type="button"
          onClick={() => onSort("winRatio")}
          className="flex cursor-pointer items-center justify-end gap-1.5 transition-colors hover:text-foreground"
        >
          Win rate
          <SortGlyph
            column="winRatio"
            sortBy={sortBy}
            sortDirection={sortDirection}
          />
        </button>
        <button
          type="button"
          onClick={() => onSort("tournamentWins")}
          className="flex cursor-pointer items-center justify-end gap-1.5 transition-colors hover:text-foreground"
        >
          Tourn. wins
          <SortGlyph
            column="tournamentWins"
            sortBy={sortBy}
            sortDirection={sortDirection}
          />
        </button>
        <button
          type="button"
          onClick={() => onSort("members")}
          className="flex cursor-pointer items-center justify-end gap-1.5 transition-colors hover:text-foreground"
        >
          Members
          <SortGlyph column="members" sortBy={sortBy} sortDirection={sortDirection} />
        </button>
      </div>
    </div>
  );
}
