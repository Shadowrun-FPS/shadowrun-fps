"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  Scroll,
  Menu,
  X,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DirectModerationDialogs } from "@/components/direct-moderation-dialogs";

interface AdminLayoutProps {
  children: ReactNode;
}

// Extract the sidebar content to be reused in both desktop and mobile views
function SidebarContent({
  pathname,
  closeMobileMenu,
}: {
  pathname: string | null;
  closeMobileMenu?: () => void;
}) {
  const navItems = [
    {
      title: "Moderation",
      href: "/admin/moderation",
      icon: <Shield className="w-4 h-4 mr-3" />,
    },
    {
      title: "Players",
      href: "/admin/players",
      icon: <Users className="w-4 h-4 mr-3" />,
    },
    {
      title: "Rules",
      href: "/admin/rules",
      icon: <BookOpen className="w-4 h-4 mr-3" />,
    },
  ];

  const externalLinks = [
    {
      title: "Public Mod Log",
      href: "/moderation-log",
      icon: <ExternalLink className="w-4 h-4 mr-3" />,
    },
  ];

  return (
    <ScrollArea className="flex-1">
      <div className="px-3 py-2">
        <h2 className="px-4 mb-2 text-lg font-semibold">Admin Panel</h2>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center py-2 px-3 text-sm rounded-md",
                pathname === item.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <h3 className="px-4 mb-2 text-sm font-medium">External Links</h3>
        <div className="space-y-1">
          {externalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target="_blank"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center py-2 px-3 text-sm rounded-md",
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle authentication and authorization
  useEffect(() => {
    // Check if authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check if user has admin rights
    if (status === "authenticated" && session?.user) {
      const isAdmin =
        session.user.id === "238329746671271936" ||
        session.user.roles?.some((role) =>
          ["admin", "moderator", "founder"].includes(role)
        );

      if (!isAdmin) {
        router.push("/");
        return;
      }
    }

    setIsMounted(true);
  }, [status, session, router]);

  // Don't render anything until authentication check is complete
  if (!isMounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 px-3 py-2 border-b md:hidden bg-background">
        {/* Mobile header content */}
      </div>

      <div className="flex flex-1 overflow-hidden pt-14 md:pt-0">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:border-r">
          <SidebarContent pathname={pathname} />
        </div>

        {/* Main content with strict overflow control */}
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          {/* Main scrollable area with horizontal overflow prevention */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
            <div className="px-3 py-4 max-w-full">{children}</div>
          </main>
          <DirectModerationDialogs />
        </div>
      </div>
    </div>
  );
}
