import Link from "next/link";

import { ResultPips } from "@/components/rivals/result-pips";
import { PlayerIdentity } from "@/components/leaderboard/rank-tier-mark";
import { formatKd, formatPercent, formatStatAverage } from "@/lib/leaderboard-stats";
import { formatMatchDateTime } from "@/lib/match-date";
import { RECENT_WINDOW_MS } from "@/lib/rivals/config";
import {
  currentStreak,
  encountersInWindow,
  formatEncounterScore,
  formatSeriesScore,
  mapRecords,
  playerName,
  resultFor,
  seriesRecord,
} from "@/lib/rivals/pairs";
import { rivalPerformance } from "@/lib/rivals/performance";
import { buildStoryEvents, nextEncounterStakes, storyText } from "@/lib/rivals/stories";
import type { PerformanceRates, RivalIndex, RivalSeries, SeriesRecord, SeriesStreak } from "@/types/rivals";

function RecordLine({ label, record }: { label: string; record: SeriesRecord }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">
        {formatSeriesScore(record.wins, record.losses)}
      </p>
      <p className="text-xs text-muted-foreground">
        {record.meetings} meetings
        {record.unresolved > 0 ? ` · ${record.unresolved} unresolved` : ""}
      </p>
    </div>
  );
}

function leadText(record: SeriesRecord): string {
  if (record.decisive === 0) return "No decisive results in the recorded history.";
  if (record.wins === record.losses) return "The recorded series is tied.";
  if (record.wins > record.losses) {
    return `You lead the recorded series by ${record.wins - record.losses}.`;
  }
  return `You trail in the recorded series by ${record.losses - record.wins}.`;
}

function streakSentence(streak: SeriesStreak): string {
  if (streak.kind === "none" || streak.length < 1) return "No current streak.";
  const label = streak.kind === "win" ? "winning" : "losing";
  return `Current streak: ${streak.length} ${label} ${streak.length === 1 ? "meeting" : "meetings"}.`;
}

function RateCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function PerformanceColumn({ title, rates }: { title: string; rates: PerformanceRates }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Stats recorded in {rates.sample} of {rates.meetings}.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <RateCell label="Kills / round" value={formatStatAverage(rates.killsPerRound)} />
        <RateCell label="Resurrects / round" value={formatStatAverage(rates.resurrectsPerRound)} />
        <RateCell label="K/D" value={formatKd(rates.kd)} />
        <RateCell label="Accuracy" value={formatPercent(rates.accuracy)} />
      </dl>
    </div>
  );
}

export function SeriesSummary({
  index,
  viewerId,
  pairKey,
  detailed = false,
}: {
  index: RivalIndex;
  viewerId: string;
  pairKey: string;
  detailed?: boolean;
}) {
  const series = index.seriesByKey.get(pairKey);
  if (!series || !series.playerIds.includes(viewerId)) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
        No recorded opposing-team meetings for this pair.
      </p>
    );
  }

  const opponentId = series.playerIds[0] === viewerId ? series.playerIds[1] : series.playerIds[0];
  const lifetime = seriesRecord(series.encounters, viewerId);
  const recent = seriesRecord(
    encountersInWindow(series.encounters, index.asOfMs, RECENT_WINDOW_MS),
    viewerId,
  );
  const streak = currentStreak(series.encounters, viewerId);
  const first = series.encounters[0];
  const latest = series.encounters[series.encounters.length - 1];
  const stakes = nextEncounterStakes(lifetime, streak);
  const opponent = index.players.get(opponentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlayerIdentity
          name={opponent?.name ?? playerName(index, opponentId)}
          tier={opponent?.tier}
          nameClassName="text-lg font-semibold"
        />
        <p className="text-3xl font-semibold tabular-nums tracking-tight">
          {formatSeriesScore(lifetime.wins, lifetime.losses)}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Recorded opposing-team results. A 4v4 shares one team result across every opposing pair.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <RecordLine label="Recorded history" record={lifetime} />
        <RecordLine label="Last 30 days" record={recent} />
      </div>
      <p className="text-sm">{leadText(lifetime)}</p>
      <p className="text-sm">{streakSentence(streak)}</p>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Last five recorded meetings
        </p>
        <ResultPips results={lifetime.lastFive} />
      </div>
      <p className="text-sm text-muted-foreground">
        First {first ? formatMatchDateTime(first.finishedAt) : "—"}
        {" · "}
        Latest {latest ? formatMatchDateTime(latest.finishedAt) : "—"}
      </p>
      {stakes.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {stakes.map((stake) => (
            <li key={stake}>{stake}</li>
          ))}
        </ul>
      ) : null}
      {detailed ? <SeriesDetail index={index} viewerId={viewerId} series={series} /> : null}
    </div>
  );
}

function SeriesDetail({
  index,
  viewerId,
  series,
}: {
  index: RivalIndex;
  viewerId: string;
  series: RivalSeries;
}) {
  const maps = mapRecords(series.encounters, viewerId);
  const events = buildStoryEvents(series);
  const performance = rivalPerformance(index.matches, series.encounters, viewerId);
  const nameFor = (playerId: string) => playerName(index, playerId);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Maps</h2>
        <ul className="space-y-2">
          {maps.map((map) => (
            <li
              key={map.map}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{map.map}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatSeriesScore(map.wins, map.losses)} · {map.meetings}{" "}
                {map.meetings === 1 ? "meeting" : "meetings"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Recorded history</h2>
        <p className="text-sm text-muted-foreground">
          This is the history in the current snapshot, which may not include every past match.
        </p>
        <ol className="space-y-2">
          {series.encounters.map((encounter) => {
            const result = resultFor(encounter, viewerId);
            return (
              <li key={encounter.matchId}>
                <Link
                  href={`/matches?match=${encounter.matchId}`}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    {formatMatchDateTime(encounter.finishedAt)} · {encounter.map}
                  </span>
                  <span className="tabular-nums">
                    {result === "win" ? "Win" : result === "loss" ? "Loss" : "Result unavailable"}{" "}
                    {formatEncounterScore(encounter, viewerId)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">What changed</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No series events yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="text-sm">
                <Link href={`/matches?match=${event.matchId}`} className="hover:underline">
                  {storyText(event, viewerId, series, nameFor)}
                </Link>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatMatchDateTime(event.finishedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Performance</h2>
        <p className="text-sm text-muted-foreground">
          Your performance in matches against this opponent&apos;s team. Rounds are the recorded
          score total. Missing stat lines are left out.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <PerformanceColumn title="These meetings" rates={performance.versus} />
          <PerformanceColumn title="Your other recorded matches" rates={performance.other} />
        </div>
      </section>
    </div>
  );
}
