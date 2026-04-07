import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type RankingsPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function RankingsPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPrev,
  onNext,
}: RankingsPaginationProps) {
  if (totalPages <= 1) return null;

  const pageButtons = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    let page: number;
    if (totalPages <= 7) {
      page = i + 1;
    } else if (currentPage <= 4) {
      page = i + 1;
    } else if (currentPage >= totalPages - 3) {
      page = totalPages - 6 + i;
    } else {
      page = currentPage - 3 + i;
    }
    return page;
  });

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t bg-muted/30 px-4 py-4 sm:flex-row sm:px-6">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * pageSize + 1} to{" "}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} teams
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentPage === 1}
          className="h-9 border-2"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {pageButtons.map((page) => (
            <Button
              key={page}
              type="button"
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-9 min-w-[36px] border-2"
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="h-9 border-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
