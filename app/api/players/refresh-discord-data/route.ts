import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get request body if available
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // No body or invalid JSON
    }

    const { nickname, updateTeamInfo = true } = requestBody;

    // Get the user's Discord data from the session
    const discordId = session.user.id;
    const discordUsername = session.user.name;
    const discordNickname =
      nickname || session.user.nickname || session.user.name;
    const discordProfilePicture = session.user.image;

    // Update the player document
    const updateResult = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordUsername,
          discordNickname,
          discordProfilePicture,
          lastUpdated: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          elo: 1000,
          wins: 0,
          losses: 0,
          matches: [],
        },
      },
      { upsert: true }
    );

    // If updateTeamInfo is true, update the player's info in any teams they belong to
    if (updateTeamInfo) {
      // Find all teams where this player is a member
      const teams = await db
        .collection("Teams")
        .find({
          "members.discordId": discordId,
        })
        .toArray();

      // Update each team with the player's latest Discord info
      for (const team of teams) {
        await db.collection("Teams").updateOne(
          {
            _id: team._id,
            "members.discordId": discordId,
          },
          {
            $set: {
              "members.$.discordUsername": discordUsername,
              "members.$.discordNickname": discordNickname,
              "members.$.discordProfilePicture": discordProfilePicture,
            },
          }
        );

        // If this player is the team captain, also update the captain info
        if (team.captain.discordId === discordId) {
          await db.collection("Teams").updateOne(
            { _id: team._id },
            {
              $set: {
                "captain.discordUsername": discordUsername,
                "captain.discordNickname": discordNickname,
                "captain.discordProfilePicture": discordProfilePicture,
              },
            }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updateResult.modifiedCount > 0,
      created: updateResult.upsertedCount > 0,
    });
  } catch (error) {
    console.error("Error refreshing player data:", error);
    return NextResponse.json(
      { error: "Failed to refresh player data" },
      { status: 500 }
    );
  }
}
