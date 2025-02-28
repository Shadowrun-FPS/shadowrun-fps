import { MongoClient } from "mongodb";
import clientPromise from "../lib/mongodb";

async function migrateTeamElo() {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const teams = await db.collection("Teams").find({}).toArray();

  for (const team of teams) {
    const activeMembers = team.members
      .filter((m: any) => m.role !== "substitute")
      .slice(0, 4);

    const combinedElo = activeMembers.reduce(
      (sum: number, member: any) =>
        sum + (parseInt(member.elo?.[`4v4`]) || 1500),
      0
    );

    await db.collection("Teams").updateOne(
      { _id: team._id },
      {
        $set: {
          teamElo: combinedElo.toString(),
          lastEloUpdate: new Date(),
        },
      }
    );

    console.log(`Updated team ${team.name} with ELO ${combinedElo}`);
  }
}

migrateTeamElo().catch(console.error);
