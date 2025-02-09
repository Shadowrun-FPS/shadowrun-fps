"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/ui/sidebar-nav";

interface DocLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const getQuickLinks = (pathname: string) => {
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
};

export function DocLayout({ children, className }: DocLayoutProps) {
  const pathname = usePathname();
  const quickLinks = getQuickLinks(pathname);
  const showQuickLinks =
    pathname.includes("/install") || pathname.includes("/troubleshoot");

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("container mx-auto px-4 py-4", className)}>
        <main className="w-full max-w-7xl mx-auto">
          <div className="space-y-4">{children}</div>
        </main>
      </div>
      {showQuickLinks && <SidebarNav items={quickLinks} />}
    </div>
  );
}
