import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeLeaderboard } from "@/lib/leaderboard";
import { RANKED_PUBLIC_SCHEMA } from "@/types/leaderboard";
import type { RankedPlayerTotals } from "@/types/leaderboard";
import {
  buildRivalIndex,
  canonicalPairKey,
  mapRecords,
  resultFor,
  seriesRecord,
} from "@/lib/rivals/pairs";
import { opponentSummaries, selectFeatured } from "@/lib/rivals/rank";
import { buildStoryEvents, nextEncounterStakes, storyText } from "@/lib/rivals/stories";
import { rivalPerformance } from "@/lib/rivals/performance";
import { captureSeen, updatesSinceLastSeen } from "@/lib/rivals/updates";
import { uniquePlayerByNames } from "@/lib/rivals/identity";
import { mergeRivalsPreferences, sanitizeRivalsPreference } from "@/lib/rivals/preferences";
import type { RivalSource, RivalSourceMatch, RivalSourceSeat } from "@/types/rivals";

const A = "a".repeat(24);
const B = "b".repeat(24);
const C = "c".repeat(24);
const D = "d".repeat(24);

const STATS: RankedPlayerTotals = {
  artifactPickups: 1,
  artifactScores: 0,
  deaths: 2,
  friendlyFireTotal: 0,
  kills: 4,
  resurrects: 1,
  scoreboardBonus: 8,
  shotsFired: 10,
  shotsHit: 4,
};

function seat(
  id: string,
  team: 0 | 1,
  stats: RankedPlayerTotals | null = STATS,
): RivalSourceSeat {
  return { id, team, stats, name: `Player ${id.slice(0, 4)}` };
}

function game(
  matchId: string,
  finishedAt: string,
  winningTeam: 0 | 1 | null,
  score: [number, number],
  rosters: RivalSourceSeat[],
  extra?: { map?: string; number?: number },
): RivalSourceMatch {
  return {
    id: matchId,
    finishedAt,
    map: extra?.map ?? "Lobby",
    mode: "Artifact",
    number: extra?.number ?? 1,
    score,
    winningTeam,
    players: rosters,
  };
}

function source(
  matches: RivalSourceMatch[],
  updatedAt = "2026-11-26T00:00:00.000Z",
): RivalSource {
  return {
    updatedAt,
    players: [A, B, C, D].map((id) => ({
      id,
      name: `Player ${id.slice(0, 4)}`,
      tier: "gold" as const,
    })),
    matches,
  };
}

function oppose(
  matchId: string,
  finishedAt: string,
  winner: 0 | 1 | null,
  score: [number, number] = winner === 0 ? [6, 4] : [4, 6],
  extra?: { map?: string; number?: number; leftStats?: RankedPlayerTotals | null; rightStats?: RankedPlayerTotals | null },
): RivalSourceMatch {
  return game(
    matchId,
    finishedAt,
    winner,
    score,
    [
      seat(A, 0, extra && "leftStats" in extra ? extra.leftStats ?? null : STATS),
      seat(B, 1, extra && "rightStats" in extra ? extra.rightStats ?? null : STATS),
    ],
    extra,
  );
}

describe("canonical pairs", () => {
  it("sorts player ids and rejects the same player", () => {
    assert.equal(canonicalPairKey(B, A), `${A}_${B}`);
    assert.equal(canonicalPairKey(A, B), `${A}_${B}`);
    assert.equal(canonicalPairKey(A, A), null);
  });

  it("reverses the series record with perspective", () => {
    const index = buildRivalIndex(
      source([
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0),
        oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 1),
      ]),
    );
    const series = index.seriesByKey.get(`${A}_${B}`);
    assert.ok(series);
    const fromA = seriesRecord(series.encounters, A);
    const fromB = seriesRecord(series.encounters, B);
    assert.deepEqual([fromA.wins, fromA.losses], [1, 1]);
    assert.deepEqual([fromB.wins, fromB.losses], [1, 1]);
    assert.equal(resultFor(series.encounters[0], A), "win");
    assert.equal(resultFor(series.encounters[0], B), "loss");
  });
});

describe("encounter rules", () => {
  it("ignores same-team seats and keeps each opposing pair once", () => {
    const index = buildRivalIndex(
      source([
        game("1".repeat(24), "2026-11-20T00:00:00.000Z", 0, [6, 4], [
          seat(A, 0),
          seat(C, 0),
          seat(B, 1),
          seat(D, 1),
        ]),
      ]),
    );
    assert.equal(index.seriesByKey.has(canonicalPairKey(A, C)!), false);
    assert.equal(index.seriesByKey.size, 4);
  });

  it("keeps the later copy of a duplicate match id", () => {
    const index = buildRivalIndex(
      source([
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0, [6, 3]),
        oppose("1".repeat(24), "2026-11-22T00:00:00.000Z", 1, [2, 6]),
      ]),
    );
    const series = index.seriesByKey.get(`${A}_${B}`)!;
    assert.equal(series.encounters.length, 1);
    assert.equal(resultFor(series.encounters[0], A), "loss");
    assert.equal(series.encounters[0].score[1], 6);
  });

  it("counts a meeting with no stats and keeps map names apart", () => {
    const index = buildRivalIndex(
      source([
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0, [6, 4], {
          map: "Lobby",
          leftStats: null,
          rightStats: null,
        }),
        oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 1, [3, 6], {
          map: "Lobby (Small)",
        }),
      ]),
    );
    const series = index.seriesByKey.get(`${A}_${B}`)!;
    const record = seriesRecord(series.encounters, A);
    assert.equal(record.meetings, 2);
    assert.equal(record.wins, 1);
    assert.equal(record.losses, 1);
    const maps = mapRecords(series.encounters, A).map((entry) => entry.map);
    assert.deepEqual(maps.sort(), ["Lobby", "Lobby (Small)"]);
  });

  it("orders by finished time, then match number, then id", () => {
    const index = buildRivalIndex(
      source([
        oppose("3".repeat(24), "2026-11-21T00:00:00.000Z", 0, [6, 4], { number: 2 }),
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0),
        oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 1, [4, 6], { number: 1 }),
      ]),
    );
    const ids = index.seriesByKey.get(`${A}_${B}`)!.encounters.map((encounter) => encounter.matchId);
    assert.deepEqual(ids, ["1".repeat(24), "2".repeat(24), "3".repeat(24)]);
  });

  it("does not treat an undeclared winner as a win", () => {
    const normalized = normalizeLeaderboard({
      schema: RANKED_PUBLIC_SCHEMA,
      updatedAt: "2026-11-26T00:00:00.000Z",
      players: [
        {
          id: A,
          name: "Alpha",
          elo: 1500,
          wins: 1,
          losses: 0,
          matches: 1,
          statsMatches: 0,
          totals: STATS,
          rank: 1,
        },
      ],
      matches: [
        {
          id: "1".repeat(24),
          finishedAt: "2026-11-20T00:00:00.000Z",
          map: "Lobby",
          mode: "Artifact",
          number: 1,
          score: [6, 4],
          winningTeam: 2,
          players: [
            { id: A, team: 0, eloBefore: 1500, eloAfter: 1510, eloChange: 10, performanceUsed: false, stats: null, damagePercent: null },
            { id: B, team: 1, eloBefore: 1500, eloAfter: 1490, eloChange: -10, performanceUsed: false, stats: null, damagePercent: null },
          ],
        },
      ],
    });
    assert.equal(normalized.matches[0]?.decisive, false);
    const index = buildRivalIndex(
      source([oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", null, [6, 4])]),
    );
    const record = seriesRecord(index.seriesByKey.get(`${A}_${B}`)!.encounters, A);
    assert.equal(record.wins, 0);
    assert.equal(record.losses, 0);
    assert.equal(record.unresolved, 1);
    assert.equal(record.meetings, 1);
  });
});

describe("stories", () => {
  it("records ties, a broken losing streak, and a comeback lead", () => {
    const dates = [
      "2026-11-10T00:00:00.000Z",
      "2026-11-11T00:00:00.000Z",
      "2026-11-12T00:00:00.000Z",
      "2026-11-13T00:00:00.000Z",
      "2026-11-14T00:00:00.000Z",
      "2026-11-15T00:00:00.000Z",
      "2026-11-16T00:00:00.000Z",
      "2026-11-17T00:00:00.000Z",
    ];
    // A loses three, then wins the next five: trail 0-3, pass 1-3, tie, then lead 4-3.
    const winners: Array<0 | 1> = [1, 1, 1, 0, 0, 0, 0, 0];
    const index = buildRivalIndex(
      source(
        winners.map((winner, indexNumber) =>
          oppose(String(indexNumber + 1).repeat(24), dates[indexNumber], winner),
        ),
      ),
    );
    const series = index.seriesByKey.get(`${A}_${B}`)!;
    const events = buildStoryEvents(series);
    const types = events.map((event) => event.type);
    assert.ok(types.includes("first_encounter"));
    assert.ok(types.includes("series_tied"));
    assert.ok(types.includes("streak_broken"));
    assert.ok(types.includes("established"));
    const comeback = events.find((event) => event.type === "comeback_lead" && event.side === "low");
    assert.ok(comeback);
    assert.equal(comeback.trailWinsLow, 0);
    assert.equal(comeback.trailWinsHigh, 3);
    const text = storyText(comeback, A, series, () => "Opponent");
    assert.equal(
      text,
      "From 0–3 down to a 4–3 series lead in the recorded history.",
    );
    const flipped = storyText(comeback, B, series, () => "Alpha");
    assert.match(flipped, /^Alpha went from 0–3 down/);

    const broken = events.find((event) => event.type === "streak_broken" && event.side === "low");
    assert.equal(
      storyText(broken!, A, series, () => "Opponent"),
      "Three-match losing streak broken.",
    );
  });

  it("replaces story events when a result is corrected", () => {
    const first = buildRivalIndex(
      source([
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0),
        oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 1),
        oppose("3".repeat(24), "2026-11-22T00:00:00.000Z", 1),
      ]),
    );
    const before = buildStoryEvents(first.seriesByKey.get(`${A}_${B}`)!);
    const leadBefore = before.find((event) => event.type === "lead_taken");
    assert.equal(leadBefore?.side, "high");

    const corrected = buildRivalIndex(
      source([
        oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0),
        oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 1),
        oppose("3".repeat(24), "2026-11-22T00:00:00.000Z", 0),
      ]),
    );
    const after = buildStoryEvents(corrected.seriesByKey.get(`${A}_${B}`)!);
    const leadAfter = after.find((event) => event.type === "lead_taken");
    assert.equal(leadAfter?.side, "low");
    assert.notEqual(leadBefore?.id, leadAfter?.id);
    const seen = captureSeen(first, A, null);
    const diff = updatesSinceLastSeen(corrected, A, seen, null);
    assert.equal(diff.firstVisit, false);
    assert.ok(diff.items.some((item) => item.kind === "corrected"));
    assert.ok(diff.items.some((item) => item.kind === "event" && item.text.includes("lead")));
  });
});

describe("eligibility", () => {
  it("keeps a short series out of Main Rival and prefers the longer sample", () => {
    const recent = "2026-11-20T00:00:00.000Z";
    const matches: RivalSourceMatch[] = [];
    for (let index = 0; index < 2; index += 1) {
      matches.push(
        game(String(index + 1).padStart(24, "1"), recent, 0, [6, 4], [
          seat(A, 0),
          seat(C, 1),
        ]),
      );
    }
    for (let index = 0; index < 5; index += 1) {
      const winner = index % 2 === 0 ? 0 : 1;
      matches.push(
        game(String(index + 1).padStart(24, "2"), `2026-11-${20 + index}T00:00:00.000Z`, winner, winner === 0 ? [6, 5] : [5, 6], [
          seat(A, 0),
          seat(B, 1),
        ]),
      );
    }
    for (let index = 0; index < 12; index += 1) {
      const winner = index % 2 === 0 ? 0 : 1;
      matches.push(
        game(String(index + 1).padStart(24, "3"), `2026-11-${10 + index}T00:00:00.000Z`, winner, winner === 0 ? [6, 4] : [4, 6], [
          seat(A, 0),
          seat(D, 1),
        ]),
      );
    }
    const index = buildRivalIndex(source(matches, "2026-11-26T00:00:00.000Z"));
    const featured = selectFeatured(index, A);
    assert.equal(featured.main?.opponentId, D);
    assert.notEqual(featured.main?.opponentId, C);
    const again = selectFeatured(index, A);
    assert.equal(again.main?.opponentId, featured.main?.opponentId);
    assert.equal(again.main?.explanation.includes("score"), false);
  });

  it("uses the recent window for discovery and keeps older meetings in the record", () => {
    const matches: RivalSourceMatch[] = [];
    for (let index = 0; index < 5; index += 1) {
      matches.push(
        oppose(String(index + 1).padStart(24, "4"), `2026-10-0${index + 1}T00:00:00.000Z`, 0),
      );
    }
    for (let index = 0; index < 3; index += 1) {
      matches.push(
        game(String(index + 1).padStart(24, "5"), `2026-11-2${index}T00:00:00.000Z`, 1, [4, 6], [
          seat(A, 0),
          seat(C, 1),
        ]),
      );
    }
    const index = buildRivalIndex(source(matches));
    const summaries = opponentSummaries(index, A);
    const quiet = summaries.find((summary) => summary.opponentId === B);
    const emerging = summaries.find((summary) => summary.opponentId === C);
    assert.equal(quiet?.lifetime.meetings, 5);
    assert.equal(quiet?.recent.meetings, 0);
    assert.equal(quiet?.quietLately, true);
    assert.equal(emerging?.emerging, true);
    const featured = selectFeatured(index, A);
    assert.equal(featured.developing, true);
    assert.equal(featured.main, null);
    assert.equal(featured.emerging?.opponentId, C);
  });

  it("does not repeat the only nemesis beside Main Rival", () => {
    const matches: RivalSourceMatch[] = [];
    for (let index = 0; index < 6; index += 1) {
      matches.push(
        oppose(String(index + 1).padStart(24, "6"), `2026-11-${10 + index}T00:00:00.000Z`, 1, [2, 6]),
      );
    }
    const index = buildRivalIndex(source(matches));
    const featured = selectFeatured(index, A);
    assert.equal(featured.main?.opponentId, B);
    assert.deepEqual(featured.main?.badges, ["main", "nemesis"]);
    assert.equal(featured.nemesis, null);
    assert.match(featured.nemesisNote ?? "", /only Nemesis/);
    const mutual = selectFeatured(index, B);
    assert.equal(mutual.main?.opponentId, A);
    assert.equal(featured.main?.mutualMain, true);
  });
});

describe("stakes and performance", () => {
  it("describes the next meeting without promising one", () => {
    assert.deepEqual(
      nextEncounterStakes(
        {
          meetings: 7,
          wins: 3,
          losses: 4,
          unresolved: 0,
          decisive: 7,
          close: 1,
          newestMs: 1,
          lastFinishedAt: null,
          lastFive: [],
        },
        { kind: "loss", length: 3 },
      ),
      [
        "Win your next encounter to tie the series.",
        "A win would end your three-match losing streak.",
      ],
    );
  });

  it("skips missing stats and compares other matches separately", () => {
    const versus = oppose("1".repeat(24), "2026-11-20T00:00:00.000Z", 0, [6, 4], {
      leftStats: null,
    });
    const counted = oppose("2".repeat(24), "2026-11-21T00:00:00.000Z", 0, [6, 3], {
      leftStats: { ...STATS, kills: 9, deaths: 3, resurrects: 2, shotsFired: 20, shotsHit: 10 },
    });
    const other = game("3".repeat(24), "2026-11-22T00:00:00.000Z", 0, [6, 4], [
      seat(A, 0, { ...STATS, kills: 2, deaths: 4, resurrects: 0, shotsFired: 0, shotsHit: 0 }),
      seat(C, 1),
    ]);
    const index = buildRivalIndex(source([versus, counted, other]));
    const series = index.seriesByKey.get(`${A}_${B}`)!;
    const performance = rivalPerformance(index.matches, series.encounters, A);
    assert.equal(performance.versus.sample, 1);
    assert.equal(performance.versus.meetings, 2);
    assert.equal(performance.versus.killsPerRound, 9 / 9);
    assert.equal(performance.versus.accuracy, 0.5);
    assert.equal(performance.other.sample, 1);
    assert.equal(performance.other.accuracy, null);
    assert.equal(performance.other.kd, 0.5);
  });
});

describe("discord name match", () => {
  it("prefers a unique server nickname, then the Discord username", () => {
    const players = [
      { id: A, name: "Ada" },
      { id: B, name: "Bea" },
    ];
    assert.equal(uniquePlayerByNames(players, ["Ada", "Bea"])?.id, A);
    assert.equal(uniquePlayerByNames(players, ["Nobody", "Bea"])?.id, B);
    assert.equal(uniquePlayerByNames(players, ["Ada", "Ada"])?.id, A);
    assert.equal(uniquePlayerByNames([{ id: A, name: "Ada" }, { id: B, name: "ada" }], ["Ada", "Bea"]), null);
  });
});

describe("preferences", () => {
  it("drops malformed storage and lets an empty browser adopt the account copy", () => {
    assert.equal(sanitizeRivalsPreference({ selectedPlayerId: "nope" })?.selectedPlayerId, null);
    const account = sanitizeRivalsPreference({
      version: 1,
      selectedPlayerId: A,
      pinnedPairKeys: [`${B}_${A}`],
      lastSeenByPlayer: {},
    });
    const merged = mergeRivalsPreferences(null, account);
    assert.equal(merged.selectedPlayerId, A);
    assert.deepEqual(merged.pinnedPairKeys, [`${A}_${B}`]);
  });
});
