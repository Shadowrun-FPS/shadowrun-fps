"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { formatMatchDateTime } from "@/lib/match-date";
import { cn } from "@/lib/utils";
import type { CompareEvidence, CompareScope, PlayerSample } from "@/types/compare";

const OUTCOME_LABEL = {
  win: "Win",
  loss: "Loss",
  unresolved: "Unresolved",
} as const;

function resultText(item: CompareEvidence): string {
  return `${OUTCOME_LABEL[item.outcome]} ${item.scoreLabel}${item.statsRecorded ? "" : " · No stats"}`;
}

export function MatchEvidence({
  players,
  names,
  scope,
}: {
  players: PlayerSample[];
  names: ReadonlyMap<string, string>;
  scope: CompareScope;
}) {
  const [activeId, setActiveId] = useState(players[0]?.playerId ?? "");
  useEffect(() => {
    if (!players.some((sample) => sample.playerId === activeId)) {
      setActiveId(players[0]?.playerId ?? "");
    }
  }, [activeId, players]);
  const any = players.some((sample) => sample.evidence.length > 0);
  if (!any) return null;
  const active = players.find((sample) => sample.playerId === activeId) ?? players[0];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Matches</h2>
        <p className="text-sm text-muted-foreground">
          {scope === "shared" ? "Games where every selected player was seated." : "Each player's matches in this sample."}
        </p>
      </div>
      {scope === "shared" ? (
        <SharedTable players={players} names={names} />
      ) : (
        <>
          {players.length > 1 ? (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Player match lists">
              {players.map((sample) => {
                const name = names.get(sample.playerId) ?? "Player";
                const selected = sample.playerId === active?.playerId;
                return (
                  <button
                    key={sample.playerId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full border px-3 text-sm",
                      selected ? "border-transparent bg-secondary" : "border-border/70 bg-card",
                    )}
                    onClick={() => setActiveId(sample.playerId)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          ) : null}
          {active ? <GameLog sample={active} /> : null}
        </>
      )}
    </section>
  );
}

function SharedTable({
  players,
  names,
}: {
  players: PlayerSample[];
  names: ReadonlyMap<string, string>;
}) {
  const matches = players[0]?.evidence ?? [];
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="text-left">
            <th className="sticky left-0 z-10 min-w-[12rem] bg-card px-3 py-3 font-medium text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">
              Match
            </th>
            {players.map((sample) => (
              <th key={sample.playerId} className="min-w-[8rem] px-3 py-3 font-semibold">
                <span className="block truncate" title={names.get(sample.playerId)}>
                  {names.get(sample.playerId)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matches.map((item) => (
            <tr key={item.matchId} className="border-t border-border/40">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left font-medium shadow-[1px_0_0_0_hsl(var(--border))]"
              >
                <Link href={`/matches?match=${item.matchId}`} className="underline-offset-4 hover:underline">
                  {formatMatchDateTime(item.finishedAt)}
                  <span className="mt-0.5 block font-normal text-muted-foreground">{item.map}</span>
                </Link>
              </th>
              {players.map((sample) => {
                const seat = sample.evidence.find((entry) => entry.matchId === item.matchId);
                return (
                  <td key={sample.playerId} className="px-3 py-2.5 tabular-nums">
                    {seat ? resultText(seat) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameLog({ sample }: { sample: PlayerSample }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="px-3 py-3 font-medium">When</th>
            <th className="px-3 py-3 font-medium">Map</th>
            <th className="px-3 py-3 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {sample.evidence.map((item) => (
            <tr key={item.matchId} className="border-t border-border/40">
              <td className="px-3 py-2.5">
                <Link
                  href={`/matches?match=${item.matchId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {formatMatchDateTime(item.finishedAt)}
                </Link>
              </td>
              <td className="px-3 py-2.5">{item.map}</td>
              <td className="px-3 py-2.5 tabular-nums">{resultText(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
