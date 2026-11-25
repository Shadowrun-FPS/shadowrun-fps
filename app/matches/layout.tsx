import type { Metadata } from "next";
import { DocHero } from "@/components/doc-hero";
import { ogImages } from "@/lib/og-images";

const SITE_URL = "https://www.shadowrunfps.com";

export const metadata: Metadata = {
  title: "Past Matches",
  description:
    "Open a ranked Shadowrun FPS match for its in-game scoreboard. Best-of-three series show up when games are grouped.",
  alternates: {
    canonical: "/matches",
  },
  authors: [{ name: "Shadowrun FPS Community", url: SITE_URL }],
  creator: "Shadowrun FPS Community",
  publisher: "Shadowrun FPS Community",
  openGraph: {
    title: "Shadowrun FPS Past Matches",
    description:
      "Ranked match scoreboards for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    url: "https://www.shadowrunfps.com/matches",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: ogImages("matches"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Past Matches",
    description:
      "Ranked match scoreboards for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    images: ogImages("matches"),
  },
};

export default function MatchesLayout({
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
