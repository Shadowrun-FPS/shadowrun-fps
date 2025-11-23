import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: { matchId: string };
}

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Default metadata as fallback
  let title = "Tournament Match";
  let description = "View details about this tournament match";

  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if matchId is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.matchId);
    
    // Fetch match data
    let match = null;
    if (isObjectId) {
      match = await db.collection("TournamentMatches").findOne({
        _id: new ObjectId(params.matchId),
      });
    }
    
    // If not found by _id or not an ObjectId, try tournamentMatchId field
    if (!match) {
      match = await db.collection("TournamentMatches").findOne({
        tournamentMatchId: params.matchId,
      });
    }

    // If match exists, fetch tournament to get team size and use team names in metadata
    if (match && match.tournamentId) {
      const tournament = await db.collection("Tournaments").findOne({
        _id: new ObjectId(match.tournamentId),
      });

      const teamA = match.teamA?.name || "Team A";
      const teamB = match.teamB?.name || "Team B";
      const teamSize = tournament?.teamSize || match.teamSize || 4;
      const teamSizeLabel = teamSize === 2 ? "Duos" : teamSize === 3 ? "Trios" : teamSize === 4 ? "Squads" : teamSize === 5 ? "Full Team" : `${teamSize}v${teamSize}`;
      const tournamentName = tournament?.name || "Tournament";

      // Create title with both team names, team size, and tournament name
      title = `${teamA} vs ${teamB} - ${teamSizeLabel} Match | ${tournamentName}`;

      // Create a more detailed description
      const matchStatus =
        match.status.charAt(0).toUpperCase() + match.status.slice(1);
      description = `${matchStatus} ${teamSize}v${teamSize} tournament match between ${teamA} and ${teamB} in ${tournamentName}`;

      // If match is completed and has a winner
      if (match.status === "completed" && match.winner) {
        const winnerTeam = match.winner === 1 ? teamA : teamB;
        description = `${winnerTeam} won the ${teamSize}v${teamSize} match against ${match.winner === 1 ? teamB : teamA} in ${tournamentName}`;
      }
    }
  } catch (error) {
    console.error("Error generating tournament match metadata:", error);
    // Fall back to default metadata
  }

  // Build the metadata object
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function TournamentMatchLayout({ children }: LayoutProps) {
  return children;
}

