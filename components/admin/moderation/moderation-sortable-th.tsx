"use client";

import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface ModerationSortableThProps {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}

export function ModerationSortableTh({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className,
}: ModerationSortableThProps) {
  const active = sortKey === columnKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="-mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onSort(columnKey)}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="truncate">{label}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
