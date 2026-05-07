import type { Metadata } from "next";

import { DocHero } from "@/components/doc-hero";
import { LAUNCHER_INSTALLER_SCHEMA_URL } from "@/lib/download-urls";

export const metadata: Metadata = {
  title: "Download Shadowrun FPS Launcher",
  alternates: {
    canonical: "/download",
  },
  description:
    "Download the community-made Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
  openGraph: {
    title: "Download Shadowrun FPS Launcher",
    description:
      "Download the community-made Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
    images: [
      {
        url: "https://www.shadowrunfps.com/hero.webp",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Download Page",
      },
    ],
    url: "https://www.shadowrunfps.com/download",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Shadowrun FPS Launcher",
    description:
      "Download the community-made Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
    images: ["https://www.shadowrunfps.com/hero.webp"],
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DocHero />
      {/* Schema data for the download page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Shadowrun FPS Launcher",
            applicationCategory: "Game",
            operatingSystem: "Windows",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            downloadUrl: LAUNCHER_INSTALLER_SCHEMA_URL,
          }),
        }}
      />
      {children}
    </>
  );
}
