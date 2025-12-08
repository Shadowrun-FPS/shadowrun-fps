import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function postTransferCaptainHandler(
  req: NextRequest,
  { params }: { params: { teamId: string; newCaptainId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = sanitizeString(params.teamId, 50);
  const newCaptainId = sanitizeString(params.newCaptainId, 50);

  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;

    // Verify current user is captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can transfer leadership" },
        { status: 403 }
      );
    }

    const newCaptain = team.members.find(
      (m: any) => m.discordId === newCaptainId
    );

    if (!newCaptain) {
      return NextResponse.json(
        { error: "New captain must be a team member" },
        { status: 400 }
      );
    }

    if (newCaptain.role === "substitute") {
      return NextResponse.json(
        { error: "Substitutes cannot be team captain" },
        { status: 400 }
      );
    }

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(teamId) },
      {
        $set: {
          captain: {
            discordId: sanitizeString(newCaptain.discordId, 50),
            discordUsername: sanitizeString(newCaptain.discordUsername || "", 100),
            discordNickname: sanitizeString(newCaptain.discordNickname || "", 100),
          },
          "members.$[oldCaptain].role": "member",
          "members.$[newCaptain].role": "captain",
        },
      },
      {
        arrayFilters: [
          { "oldCaptain.discordId": sanitizeString(session.user.id, 50) },
          { "newCaptain.discordId": newCaptainId },
        ],
      }
    );

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);

    return NextResponse.json({ success: true });
}

export const POST = withApiSecurity(postTransferCaptainHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
