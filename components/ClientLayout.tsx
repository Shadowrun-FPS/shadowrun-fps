"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";

import { Footer } from "@/components/footer";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="flex flex-col w-full min-h-screen">
          <div className="relative flex-1 w-full">
            <Header />
            <main className="container flex-1 px-4 py-6 mx-auto">
              {children}
            </main>
          </div>
          <Footer />
          <Toaster />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
