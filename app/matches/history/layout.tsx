import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match History | Shadowrun FPS",
  description: "View your past matches and results in Shadowrun FPS",
  openGraph: {
    title: "Match History | Shadowrun FPS",
    description: "View your past matches and results in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Match History",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Match History | Shadowrun FPS",
    description: "View your past matches and results in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
