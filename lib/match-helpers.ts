import { Db, WithId, Document, ObjectId } from "mongodb";

// Base interface without _id
interface BaseMatch {
  team1Players: string[];
  team2Players: string[];
  status: string;
  type: string;
  gameType: string;
  eloTier: string;
  teamSize: number;
  maps: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for MongoDB operations
interface Match extends WithId<Document>, BaseMatch {
  _id: ObjectId;
}

// Interface for document to insert
interface InsertMatch extends BaseMatch {
  teams?: {
    teamA: Array<{
      discordId: string;
      stats?: {
        kills: number;
        deaths: number;
        assists: number;
      };
    }>;
    teamB: Array<{
      discordId: string;
      stats?: {
        kills: number;
        deaths: number;
        assists: number;
      };
    }>;
  };
  winner?: string;
}

// Interface for API responses
interface MatchResponse extends BaseMatch {
  _id: string;
}

export async function createMatch(
  db: Db,
  matchData: Omit<BaseMatch, "createdAt" | "updatedAt">
) {
  const now = new Date();
  const match = await db.collection<InsertMatch>("Matches").insertOne({
    ...matchData,
    createdAt: now,
    updatedAt: now,
  });

  return match;
}

export async function updatePlayerStats(db: Db, match: Match) {
  const bulkOps = [];

  // Process both teams
  for (const team of ["teamA", "teamB"] as const) {
    for (const player of match.teams[team]) {
      if (player.stats) {
        bulkOps.push({
          updateOne: {
            filter: { discordId: player.discordId },
            update: {
              $inc: {
                "stats.kills": player.stats.kills,
                "stats.deaths": player.stats.deaths,
                "stats.assists": player.stats.assists,
                "stats.gamesPlayed": 1,
                ...(match.winner === team && { "stats.wins": 1 }),
                ...(match.winner !== team && { "stats.losses": 1 }),
              },
            },
            upsert: true,
          },
        });
      }
    }
  }

  if (bulkOps.length > 0) {
    await db.collection("Players").bulkWrite(bulkOps);
  }
}

export type { Match, MatchResponse, BaseMatch, InsertMatch };
