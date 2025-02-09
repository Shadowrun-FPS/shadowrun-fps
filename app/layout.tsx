import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ClientLayout } from "@/components/ClientLayout";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://ShadowrunFPS.com"),
  title: {
    default: "Shadowrun FPS - Classic Multiplayer Shooter",
    template: "%s | Shadowrun FPS",
  },
  description:
    "Experience the unique blend of cyberpunk and fantasy in Shadowrun FPS (2007). Join our active community, find matches, and master this classic competitive shooter combining magic and technology.",
  keywords: [
    "Shadowrun FPS",
    "competitive FPS",
    "multiplayer shooter",
    "cyberpunk FPS",
    "fantasy FPS",
    "FASA Studios",
    "classic FPS games",
    "team-based shooter",
    "esports",
    "gaming community",
    "cross-platform FPS",
    "Xbox 360 FPS",
    "PC FPS games",
    "tactical shooter",
    "hero shooter",
  ],
  openGraph: {
    title: "Shadowrun FPS - Classic Multiplayer Shooter",
    description:
      "Join the active Shadowrun FPS community. Experience unique gameplay combining magic and technology in this classic competitive shooter.",
    url: "https://shadowrunfps.com",
    siteName: "Shadowrun FPS",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Gameplay",
      },
    ],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS - Classic Multiplayer Shooter",
    description:
      "Join the active Shadowrun FPS community. Experience unique gameplay combining magic and technology in this classic competitive shooter.",
    images: ["/hero.png"],
    creator: "@ShadowrunFPS",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://shadowrunfps.com" />
        <meta
          name="google-site-verification"
          content="your-verification-code"
        />
        <meta property="og:site_name" content="Shadowrun FPS" />
        <meta name="application-name" content="Shadowrun FPS" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`min-h-screen flex flex-col ${inter.className}`}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
