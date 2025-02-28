import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string; newCaptainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get team
    const team = await db.collection("Teams").findOne({
      _id: new ObjectId(params.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify current user is captain
    if (team.captain.discordId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team captain can transfer leadership" },
        { status: 403 }
      );
    }

    // Get new captain details
    const newCaptain = team.members.find(
      (m: any) => m.discordId === params.newCaptainId
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

    // Update team captain and member roles
    await db.collection("Teams").updateOne(
      { _id: new ObjectId(params.teamId) },
      {
        $set: {
          captain: {
            discordId: newCaptain.discordId,
            discordUsername: newCaptain.discordUsername,
            discordNickname: newCaptain.discordNickname,
          },
          "members.$[oldCaptain].role": "member",
          "members.$[newCaptain].role": "captain",
        },
      },
      {
        arrayFilters: [
          { "oldCaptain.discordId": session.user.id },
          { "newCaptain.discordId": params.newCaptainId },
        ],
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to transfer captain:", error);
    return NextResponse.json(
      { error: "Failed to transfer captain" },
      { status: 500 }
    );
  }
}
