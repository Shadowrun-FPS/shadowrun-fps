import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const scrimmageId = params.id;

    // Get the scrimmage
    const scrimmage = await db.collection("Scrimmages").findOne({
      _id: new ObjectId(scrimmageId),
    });

    if (!scrimmage) {
      return NextResponse.json(
        { error: "Scrimmage not found" },
        { status: 404 }
      );
    }

    // Get teams
    const [challengerTeam, challengedTeam] = await Promise.all([
      db.collection("Teams").findOne({ _id: scrimmage.challengerTeamId }),
      db.collection("Teams").findOne({ _id: scrimmage.challengedTeamId }),
    ]);

    // Check if user is part of either team
    const isUserInTeams =
      (challengerTeam?.members || []).some(
        (m: { discordId: string }) => m.discordId === session.user.id
      ) ||
      (challengedTeam?.members || []).some(
        (m: { discordId: string }) => m.discordId === session.user.id
      );

    if (!isUserInTeams) {
      return NextResponse.json(
        { error: "You don't have permission to view this scrimmage" },
        { status: 403 }
      );
    }

    // Get map details
    const mapIds = scrimmage.selectedMaps.map(
      (map: { isSmallVariant?: boolean; mapId: any }) =>
        map.isSmallVariant ? map.mapId : map.mapId
    );

    const maps = await db
      .collection("Maps")
      .find({ _id: { $in: mapIds } })
      .toArray();

    // Transform for client
    return NextResponse.json({
      ...scrimmage,
      _id: scrimmage._id.toString(),
      challengerTeamId: scrimmage.challengerTeamId.toString(),
      challengedTeamId: scrimmage.challengedTeamId.toString(),
      challengerTeam: challengerTeam
        ? {
            ...challengerTeam,
            _id: challengerTeam._id.toString(),
          }
        : null,
      challengedTeam: challengedTeam
        ? {
            ...challengedTeam,
            _id: challengedTeam._id.toString(),
          }
        : null,
      selectedMaps: scrimmage.selectedMaps.map((map: { mapId: any }) => ({
        ...map,
        mapId: map.mapId.toString(),
      })),
      maps: maps.map((map) => ({
        ...map,
        _id: map._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching scrimmage:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrimmage" },
      { status: 500 }
    );
  }
}
