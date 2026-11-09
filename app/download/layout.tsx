import type { Metadata } from "next";

import { DocHero } from "@/components/doc-hero";
import { ogImages } from "@/lib/og-images";
import {
  GAME_VERSION,
  LAUNCHER_INSTALLER_SCHEMA_URL,
  LAUNCHER_VERSION,
} from "@/lib/download-urls";

export const metadata: Metadata = {
  title: {
    absolute: "Download Shadowrun FPS for PC (2007)",
  },
  alternates: {
    canonical: "/download",
  },
  description:
    "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios shooter. Sign in with Discord to play.",
  openGraph: {
    title: "Download Shadowrun FPS for PC (2007)",
    description:
      "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios shooter. Sign in with Discord to play.",
    images: ogImages("download"),
    url: "https://www.shadowrunfps.com/download",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Shadowrun FPS for PC (2007)",
    description:
      "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios shooter. Sign in with Discord to play.",
    images: ogImages("download"),
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
            applicationCategory: "GameApplication",
            operatingSystem: "Windows",
            softwareVersion: LAUNCHER_VERSION,
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Game version",
              value: GAME_VERSION,
            },
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
