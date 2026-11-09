import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types";

interface SortableColumnHeaderProps {
  label: string;
  /** Compact label for narrow screens; falls back to `label`. */
  shortLabel?: string;
  /** Direction when this column is the active sort, otherwise undefined. */
  direction?: SortDirection;
  align?: "left" | "right";
  onSort: () => void;
  className?: string;
}

/** Table header cell that toggles sorting; exposes `aria-sort` for assistive tech. */
export function SortableColumnHeader({
  label,
  shortLabel,
  direction,
  align = "right",
  onSort,
  className,
}: SortableColumnHeaderProps) {
  const SortIcon = direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
      className={cn("whitespace-nowrap font-medium", className)}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "flex min-h-[3.5rem] w-full py-3 items-center gap-0.5 px-1 uppercase tracking-wider transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-1 sm:px-4",
          align === "right"
            ? "justify-end text-right"
            : "justify-start text-left",
          direction && "text-foreground",
        )}
      >
        {shortLabel ? (
          <>
            <span className="sm:hidden" aria-hidden="true">
              {shortLabel}
            </span>
            <span className="sr-only sm:not-sr-only">{label}</span>
          </>
        ) : (
          label
        )}
        {direction ? (
          <SortIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    </th>
  );
}
