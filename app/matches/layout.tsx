import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matches | Shadowrun FPS",
  description:
    "View match history, join queues, and track your competitive matches in Shadowrun FPS",
  openGraph: {
    title: "Matches | Shadowrun FPS",
    description:
      "View match history, join queues, and track your competitive matches in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Matches",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matches | Shadowrun FPS",
    description:
      "View match history, join queues, and track your competitive matches in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
