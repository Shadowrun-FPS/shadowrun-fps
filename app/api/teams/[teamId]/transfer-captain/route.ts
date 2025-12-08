import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { recalculateTeamElo } from "@/lib/team-elo-calculator";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { findTeamAcrossCollections } from "@/lib/team-collections";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

interface TeamMember {
  discordId: string;
  discordNickname?: string;
  discordUsername?: string;
  role?: string;
}

async function postTransferCaptainHandler(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in to transfer captaincy" },
      { status: 401 }
    );
  }

  const teamId = sanitizeString(params.teamId, 50);
  if (!ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { error: "Invalid team ID format" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();
  
  const body = await req.json();
  const validation = validateBody(body, {
    newCaptainId: { type: "string", required: true, maxLength: 50 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { newCaptainId } = validation.data! as { newCaptainId: string };
  const sanitizedNewCaptainId = sanitizeString(newCaptainId, 50);

    // Find team across all collections
    const teamResult = await findTeamAcrossCollections(db, teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;

    const currentUserId = session.user.id;

    const currentUserMember = team.members.find(
      (m: TeamMember) => m.discordId === currentUserId
    );

    const isCaptain =
      [SECURITY_CONFIG.DEVELOPER_ID, "418256816812015627"].includes(
        currentUserId
      ) ||
      currentUserMember?.role === "captain" ||
      team.captain?.discordId === currentUserId;

    if (!isCaptain) {
      return NextResponse.json(
        {
          error: "Only the team captain can transfer ownership",
          details: {
            userId: currentUserId,
            captainId: team.captain?.discordId,
          },
        },
        { status: 403 }
      );
    }

    const newCaptainMember = team.members.find(
      (member: any) => member.discordId === sanitizedNewCaptainId
    );

    if (!newCaptainMember) {
      return NextResponse.json(
        { error: "New captain not found in team members" },
        { status: 400 }
      );
    }

    const updateResult = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(teamId) },
      {
        $set: {
          captain: {
            discordId: sanitizedNewCaptainId,
            discordNickname: sanitizeString(newCaptainMember.discordNickname || "", 100),
            discordProfilePicture: newCaptainMember.discordProfilePicture || "",
          },
          members: team.members.map((member: any) => ({
            ...member,
            role: member.discordId === sanitizedNewCaptainId ? "captain" : "member",
          })),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 500 }
      );
    }

    await db.collection("Notifications").insertOne({
      userId: sanitizedNewCaptainId,
      type: "team_captain_transfer",
      title: "You are now a Team Captain",
      message: `You have been made the captain of team "${sanitizeString(team.name, 100)}"`,
      read: false,
      createdAt: new Date(),
      discordUsername:
        team.members.find((m: any) => m.discordId === newCaptainId)
          ?.discordUsername || "Unknown",
      discordNickname:
        team.members.find((m: any) => m.discordId === newCaptainId)
          ?.discordNickname || "Unknown",
      metadata: {
        teamId: teamId,
        teamName: sanitizeString(team.name, 100),
        previousCaptainId: session.user.id,
        previousCaptainName: sanitizeString(session.user.name || "Unknown", 100),
      },
    });

    await recalculateTeamElo(teamId);

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");

    return NextResponse.json({
      success: true,
      message: "Team captain transferred successfully",
    });
}

export const POST = withApiSecurity(postTransferCaptainHandler, {
  rateLimiter: "api",
  requireAuth: true,
  revalidatePaths: ["/teams"],
});
