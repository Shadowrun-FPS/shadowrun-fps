"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import PlayerTrackerBanner from "@/components/player-tracker-banner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="flex flex-col w-full min-h-screen">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        {/* Player Tracker Banner - At very top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <PlayerTrackerBanner />
        </div>
        {/* Header - Fixed below banner (banner is ~42-48px tall) */}
        <div className="fixed top-[48px] sm:top-[50px] left-0 right-0 z-40">
          <Header />
        </div>
        {/* Spacer to account for fixed banner + header */}
        <div className="h-[104px] sm:h-[106px]" />
        <div className="relative flex-1 w-full">
          <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
            {children}
          </main>
        </div>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
