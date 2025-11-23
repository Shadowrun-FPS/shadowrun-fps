// Load environment variables from .env.local BEFORE any other imports
// Using require() ensures this executes immediately, before ES module imports
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

import { MongoClient } from "mongodb";

// Create MongoDB connection directly (avoiding lib/mongodb.ts which checks env at import time)
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is required");
}
const mongoClient = new MongoClient(mongoUri);
const clientPromise = mongoClient.connect();

const TEST_TEAM_PREFIX = "[TEST]";

async function deleteTestTeams() {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    console.log("Starting test team deletion...");

    // Find all test teams (by prefix or isTestTeam flag)
    const testTeams = await db.collection("Teams").find({
      $or: [
        { name: { $regex: new RegExp(`^${TEST_TEAM_PREFIX}`, "i") } },
        { isTestTeam: true },
      ],
    }).toArray();

    console.log(`Found ${testTeams.length} test teams to delete`);

    if (testTeams.length === 0) {
      console.log("No test teams found to delete.");
      return;
    }

    // Show teams that will be deleted
    console.log("\nTeams to be deleted:");
    testTeams.forEach((team: any, index: number) => {
      console.log(`  ${index + 1}. ${team.name} [${team.tag}] (ID: ${team._id})`);
    });

    // Delete teams
    const teamIds = testTeams.map((team: any) => team._id);
    const result = await db.collection("Teams").deleteMany({
      _id: { $in: teamIds },
    });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} test team(s)`);

    // Also check for any teams with the prefix that might have been missed
    const remainingTestTeams = await db.collection("Teams").find({
      name: { $regex: new RegExp(`^${TEST_TEAM_PREFIX}`, "i") },
    }).toArray();

    if (remainingTestTeams.length > 0) {
      console.log(`\n⚠️  Warning: Found ${remainingTestTeams.length} additional teams with test prefix:`);
      remainingTestTeams.forEach((team: any) => {
        console.log(`  - ${team.name} [${team.tag}] (ID: ${team._id})`);
      });
      console.log("\nThese teams were not deleted. Please review manually.");
    } else {
      console.log("\n✅ All test teams have been deleted successfully!");
    }
  } catch (error) {
    console.error("Error deleting test teams:", error);
    process.exit(1);
  }
}

deleteTestTeams()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

