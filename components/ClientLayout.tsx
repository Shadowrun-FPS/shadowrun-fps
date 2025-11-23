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
        <div className="relative flex-1 w-full">
          <Header />
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
