import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(params.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is the captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can delete the team" },
        { status: 403 }
      );
    }

    // Check if there are other members
    if (
      team.members.filter((m: any) => m.discordId !== session.user.id).length >
      0
    ) {
      return NextResponse.json(
        { error: "You must remove all other members before deleting the team" },
        { status: 400 }
      );
    }

    // Delete the team
    await db.collection("Teams").deleteOne({
      _id: new ObjectId(params.teamId),
    });

    // Delete all related invites
    await db.collection("TeamInvites").deleteMany({
      teamId: params.teamId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
