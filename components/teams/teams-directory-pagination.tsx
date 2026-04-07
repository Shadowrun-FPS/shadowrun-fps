"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TeamsDirectoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  indexOfFirstTeam: number;
  indexOfLastTeam: number;
  totalTeams: number;
  onPageChange: (page: number) => void;
};

export function TeamsDirectoryPagination({
  currentPage,
  totalPages,
  indexOfFirstTeam,
  indexOfLastTeam,
  totalTeams,
  onPageChange,
}: TeamsDirectoryPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Card className="mt-6 border-2 sm:mt-8">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="text-xs text-muted-foreground sm:text-sm">
          Showing{" "}
          <span className="font-medium text-foreground">{indexOfFirstTeam + 1}</span> to{" "}
          <span className="font-medium text-foreground">
            {Math.min(indexOfLastTeam, totalTeams)}
          </span>{" "}
          of <span className="font-medium text-foreground">{totalTeams}</span> teams
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-9 px-3 sm:h-10 sm:px-4"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 items-center rounded-md border-2 border-input bg-background px-3 text-xs font-medium sm:h-10 sm:px-4 sm:text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-3 sm:h-10 sm:px-4"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
          >
            Last
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
