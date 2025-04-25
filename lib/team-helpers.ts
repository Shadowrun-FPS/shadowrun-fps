import { MongoClient, ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { TeamMember, MongoTeam } from "@/types/mongodb";

export async function updateTeamElo(teamId: string) {
  const client = await clientPromise;
  const webDb = client.db("ShadowrunWeb");
  const db2 = client.db("ShadowrunDB2");

  // Get team with members
  const team = await webDb.collection<MongoTeam>("Teams").findOne({
    _id: new ObjectId(teamId),
  });

  if (!team) return;

  // Get all non-substitute members
  const activeMembers = team.members
    .filter((m: TeamMember) => m.role !== "substitute")
    .slice(0, 4);

  // Get all member discord IDs
  const memberIds = activeMembers.map((m: TeamMember) => m.discordId);

  // Get player ratings from ShadowrunDB2 for teamSize 4
  const db2Players = await db2
    .collection("players")
    .find({ discordId: { $in: memberIds } })
    .toArray();

  // Calculate combined ELO using DB2 ratings when available
  let combinedElo = 0;

  for (const member of activeMembers) {
    // First check if player exists in DB2
    const db2Player = db2Players.find((p) => p.discordId === member.discordId);

    if (db2Player && db2Player.rating !== undefined) {
      // Use ShadowrunDB2 rating
      combinedElo += parseInt(String(db2Player.rating || "1500"));
    } else {
      // Fall back to ShadowrunWeb rating
      combinedElo += parseInt(String(member.elo?.["4v4"] || "1500"));
    }
  }

  // Update team ELO
  await webDb.collection<MongoTeam>("Teams").updateOne(
    { _id: new ObjectId(teamId) },
    {
      $set: {
        teamElo: combinedElo.toString(),
        lastEloUpdate: new Date(),
      },
    }
  );

  return combinedElo.toString();
}

export async function recalculateTeamElos() {
  const client = await clientPromise;
  const webDb = client.db("ShadowrunWeb");
  const db2 = client.db("ShadowrunDB2");

  const teams = await webDb.collection("Teams").find({}).toArray();

  for (const team of teams) {
    const activeMembers = team.members
      .filter((m: any) => m.role !== "substitute")
      .slice(0, 4);

    const memberIds = activeMembers.map((m: any) => m.discordId);

    // Get player ratings from ShadowrunDB2 for teamSize 4
    const db2Players = await db2
      .collection("players")
      .find({ discordId: { $in: memberIds } })
      .toArray();

    // Calculate combined ELO using DB2 ratings when available
    let combinedElo = 0;

    for (const member of activeMembers) {
      // First check if player exists in DB2
      const db2Player = db2Players.find(
        (p) => p.discordId === member.discordId
      );

      if (db2Player && db2Player.rating !== undefined) {
        // Use ShadowrunDB2 rating
        combinedElo += parseInt(String(db2Player.rating || "1500"));
      } else {
        // Fall back to ShadowrunWeb rating
        combinedElo += parseInt(String(member.elo?.[`4v4`] || "1500"));
      }
    }

    await webDb.collection("Teams").updateOne(
      { _id: team._id },
      {
        $set: {
          teamElo: combinedElo.toString(),
          lastEloUpdate: new Date(),
        },
      }
    );
  }
}

export async function getTeamById(teamId: string) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  return await db.collection<MongoTeam>("Teams").findOne({
    _id: new ObjectId(teamId),
  });
}

export async function isTeamCaptain(teamId: string, userId: string) {
  const team = await getTeamById(teamId);
  return team?.captain.discordId === userId;
}

export async function isTeamMember(teamId: string, userId: string) {
  const team = await getTeamById(teamId);
  return team?.members.some(
    (member: TeamMember) => member.discordId === userId
  );
}

export async function updateTeamMember(
  teamId: string,
  memberId: string,
  update: any
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  return db.collection("Teams").updateOne(
    {
      _id: new ObjectId(teamId),
      "members.discordId": memberId,
    },
    { $set: { "members.$": update } }
  );
}
