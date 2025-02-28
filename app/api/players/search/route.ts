import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const teamId = searchParams.get("teamId");

    if (!query) {
      return NextResponse.json({ players: [] });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find players matching the search query
    const players = await db
      .collection("Players")
      .find({
        $or: [
          { discordUsername: { $regex: query, $options: "i" } },
          { discordNickname: { $regex: query, $options: "i" } },
        ],
      })
      .limit(10)
      .toArray();

    // If teamId is provided, check for pending invites
    if (teamId) {
      const pendingInvites = await db
        .collection("TeamInvites")
        .find({
          teamId:
            teamId && /^[0-9a-fA-F]{24}$/.test(teamId)
              ? new ObjectId(teamId)
              : null,
          inviteeId: { $in: players.map((p) => p.discordId) },
          status: "pending",
        })
        .toArray();

      // Add invited flag to players
      const playersWithInviteStatus = players.map((player) => ({
        ...player,
        invited: pendingInvites.some(
          (invite) => invite.inviteeId === player.discordId
        ),
      }));

      return NextResponse.json({ players: playersWithInviteStatus });
    }

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Failed to search players:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
