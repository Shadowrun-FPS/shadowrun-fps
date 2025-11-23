import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClientLayout } from "@/components/ClientLayout";
import { AuthProvider } from "@/components/providers/auth-provider";
import { OnlineStatus } from "@/components/online-status";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PlayerUpdater } from "@/components/player-updater";

// Define the Inter font outside the component
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shadowrunfps.com"),
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

// Suppress console warnings and errors from browser extensions (ad blockers, etc.)
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || "";
    const fullMessage = args.join(" ");
    
    // Suppress YouTube and Google Play errors blocked by browser extensions
    if (
      errorMessage.includes("ERR_BLOCKED_BY_CLIENT") ||
      errorMessage.includes("youtubei/v1/log_event") ||
      errorMessage.includes("www-embed-player.js") ||
      errorMessage.includes("www.youtube.com/generate_204") ||
      errorMessage.includes("play.google.com/log") ||
      fullMessage.includes("youtube.com/generate_204") ||
      fullMessage.includes("play.google.com/log") ||
      fullMessage.includes("youtubei/v1/log_event")
    ) {
      return;
    }
    
    // Suppress React warnings in production
    if (
      process.env.NODE_ENV === "production" &&
      typeof args[0] === "string" &&
      (args[0].includes("Warning:") ||
        args[0].includes("Error:") ||
        args[0].includes("Tracking Prevention"))
    ) {
      return;
    }
    
    originalConsoleError(...args);
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://www.shadowrunfps.com" />
        <meta
          name="google-site-verification"
          content="your-verification-code"
        />
        <meta property="og:site_name" content="Shadowrun FPS" />
        <meta name="application-name" content="Shadowrun FPS" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Shadowrun FPS",
              url: "https://www.shadowrunfps.com",
              description:
                "Experience the unique blend of cyberpunk and fantasy in Shadowrun FPS (2007). Join our active community, find matches, and master this classic competitive shooter combining magic and technology.",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.shadowrunfps.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`min-h-screen flex flex-col overflow-x-hidden ${inter.className}`}
      >
        <AuthProvider>
          <NotificationsProvider>
            <OnlineStatus />
            <PlayerUpdater />
            <ClientLayout>{children}</ClientLayout>
          </NotificationsProvider>
        </AuthProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
