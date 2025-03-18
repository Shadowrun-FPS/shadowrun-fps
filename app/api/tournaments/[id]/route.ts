import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Team {
  _id: string | ObjectId;
  name: string;
  tag: string;
  captain?: {
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
  };
  members?: Array<{
    discordId: string;
    discordUsername?: string;
    discordNickname?: string;
    discordProfilePicture?: string;
    role?: string;
  }>;
  teamElo?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(id),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get registered teams
    let registeredTeams: Team[] = [];
    if (tournament.teams && Array.isArray(tournament.teams)) {
      const teamIds = tournament.teams.map((teamId) =>
        typeof teamId === "string" ? new ObjectId(teamId) : teamId
      );

      if (teamIds.length > 0) {
        registeredTeams = (await db
          .collection("Teams")
          .find({
            _id: { $in: teamIds },
          })
          .project({
            _id: 1,
            name: 1,
            tag: 1,
          })
          .toArray()) as unknown as Team[];
      }
    }

    // Convert ObjectId to string
    const formattedTournament = {
      ...tournament,
      _id: tournament._id.toString(),
      registeredTeams: registeredTeams.map((team) => ({
        ...team,
        _id: team._id.toString(),
      })),
    };

    if (tournament.registeredTeams && tournament.registeredTeams.length > 0) {
      const teamIds = tournament.registeredTeams.map((team: any) =>
        typeof team._id === "string" ? new ObjectId(team._id) : team._id
      );

      const teamDetails = await db
        .collection("Teams")
        .find({
          _id: { $in: teamIds },
        })
        .toArray();

      // Replace team references with full team objects
      tournament.registeredTeams = tournament.registeredTeams.map(
        (team: any) => {
          const details = teamDetails.find(
            (t: any) => t._id.toString() === team._id.toString()
          );
          return { ...team, ...details };
        }
      );
    }

    return NextResponse.json(formattedTournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament data" },
      { status: 500 }
    );
  }
}
