import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Leaderboard",
  description:
    "View the top-ranked players and their statistics in Shadowrun FPS",
  openGraph: {
    title: "Player Leaderboard",
    description:
      "View the top-ranked players and their statistics in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Player Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Player Leaderboard",
    description:
      "View the top-ranked players and their statistics in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
