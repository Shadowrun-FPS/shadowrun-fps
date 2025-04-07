import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const tournamentId = params.id;
    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    console.log(`Unregistering team ${teamId} from tournament ${tournamentId}`);

    const { db } = await connectToDatabase();

    // Check if user is admin or team captain
    const isAdmin =
      session.user.id === "238329746671271936" ||
      (session.user.roles &&
        (session.user.roles.includes("admin") ||
          session.user.roles.includes("moderator")));

    // Get the tournament first to check if the team is registered
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament is in upcoming status
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Cannot unregister from an active or completed tournament" },
        { status: 400 }
      );
    }

    // Check if the team is registered
    const isTeamRegistered = tournament.registeredTeams.some(
      (team: any) => team._id.toString() === teamId || team._id === teamId
    );

    if (!isTeamRegistered) {
      return NextResponse.json(
        { error: "Team is not registered in this tournament" },
        { status: 400 }
      );
    }

    // If not admin, check if user is the team captain
    if (!isAdmin) {
      const team = await db.collection("Teams").findOne({
        _id: new ObjectId(teamId),
        "captain.discordId": session.user.id,
      });

      if (!team) {
        return NextResponse.json(
          { error: "You must be the team captain to unregister" },
          { status: 403 }
        );
      }
    }

    // Update the tournament document to remove the team
    const result = await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      {
        $pull: {
          registeredTeams: { _id: teamId } as any,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to unregister team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team unregistered successfully",
    });
  } catch (error) {
    console.error("Error unregistering team:", error);
    return NextResponse.json(
      { error: "Failed to unregister team" },
      { status: 500 }
    );
  }
}
