import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { findTeamAcrossCollections, getTeamCollectionName } from "@/lib/team-collections";

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

    // Get the team - search across all collections
    const teamResult = await findTeamAcrossCollections(db, params.teamId);
    if (!teamResult) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    const team = teamResult.team;
    const collectionName = teamResult.collectionName;

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

    // Check if team has any history (wins, losses, or tournament wins)
    const wins = team.wins || 0;
    const losses = team.losses || 0;
    const tournamentWins = team.tournamentWins || 0;
    const gamesPlayed = wins + losses;
    const hasHistory = wins > 0 || losses > 0 || tournamentWins > 0;

    // Cancel all pending scrimmages involving this team
    const pendingScrimmages = await db.collection("Scrimmages").find({
      status: "pending",
      $or: [
        { challengerTeamId: params.teamId },
        { challengedTeamId: params.teamId },
      ],
    }).toArray();

    // Update pending scrimmages to cancelled status
    if (pendingScrimmages.length > 0) {
      await db.collection("Scrimmages").updateMany(
        {
          status: "pending",
          $or: [
            { challengerTeamId: params.teamId },
            { challengedTeamId: params.teamId },
          ],
        },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
            cancellationReason: `Team "${team.name}" was deleted`,
          },
        }
      );

      // Notify the other team's captain about cancelled scrimmages
      for (const scrimmage of pendingScrimmages) {
        const otherTeamId = scrimmage.challengerTeamId === params.teamId 
          ? scrimmage.challengedTeamId 
          : scrimmage.challengerTeamId;
        
        const otherTeamResult = await findTeamAcrossCollections(db, otherTeamId);
        if (otherTeamResult?.team?.captain?.discordId) {
          await db.collection("Notifications").insertOne({
            userId: otherTeamResult.team.captain.discordId,
            type: "scrimmage_cancelled",
            title: "Scrimmage Cancelled",
            message: `The scrimmage with "${team.name}" has been cancelled because the team was deleted.`,
            read: false,
            createdAt: new Date(),
            metadata: {
              scrimmageId: scrimmage._id.toString(),
              cancelledTeamId: params.teamId,
              cancelledTeamName: team.name,
            },
          });
        }
      }
    }

    // If team has history, archive it instead of deleting
    if (hasHistory) {
      // Create archived team record with minimal information
      const archivedTeam = {
        originalTeamId: params.teamId,
        originalCollection: collectionName,
        name: team.name,
        tag: team.tag,
        teamSize: team.teamSize || 4,
        description: team.description || "",
        // Stats
        wins: wins,
        losses: losses,
        tournamentWins: tournamentWins,
        gamesPlayed: gamesPlayed,
        finalTeamElo: team.teamElo || 0,
        // Team members (minimal info)
        captain: {
          discordId: team.captain?.discordId || "",
          discordUsername: team.captain?.discordUsername || "",
          discordNickname: team.captain?.discordNickname || "",
        },
        members: (team.members || []).map((member: any) => ({
          discordId: member.discordId || "",
          discordUsername: member.discordUsername || "",
          discordNickname: member.discordNickname || "",
          role: member.role || "member",
        })),
        // Dates
        createdAt: team.createdAt || new Date(),
        archivedAt: new Date(),
        archivedBy: session.user.id,
      };

      // Store in ArchivedTeams collection
      await db.collection("ArchivedTeams").insertOne(archivedTeam);

      // Delete the team from active collection
      await db.collection(collectionName).deleteOne({
        _id: new ObjectId(params.teamId),
      });
    } else {
      // No history, just delete normally
      await db.collection(collectionName).deleteOne({
        _id: new ObjectId(params.teamId),
      });
    }

    // Delete all related invites
    await db.collection("TeamInvites").deleteMany({
      teamId: params.teamId,
    });

    return NextResponse.json({ 
      success: true,
      archived: hasHistory,
      message: hasHistory 
        ? "Team has been archived due to its history" 
        : "Team has been deleted",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
