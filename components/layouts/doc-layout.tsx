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

  if (pathname.includes("/install")) {
    return [
      { title: "Required Downloads", href: "#getting-started" },
      { title: "Installation Steps", href: "#installation-steps" },
      { title: "Post-Installation Tips", href: "#post-install" },
      { title: "Getting a Game Key", href: "#game-key" },
      { title: "Matchmaking Preferences", href: "#matchmaking" },
      { title: "System Requirements", href: "#requirements" },
    ];
  }

  if (pathname.includes("/troubleshoot")) {
    return [
      { title: "Common Errors", href: "#errors" },
      { title: "Activation Issues", href: "#activation" },
      { title: "Performance Settings", href: "#performance" },
      { title: "Controller Setup", href: "#controller" },
      { title: "Getting the Game", href: "#getting-game" },
      { title: "Connection Issues", href: "#connection" },
    ];
  }

  return [];
}

export function DocLayout({ children, className }: DocLayoutProps) {
  const pathname = usePathname();
  const quickLinks = getQuickLinks(pathname);
  const showQuickLinks =
    pathname?.includes("/install") || pathname?.includes("/troubleshoot");

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
