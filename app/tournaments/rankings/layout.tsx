import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Rankings | Shadowrun FPS",
  description:
    "View the current rankings and statistics for competitive teams in Shadowrun FPS",
  openGraph: {
    title: "Team Rankings | Shadowrun FPS",
    description:
      "View the current rankings and statistics for competitive teams in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Team Rankings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Rankings | Shadowrun FPS",
    description:
      "View the current rankings and statistics for competitive teams in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
