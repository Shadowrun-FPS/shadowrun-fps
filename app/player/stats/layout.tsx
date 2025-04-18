import { Metadata } from "next";

// For the stats page with search parameters, we'll use a static metadata
// The actual dynamic metadata will be handled client-side with Head component
export const metadata: Metadata = {
  title: "Player Stats | Shadowrun FPS",
  description: "View detailed player statistics and match history",
  openGraph: {
    title: "Player Stats | Shadowrun FPS",
    description: "View detailed player statistics and match history",
    type: "profile",
    images: [
      {
        url: "/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Player Stats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Player Stats | Shadowrun FPS",
    description: "View detailed player statistics and match history",
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
