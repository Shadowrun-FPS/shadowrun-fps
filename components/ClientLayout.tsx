"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import PlayerTrackerBanner from "@/components/player-tracker-banner";
import { useVisualViewportOffset } from "@/hooks/useVisualViewportOffset";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const visualViewportOffsetTop = useVisualViewportOffset();

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
        {/* Banner + Header in one fixed block; pinned to visual viewport on iOS when URL bar hides */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-background"
          style={{
            transform: `translateY(${visualViewportOffsetTop}px)`,
          }}
        >
          <PlayerTrackerBanner />
          <Header />
        </div>
        {/* Spacer: banner + header (56px/64px) */}
        <div className="h-[103px] sm:h-[113px]" aria-hidden />
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
