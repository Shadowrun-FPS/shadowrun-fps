import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildInsights, buildMetricRows, statCoverageNote } from "@/lib/compare/present";
import { compareHref, parseCompareSearch } from "@/lib/compare/query";
import { buildComparison } from "@/lib/compare/sample";
import type { LeaderboardMatch, LeaderboardPayload, RankedPlayerTotals } from "@/types/leaderboard";
import type { CompareQuery } from "@/types/compare";

const A = "a".repeat(24);
const B = "b".repeat(24);
const C = "c".repeat(24);
const D = "d".repeat(24);
const E = "e".repeat(24);
const M1 = "1".repeat(24);
const M2 = "2".repeat(24);
const M3 = "3".repeat(24);

const STATS: RankedPlayerTotals = {
  artifactPickups: 0,
  artifactScores: 0,
  deaths: 4,
  friendlyFireTotal: 0,
  kills: 8,
  resurrects: 2,
  scoreboardBonus: 1000,
  shotsFired: 10,
  shotsHit: 5,
};

function seat(
  id: string,
  team: 0 | 1,
  stats: RankedPlayerTotals | null = STATS,
  damagePercent: number | null = null,
): LeaderboardMatch["players"][number] {
  return {
    id,
    name: id,
    team,
    eloBefore: 1000,
    eloAfter: 1000,
    eloChange: 0,
    performanceUsed: stats != null,
    stats,
    damagePercent,
  };
}

function game(
  id: string,
  finishedAt: string,
  players: LeaderboardMatch["players"],
  extra: Partial<LeaderboardMatch> = {},
): LeaderboardMatch {
  return {
    id,
    finishedAt,
    map: "Lobby",
    mode: "Attrition",
    number: 1,
    score: [6, 5],
    winningTeam: 0,
    decisive: true,
    players,
    ...extra,
  };
}

function payload(matches: LeaderboardMatch[]): LeaderboardPayload {
  return {
    schema: "shadowrun.ranked.public.v1",
    updatedAt: "2026-11-26T00:00:00.000Z",
    players: [],
    unlistedPlayers: [],
    matches,
  };
}

function query(partial: Partial<CompareQuery> & Pick<CompareQuery, "playerIds">): CompareQuery {
  return {
    window: "all",
    map: null,
    mode: null,
    scope: "own",
    ...partial,
  };
}

describe("compare selection and url", () => {
  it("keeps four ids in order and drops duplicates and extras", () => {
    const parsed = parseCompareSearch({
      players: `${B},${A},${B},${C},${D},${E},nope`,
    });
    assert.deepEqual(parsed.playerIds, [B, A, C, D]);
    assert.equal(compareHref(parsed), `/leaderboard/compare?players=${B}%2C${A}%2C${C}%2C${D}`);
  });

  it("falls back from unknown filters and restores a direct link", () => {
    const known = new Set([A, B]);
    const parsed = parseCompareSearch(
      {
        players: `${A},${B},${"f".repeat(24)}`,
        window: "season",
        map: "Missing",
        mode: "Other",
        scope: "both",
      },
      { playerIds: known, maps: new Set(["Lobby", "Lobby (Small)"]), modes: ["Attrition"] },
    );
    assert.deepEqual(parsed, {
      playerIds: [A, B],
      window: "all",
      map: null,
      mode: null,
      scope: "own",
    });
    const restored = parseCompareSearch({
      players: `${A},${B}`,
      window: "7d",
      map: "Lobby (Small)",
      scope: "shared",
    });
    assert.equal(restored.window, "7d");
    assert.equal(restored.map, "Lobby (Small)");
    assert.equal(restored.scope, "shared");
    assert.equal(
      compareHref(restored),
      `/leaderboard/compare?players=${A}%2C${B}&window=7d&map=Lobby+%28Small%29&scope=shared`,
    );
  });
});

describe("compare aggregation", () => {
  it("includes same-team and opposing seats only when every selected player is present", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 0), seat(B, 0), seat(C, 1)]),
        game(M2, "2026-11-21T00:00:00.000Z", [seat(A, 0), seat(B, 1)]),
        game(M3, "2026-11-22T00:00:00.000Z", [seat(A, 1), seat(B, 0), seat(C, 0), seat(D, 1)]),
      ]),
      query({ playerIds: [A, B, C], scope: "shared" }),
    );
    assert.equal(model.sharedMatchCount, 2);
    assert.equal(model.emptyShared, false);
    assert.deepEqual(
      model.players.map((sample) => sample.matches),
      [2, 2, 2],
    );
    assert.equal(model.players[0]?.wins, 1);
    assert.equal(model.players[2]?.wins, 1);
  });

  it("does not treat a partial group as shared and leaves the filters in place", () => {
    const model = buildComparison(
      payload([game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 0), seat(B, 1)])]),
      query({ playerIds: [A, B, C], scope: "shared" }),
    );
    assert.equal(model.emptyShared, true);
    assert.deepEqual(
      model.players.map((sample) => sample.matches),
      [0, 0, 0],
    );
  });

  it("filters by time and keeps map variants apart", () => {
    const matches = [
      game(M1, "2026-11-25T00:00:00.000Z", [seat(A, 0)], { map: "Lobby" }),
      game(M2, "2026-11-10T00:00:00.000Z", [seat(A, 0)], { map: "Lobby (Small)" }),
      game(M3, "2026-10-01T00:00:00.000Z", [seat(A, 0)], { map: "Lobby" }),
    ];
    const week = buildComparison(payload(matches), query({ playerIds: [A], window: "7d" }));
    const month = buildComparison(payload(matches), query({ playerIds: [A], window: "30d", map: "Lobby" }));
    assert.equal(week.players[0]?.matches, 1);
    assert.equal(month.players[0]?.matches, 1);
    assert.equal(month.players[0]?.maps[0]?.map, "Lobby");
  });

  it("keeps the later copy of a duplicate match id", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-01T00:00:00.000Z", [seat(A, 0, { ...STATS, kills: 1 })]),
        game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 1, { ...STATS, kills: 9 })], {
          winningTeam: 0,
          score: [6, 4],
        }),
      ]),
      query({ playerIds: [A] }),
    );
    assert.equal(model.players[0]?.matches, 1);
    assert.equal(model.players[0]?.kills, 9);
    assert.equal(model.players[0]?.wins, 0);
  });

  it("skips null stats, weights accuracy, and uses this player's rounds once", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [
          seat(A, 0, null),
          seat(B, 1, { ...STATS, kills: 3, shotsFired: 100, shotsHit: 50 }),
        ]),
        game(M2, "2026-11-21T00:00:00.000Z", [
          seat(A, 0, { ...STATS, kills: 10, deaths: 0, shotsFired: 2, shotsHit: 1 }),
          seat(B, 1, { ...STATS, kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0 }),
        ], { score: [6, 5] }),
        game(M3, "2026-11-22T00:00:00.000Z", [
          seat(A, 0, { ...STATS, kills: 4, deaths: 0, shotsFired: 10, shotsHit: 9 }),
        ], { score: [0, 0], decisive: false }),
      ]),
      query({ playerIds: [A, B], scope: "own" }),
    );
    const [alpha, beta] = model.players;
    assert.equal(alpha?.matches, 3);
    assert.equal(alpha?.statRows, 2);
    assert.equal(alpha?.killsWithRounds, 10);
    assert.equal(alpha?.roundsWithKills, 11);
    assert.equal(alpha?.shotRows, 2);
    assert.equal(alpha?.shotsHit, 10);
    assert.equal(alpha?.shotsFired, 12);
    assert.equal(beta?.matches, 2);
    assert.equal(beta?.shotsHit, 50);
    assert.equal(beta?.shotsFired, 100);
    const rows = buildMetricRows(model.players);
    const kd = rows.find((row) => row.id === "kd");
    const accuracy = rows.find((row) => row.id === "accuracy");
    assert.equal(kd?.cells[0]?.text, "∞");
    assert.equal(kd?.cells[1]?.text, "0.75");
    assert.equal(accuracy?.cells[0]?.text, "83%");
    assert.equal(accuracy?.cells[1]?.text, "50%");
    const kills = rows.find((row) => row.id === "killsPerRound");
    assert.equal(kills?.cells[0]?.text, (10 / 11).toFixed(1));
  });

  it("averages damage share per recorded match and keeps missing stat lines out of kills per match", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 0, { ...STATS, kills: 127 }, 20)]),
        game(M2, "2026-11-21T00:00:00.000Z", [seat(A, 0, null, null)]),
      ]),
      query({ playerIds: [A] }),
    );
    const rows = buildMetricRows(model.players);
    assert.equal(rows.find((row) => row.id === "killsPerMatch")?.cells[0]?.text, "127.0");
    const recorded = model.players[0]?.evidence.find((item) => item.statsRecorded);
    assert.equal(recorded?.killsPerRound, 127 / 11);
    assert.equal(
      statCoverageNote(model.players, new Map([[A, "Ada"]])),
      "Kills and K/D leave out matches with no stat line: Ada 1 of 2.",
    );
    const second = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 0, STATS, 20)]),
        game(M2, "2026-11-21T00:00:00.000Z", [seat(A, 0, STATS, 40)]),
        game(M3, "2026-11-22T00:00:00.000Z", [seat(A, 0, STATS, null)]),
      ]),
      query({ playerIds: [A] }),
    );
    assert.equal(
      buildMetricRows(second.players).find((row) => row.id === "damagePercent")?.cells[0]?.text,
      "30%",
    );
    assert.equal(statCoverageNote(second.players, new Map([[A, "Ada"]])), null);
  });

  it("does not invent a ratio when kills and deaths are both zero", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [
          seat(A, 0, { ...STATS, kills: 0, deaths: 0 }),
        ]),
      ]),
      query({ playerIds: [A] }),
    );
    const kd = buildMetricRows(model.players).find((row) => row.id === "kd");
    assert.equal(kd?.cells[0]?.text, "—");
  });

  it("withholds a highest badge when every sample is under five matches", () => {
    const model = buildComparison(
      payload([
        game(M1, "2026-11-20T00:00:00.000Z", [seat(A, 0, { ...STATS, kills: 20 })]),
        game(M2, "2026-11-21T00:00:00.000Z", [seat(B, 0, { ...STATS, kills: 1 })]),
      ]),
      query({ playerIds: [A, B] }),
    );
    const kills = buildMetricRows(model.players).find((row) => row.id === "killsPerRound");
    assert.equal(kills?.cells.some((item) => item.highest), false);
    assert.deepEqual(buildInsights(model.players, new Map([[A, "Ada"], [B, "Bea"]])), []);
  });

  it("ranks callouts by the relative lead so a dollar gap does not crowd out a win-rate gap", () => {
    const matches = Array.from({ length: 6 }, (_, index) =>
      game(`m${index}`.padEnd(24, "0"), `2026-11-${String(20 + index).padStart(2, "0")}T00:00:00.000Z`, [
        seat(A, 0, { ...STATS, scoreboardBonus: 1000 }),
        seat(B, 1, { ...STATS, scoreboardBonus: 1050 }),
      ]),
    );
    const model = buildComparison(payload(matches), query({ playerIds: [A, B] }));
    const lines = buildInsights(model.players, new Map([[A, "Ada"], [B, "Bea"]]));
    assert.equal(lines.some((line) => line.includes("Ada") && line.includes("win rate")), true);
    assert.equal(lines.some((line) => line.toLowerCase().includes("bonus")), false);
  });
});
