import { COMPARE_BAR_CLASS } from "@/lib/compare/config";
import { cn } from "@/lib/utils";
import type { CompareMapRow, PlayerSample } from "@/types/compare";

function score(wins: number, losses: number): string {
  return `${wins}–${losses}`;
}

function winShare(row: CompareMapRow | undefined): number | null {
  if (!row) return null;
  const decisive = row.wins + row.losses;
  if (decisive <= 0) return null;
  return row.wins / decisive;
}

export function MapBreakdown({
  players,
  names,
}: {
  players: PlayerSample[];
  names: ReadonlyMap<string, string>;
}) {
  const maps = [...new Set(players.flatMap((sample) => sample.maps.map((row) => row.map)))].sort((left, right) =>
    left.localeCompare(right),
  );
  if (maps.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Maps</h2>
        <p className="text-sm text-muted-foreground">Wins and losses on each map in this sample.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card md:overflow-visible">
        <table className="w-full min-w-[40rem] border-collapse text-sm md:min-w-full md:table-fixed">
          <thead className="md:sticky md:top-[calc(4rem+env(safe-area-inset-top))] md:z-20">
            <tr className="text-left">
              <th className="sticky left-0 z-30 w-[22%] min-w-[8rem] bg-card px-3 py-3 font-medium text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">
                Map
              </th>
              {players.map((sample) => (
                <th key={sample.playerId} className="min-w-[8.5rem] bg-card px-3 py-3 font-semibold">
                  <span className="block truncate" title={names.get(sample.playerId)}>
                    {names.get(sample.playerId)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maps.map((map) => (
              <tr key={map} className="border-t border-border/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-[8rem] bg-card px-3 py-2.5 text-left font-medium shadow-[1px_0_0_0_hsl(var(--border))]"
                >
                  {map}
                </th>
                {players.map((sample, index) => {
                  const row = sample.maps.find((item) => item.map === map);
                  const share = winShare(row);
                  return (
                    <td key={sample.playerId} className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 font-semibold tabular-nums">
                          {row ? score(row.wins, row.losses) : "—"}
                        </span>
                        {share != null ? (
                          <span className="block h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <span
                              className={cn("block h-2 rounded-full", COMPARE_BAR_CLASS[index])}
                              style={{ width: `${Math.round(share * 100)}%` }}
                            />
                          </span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
