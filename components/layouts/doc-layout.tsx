"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/ui/sidebar-nav";

interface DocLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface QuickLink {
  title: string;
  href: string;
}

function getQuickLinks(pathname: string | null): QuickLink[] {
  if (!pathname) return []; // Return empty array if pathname is null

  if (pathname === "/troubleshoot" || pathname.startsWith("/troubleshoot/")) {
    return [
      { title: "Common errors", href: "#errors" },
      { title: "Controller setup", href: "#controller" },
      { title: "Getting the game", href: "#getting-game" },
      { title: "Connection issues", href: "#connection" },
    ];
  }

  return [];
}

export function DocLayout({ children, className }: DocLayoutProps) {
  const pathname = usePathname();
  const quickLinks = getQuickLinks(pathname);
  const showQuickLinks =
    pathname === "/troubleshoot" || pathname?.startsWith("/troubleshoot/");

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl", className)}>
        <main className="w-full">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">{children}</div>
        </main>
      </div>
      {showQuickLinks && <SidebarNav items={quickLinks} />}
    </div>
  );
}
