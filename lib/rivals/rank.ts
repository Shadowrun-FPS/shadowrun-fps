import {
  CONFIDENCE_PRIOR,
  EMERGING_MAX,
  EMERGING_MIN,
  ESTABLISHED_MIN,
  MAIN_RIVAL_WEIGHTS,
  NEMESIS_WIN_RATE_DENOMINATOR,
  NEMESIS_WIN_RATE_NUMERATOR,
  RECENCY_TAU_DAYS,
  RECENT_WINDOW_MS,
  VOLUME_TAU,
} from "@/lib/rivals/config";
import {
  currentStreak,
  daysBetween,
  encountersInWindow,
  opponentIdFor,
  seriesRecord,
} from "@/lib/rivals/pairs";
import type {
  FeaturedRival,
  FeaturedSet,
  OpponentSummary,
  RivalIndex,
  SeriesRecord,
} from "@/types/rivals";

export function winRateAtMost(
  wins: number,
  decisive: number,
  numerator: number,
  denominator: number,
): boolean {
  if (decisive <= 0) return false;
  return wins * denominator <= decisive * numerator;
}

export function mainRivalScoreMicros(record: SeriesRecord, asOfMs: number): number {
  if (record.meetings <= 0) return 0;

  const volume = 1 - Math.exp(-record.meetings / VOLUME_TAU);
  const competitiveness =
    record.decisive > 0
      ? 1 - 2 * Math.abs(record.wins / record.decisive - 0.5)
      : 0;
  const days = record.newestMs > 0 ? daysBetween(record.newestMs, asOfMs) : 0;
  const recency = Math.exp(-days / RECENCY_TAU_DAYS);
  const closeRate = record.decisive > 0 ? record.close / record.decisive : 0;
  const confidence = record.meetings / (record.meetings + CONFIDENCE_PRIOR);
  const raw =
    MAIN_RIVAL_WEIGHTS.volume * volume +
    MAIN_RIVAL_WEIGHTS.competitiveness * competitiveness +
    MAIN_RIVAL_WEIGHTS.recency * recency +
    MAIN_RIVAL_WEIGHTS.close * closeRate;

  return Math.round(confidence * raw * 1_000_000);
}

function compareMain(left: OpponentSummary, right: OpponentSummary): number {
  if (right.scoreMicros !== left.scoreMicros) return right.scoreMicros - left.scoreMicros;
  if (right.recent.meetings !== left.recent.meetings) {
    return right.recent.meetings - left.recent.meetings;
  }
  if (right.recent.newestMs !== left.recent.newestMs) {
    return right.recent.newestMs - left.recent.newestMs;
  }
  return left.opponentId.localeCompare(right.opponentId);
}

function compareNemesis(left: OpponentSummary, right: OpponentSummary): number {
  const rate =
    left.recent.wins * right.recent.decisive -
    right.recent.wins * left.recent.decisive;
  if (rate !== 0) return rate;
  if (right.recent.losses !== left.recent.losses) {
    return right.recent.losses - left.recent.losses;
  }
  if (right.recent.newestMs !== left.recent.newestMs) {
    return right.recent.newestMs - left.recent.newestMs;
  }
  return left.opponentId.localeCompare(right.opponentId);
}

export function opponentSummaries(
  index: RivalIndex,
  playerId: string,
): OpponentSummary[] {
  const keys = index.pairKeysByPlayer.get(playerId) ?? [];
  const summaries: OpponentSummary[] = [];

  for (const pairKey of keys) {
    const series = index.seriesByKey.get(pairKey);
    if (!series) continue;
    const recentEncounters = encountersInWindow(
      series.encounters,
      index.asOfMs,
      RECENT_WINDOW_MS,
    );
    const recent = seriesRecord(recentEncounters, playerId);
    const lifetime = seriesRecord(series.encounters, playerId);
    const recentWinRate =
      recent.decisive > 0 ? recent.wins / recent.decisive : null;
    const nemesis =
      recent.meetings >= ESTABLISHED_MIN &&
      winRateAtMost(
        recent.wins,
        recent.decisive,
        NEMESIS_WIN_RATE_NUMERATOR,
        NEMESIS_WIN_RATE_DENOMINATOR,
      );

    summaries.push({
      opponentId: opponentIdFor(series, playerId),
      pairKey,
      recent,
      lifetime,
      streak: currentStreak(series.encounters, playerId),
      scoreMicros: mainRivalScoreMicros(recent, index.asOfMs),
      recentWinRate,
      nemesis,
      emerging:
        recent.meetings >= EMERGING_MIN && recent.meetings <= EMERGING_MAX,
      established: lifetime.meetings >= ESTABLISHED_MIN || recent.meetings >= ESTABLISHED_MIN,
      quietLately: lifetime.meetings >= ESTABLISHED_MIN && recent.meetings < EMERGING_MIN,
    });
  }

  return summaries;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function explainMainRival(record: SeriesRecord): string {
  const times = plural(record.meetings, "time");
  const series = `${record.wins}–${record.losses}`;
  const close = plural(record.close, "close match", "close matches");
  if (record.wins === record.losses) {
    return `You've faced each other ${times} in the last 30 days, split the series ${series}, and played ${close}.`;
  }
  return `You've faced each other ${times} in the last 30 days. The series is ${series}, with ${close}.`;
}

export function explainNemesis(record: SeriesRecord): string {
  return `Your teams are ${record.wins}–${record.losses} across ${plural(record.meetings, "meeting")} in the last 30 days.`;
}

export function explainEmerging(record: SeriesRecord): string {
  return `You've met ${plural(record.meetings, "time")} in the last 30 days, and the series is ${record.wins}–${record.losses}. This rivalry is still developing.`;
}

function toFeatured(
  summary: OpponentSummary,
  badges: FeaturedRival["badges"],
  explanation: string,
  mutualMain: boolean,
): FeaturedRival {
  return {
    opponentId: summary.opponentId,
    pairKey: summary.pairKey,
    badges,
    explanation,
    mutualMain,
    recent: summary.recent,
    lifetime: summary.lifetime,
    streak: summary.streak,
  };
}

export function mainRivalByPlayer(index: RivalIndex): Map<string, string | null> {
  const result = new Map<string, string | null>();
  for (const playerId of index.pairKeysByPlayer.keys()) {
    const established = opponentSummaries(index, playerId)
      .filter((summary) => summary.recent.meetings >= ESTABLISHED_MIN)
      .sort(compareMain);
    result.set(playerId, established[0]?.opponentId ?? null);
  }
  return result;
}

export function selectFeatured(index: RivalIndex, playerId: string): FeaturedSet {
  const summaries = opponentSummaries(index, playerId);
  const mains = summaries
    .filter((summary) => summary.recent.meetings >= ESTABLISHED_MIN)
    .sort(compareMain);
  const nemeses = summaries.filter((summary) => summary.nemesis).sort(compareNemesis);
  const emerging = summaries.filter((summary) => summary.emerging).sort(compareMain);
  const main = mains[0] ?? null;
  const mainsByPlayer = main ? mainRivalByPlayer(index) : null;
  const mutualMain = Boolean(
    main && mainsByPlayer?.get(main.opponentId) === playerId,
  );

  const mainIsNemesis = Boolean(main && nemeses.some((summary) => summary.opponentId === main.opponentId));
  const distinctNemesis =
    nemeses.find((summary) => summary.opponentId !== main?.opponentId) ?? null;
  const distinctEmerging =
    emerging.find(
      (summary) =>
        summary.opponentId !== main?.opponentId &&
        summary.opponentId !== distinctNemesis?.opponentId,
    ) ?? null;

  return {
    developing: main == null,
    main: main
      ? toFeatured(
          main,
          mainIsNemesis ? ["main", "nemesis"] : ["main"],
          explainMainRival(main.recent),
          mutualMain,
        )
      : null,
    nemesis: distinctNemesis
      ? toFeatured(
          distinctNemesis,
          ["nemesis"],
          explainNemesis(distinctNemesis.recent),
          false,
        )
      : null,
    nemesisNote:
      !distinctNemesis && mainIsNemesis
        ? "Your Main Rival is also your only Nemesis."
        : null,
    emerging: distinctEmerging
      ? toFeatured(
          distinctEmerging,
          ["emerging"],
          explainEmerging(distinctEmerging.recent),
          false,
        )
      : null,
    emergingNote:
      !distinctEmerging &&
      emerging.length > 0 &&
      emerging.every(
        (summary) =>
          summary.opponentId === main?.opponentId ||
          summary.opponentId === distinctNemesis?.opponentId,
      )
        ? "Your other featured rival is also the only emerging one."
        : null,
  };
}

export function tableBadge(
  summary: OpponentSummary,
  featured: FeaturedSet,
): "main" | "nemesis" | "emerging" | "established" | null {
  if (featured.main?.opponentId === summary.opponentId) return "main";
  if (summary.nemesis) return "nemesis";
  if (summary.emerging) return "emerging";
  if (summary.established) return "established";
  return null;
}
