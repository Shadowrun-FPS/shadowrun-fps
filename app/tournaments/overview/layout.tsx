import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournaments | Shadowrun FPS",
  description:
    "Browse active, upcoming, and completed tournaments for Shadowrun FPS",
  openGraph: {
    title: "Tournaments | Shadowrun FPS",
    description:
      "Browse active, upcoming, and completed tournaments for Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Tournament Overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tournaments | Shadowrun FPS",
    description:
      "Browse active, upcoming, and completed tournaments for Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
