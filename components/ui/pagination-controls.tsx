"use client";

import { memo, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** First, last, and a window around the current page, with ellipses between. */
function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(pageCount - 1, page + 1);
  const items: PageItem[] = [1];

  if (windowStart > 2) items.push("ellipsis-start");
  for (let current = windowStart; current <= windowEnd; current += 1) {
    items.push(current);
  }
  if (windowEnd < pageCount - 1) items.push("ellipsis-end");

  items.push(pageCount);
  return items;
}

interface PaginationControlsProps {
  /** Current page, starting at 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Mobile-first pagination: large Previous/Next buttons with a "Page X of Y"
 * label on phones, and numbered pages from the `sm` breakpoint up.
 */
export const PaginationControls = memo(function PaginationControls({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const pageItems = useMemo(
    () => getPageItems(page, pageCount),
    [page, pageCount],
  );

  if (pageCount <= 1) return null;

  const isFirstPage = page <= 1;
  const isLastPage = page >= pageCount;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirstPage}
        aria-label="Previous page"
        className="h-11 min-w-[2.75rem] px-3 sm:px-4"
      >
        <ChevronLeft aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <p
        className="text-sm text-muted-foreground tabular-nums sm:hidden"
        aria-live="polite"
      >
        Page {page} of {pageCount}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                type="button"
                variant={item === page ? "default" : "ghost"}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className="h-10 min-w-[2.5rem] px-2 tabular-nums"
              >
                {item}
              </Button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="px-1 text-muted-foreground"
            >
              …
            </li>
          ),
        )}
      </ul>

      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={isLastPage}
        aria-label="Next page"
        className="h-11 min-w-[2.75rem] px-3 sm:px-4"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
});
