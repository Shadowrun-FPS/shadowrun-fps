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

    // Fetch scrimmage data
    const scrimmage = await db.collection("Scrimmages").findOne({
      $or: [
        { _id: new ObjectId(params.scrimmageId) },
        { scrimmageId: params.scrimmageId },
      ],
    });

    // If scrimmage exists, use team names in metadata
    if (scrimmage) {
      const teamA = scrimmage.challengerTeam?.name || "Team A";
      const teamB = scrimmage.challengedTeam?.name || "Team B";

      // Create title with both team names
      title = `${teamA} vs ${teamB} - Scrimmage Match`;

      // Create a more detailed description
      const matchStatus =
        scrimmage.status.charAt(0).toUpperCase() + scrimmage.status.slice(1);
      description = `${matchStatus} scrimmage match between ${teamA} and ${teamB}`;

      // If match is completed and has a winner
      if (scrimmage.status === "completed" && scrimmage.winner) {
        const winnerTeam = scrimmage.winner === "teamA" ? teamA : teamB;
        description = `${winnerTeam} won the scrimmage match between ${teamA} and ${teamB}`;
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
