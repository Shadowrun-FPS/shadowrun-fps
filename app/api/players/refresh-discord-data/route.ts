import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Define the interface for the request body
interface RefreshDiscordDataRequest {
  nickname?: string;
  updateTeamInfo?: boolean;
  forceDiscordRefresh?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get request body if available
    let requestBody: RefreshDiscordDataRequest = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // No body or invalid JSON
    }

    const {
      nickname,
      updateTeamInfo = true,
      forceDiscordRefresh = false,
    } = requestBody;

    // Get the user's Discord data from the session
    const discordId = session.user.id;
    let discordUsername = session.user.name;
    const discordNickname =
      nickname || session.user.nickname || session.user.name;

    // First, check if the player already exists and get their current profile picture
    const existingPlayer = await db
      .collection("Players")
      .findOne({ discordId });
    let discordProfilePicture = session.user.image;

    // If session has no image but player has one in DB, keep the existing one
    if (!discordProfilePicture && existingPlayer?.discordProfilePicture) {
      discordProfilePicture = existingPlayer.discordProfilePicture;
    }

    // If forceDiscordRefresh is true, fetch latest data from Discord
    if (forceDiscordRefresh) {
      try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.DISCORD_GUILD_ID;

        if (botToken && guildId) {
          // Fetch latest user data from Discord API
          const discordResponse = await fetch(
            `https://discord.com/api/v10/users/${discordId}`,
            {
              headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (discordResponse.ok) {
            const userData = await discordResponse.json();
            // Update with latest Discord data
            discordUsername = userData.username;

            // Only update profile picture if we get a valid avatar from Discord
            if (userData.avatar) {
              discordProfilePicture = `https://cdn.discordapp.com/avatars/${discordId}/${userData.avatar}.png`;
            }
          }
        }
      } catch (discordError) {
        console.error("Error fetching Discord user data:", discordError);
        // Continue with session data if Discord API fails
      }
    }

    // Never set profile picture to null if we have an existing value
    if (!discordProfilePicture && existingPlayer?.discordProfilePicture) {
      discordProfilePicture = existingPlayer.discordProfilePicture;
    }

    // Update the player document
    const updateResult = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordUsername,
          discordNickname,
          ...(discordProfilePicture ? { discordProfilePicture } : {}),
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
      // Find all teams where this player is a member - search across all collections
      const { getAllTeamCollectionNames } = await import("@/lib/team-collections");
      const allCollections = getAllTeamCollectionNames();
      const teams = [];
      for (const collectionName of allCollections) {
        const collectionTeams = await db
          .collection(collectionName)
          .find({
            "members.discordId": discordId,
          })
          .toArray();
        teams.push(...collectionTeams.map((t: any) => ({ ...t, _collectionName: collectionName })));
      }

      // Update each team with the player's latest Discord info
      for (const team of teams) {
        const collectionName = (team as any)._collectionName;
        const updateFields: any = {
          "members.$.discordUsername": discordUsername,
          "members.$.discordNickname": discordNickname,
        };

        // Only include profile picture in update if it's not null
        if (discordProfilePicture) {
          updateFields["members.$.discordProfilePicture"] =
            discordProfilePicture;
        }

        await db.collection(collectionName).updateOne(
          {
            _id: team._id,
            "members.discordId": discordId,
          },
          {
            $set: updateFields,
          }
        );

        // If this player is the team captain, also update the captain info
        if (team.captain.discordId === discordId) {
          const captainUpdateFields: any = {
            "captain.discordUsername": discordUsername,
            "captain.discordNickname": discordNickname,
          };

          // Only include profile picture in update if it's not null
          if (discordProfilePicture) {
            captainUpdateFields["captain.discordProfilePicture"] =
              discordProfilePicture;
          }

          await db.collection(collectionName).updateOne(
            { _id: team._id },
            {
              $set: captainUpdateFields,
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
