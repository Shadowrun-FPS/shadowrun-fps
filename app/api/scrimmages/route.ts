import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user's team
    const userTeam = await db.collection("Teams").findOne({
      "members.discordId": session.user.id,
    });

    // If user is not in a team, return empty array
    if (!userTeam) {
      return NextResponse.json([]);
    }

    // Find scrimmages where the user's team is involved
    const scrimmages = await db
      .collection("Scrimmages")
      .find({
        $or: [
          { "challengerTeam._id": userTeam._id },
          { "challengedTeam._id": userTeam._id },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const serializedScrimmages = scrimmages.map((scrimmage) => {
      // Create a copy of the scrimmage object to avoid modifying the original
      const serialized = { ...scrimmage };

      // Convert ObjectId to string
      if (serialized._id) {
        (serialized as any)._id = serialized._id.toString();
      }

      // Convert challengerTeamId and challengedTeamId if they exist
      if (serialized.challengerTeamId) {
        serialized.challengerTeamId = serialized.challengerTeamId.toString();
      }

      if (serialized.challengedTeamId) {
        serialized.challengedTeamId = serialized.challengedTeamId.toString();
      }

      // Convert team IDs in the team objects
      if (serialized.challengerTeam && serialized.challengerTeam._id) {
        serialized.challengerTeam._id =
          serialized.challengerTeam._id.toString();
      }

      if (serialized.challengedTeam && serialized.challengedTeam._id) {
        serialized.challengedTeam._id =
          serialized.challengedTeam._id.toString();
      }

      // Convert dates to ISO strings
      if (serialized.proposedDate) {
        serialized.proposedDate = new Date(
          serialized.proposedDate
        ).toISOString();
      }

      if (serialized.createdAt) {
        serialized.createdAt = new Date(serialized.createdAt).toISOString();
      }

      if (serialized.updatedAt) {
        serialized.updatedAt = new Date(serialized.updatedAt).toISOString();
      }

      if (serialized.notifiedAt) {
        serialized.notifiedAt = new Date(serialized.notifiedAt).toISOString();
      }

      return serialized;
    });

    // Fetch map details for all scrimmages
    const mapIds = scrimmages
      .flatMap((scrimmage) => scrimmage.selectedMaps || [])
      .filter((id) => id);

    if (mapIds.length > 0) {
      // Convert string IDs to ObjectIds for MongoDB query
      const objectIdMapIds = mapIds
        .map((id) => {
          try {
            return new ObjectId(id.toString());
          } catch (e) {
            console.error("Invalid ObjectId:", id);
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null);

      const maps = await db
        .collection("Maps")
        .find({ _id: { $in: objectIdMapIds } })
        .toArray();

      // Add map details to each scrimmage
      serializedScrimmages.forEach((scrimmage) => {
        if (scrimmage.selectedMaps && scrimmage.selectedMaps.length > 0) {
          scrimmage.mapDetails = scrimmage.selectedMaps
            .map((mapId: any) => {
              const map = maps.find(
                (m) => m._id.toString() === mapId.toString()
              );
              return map
                ? {
                    _id: map._id.toString(),
                    name: map.name,
                    gameMode: map.gameMode || "Standard",
                  }
                : null;
            })
            .filter(Boolean);
        }
      });
    }

    return NextResponse.json(serializedScrimmages);
  } catch (error) {
    console.error("Error fetching scrimmages:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrimmages" },
      { status: 500 }
    );
  }
}
