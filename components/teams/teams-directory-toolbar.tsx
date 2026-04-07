"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamsPageSort, TeamsPageView } from "@/lib/teams-page-url";

type TeamsDirectoryToolbarProps = {
  resultCount: number;
  view: TeamsPageView;
  onViewChange: (view: TeamsPageView) => void;
  sort: TeamsPageSort;
  order: "asc" | "desc";
  onSortChange: (sort: TeamsPageSort) => void;
  onOrderChange: (order: "asc" | "desc") => void;
  onOpenMobileFilters?: () => void;
  activeFilterCount: number;
  showMobileFilterButton: boolean;
};

export function TeamsDirectoryToolbar({
  resultCount,
  view,
  onViewChange,
  sort,
  order,
  onSortChange,
  onOrderChange,
  onOpenMobileFilters,
  activeFilterCount,
  showMobileFilterButton,
}: TeamsDirectoryToolbarProps) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-0 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {resultCount} {resultCount === 1 ? "team" : "teams"} found
          </Badge>
          {showMobileFilterButton && onOpenMobileFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 sm:hidden"
              onClick={onOpenMobileFilters}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Sort</span>
            <Select value={sort} onValueChange={(v) => onSortChange(v as TeamsPageSort)}>
              <SelectTrigger className="h-10 w-full sm:w-[160px]" aria-label="Sort teams by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elo">ELO</SelectItem>
                <SelectItem value="winRatio">Win rate</SelectItem>
                <SelectItem value="wins">Wins</SelectItem>
                <SelectItem value="losses">Losses</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={order}
              onValueChange={(v) => onOrderChange(v as "asc" | "desc")}
            >
              <SelectTrigger className="h-10 w-[110px]" aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">View</span>
            <div
              className="grid h-10 w-full grid-cols-2 gap-1 rounded-full border border-primary/25 bg-gradient-to-b from-muted/50 to-muted/35 p-1 shadow-sm sm:flex sm:w-auto"
              role="group"
              aria-label="Result layout"
            >
              <Button
                type="button"
                variant={view === "grid" ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-full text-xs sm:px-4 sm:text-sm"
                onClick={() => onViewChange("grid")}
              >
                Grid
              </Button>
              <Button
                type="button"
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-full text-xs sm:px-4 sm:text-sm"
                onClick={() => onViewChange("list")}
              >
                List
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
