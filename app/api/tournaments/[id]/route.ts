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

interface TeamMember {
  discordId?: string;
  discordUsername?: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
  role?: string;
  elo?: number;
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

    // Important: Fix the registeredTeams structure
    if (
      tournament.registeredTeams &&
      Array.isArray(tournament.registeredTeams)
    ) {
      console.log(
        "Processing registered teams in API:",
        tournament.registeredTeams.length
      );

      // Enhance each team with proper structure
      tournament.registeredTeams = tournament.registeredTeams.map((team) => {
        // Ensure we have an object with proper structure
        return {
          _id: team._id ? team._id.toString() : "",
          name: team.name || "Unknown Team",
          tag: team.tag || "",
          description: team.description || "",
          teamElo: typeof team.teamElo === "number" ? team.teamElo : 0,

          // Ensure members is always an array
          members: Array.isArray(team.members)
            ? team.members.map((member: TeamMember) => ({
                discordId: member.discordId || "",
                discordUsername: member.discordUsername || "Unknown",
                discordNickname: member.discordNickname || null,
                discordProfilePicture: member.discordProfilePicture || null,
                role: member.role || "member",
                elo: typeof member.elo === "number" ? member.elo : 0,
              }))
            : [],

          // Ensure captain is a valid object
          captain: team.captain
            ? {
                discordId: team.captain.discordId || "",
                discordUsername: team.captain.discordUsername || "Unknown",
                discordNickname: team.captain.discordNickname || null,
                discordProfilePicture:
                  team.captain.discordProfilePicture || null,
                elo:
                  typeof team.captain.elo === "number" ? team.captain.elo : 0,
              }
            : {
                discordId: "",
                discordUsername: "Unknown",
                discordNickname: null,
                discordProfilePicture: null,
                elo: 0,
              },
        };
      });
    } else {
      tournament.registeredTeams = [];
    }

    // Convert ObjectId to string for the entire object
    const formattedTournament = {
      ...tournament,
      _id: tournament._id.toString(),
      // For "teams" array (references to team IDs)
      teams: tournament.teams
        ? tournament.teams.map((teamId: string | ObjectId) =>
            typeof teamId === "object" ? teamId.toString() : teamId
          )
        : [],
      // Use the fixed registeredTeams we created above
      registeredTeams: tournament.registeredTeams,
    };

    return NextResponse.json(formattedTournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament data" },
      { status: 500 }
    );
  }
}
