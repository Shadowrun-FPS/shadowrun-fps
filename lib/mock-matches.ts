import type {
  MatchFilters,
  MatchGame,
  MatchSeries,
  MatchTeamSide,
  ScoreboardColumn,
  ScoreboardPage,
  ScoreboardPlayer,
} from "@/types";

/**
 * MOCK DATA ONLY. Replace `getMatches` with a real data source (API route or
 * database query) once the dedicated server posts match results to the site.
 */

export const MATCH_TEAM_LABELS: Record<MatchTeamSide, string> = {
  lineage: "Lineage",
  rna: "RNA",
};

export const MATCH_MAPS = [
  { id: "favela", name: "Favela", image: "/maps/map_favela.png" },
  { id: "maelstrom", name: "Maelstrom", image: "/maps/map_maelstrom.png" },
  {
    id: "nerve-center",
    name: "Nerve Center",
    image: "/maps/map_nervecenter.png",
  },
  { id: "pinnacle", name: "Pinnacle", image: "/maps/map_pinnacle.png" },
  { id: "poco", name: "Poco", image: "/maps/map_poco.png" },
  {
    id: "power-station",
    name: "Power Station",
    image: "/maps/map_powerstation.png",
  },
  {
    id: "temple-grounds",
    name: "Temple Grounds",
    image: "/maps/map_templegrounds.png",
  },
  { id: "dig-site", name: "Dig Site", image: "/maps/map_digsite.png" },
] as const;

const STAT_COLUMNS: ScoreboardColumn[] = [
  {
    key: "bonusTotal",
    label: "Bonus $ Total",
    shortLabel: "Bonus",
    isCurrency: true,
  },
  { key: "kills", label: "Kills", shortLabel: "K" },
  { key: "deaths", label: "Deaths", shortLabel: "D" },
  { key: "resurrects", label: "Resurrects", shortLabel: "Res" },
  {
    key: "friendlyFireCost",
    label: "Friendly Fire $",
    shortLabel: "FF",
    isCurrency: true,
  },
];

/**
 * In-game scoreboard pages. Only the stat summary is built; the other pages
 * are placeholders until the real in-game pages are documented.
 */
export const SCOREBOARD_PAGES: ScoreboardPage[] = [
  { id: "stat-summary", title: "Stat Summary", columns: STAT_COLUMNS },
  { id: "page-2", title: "Page 2" },
  { id: "page-3", title: "Page 3" },
];

const ROSTERS: Record<MatchTeamSide, string[][]> = {
  lineage: [
    ["Vex", "Kaito", "Mara", "Dagger"],
    ["Nyx", "Torque", "Sable", "Quill"],
    ["Rook", "Lumen", "Cipher", "Hex"],
  ],
  rna: [
    ["Wraith", "Ember", "Jinx", "Moxie"],
    ["Saber", "Onyx", "Fable", "Rift"],
    ["Zephyr", "Brick", "Echo", "Vandal"],
  ],
};

interface GameSeed {
  mapId: (typeof MATCH_MAPS)[number]["id"];
  winner: MatchTeamSide;
  loserRounds: number;
}

interface SeriesSeed {
  id: string;
  playedAt: string;
  rosterIndex: Record<MatchTeamSide, number>;
  games: GameSeed[];
}

const SERIES_SEEDS: SeriesSeed[] = [
  {
    id: "sr-1042",
    playedAt: "2026-11-08T21:30:00-08:00",
    rosterIndex: { lineage: 0, rna: 0 },
    games: [
      { mapId: "favela", winner: "lineage", loserRounds: 5 },
      { mapId: "pinnacle", winner: "rna", loserRounds: 3 },
      { mapId: "poco", winner: "lineage", loserRounds: 4 },
    ],
  },
  {
    id: "sr-1041",
    playedAt: "2026-11-08T19:10:00-08:00",
    rosterIndex: { lineage: 1, rna: 1 },
    games: [
      { mapId: "maelstrom", winner: "rna", loserRounds: 2 },
      { mapId: "nerve-center", winner: "rna", loserRounds: 4 },
    ],
  },
  {
    id: "sr-1040",
    playedAt: "2026-11-07T20:45:00-08:00",
    rosterIndex: { lineage: 2, rna: 2 },
    games: [
      { mapId: "power-station", winner: "lineage", loserRounds: 1 },
      { mapId: "temple-grounds", winner: "rna", loserRounds: 5 },
      { mapId: "dig-site", winner: "rna", loserRounds: 5 },
    ],
  },
  {
    id: "sr-1039",
    playedAt: "2026-11-07T18:00:00-08:00",
    rosterIndex: { lineage: 0, rna: 1 },
    games: [
      { mapId: "pinnacle", winner: "lineage", loserRounds: 0 },
      { mapId: "favela", winner: "lineage", loserRounds: 3 },
    ],
  },
  {
    id: "sr-1038",
    playedAt: "2026-11-05T22:15:00-08:00",
    rosterIndex: { lineage: 1, rna: 2 },
    games: [
      { mapId: "poco", winner: "rna", loserRounds: 4 },
      { mapId: "maelstrom", winner: "lineage", loserRounds: 2 },
      { mapId: "nerve-center", winner: "lineage", loserRounds: 5 },
    ],
  },
  {
    id: "sr-1037",
    playedAt: "2026-11-04T20:20:00-08:00",
    rosterIndex: { lineage: 2, rna: 0 },
    games: [
      { mapId: "dig-site", winner: "rna", loserRounds: 3 },
      { mapId: "power-station", winner: "rna", loserRounds: 1 },
    ],
  },
  {
    id: "sr-1036",
    playedAt: "2026-11-02T17:40:00-08:00",
    rosterIndex: { lineage: 0, rna: 2 },
    games: [
      { mapId: "temple-grounds", winner: "lineage", loserRounds: 5 },
      { mapId: "favela", winner: "rna", loserRounds: 4 },
      { mapId: "pinnacle", winner: "lineage", loserRounds: 5 },
    ],
  },
  {
    id: "sr-1035",
    playedAt: "2026-10-30T21:05:00-07:00",
    rosterIndex: { lineage: 1, rna: 0 },
    games: [
      { mapId: "nerve-center", winner: "lineage", loserRounds: 2 },
      { mapId: "poco", winner: "lineage", loserRounds: 0 },
    ],
  },
];

const ROUNDS_TO_WIN = 6;

/** Small deterministic pseudo-random so mock stats are stable between renders. */
function seededValue(seed: number, min: number, max: number): number {
  const raw = Math.sin(seed * 9301 + 49297) * 233280;
  const fraction = raw - Math.floor(raw);
  return min + Math.floor(fraction * (max - min + 1));
}

function buildPlayers(
  seriesSeed: SeriesSeed,
  gameIndex: number,
  winner: MatchTeamSide,
): ScoreboardPlayer[] {
  const sides: MatchTeamSide[] = ["lineage", "rna"];
  return sides.flatMap((side) =>
    ROSTERS[side][seriesSeed.rosterIndex[side]].map((name, playerIndex) => {
      const seed =
        seriesSeed.id.length * 31 +
        gameIndex * 17 +
        playerIndex * 7 +
        (side === "rna" ? 101 : 0);
      const isWinner = side === winner;
      const kills = seededValue(seed, isWinner ? 6 : 3, isWinner ? 14 : 10);
      const deaths = seededValue(seed + 1, isWinner ? 3 : 6, isWinner ? 9 : 13);
      return {
        name,
        team: side,
        kills,
        deaths,
        bonusTotal: kills * 100 + seededValue(seed + 2, 0, 6) * 50,
        resurrects: seededValue(seed + 3, 0, 4),
        friendlyFireCost: seededValue(seed + 4, 0, 2) * 100,
      };
    }),
  );
}

function buildSeries(seed: SeriesSeed): MatchSeries {
  const seriesScore: Record<MatchTeamSide, number> = { lineage: 0, rna: 0 };

  const games: MatchGame[] = seed.games.map((gameSeed, gameIndex) => {
    const map =
      MATCH_MAPS.find((candidate) => candidate.id === gameSeed.mapId) ??
      MATCH_MAPS[0];
    const loser: MatchTeamSide =
      gameSeed.winner === "lineage" ? "rna" : "lineage";
    seriesScore[gameSeed.winner] += 1;

    return {
      gameNumber: (gameIndex + 1) as MatchGame["gameNumber"],
      mapId: map.id,
      mapName: map.name,
      mapImage: map.image,
      mode: "Attrition",
      winningTeam: gameSeed.winner,
      score: {
        [gameSeed.winner]: ROUNDS_TO_WIN,
        [loser]: gameSeed.loserRounds,
      } as Record<MatchTeamSide, number>,
      clock: `0:${String(seededValue(gameIndex + seed.id.length, 10, 59)).padStart(2, "0")}`,
      players: buildPlayers(seed, gameIndex, gameSeed.winner),
    };
  });

  return {
    id: seed.id,
    playedAt: seed.playedAt,
    format: "bo3",
    teamNames: MATCH_TEAM_LABELS,
    games,
    seriesScore,
    winner: seriesScore.lineage > seriesScore.rna ? "lineage" : "rna",
  };
}

const MOCK_SERIES: MatchSeries[] = SERIES_SEEDS.map(buildSeries);

export const DEFAULT_MATCH_FILTERS: MatchFilters = {
  query: "",
  mapId: "all",
  winner: "all",
  dateFrom: "",
  dateTo: "",
};

/** Single seam for fetching series; swap the body for a real API call later. */
export function getMatches(
  filters: MatchFilters = DEFAULT_MATCH_FILTERS,
): MatchSeries[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return MOCK_SERIES.filter((series) => {
    const playedDate = series.playedAt.slice(0, 10);

    if (filters.winner !== "all" && series.winner !== filters.winner)
      return false;
    if (filters.dateFrom && playedDate < filters.dateFrom) return false;
    if (filters.dateTo && playedDate > filters.dateTo) return false;
    if (
      filters.mapId !== "all" &&
      !series.games.some((game) => game.mapId === filters.mapId)
    ) {
      return false;
    }
    if (
      normalizedQuery &&
      !series.games.some((game) =>
        game.players.some((player) =>
          player.name.toLowerCase().includes(normalizedQuery),
        ),
      )
    ) {
      return false;
    }
    return true;
  });
}
