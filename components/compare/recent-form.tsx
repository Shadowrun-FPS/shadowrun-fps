import { COMPARE_BAR_CLASS, COMPARE_INK_CLASS } from "@/lib/compare/config";
import { formatMatchAxisLabel, formatMatchSpan, matchDayKey } from "@/lib/match-date";
import { cn } from "@/lib/utils";
import type { CompareEvidence, CompareScope, PlayerSample } from "@/types/compare";

const RECENT_LIMIT = 12;
const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

interface PlotPoint {
  ms: number;
  value: number | null;
}

interface Series {
  playerId: string;
  name: string;
  points: PlotPoint[];
}

function pointFrom(item: CompareEvidence, value: number | null): PlotPoint | null {
  const ms = Date.parse(item.finishedAt);
  if (!Number.isFinite(ms)) return null;
  return { ms, value };
}

function seriesFor(players: PlayerSample[], names: ReadonlyMap<string, string>, scope: CompareScope): Series[] {
  if (scope === "shared") {
    const matches = (players[0]?.evidence ?? []).slice(0, RECENT_LIMIT).reverse();
    return players.map((sample) => ({
      playerId: sample.playerId,
      name: names.get(sample.playerId) ?? "Player",
      points: matches.flatMap((match) => {
        const seat = sample.evidence.find((item) => item.matchId === match.matchId);
        const point = pointFrom(match, seat?.killsPerRound ?? null);
        return point ? [point] : [];
      }),
    }));
  }

  return players.map((sample) => ({
    playerId: sample.playerId,
    name: names.get(sample.playerId) ?? "Player",
    points: [...sample.evidence]
      .filter((item) => item.killsPerRound != null)
      .slice(0, RECENT_LIMIT)
      .reverse()
      .flatMap((item) => {
        const point = pointFrom(item, item.killsPerRound);
        return point ? [point] : [];
      }),
  }));
}

function axisMax(series: Series[]): number {
  const peak = Math.max(
    ...series.flatMap((item) =>
      item.points.map((point) => point.value).filter((value): value is number => value != null),
    ),
    0,
  );
  return Math.max(1, Math.ceil(peak * 2) / 2);
}

function xAt(index: number, count: number): number {
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  if (count <= 1) return PAD_LEFT + plotWidth / 2;
  return PAD_LEFT + (index / (count - 1)) * plotWidth;
}

function yFor(value: number, max: number): number {
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + (1 - value / max) * plotHeight;
}

function segments(points: PlotPoint[], yMax: number): string[] {
  const lines: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length > 1) lines.push(current.join(" "));
    current = [];
  };
  points.forEach((point, index) => {
    if (point.value == null) {
      flush();
      return;
    }
    current.push(`${xAt(index, points.length).toFixed(1)},${yFor(point.value, yMax).toFixed(1)}`);
  });
  flush();
  return lines;
}

function tickLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function rangeLabel(points: PlotPoint[]): string | null {
  const dated = points.filter((point) => point.value != null);
  const first = dated[0];
  const last = dated[dated.length - 1];
  if (!first || !last) return null;
  return formatMatchSpan(first.ms, last.ms);
}

function sharedAxisLabels(points: PlotPoint[]): Array<{ index: number; label: string }> {
  const usable = points.flatMap((point, index) => (point.value != null ? [{ index, ms: point.ms }] : []));
  const first = usable[0];
  const last = usable[usable.length - 1];
  if (!first || !last) return [];
  const sameDay = matchDayKey(first.ms) === matchDayKey(last.ms);
  const withYear = matchDayKey(first.ms).slice(0, 4) !== matchDayKey(last.ms).slice(0, 4);
  const labelFor = (ms: number) => formatMatchAxisLabel(ms, sameDay, withYear);
  if (first.index === last.index) return [{ index: first.index, label: labelFor(first.ms) }];
  const labels = [{ index: first.index, label: labelFor(first.ms) }];
  if (usable.length >= 5) {
    const middle = usable[Math.floor((usable.length - 1) / 2)];
    if (middle && middle.index !== first.index && middle.index !== last.index) {
      const middleLabel = labelFor(middle.ms);
      if (middleLabel !== labels[0]?.label && middleLabel !== labelFor(last.ms)) {
        labels.push({ index: middle.index, label: middleLabel });
      }
    }
  }
  labels.push({ index: last.index, label: labelFor(last.ms) });
  return labels;
}

export function RecentForm({
  players,
  names,
  scope,
}: {
  players: PlayerSample[];
  names: ReadonlyMap<string, string>;
  scope: CompareScope;
}) {
  const series = seriesFor(players, names, scope);
  const plotted = series.some((item) => item.points.some((point) => point.value != null));
  if (!plotted) return null;
  const max = axisMax(series);
  const step = max <= 3 ? 0.5 : 1;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, index) => Math.round(index * step * 10) / 10);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const sharedLabels = scope === "shared" ? sharedAxisLabels(series[0]?.points ?? []) : [];
  const caption =
    scope === "shared"
      ? "Each point is a match everyone selected played, evenly spaced from the oldest to the newest."
      : "Each line is that player's own matches, evenly spaced. The left end is their oldest match in this sample, and the right end is their newest.";

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Kills per round</h2>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {series.map((item, index) => {
            const range = rangeLabel(item.points);
            return (
              <li key={item.playerId} className="flex min-w-0 items-baseline gap-2 text-sm">
                <span className={cn("h-0.5 w-4 shrink-0 self-center rounded-full", COMPARE_BAR_CLASS[index])} aria-hidden="true" />
                <span className="truncate font-medium" title={item.name}>
                  {item.name}
                </span>
                {range ? <span className="truncate text-muted-foreground">{range}</span> : null}
              </li>
            );
          })}
        </ul>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="mt-2 h-56 w-full"
          role="img"
          aria-label={series
            .map((item) => {
              const values = item.points.filter((point): point is PlotPoint & { value: number } => point.value != null);
              return values.length > 0
                ? `${item.name}: ${values.map((point) => `${formatMatchAxisLabel(point.ms, false, false)} ${point.value.toFixed(1)}`).join(", ")}`
                : `${item.name}: no per-round kills`;
            })
            .join(". ")}
        >
          {ticks.map((tick) => {
            const y = PAD_TOP + (1 - tick / max) * plotHeight;
            return (
              <g key={tick}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />
                <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                  {tickLabel(tick)}
                </text>
              </g>
            );
          })}
          {scope === "shared"
            ? sharedLabels.map((tick, index) => {
                const count = series[0]?.points.length ?? 1;
                const anchor = index === 0 ? "start" : index === sharedLabels.length - 1 ? "end" : "middle";
                return (
                  <text
                    key={`${tick.index}-${tick.label}`}
                    x={xAt(tick.index, count)}
                    y={HEIGHT - 8}
                    textAnchor={anchor}
                    className="fill-muted-foreground text-[11px]"
                  >
                    {tick.label}
                  </text>
                );
              })
            : (
              <>
                <text x={PAD_LEFT} y={HEIGHT - 8} className="fill-muted-foreground text-[11px]">
                  Oldest match
                </text>
                <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 8} textAnchor="end" className="fill-muted-foreground text-[11px]">
                  Newest match
                </text>
              </>
            )}
          {series.map((item, index) => (
            <g key={item.playerId} className={COMPARE_INK_CLASS[index]}>
              {segments(item.points, max).map((points) => (
                <polyline
                  key={points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={points}
                />
              ))}
              {item.points.map((point, pointIndex) => {
                if (point.value == null) return null;
                return (
                  <circle
                    key={`${item.playerId}-${pointIndex}`}
                    cx={xAt(pointIndex, item.points.length).toFixed(1)}
                    cy={yFor(point.value, max).toFixed(1)}
                    r="3.5"
                    fill="currentColor"
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
