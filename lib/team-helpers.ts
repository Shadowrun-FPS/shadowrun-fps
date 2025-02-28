import { MongoClient, ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { TeamMember, MongoTeam } from "@/types/mongodb";

export async function updateTeamElo(teamId: string) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Get team with members
  const team = await db.collection<MongoTeam>("Teams").findOne({
    _id: new ObjectId(teamId),
  });

  if (!team) return;

  // Get all non-substitute members
  const activeMembers = team.members
    .filter((m: TeamMember) => m.role !== "substitute")
    .slice(0, 4);

  // Calculate combined ELO
  const combinedElo = activeMembers.reduce(
    (sum: number, member: TeamMember) =>
      sum + parseInt(member.elo?.["4v4"] || "1500"),
    0
  );

  // Update team ELO
  await db.collection<MongoTeam>("Teams").updateOne(
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
