import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Find and update the match
    const result = await db.collection("Matches").findOneAndUpdate(
      {
        _id: new ObjectId(params.matchId),
        $or: [
          { "teams.teamA.discordId": session.user.id },
          { "teams.teamB.discordId": session.user.id },
        ],
      },
      {
        $set: {
          [`teams.$[player].ready`]: true,
        },
      },
      {
        arrayFilters: [{ "player.discordId": session.user.id }],
        returnDocument: "after",
      }
    );

    if (!result) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = result.value;
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if all players are ready
    const allPlayersReady = [...match.teams.teamA, ...match.teams.teamB].every(
      (player) => player.ready
    );

    if (allPlayersReady) {
      // Update match status to "in-progress"
      await db
        .collection("Matches")
        .updateOne(
          { _id: new ObjectId(params.matchId) },
          { $set: { status: "in-progress" } }
        );
    }

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Failed to update ready status:", error);
    return NextResponse.json(
      { error: "Failed to update ready status" },
      { status: 500 }
    );
  }
}
