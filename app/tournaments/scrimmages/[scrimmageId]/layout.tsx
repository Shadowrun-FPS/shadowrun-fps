import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: { scrimmageId: string };
}

// Dynamic metadata generation based on scrimmage ID
export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Default metadata as fallback
  let title = "Scrimmage Match";
  let description = "View details about this scrimmage match";

  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if scrimmageId is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.scrimmageId);
    
    // Fetch scrimmage data
    let scrimmage = null;
    if (isObjectId) {
      scrimmage = await db.collection("Scrimmages").findOne({
        _id: new ObjectId(params.scrimmageId),
      });
    }
    
    // If not found by _id or not an ObjectId, try scrimmageId field
    if (!scrimmage) {
      scrimmage = await db.collection("Scrimmages").findOne({
        scrimmageId: params.scrimmageId,
      });
    }

    // If scrimmage exists, use team names in metadata
    if (scrimmage) {
      const teamA = scrimmage.challengerTeam?.name || "Team A";
      const teamB = scrimmage.challengedTeam?.name || "Team B";
      const teamSize = scrimmage.teamSize || 4;
      const teamSizeLabel = teamSize === 2 ? "Duos" : teamSize === 3 ? "Trios" : teamSize === 4 ? "Squads" : teamSize === 5 ? "Full Team" : `${teamSize}v${teamSize}`;

      // Create title with both team names and team size
      title = `${teamA} vs ${teamB} - ${teamSizeLabel} Scrimmage Match`;

      // Create a more detailed description
      const matchStatus =
        scrimmage.status.charAt(0).toUpperCase() + scrimmage.status.slice(1);
      description = `${matchStatus} ${teamSize}v${teamSize} scrimmage match between ${teamA} and ${teamB}`;

      // If match is completed and has a winner
      if (scrimmage.status === "completed" && scrimmage.winner) {
        const winnerTeam = scrimmage.winner === "teamA" ? teamA : teamB;
        description = `${winnerTeam} won the ${teamSize}v${teamSize} scrimmage match between ${teamA} and ${teamB}`;
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
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
      // You can add more OG properties like images if available
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ScrimmageLayout({ children }: LayoutProps) {
  return children;
}
