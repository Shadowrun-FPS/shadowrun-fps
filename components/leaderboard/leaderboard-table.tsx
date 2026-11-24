"use client";

import { memo, useCallback } from "react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { SortableColumnHeader } from "@/components/matches/sortable-column-header";
import { formatElo, formatKd, formatPercent } from "@/lib/leaderboard-stats";
import { cn } from "@/lib/utils";
import type {
  LeaderboardPlayer,
  LeaderboardSort,
  LeaderboardSortKey,
} from "@/types";

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
  sort: LeaderboardSort;
  onSort: (key: LeaderboardSortKey) => void;
  onSelectPlayer: (playerId: string) => void;
  highlightedName?: string | null;
}

const COLUMNS: {
  key: LeaderboardSortKey;
  label: string;
  shortLabel: string;
  align: "left" | "right";
}[] = [
  { key: "rank", label: "Rank", shortLabel: "#", align: "left" },
  { key: "elo", label: "Elo", shortLabel: "Elo", align: "right" },
  { key: "wins", label: "Record", shortLabel: "W-L", align: "right" },
  { key: "winRate", label: "Win %", shortLabel: "WR", align: "right" },
  { key: "kd", label: "K/D", shortLabel: "K/D", align: "right" },
  { key: "matches", label: "Matches", shortLabel: "M", align: "right" },
];

export const LeaderboardTable = memo(function LeaderboardTable({
  players,
  sort,
  onSort,
  onSelectPlayer,
  highlightedName,
}: LeaderboardTableProps) {
  const handleSort = useCallback(
    (key: LeaderboardSortKey) => {
      onSort(key);
    },
    [onSort],
  );

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border/60 md:block">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {COLUMNS.slice(0, 1).map((column) => (
              <SortableColumnHeader
                key={column.key}
                label={column.label}
                shortLabel={column.shortLabel}
                align={column.align}
                direction={sort.key === column.key ? sort.direction : undefined}
                onSort={() => handleSort(column.key)}
                className="w-16"
              />
            ))}
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
            >
              Player
            </th>
            {COLUMNS.slice(1).map((column) => (
              <SortableColumnHeader
                key={column.key}
                label={column.label}
                shortLabel={column.shortLabel}
                align={column.align}
                direction={sort.key === column.key ? sort.direction : undefined}
                onSort={() => handleSort(column.key)}
                className="w-[4.5rem]"
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isHighlighted =
              highlightedName != null &&
              player.name.trim().toLowerCase() ===
                highlightedName.trim().toLowerCase();

            return (
              <tr
                key={player.id}
                tabIndex={0}
                className={cn(
                  "cursor-pointer border-t border-border/50 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isHighlighted && "bg-primary/10",
                )}
                onClick={() => onSelectPlayer(player.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPlayer(player.id);
                  }
                }}
              >
                <td className="px-4 py-2.5 font-semibold tabular-nums text-muted-foreground">
                  {player.rank}
                </td>
                <td className="px-4 py-2.5">
                  <PlayerIdentity
                    name={player.name}
                    tier={player.tier}
                    nameClassName="font-medium"
                  />
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {formatElo(player.elo)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {player.wins}–{player.losses}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatPercent(player.winRate)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatKd(player.kd)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {player.matches}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
