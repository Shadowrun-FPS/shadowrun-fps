import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme-provider";
import NextAuthProvider from "./providers/next-auth-provider";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("http://ShadowrunFPS.com"),
  title: {
    template: "%s | Shadowrun FPS Fan Community",
    default: "Shadowrun FPS Fan Community",
  },
  description:
    "Join the ultimate Shadowrun FPS fan community. Explore game content for Shadowrun on Xbox 360 and PC, connect on Discord, and keep the game alive!",
  keywords:
    "Shadowrun, Shadowrun FPS, Shadowrun 360, Shadowrun PC, Shadowrun Discord, Shadowrun Xbox 360, Shadowrun multiplayer, FASA Studios, Shadowrun fan site",
  openGraph: {
    title: {
      template: "%s - Shadowrun FPS Fan Community",
      default: "Shadowrun FPS Fan Community",
    },
    description:
      "Explore Shadowrun FPS content for Xbox 360 and PC. Join the fan community, connect on Discord, and experience classic FASA Studios gameplay.",
    images: [
      {
        url: "https://ShadowrunFPS.com/hero.png",
        width: 1200,
        height: 675,
        alt: "Shadowrun FPS game cover with Xbox 360 and PC elements.",
      },
    ],
    siteName: "Shadowrun FPS Fan Community",
    url: "https://ShadowrunFPS.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Fan Community",
    description:
      "Join the Shadowrun FPS fan site for Xbox 360 and PC. Connect on Discord and rediscover the classic FASA Studios shooter.",
    images: ["https://ShadowrunFPS.com/hero.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen flex flex-col ${inter.className}`}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
