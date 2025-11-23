"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Users, FileText, Book, ExternalLink, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/admin/moderation",
      icon: Shield,
      label: "Moderation",
    },
    {
      href: "/admin/players",
      icon: Users,
      label: "Players",
    },
    {
      href: "/admin/rules",
      icon: Book,
      label: "Rules",
    },
  ];

  const externalLinks = [
    {
      href: "/moderation-log",
      icon: ExternalLink,
      label: "Public Mod Log",
    },
  ];

  return (
    <div className="h-full p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-muted-foreground">Management Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2">
        <div className="px-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </h3>
        </div>
        {routes.map((route) => {
          const isActive = pathname === route.href || (route.href !== "/admin" && pathname?.startsWith(route.href));
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <route.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span>{route.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-border/40" />

      {/* External Links */}
      <nav className="space-y-2">
        <div className="px-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            External Links
          </h3>
        </div>
        {externalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
          >
            <link.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
