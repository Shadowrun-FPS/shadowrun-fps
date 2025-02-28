import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { updatePlayerStats } from "@/lib/match-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { confirmerId, confirm } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const match = await db.collection("Matches").findOne({
      _id: new ObjectId(params.matchId),
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify confirmer is from opposing team
    const isTeam1 = match.team1Players.includes(match.submittedBy);
    const opposingTeam = isTeam1 ? match.team2Players : match.team1Players;

    if (!opposingTeam.includes(confirmerId)) {
      return NextResponse.json(
        { error: "Only opposing team members can confirm results" },
        { status: 403 }
      );
    }

    if (confirm) {
      // Update match status and process results
      await db.collection("Matches").updateOne(
        { _id: new ObjectId(params.matchId) },
        {
          $set: {
            status: "confirmed",
            confirmedBy: confirmerId,
            confirmedAt: new Date(),
          },
        }
      );

      // Update player stats and ELO - cast match to correct type
      await updatePlayerStats(db, match as any); // Using any here since we know the structure matches
    } else {
      // Mark match as disputed
      await db.collection("Matches").updateOne(
        { _id: new ObjectId(params.matchId) },
        {
          $set: {
            status: "disputed",
            disputedBy: confirmerId,
            disputedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to confirm match:", error);
    return NextResponse.json(
      { error: "Failed to confirm match" },
      { status: 500 }
    );
  }
}
