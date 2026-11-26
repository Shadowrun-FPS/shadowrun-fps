import { formatBonus, formatPercent } from "@/lib/leaderboard-stats";
import { LOW_SAMPLE_MATCHES } from "@/lib/compare/config";
import type { MetricCell, MetricRow, PlayerSample } from "@/types/compare";

interface DraftCell {
  playerId: string;
  text: string;
  accessibleText: string;
  plot: number | null;
  sample: number;
  coverage: string | null;
  eligible: boolean;
}

function decimal(value: number): string {
  return value.toFixed(1);
}

function formatDamageShare(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function cell(
  playerId: string,
  text: string,
  accessibleText: string,
  plot: number | null,
  sample: number,
  coverage: string | null,
  eligible: boolean,
): DraftCell {
  return { playerId, text, accessibleText, plot, sample, coverage, eligible };
}

function unavailable(playerId: string, sample: number, coverage: string | null): DraftCell {
  return cell(playerId, "—", "Unavailable", null, sample, coverage, false);
}

function finish(drafts: DraftCell[], higherIsBetter: boolean): MetricCell[] {
  const anyLarge = drafts.some((draft) => draft.sample >= LOW_SAMPLE_MATCHES);
  const eligible = higherIsBetter && anyLarge ? drafts.filter((draft) => draft.eligible && draft.plot != null) : [];
  const best = eligible.reduce<number | null>((current, draft) => {
    if (draft.plot == null) return current;
    if (current == null || draft.plot > current) return draft.plot;
    return current;
  }, null);

  const finite = drafts
    .map((draft) => draft.plot)
    .filter((value): value is number => value != null && Number.isFinite(value) && value > 0);
  const max = finite.length > 0 ? Math.max(...finite) : 0;

  return drafts.map((draft) => {
    let bar: number | null = null;
    if (draft.plot === Number.POSITIVE_INFINITY) bar = 1;
    else if (draft.plot != null && draft.plot > 0 && max > 0) bar = draft.plot / max;
    else if (draft.plot != null && draft.plot === 0) bar = 0;
    const highest = best != null && draft.plot === best && draft.eligible;
    return {
      playerId: draft.playerId,
      text: draft.text,
      accessibleText: highest ? `${draft.accessibleText}. Highest in this sample` : draft.accessibleText,
      plot: draft.plot,
      bar,
      highest,
      sample: draft.sample,
      coverage: draft.coverage,
    };
  });
}

function perRound(
  sample: PlayerSample,
  withRounds: number,
  roundRows: number,
  rounds: number,
  total: number,
  statRows: number,
  noun: string,
): DraftCell {
  if (roundRows > 0 && rounds > 0) {
    const value = withRounds / rounds;
    return cell(
      sample.playerId,
      decimal(value),
      `${decimal(value)} ${noun} per round`,
      value,
      sample.matches,
      `${noun} in ${countLabel(roundRows, "match", "matches")} with rounds`,
      sample.matches >= LOW_SAMPLE_MATCHES,
    );
  }
  if (statRows > 0) {
    const value = total / statRows;
    return cell(
      sample.playerId,
      decimal(value),
      `${decimal(value)} ${noun} per match. Round counts were unavailable`,
      value,
      sample.matches,
      `per match · ${noun} in ${statRows} of ${sample.matches}`,
      sample.matches >= LOW_SAMPLE_MATCHES,
    );
  }
  return unavailable(sample.playerId, sample.matches, null);
}

function kdCell(sample: PlayerSample): DraftCell {
  const coverage = `stats recorded in ${sample.statRows} of ${sample.matches}`;
  if (sample.statRows <= 0) return unavailable(sample.playerId, sample.matches, coverage);
  if (sample.deaths === 0) {
    if (sample.kills <= 0) return unavailable(sample.playerId, sample.matches, coverage);
    return cell(
      sample.playerId,
      "∞",
      "Infinity, no recorded deaths",
      Number.POSITIVE_INFINITY,
      sample.matches,
      coverage,
      sample.matches >= LOW_SAMPLE_MATCHES,
    );
  }
  const value = sample.kills / sample.deaths;
  return cell(
    sample.playerId,
    value.toFixed(2),
    `K/D ${value.toFixed(2)}`,
    value,
    sample.matches,
    coverage,
    sample.matches >= LOW_SAMPLE_MATCHES,
  );
}

export function buildMetricRows(players: PlayerSample[]): MetricRow[] {
  const showArtifacts = players.some(
    (sample) => sample.artifactPickups > 0 || sample.artifactScores > 0,
  );

  const rows: MetricRow[] = [
    {
      id: "matches",
      group: "overview",
      primary: true,
      name: "Matches",
      definition: "Filtered matches in this snapshot, including games without a stat line.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          cell(
            sample.playerId,
            String(sample.matches),
            countLabel(sample.matches, "match", "matches"),
            sample.matches,
            sample.matches,
            null,
            false,
          ),
        ),
        false,
      ),
    },
    {
      id: "record",
      group: "details",
      primary: false,
      name: "W–L",
      definition: "Wins and losses from decisive results. Unresolved games stay in the match count.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          cell(
            sample.playerId,
            `${sample.wins}–${sample.losses}`,
            `${sample.wins} wins and ${sample.losses} losses`,
            null,
            sample.matches,
            null,
            false,
          ),
        ),
        false,
      ),
    },
    {
      id: "winRate",
      group: "overview",
      primary: true,
      name: "Win rate",
      definition: "Wins divided by decisive matches.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) => {
          if (sample.decisive <= 0) return unavailable(sample.playerId, sample.matches, "No decisive matches");
          const value = sample.wins / sample.decisive;
          const rate = formatPercent(value);
          const record = `${sample.wins}–${sample.losses}`;
          return cell(
            sample.playerId,
            `${rate} (${record})`,
            `Win rate ${rate}, ${sample.wins} wins and ${sample.losses} losses`,
            value,
            sample.matches,
            null,
            sample.matches >= LOW_SAMPLE_MATCHES,
          );
        }),
        true,
      ),
    },
    {
      id: "kd",
      group: "overview",
      primary: true,
      name: "K/D",
      definition: "Total kills divided by total deaths on rows with stats.",
      higherIsBetter: true,
      cells: finish(players.map(kdCell), true),
    },
    {
      id: "killsPerRound",
      group: "overview",
      primary: true,
      name: "Kills / round",
      definition: "Kills divided by the score total on rows that have both.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) =>
          perRound(
            sample,
            sample.killsWithRounds,
            sample.killRoundRows,
            sample.roundsWithKills,
            sample.kills,
            sample.statRows,
            "kills",
          ),
        ),
        true,
      ),
    },
    {
      id: "killsPerMatch",
      group: "overview",
      primary: true,
      name: "Kills / match",
      definition:
        "Recorded kills divided by matches that included a stat line. Games with no stat line are left out, not treated as zero kills.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) => {
          if (sample.statRows <= 0) return unavailable(sample.playerId, sample.matches, null);
          const value = sample.kills / sample.statRows;
          return cell(
            sample.playerId,
            decimal(value),
            `${decimal(value)} kills per match with stats`,
            value,
            sample.matches,
            `kills in ${sample.statRows} of ${sample.matches} matches`,
            sample.matches >= LOW_SAMPLE_MATCHES,
          );
        }),
        true,
      ),
    },
    {
      id: "damagePercent",
      group: "overview",
      primary: true,
      name: "Avg damage %",
      definition:
        "Average of each match's combat damage share. A high kill rate with a low share means more of the kills were finishes.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) => {
          if (sample.damageRows <= 0) {
            return unavailable(sample.playerId, sample.matches, "No damage share recorded");
          }
          const value = sample.damagePercentSum / sample.damageRows;
          const text = formatDamageShare(value);
          return cell(
            sample.playerId,
            text,
            `Average damage share ${text}`,
            value,
            sample.matches,
            `damage share in ${sample.damageRows} of ${sample.matches}`,
            sample.matches >= LOW_SAMPLE_MATCHES,
          );
        }),
        true,
      ),
    },
    {
      id: "resurrectsPerRound",
      group: "overview",
      primary: true,
      name: "Resurrects / round",
      definition: "Resurrects divided by the score total on rows that have both.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) =>
          perRound(
            sample,
            sample.resurrectsWithRounds,
            sample.resRoundRows,
            sample.roundsWithResurrects,
            sample.resurrects,
            sample.statRows,
            "resurrects",
          ),
        ),
        true,
      ),
    },
    {
      id: "accuracy",
      group: "overview",
      primary: true,
      name: "Accuracy",
      definition: "Total hits divided by total shots. This is not averaged from each match.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) => {
          if (sample.shotRows <= 0 || sample.shotsFired <= 0) {
            return unavailable(sample.playerId, sample.matches, "No shots recorded");
          }
          const value = sample.shotsHit / sample.shotsFired;
          return cell(
            sample.playerId,
            formatPercent(value),
            `Accuracy ${formatPercent(value)}`,
            value,
            sample.matches,
            `shots recorded in ${sample.shotRows} of ${sample.matches}`,
            sample.matches >= LOW_SAMPLE_MATCHES,
          );
        }),
        true,
      ),
    },
    {
      id: "bonusPerRound",
      group: "overview",
      primary: true,
      name: "Bonus / round",
      definition: "Scoreboard bonus divided by the score total. This is the game’s scoreboard metric.",
      higherIsBetter: true,
      cells: finish(
        players.map((sample) => {
          if (sample.bonusRoundRows > 0 && sample.roundsWithBonus > 0) {
            const value = sample.bonusWithRounds / sample.roundsWithBonus;
            return cell(
              sample.playerId,
              formatBonus(value),
              `${formatBonus(value)} scoreboard bonus per round`,
              value > 0 ? value : null,
              sample.matches,
              `bonus in ${sample.bonusRoundRows} of ${sample.matches}`,
              sample.matches >= LOW_SAMPLE_MATCHES && value > 0,
            );
          }
          if (sample.statRows > 0) {
            const value = sample.bonus / sample.statRows;
            return cell(
              sample.playerId,
              formatBonus(value),
              `${formatBonus(value)} scoreboard bonus per match. Round counts were unavailable`,
              value > 0 ? value : null,
              sample.matches,
              `per match · bonus in ${sample.statRows} of ${sample.matches}`,
              sample.matches >= LOW_SAMPLE_MATCHES && value > 0,
            );
          }
          return unavailable(sample.playerId, sample.matches, null);
        }),
        true,
      ),
    },
  ];

  const perMatch = (total: number, rows: number): string =>
    rows > 0 ? decimal(total / rows) : "—";

  rows.push(
    {
      id: "deathsPerMatch",
      group: "combat",
      primary: false,
      name: "Deaths / match",
      definition: "Deaths on rows with stats, divided by those rows.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.statRows > 0
            ? cell(
                sample.playerId,
                perMatch(sample.deaths, sample.statRows),
                `${perMatch(sample.deaths, sample.statRows)} deaths per match`,
                null,
                sample.matches,
                `deaths in ${sample.statRows} of ${sample.matches}`,
                false,
              )
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
    {
      id: "resurrectsPerMatch",
      group: "combat",
      primary: false,
      name: "Resurrects / match",
      definition: "Resurrects on rows with stats, divided by those rows.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.statRows > 0
            ? cell(
                sample.playerId,
                perMatch(sample.resurrects, sample.statRows),
                `${perMatch(sample.resurrects, sample.statRows)} resurrects per match`,
                null,
                sample.matches,
                `resurrects in ${sample.statRows} of ${sample.matches}`,
                false,
              )
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
    {
      id: "killsTotal",
      group: "details",
      primary: false,
      name: "Kills",
      definition: "Recorded kill total. A larger sample can raise this without a higher rate.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.statRows > 0
            ? cell(sample.playerId, String(sample.kills), `${sample.kills} kills`, null, sample.matches, null, false)
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
    {
      id: "deathsTotal",
      group: "details",
      primary: false,
      name: "Deaths",
      definition: "Recorded death total.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.statRows > 0
            ? cell(
                sample.playerId,
                String(sample.deaths),
                `${sample.deaths} deaths`,
                null,
                sample.matches,
                null,
                false,
              )
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
    {
      id: "shots",
      group: "details",
      primary: false,
      name: "Shots hit / fired",
      definition: "Shots from rows that fired at least once.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.shotRows > 0
            ? cell(
                sample.playerId,
                `${sample.shotsHit} / ${sample.shotsFired}`,
                `${sample.shotsHit} hits out of ${sample.shotsFired} shots`,
                null,
                sample.matches,
                `shots in ${sample.shotRows} of ${sample.matches}`,
                false,
              )
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
    {
      id: "friendlyFire",
      group: "details",
      primary: false,
      name: "Friendly fire",
      definition: "Sum of recorded friendly-fire money. A lower number is not ranked here.",
      higherIsBetter: false,
      cells: finish(
        players.map((sample) =>
          sample.statRows > 0
            ? cell(
                sample.playerId,
                formatBonus(sample.friendlyFire),
                `Friendly fire ${formatBonus(sample.friendlyFire)}`,
                null,
                sample.matches,
                null,
                false,
              )
            : unavailable(sample.playerId, sample.matches, null),
        ),
        false,
      ),
    },
  );

  if (showArtifacts) {
    rows.push(
      {
        id: "artifactPickups",
        group: "support",
        primary: false,
        name: "Artifact pickups",
        definition: "Recorded artifact pickups.",
        higherIsBetter: false,
        cells: finish(
          players.map((sample) =>
            sample.statRows > 0
              ? cell(
                  sample.playerId,
                  String(sample.artifactPickups),
                  `${sample.artifactPickups} artifact pickups`,
                  null,
                  sample.matches,
                  null,
                  false,
                )
              : unavailable(sample.playerId, sample.matches, null),
          ),
          false,
        ),
      },
      {
        id: "artifactScores",
        group: "support",
        primary: false,
        name: "Artifact scores",
        definition: "Recorded artifact scores.",
        higherIsBetter: false,
        cells: finish(
          players.map((sample) =>
            sample.statRows > 0
              ? cell(
                  sample.playerId,
                  String(sample.artifactScores),
                  `${sample.artifactScores} artifact scores`,
                  null,
                  sample.matches,
                  null,
                  false,
                )
              : unavailable(sample.playerId, sample.matches, null),
          ),
          false,
        ),
      },
    );
  }

  return rows;
}

/** One line when a rate leaves out matches that have no stat line. */
export function statCoverageNote(
  players: PlayerSample[],
  names: ReadonlyMap<string, string>,
): string | null {
  const partial = players.filter((sample) => sample.matches > 0 && sample.statRows < sample.matches);
  if (partial.length === 0) return null;
  const list = partial
    .map((sample) => {
      const name = names.get(sample.playerId) ?? "A player";
      return `${name} ${sample.statRows} of ${sample.matches}`;
    })
    .join(", ");
  return `Kills and K/D leave out matches with no stat line: ${list}.`;
}

const INSIGHT_FAMILY: Record<string, string> = {
  winRate: "results",
  kd: "kd",
  killsPerRound: "kills",
  killsPerMatch: "kills",
  damagePercent: "damage",
  resurrectsPerRound: "resurrects",
  accuracy: "accuracy",
  bonusPerRound: "bonus",
};

/** Ignore a lead smaller than this share of the next player. Dollar totals otherwise crowd out rates. */
const MIN_RELATIVE_LEAD = 0.1;

function relativeLead(best: number, next: number): number {
  if (best === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(best) || !Number.isFinite(next) || next < 0) return 0;
  if (next === 0) return best > 0 ? Number.POSITIVE_INFINITY : 0;
  return (best - next) / next;
}

export function buildInsights(players: PlayerSample[], names: ReadonlyMap<string, string>): string[] {
  if (players.length < 2) return [];
  const rows = buildMetricRows(players).filter((row) => row.higherIsBetter && row.primary);
  const ranked = rows
    .map((row) => {
      const leaders = row.cells.filter((item) => item.highest);
      const plots = row.cells
        .map((item) => item.plot)
        .filter((value): value is number => value != null && Number.isFinite(value));
      if (leaders.length === 0 || plots.length < 2) return null;
      const best = leaders[0]?.plot;
      if (best == null) return null;
      const next = plots.filter((value) => value < best).sort((left, right) => right - left)[0];
      if (next == null) return null;
      const lead = relativeLead(best, next);
      if (lead < MIN_RELATIVE_LEAD) return null;
      return { row, leaders, lead, family: INSIGHT_FAMILY[row.id] ?? row.id };
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((left, right) => right.lead - left.lead);

  const varied: typeof ranked = [];
  for (const item of ranked) {
    if (varied.some((kept) => kept.family === item.family)) continue;
    varied.push(item);
    if (varied.length === 2) break;
  }

  return varied.map(({ row, leaders }) => {
    const leaderNames = leaders.map((leader) => names.get(leader.playerId) ?? "A player");
    const sample = leaders[0]?.sample ?? 0;
    if (leaderNames.length > 1) {
      return `${leaderNames.join(" and ")} share the highest ${row.name.toLowerCase()} in this sample.`;
    }
    const name = leaderNames[0];
    if (row.id === "winRate") return `${name} had the highest win rate across ${sample} matches.`;
    if (row.id === "kd") return `${name} had the highest K/D across ${sample} matches with recorded stats.`;
    if (row.id === "killsPerRound") {
      return `${name} recorded more kills per round across ${sample} matches.`;
    }
    if (row.id === "killsPerMatch") {
      return `${name} recorded more kills per match with stats across ${sample} matches.`;
    }
    if (row.id === "damagePercent") {
      return `${name} had the highest average damage share across ${sample} matches.`;
    }
    if (row.id === "resurrectsPerRound") {
      return `${name} recorded more resurrects per round across ${sample} matches.`;
    }
    if (row.id === "accuracy") return `${name} had the highest accuracy across ${sample} matches.`;
    return `${name} had the highest scoreboard bonus per round across ${sample} matches.`;
  });
}
