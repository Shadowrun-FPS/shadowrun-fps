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
  try {
    const client = await clientPromise;
    const db = client.db();

    // Try to find the match by ID, handling potential invalid ObjectId
    let query: any = { matchId: params.matchId };

    // Only try to use ObjectId if it looks like a valid MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(params.matchId)) {
      query = {
        $or: [
          { _id: new ObjectId(params.matchId) },
          { matchId: params.matchId },
        ],
      };
    }

    const match = await db.collection("Matches").findOne(query);

    if (!match) {
      return {
        title: "Match Not Found | Shadowrun FPS",
        description: "The match you're looking for doesn't exist",
      };
    }

    // Create dynamic metadata based on match data
    const title = `${match.teamSize}v${match.teamSize} Match | Shadowrun FPS`;
    let description = `View details for this ${match.teamSize}v${
      match.teamSize
    } ${match.eloTier || ""} match`;

    // Add winner info if available
    if (match.status === "completed" && match.winner) {
      const winnerTeam = match.winner === "team1" ? "Team 1" : "Team 2";
      description = `${winnerTeam} won this ${match.teamSize}v${
        match.teamSize
      } ${match.eloTier || ""} match`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: [
          {
            url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
            width: 1200,
            height: 630,
            alt: `Shadowrun FPS ${match.teamSize}v${match.teamSize} Match`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
      },
    };
  } catch (error) {
    console.error("Error generating match metadata:", error);
    return {
      title: "Match Details | Shadowrun FPS",
      description: "View match details and results",
    };
  }
}

export default function MatchLayout({ children }: LayoutProps) {
  return children;
}
