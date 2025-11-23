// Load environment variables from .env.local BEFORE any other imports
// Using require() ensures this executes immediately, before ES module imports
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

import { MongoClient, ObjectId } from "mongodb";

// Create MongoDB connection directly (avoiding lib/mongodb.ts which checks env at import time)
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is required");
}
const mongoClient = new MongoClient(mongoUri);
const clientPromise = mongoClient.connect();

// Inline ELO calculation to avoid dependency on lib/mongodb.ts
async function calcTeamEloInline(teamId: string, client: MongoClient): Promise<number> {
  const webDb = client.db("ShadowrunWeb");
  const DEFAULT_INDIVIDUAL_ELO = 800;
  
  const team = await webDb.collection("Teams").findOne({
    _id: new ObjectId(teamId),
  });

  if (!team) {
    return DEFAULT_INDIVIDUAL_ELO * 5;
  }

  const configuredTeamSize = team.teamSize || 5;
  const memberIds = team.members.map((member: any) => member.discordId);
  if (team.captain && team.captain.discordId) {
    if (!memberIds.includes(team.captain.discordId)) {
      memberIds.push(team.captain.discordId);
    }
  }

  const webPlayers = await webDb
    .collection("Players")
    .find({ discordId: { $in: memberIds } })
    .toArray();

  const memberElos = [];
  for (const playerId of memberIds) {
    let playerElo = DEFAULT_INDIVIDUAL_ELO;
    const webPlayer = webPlayers.find((p) => p.discordId === playerId);
    if (webPlayer && webPlayer.stats && Array.isArray(webPlayer.stats)) {
      const statForSize = webPlayer.stats.find(
        (s) => s.teamSize === configuredTeamSize
      );
      if (statForSize && typeof statForSize.elo === "number") {
        playerElo = statForSize.elo;
      }
    }
    memberElos.push(playerElo);
  }

  const sortedElos = [...memberElos].sort((a, b) => b - a);
  const topElos = sortedElos.slice(0, configuredTeamSize);
  const totalElo = topElos.reduce((sum, elo) => sum + elo, 0);

  await webDb.collection("Teams").updateOne(
    { _id: new ObjectId(teamId) },
    {
      $set: {
        teamElo: totalElo,
        updatedAt: new Date(),
      },
    }
  );

  return totalElo;
}

const TEST_TEAM_PREFIX = "[TEST5V5]";
const NUM_TEAMS = 8;
const TEAM_SIZE = 5;

// Generate random ELO between 800 and 2500
function getRandomElo(): number {
  return Math.floor(Math.random() * (2500 - 800 + 1)) + 800;
}

// Generate random team name
function generateTeamName(index: number): string {
  const adjectives = [
    "Shadow", "Elite", "Apex", "Prime", "Nexus", "Vortex", "Phantom", "Titan",
    "Storm", "Blaze", "Frost", "Thunder", "Void", "Nova", "Echo", "Rift"
  ];
  const nouns = [
    "Warriors", "Legends", "Elite", "Squad", "Unit", "Force", "Guard", "Knights",
    "Hunters", "Strikers", "Rangers", "Commandos", "Reapers", "Vipers", "Wolves", "Eagles"
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${TEST_TEAM_PREFIX} ${adj} ${noun} ${index + 1}`;
}

// Generate random team tag
function generateTeamTag(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const tag = Array.from({ length: 3 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join("");
  return `T5V${index + 1}${tag}`;
}

async function createTestTeams() {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    console.log("Starting 5v5 test team creation...");

    // Find all players who are NOT already in any team
    const allPlayers = await db.collection("Players").find({}).toArray();
    const playersInTeams = await db.collection("Teams")
      .find({})
      .toArray();

    // Get all discordIds that are already in teams
    const playerIdsInTeams = new Set<string>();
    playersInTeams.forEach((team: any) => {
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach((member: any) => {
          if (member.discordId) {
            playerIdsInTeams.add(member.discordId);
          }
        });
      }
      if (team.captain && team.captain.discordId) {
        playerIdsInTeams.add(team.captain.discordId);
      }
    });

    // Filter out players already in teams
    const availablePlayers = allPlayers.filter(
      (player: any) => !playerIdsInTeams.has(player.discordId)
    );

    console.log(`Found ${availablePlayers.length} available players (not in teams)`);
    console.log(`Need ${NUM_TEAMS * TEAM_SIZE} players for ${NUM_TEAMS} teams`);

    if (availablePlayers.length < NUM_TEAMS * TEAM_SIZE) {
      console.error(
        `Not enough available players! Need ${NUM_TEAMS * TEAM_SIZE}, but only have ${availablePlayers.length}`
      );
      process.exit(1);
    }

    // Shuffle available players
    const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);

    // Create teams
    const createdTeams = [];
    let playerIndex = 0;

    for (let i = 0; i < NUM_TEAMS; i++) {
      const teamName = generateTeamName(i);
      const teamTag = generateTeamTag(i);

      // Check if name or tag already exists
      const existingTeam = await db.collection("Teams").findOne({
        $or: [
          { name: { $regex: new RegExp(`^${teamName}$`, "i") } },
          { tag: { $regex: new RegExp(`^${teamTag}$`, "i") } },
        ],
      });

      if (existingTeam) {
        console.log(`Skipping team ${i + 1} - name or tag already exists`);
        continue;
      }

      // Get 5 players for this team
      const teamPlayers = shuffledPlayers.slice(
        playerIndex,
        playerIndex + TEAM_SIZE
      );
      playerIndex += TEAM_SIZE;

      if (teamPlayers.length < TEAM_SIZE) {
        console.error(`Not enough players for team ${i + 1}`);
        break;
      }

      // Filter out players without required fields
      const validPlayers = teamPlayers.filter(
        (player: any) => player.discordId && (player.discordUsername || player.discordNickname)
      );

      if (validPlayers.length < TEAM_SIZE) {
        console.error(`Not enough valid players for team ${i + 1}`);
        break;
      }

      // Ensure each player has stats with 5v5 ELO
      const members = [];
      for (const player of validPlayers) {
        // Get or create 5v5 stats
        let elo = getRandomElo();
        
        if (player.stats && Array.isArray(player.stats)) {
          const stat5v5 = player.stats.find((s: any) => s.teamSize === 5);
          if (stat5v5 && typeof stat5v5.elo === "number") {
            elo = stat5v5.elo;
          } else {
            // Add 5v5 stats if missing
            await db.collection("Players").updateOne(
              { _id: player._id },
              {
                $push: {
                  stats: {
                    teamSize: 5,
                    elo: elo,
                    wins: 0,
                    losses: 0,
                    lastMatchDate: null,
                  },
                } as any,
              }
            );
          }
        } else {
          // Create stats array if it doesn't exist
          await db.collection("Players").updateOne(
            { _id: player._id },
            {
              $set: {
                stats: [
                  {
                    teamSize: 5,
                    elo: elo,
                    wins: 0,
                    losses: 0,
                    lastMatchDate: null,
                  },
                ],
              },
            }
          );
        }

        // Create member object
        const member: {
          discordId: string;
          discordUsername: string;
          discordNickname: string;
          discordProfilePicture: string | null;
          role: string;
          joinedAt: Date;
          elo: number;
          playerId: string | null;
        } = {
          discordId: player.discordId,
          discordUsername: player.discordUsername || `Player${player.discordId.slice(-4)}`,
          discordNickname: player.discordNickname || player.discordUsername || `Player${player.discordId.slice(-4)}`,
          discordProfilePicture: player.discordProfilePicture || null,
          role: members.length === 0 ? "captain" : "member",
          joinedAt: new Date(),
          elo: elo,
          playerId: player._id ? player._id.toString() : null,
        };

        members.push(member);
      }

      // Create captain object (first member)
      const captain = {
        discordId: members[0].discordId,
        discordUsername: members[0].discordUsername,
        discordNickname: members[0].discordNickname,
        discordProfilePicture: members[0].discordProfilePicture,
        playerId: members[0].playerId,
      };

      // Calculate initial team ELO (sum of top 5 players)
      const sortedElos = members
        .map((m) => m.elo)
        .sort((a, b) => b - a)
        .slice(0, TEAM_SIZE);
      const teamElo = sortedElos.reduce((sum, elo) => sum + elo, 0);

      // Create team
      const result = await db.collection("Teams").insertOne({
        name: teamName,
        description: `Test 5v5 team for tournament testing (created ${new Date().toISOString()})`,
        tag: teamTag.toUpperCase(),
        teamSize: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        captain: captain,
        members: members,
        teamElo: teamElo,
        isTestTeam: true, // Flag to identify test teams
      });

      console.log(`Created team ${i + 1}/${NUM_TEAMS}: ${teamName} [${teamTag}] (ELO: ${teamElo})`);

      // Recalculate team ELO to ensure accuracy
      const recalculatedElo = await calcTeamEloInline(result.insertedId.toString(), client);
      console.log(`  Recalculated ELO: ${recalculatedElo}`);

      createdTeams.push({
        _id: result.insertedId.toString(),
        name: teamName,
        tag: teamTag,
        elo: recalculatedElo,
      });
    }

    console.log("\n✅ Successfully created 5v5 test teams:");
    createdTeams.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.name} [${team.tag}] - ELO: ${team.elo}`);
    });

    console.log(`\nTotal teams created: ${createdTeams.length}`);
    console.log(`\nTo delete these teams, run: npm run delete-test-teams-5v5`);
  } catch (error) {
    console.error("Error creating 5v5 test teams:", error);
    process.exit(1);
  }
}

createTestTeams()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

