import { Metadata, ResolvingMetadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Try to find the tournament by ID
    const tournament = await db.collection("Tournaments").findOne({
      _id: new ObjectId(params.id),
    });

    if (!tournament) {
      return {
        title: "Tournament Not Found | Shadowrun FPS",
        description: "The tournament you're looking for doesn't exist",
      };
    }

    // Create dynamic metadata based on tournament data
    const title = `${tournament.name} | Shadowrun FPS Tournaments`;
    let description =
      tournament.description ||
      `${tournament.teamSize}v${
        tournament.teamSize
      } ${tournament.format.replace("_", " ")} tournament`;

    // Add registration info if available
    if (tournament.registrationDeadline) {
      const deadline = new Date(tournament.registrationDeadline);
      const now = new Date();
      if (deadline > now) {
        description += ` - Registration open until ${deadline.toLocaleDateString()}`;
      }
    }

    // Only include basic metadata without default images
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating tournament metadata:", error);
    return {
      title: "Tournament | Shadowrun FPS",
      description: "View tournament details and brackets",
    };
  }
}

export default function TournamentLayout({ children }: LayoutProps) {
  return children;
}
