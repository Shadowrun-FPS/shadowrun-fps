import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scrimmages | Shadowrun FPS",
  description:
    "Arrange and manage practice matches between teams in Shadowrun FPS",
  openGraph: {
    title: "Scrimmages | Shadowrun FPS",
    description:
      "Arrange and manage practice matches between teams in Shadowrun FPS",
    type: "website",
    images: [
      {
        url: "https://shadowrunfps.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Scrimmages",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrimmages | Shadowrun FPS",
    description:
      "Arrange and manage practice matches between teams in Shadowrun FPS",
    images: ["https://shadowrunfps.com/shadowrun_invite_banner.png"],
  },
};

export default function ScrimmagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
