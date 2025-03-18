import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Unregister route hit with ID:", params.id);

    // Get session and check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to unregister a team" },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get request body
    const data = await request.json();
    const { teamId } = data;

    if (!teamId) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if tournament exists
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament registration can be modified
    if (tournament.status !== "upcoming") {
      return NextResponse.json(
        { error: "Teams cannot be removed after tournament has started" },
        { status: 400 }
      );
    }

    // Check if user is admin or team captain
    const user = await db.collection("Users").findOne({
      discordId: session.user.id,
    });

    const isAdmin = user?.roles?.includes("admin") || false;

    // Get the team from registered teams
    const registeredTeam = tournament.registeredTeams?.find(
      (team: any) => team._id === teamId
    );

    if (!registeredTeam) {
      return NextResponse.json(
        { error: "Team is not registered for this tournament" },
        { status: 400 }
      );
    }

    // Check if user is captain of the team or an admin
    const isTeamCaptain = registeredTeam.captain?.discordId === session.user.id;

    if (!isTeamCaptain && !isAdmin) {
      return NextResponse.json(
        { error: "Only team captains or admins can unregister teams" },
        { status: 403 }
      );
    }

    // First update removes the team from the teams array
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          teams: new ObjectId(teamId),
        } as any,
      }
    );

    // Second update removes the team from registeredTeams array
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          registeredTeams: { _id: teamId },
        } as any,
      }
    );

    // Next, update the bracket to remove the team from matches
    await db.collection("Tournaments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "brackets.rounds.$[].matches.$[match].teamA": null,
          "brackets.rounds.$[].matches.$[match].teamB": null,
          updatedAt: new Date(),
        },
      },
      {
        arrayFilters: [
          {
            $or: [{ "match.teamA._id": teamId }, { "match.teamB._id": teamId }],
          },
        ],
      }
    );

    // Re-seed the tournament if there are still teams
    const updatedTournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (updatedTournament?.registeredTeams?.length >= 2) {
      // Trigger reseeding
      // ... code to re-seed with remaining teams ...
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Team successfully unregistered from tournament",
    });
  } catch (error) {
    console.error("Error unregistering team:", error);
    return NextResponse.json(
      { error: "Failed to unregister team" },
      { status: 500 }
    );
  }
}
