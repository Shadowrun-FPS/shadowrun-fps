"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search } from "lucide-react";

import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LeaderboardPlayer } from "@/types";

const MAX_SUGGESTIONS = 8;

function rankPlayerMatches(
  players: LeaderboardPlayer[],
  query: string,
): LeaderboardPlayer[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const startsWith: LeaderboardPlayer[] = [];
  const includes: LeaderboardPlayer[] = [];

  for (const player of players) {
    const name = player.name.toLowerCase();
    if (name.startsWith(normalized)) startsWith.push(player);
    else if (name.includes(normalized)) includes.push(player);
  }

  const byName = (first: LeaderboardPlayer, second: LeaderboardPlayer) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: "base" });

  return [...startsWith.sort(byName), ...includes.sort(byName)].slice(
    0,
    MAX_SUGGESTIONS,
  );
}

interface PlayerNameSearchProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  players: LeaderboardPlayer[];
  /** Fires after a suggestion is chosen (exact name already applied via onChange). */
  onSelectPlayer?: (playerId: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  "aria-label"?: string;
}

/** Search input with in-memory player name suggestions for unusual or similar names. */
export function PlayerNameSearch({
  id,
  value,
  onChange,
  players,
  onSelectPlayer,
  placeholder = "Search player name",
  maxLength = 64,
  className,
  "aria-label": ariaLabel = "Search by player name",
}: PlayerNameSearchProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(
    () => rankPlayerMatches(players, value),
    [players, value],
  );

  const showList = isOpen && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const pickPlayer = useCallback(
    (player: LeaderboardPlayer) => {
      onChange(player.name);
      onSelectPlayer?.(player.id);
      setIsOpen(false);
    },
    [onChange, onSelectPlayer],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        return;
      }

      if (!suggestions.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) =>
          current + 1 >= suggestions.length ? 0 : current + 1,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((current) =>
          current - 1 < 0 ? suggestions.length - 1 : current - 1,
        );
        return;
      }

      if (event.key === "Enter" && isOpen) {
        const active = suggestions[activeIndex];
        if (active) {
          event.preventDefault();
          pickPlayer(active);
        }
      }
    },
    [activeIndex, isOpen, pickPlayer, suggestions],
  );

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={
          showList ? `${listboxId}-option-${activeIndex}` : undefined
        }
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-9"
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
      />
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Player name suggestions"
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((player, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={player.id} role="presentation">
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickPlayer(player)}
                >
                  <PlayerIdentity
                    name={player.name}
                    tier={player.tier}
                    markSize={20}
                    nameClassName="font-medium"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
