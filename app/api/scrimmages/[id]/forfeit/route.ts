import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postForfeitScrimmageHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = sanitizeString(params.id, 100);
  const { db } = await connectToDatabase();

  let scrimmage = null;
  if (ObjectId.isValid(id)) {
    try {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      safeLog.log("Not a valid ObjectId, trying scrimmageId");
    }
  }

  if (!scrimmage) {
    scrimmage = await db.collection("Scrimmages").findOne({
      scrimmageId: id,
    });
  }

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Verify user is authorized to forfeit
    const isAdmin = session.user.roles?.includes("admin");
    const isTeamACaptain =
      session.user.id === scrimmage.challengerTeam?.captain?.discordId ||
      scrimmage.challengerTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );
    const isTeamBCaptain =
      session.user.id === scrimmage.challengedTeam?.captain?.discordId ||
      scrimmage.challengedTeam?.members?.some(
        (member: any) =>
          member.discordId === session.user.id && member.role === "captain"
      );

    if (!isAdmin && !isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json(
        { error: "You are not authorized to forfeit this match" },
        { status: 403 }
      );
    }

    // Determine which team is forfeiting
    const forfeitingTeam = isTeamACaptain ? "teamA" : "teamB";
    const winningTeam = forfeitingTeam === "teamA" ? "teamB" : "teamA";

    // Create map scores with 0-2 for all maps
    const mapScores = (scrimmage.selectedMaps || []).map(() => ({
      teamAScore: forfeitingTeam === "teamA" ? 0 : 2,
      teamBScore: forfeitingTeam === "teamB" ? 0 : 2,
      winner: winningTeam,
      teamASubmitted: true,
      teamBSubmitted: true,
    }));

    // Update the scrimmage status to forfeited
    await db.collection("Scrimmages").updateOne(
      { _id: scrimmage._id },
      {
        $set: {
          status: "forfeited",
          forfeitedAt: new Date(),
          forfeitedBy: forfeitingTeam,
          winner: winningTeam,
          mapScores: mapScores,
        },
      }
    );

    // Get the updated scrimmage
    const updatedScrimmage = await db.collection("Scrimmages").findOne({
      _id: scrimmage._id,
    });

    revalidatePath("/scrimmages");
    revalidatePath(`/scrimmages/${id}`);

    return NextResponse.json(updatedScrimmage);
}

export const POST = withApiSecurity(postForfeitScrimmageHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/scrimmages"],
});
