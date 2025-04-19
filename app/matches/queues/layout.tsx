import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Queues | Shadowrun FPS",
  description:
    "Join active match queues and find competitive games in Shadowrun FPS",
  openGraph: {
    title: "Match Queues | Shadowrun FPS",
    description:
      "Join active match queues and find competitive games in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Match Queues",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Match Queues | Shadowrun FPS",
    description:
      "Join active match queues and find competitive games in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function QueuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
