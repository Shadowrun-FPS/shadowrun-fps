import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

// Dynamic metadata generation based on team ID
export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Default metadata as fallback
  let title = "Team Details";
  let description = "View details about this team";

  try {
    const { teamId } = await params;
    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if the teamId is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);

    // Fetch team data - handle both ObjectId and team tag
    const team = isObjectId
      ? await db.collection("Teams").findOne({
          _id: new ObjectId(teamId),
        })
      : await db.collection("Teams").findOne({
          tag: teamId,
        });

    // If team exists, use team name in metadata
    if (team) {
      title = `${team.name} [${team.tag}] - Team Details`;

      // Create a more detailed description
      description = `View details, roster, and statistics for ${team.name}`;
      // Add team description if available
      if (team.description && team.description.trim()) {
        description = team.description.substring(0, 150);
        if (team.description.length > 150) description += "...";
      }
    }
  } catch (error) {
    console.error("Error generating team metadata:", error);
    // Fall back to default metadata
  }

  // Build the metadata object
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      // You can add more OG properties like images if available
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="container px-4 py-8 mx-auto">{children}</main>
    </div>
  );
}
