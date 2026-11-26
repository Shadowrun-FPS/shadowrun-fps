import { Fragment } from "react";

import { COMPARE_BAR_CLASS } from "@/lib/compare/config";

// Keep these literals in a scanned file so Tailwind emits the player colors.
// bg-compare-1 bg-compare-2 bg-compare-3 bg-compare-4
// text-compare-1 text-compare-2 text-compare-3 text-compare-4
import { cn } from "@/lib/utils";
import type { MetricGroup, MetricRow } from "@/types/compare";

export interface ComparePerson {
  id: string;
  name: string;
  matches: number;
}

const GROUP_ORDER: MetricGroup[] = ["overview", "combat", "support", "details"];

const GROUP_LABEL: Record<MetricGroup, string> = {
  overview: "Overview",
  combat: "Combat",
  support: "Support",
  details: "Details",
};

function PersonName({ name }: { name: string }) {
  return (
    <span className="min-w-0 truncate" title={name}>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true">{name}</span>
    </span>
  );
}

function ShareBar({ index, value }: { index: number; value: number }) {
  return (
    <span className="block h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <span
        className={cn("block h-2 rounded-full", COMPARE_BAR_CLASS[index] ?? COMPARE_BAR_CLASS[0])}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </span>
  );
}

export function ComparisonTable({ rows, people }: { rows: MetricRow[]; people: ComparePerson[] }) {
  const groups = GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_LABEL[id],
    rows: rows.filter((row) => row.group === id),
  })).filter((group) => group.rows.length > 0);
  if (groups.length === 0 || people.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Stats</h2>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card md:overflow-visible">
        <table className="w-full min-w-[40rem] border-collapse text-sm md:min-w-full md:table-fixed">
          <thead className="md:sticky md:top-[calc(4rem+env(safe-area-inset-top))] md:z-20">
            <tr className="text-left">
              <th className="sticky left-0 z-30 w-[22%] min-w-[8rem] bg-card px-3 py-3 font-medium text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">
                Statistic
              </th>
              {people.map((person) => (
                <th key={person.id} className="min-w-[8.5rem] bg-card px-3 py-3 font-semibold">
                  <PersonName name={person.name} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.id}>
                <tr>
                  <th
                    colSpan={people.length + 1}
                    className="border-t border-border/40 bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {group.label}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 min-w-[8rem] bg-card px-3 py-2.5 text-left font-medium shadow-[1px_0_0_0_hsl(var(--border))]"
                      title={row.definition}
                    >
                      <span>{row.name}</span>
                      <span className="sr-only">{row.definition}</span>
                    </th>
                    {row.cells.map((cell, index) => (
                      <td key={cell.playerId} className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 font-semibold tabular-nums">{cell.text}</span>
                          {cell.bar != null ? <ShareBar index={index} value={cell.bar} /> : null}
                        </div>
                        <p className="sr-only">{cell.accessibleText}</p>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
