import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import NextAuthProvider from "./providers/next-auth-provider";

import Header from "@/components/header";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Shadowrun FPS",
    default: "Shadowrun FPS",
  },
  description:
    "A Shadowrun FPS fan site. Built by Shadowrun fans for Shadowrun fans.",
  keywords: "shadowrun, FPS, gaming, fan site",
  openGraph: {
    title: "Shadowrun FPS",
    description:
      "A Shadowrun FPS fan site. Built by Shadowrun fans for Shadowrun fans.",
    images: [
      {
        url: "https://ShadowrunFPS.com/serverIcon.png",
        width: 1200,
        height: 630,
        alt: "The spinning wheel from the Shadowrun FPS of Magic abilities.",
      },
    ],
    siteName: "Shadowrun FPS",
    url: "https://ShadowrunFPS.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS",
    description: "A Shadowrun FPS fan site.",
    images: ["https://ShadowrunFPS.com/serverIcon.png"],
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
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
