"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
        {/* Header - Fixed at top */}
        <Header />
        {/* Spacer to account for fixed header */}
        <div className="h-14 sm:h-16" />
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
