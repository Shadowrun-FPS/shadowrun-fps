import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Shadowrun FPS Launcher | Shadowrun FPS",
  description:
    "Download the official Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
  openGraph: {
    title: "Download Shadowrun FPS Launcher",
    description:
      "Download the official Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
    images: [
      {
        url: "https://ShadowrunFPS.com/download-banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Download Page",
      },
    ],
    url: "https://ShadowrunFPS.com/download",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Shadowrun FPS Launcher",
    description:
      "Download the official Shadowrun FPS Launcher to play the classic 2007 multiplayer shooter. Verified safe with VirusTotal.",
    images: ["https://ShadowrunFPS.com/download-banner.png"],
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
            downloadUrl:
              "http://157.245.214.234/releases/Shadowrun%20FPS%20Launcher.exe",
          }),
        }}
      />
      {children}
    </>
  );
}
