import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  validateMatchResult,
  validateMatchSubmission,
} from "@/lib/matchValidation";

export async function POST(req: NextRequest) {
  try {
    const matchResult = await req.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Validate match result
    const resultValidation = validateMatchResult(matchResult, 4); // 4 players per team
    if (!resultValidation.isValid) {
      return NextResponse.json(
        { error: resultValidation.error },
        { status: 400 }
      );
    }

    // Validate submission
    const submissionValidation = validateMatchSubmission(
      matchResult,
      matchResult.team1Players
    );
    if (!submissionValidation.isValid) {
      return NextResponse.json(
        { error: submissionValidation.error },
        { status: 400 }
      );
    }

    // Store match result
    const result = await db.collection("Matches").insertOne({
      ...matchResult,
      status: "pending", // Requires confirmation from opposing team
      createdAt: new Date(),
    });

    // Notify other team members (you can implement this through your preferred notification system)

    return NextResponse.json({ matchId: result.insertedId });
  } catch (error) {
    console.error("Failed to submit match result:", error);
    return NextResponse.json(
      { error: "Failed to submit match result" },
      { status: 500 }
    );
  }
}
