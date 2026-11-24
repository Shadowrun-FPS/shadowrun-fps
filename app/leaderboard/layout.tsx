import type { Metadata } from "next";
import { DocHero } from "@/components/doc-hero";
import { ogImages } from "@/lib/og-images";

const SITE_URL = "https://www.shadowrunfps.com";

export const metadata: Metadata = {
  title: "Ranked Leaderboard",
  description:
    "Live Shadowrun FPS ranked standings: Elo, win rate, K/D, and recent games.",
  alternates: {
    canonical: "/leaderboard",
  },
  authors: [{ name: "Shadowrun FPS Community", url: SITE_URL }],
  creator: "Shadowrun FPS Community",
  publisher: "Shadowrun FPS Community",
  openGraph: {
    title: "Shadowrun FPS Ranked Leaderboard",
    description:
      "Live ranked standings for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    url: "https://www.shadowrunfps.com/leaderboard",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: ogImages("leaderboard"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Ranked Leaderboard",
    description:
      "Live ranked standings for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    images: ogImages("leaderboard"),
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DocHero />
      <div>{children}</div>
    </>
  );
}
