import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const { roundIndex, matchIndex, score1, score2 } = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(params.tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Update match result
    const updatePath = `bracket.${roundIndex}.matches.${matchIndex}`;
    const winner =
      score1 > score2
        ? tournament.bracket[roundIndex].matches[matchIndex].team1
        : tournament.bracket[roundIndex].matches[matchIndex].team2;

    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(params.tournamentId) },
      {
        $set: {
          [`${updatePath}.score1`]: score1,
          [`${updatePath}.score2`]: score2,
          [`${updatePath}.winner`]: winner,
        },
      }
    );

    // Advance winner to next round if applicable
    if (roundIndex < tournament.bracket.length - 1) {
      const nextRoundMatchIndex = Math.floor(matchIndex / 2);
      const isFirstMatch = matchIndex % 2 === 0;
      const nextMatchPath = `bracket.${
        roundIndex + 1
      }.matches.${nextRoundMatchIndex}`;

      await db.collection("Tournaments").updateOne(
        { _id: new ObjectId(params.tournamentId) },
        {
          $set: {
            [`${nextMatchPath}.${isFirstMatch ? "team1" : "team2"}`]: winner,
          },
        }
      );
    }

    const updatedTournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(params.tournamentId),
    });

    return NextResponse.json(updatedTournament);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
