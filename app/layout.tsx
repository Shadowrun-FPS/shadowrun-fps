import "./globals.css";
import type { Metadata } from "next";
import { Cinzel, Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClientLayout } from "@/components/ClientLayout";
import { AuthProvider } from "@/components/providers/auth-provider";
import { OnlineStatus } from "@/components/online-status";
import { ogImages } from "@/lib/og-images";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({
  subsets: ["latin"],
  // Variable font: lets the title use heavier weights than Semibold.
  variable: "--font-cinzel",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shadowrunfps.com"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Shadowrun FPS (2007) — Download and Play on PC",
    template: "%s | Shadowrun FPS",
  },
  description:
    "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter for Xbox 360 and Windows. Install steps and GFWL fixes. This is not Shadowrun Returns.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Shadowrun FPS (2007) — Download and Play on PC",
    description:
      "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter for Xbox 360 and Windows. Install steps and GFWL fixes. This is not Shadowrun Returns.",
    url: "https://www.shadowrunfps.com",
    siteName: "Shadowrun FPS",
    images: ogImages("home"),
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS (2007) — Download and Play on PC",
    description:
      "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter for Xbox 360 and Windows. Install steps and GFWL fixes. This is not Shadowrun Returns.",
    images: ogImages("home"),
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
  const googleSiteVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#020617" />
        {googleSiteVerification ? (
          <meta
            name="google-site-verification"
            content={googleSiteVerification}
          />
        ) : null}
        <meta name="application-name" content="Shadowrun FPS" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="Shadowrun FPS — documentation for AI crawlers"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // One @context with an @graph: some JSON-LD readers can't handle a
            // top-level array of separate contexts.
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Shadowrun FPS",
                  url: "https://www.shadowrunfps.com",
                  image: ogImages("home")[0].url,
                  description:
                    "Download the free PC launcher for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter for Xbox 360 and Windows. This is not Shadowrun Returns.",
                },
                {
                  "@type": "Organization",
                  name: "Shadowrun FPS Community",
                  url: "https://www.shadowrunfps.com",
                  logo: "https://www.shadowrunfps.com/android-chrome-192x192.png",
                  sameAs: [
                    process.env.NEXT_PUBLIC_SOCIAL_DISCORD,
                    process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
                    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
                    process.env.NEXT_PUBLIC_SOCIAL_TWITCH,
                  ].filter(Boolean),
                },
              ],
            }),
          }}
        />
        {/* next/font self-hosts Inter, Space Grotesk, and Cinzel — no external font requests */}
      </head>
      <body
        className={`min-h-screen flex flex-col overflow-x-hidden ${inter.className} ${spaceGrotesk.variable} ${cinzel.variable}`}
      >
        <AuthProvider>
          <OnlineStatus />
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
