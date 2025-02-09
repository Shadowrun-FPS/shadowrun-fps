"use client";

import { useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";

interface ClientLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientLayout({ children, className }: ClientLayoutProps) {
  useEffect(() => {
    // Put any window/document operations here
  }, []);

  return (
    <div className={className}>
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Footer />
      <Toaster />
    </div>
  );
}
