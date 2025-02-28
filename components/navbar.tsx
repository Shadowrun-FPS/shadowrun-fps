"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Calendar, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";
import type { FeatureFlag } from "@/lib/features";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  feature: FeatureFlag;
}

const navItems: NavItem[] = [
  {
    name: "Tournaments",
    href: "/tournaments/overview",
    icon: Trophy,
    feature: "tournaments",
  },
  {
    name: "Teams",
    href: "/tournaments/teams",
    icon: Users,
    feature: "teams",
  },
  {
    name: "Scrimmages",
    href: "/tournaments/scrimmages",
    icon: Swords,
    feature: "scrimmage",
  },
  {
    name: "Rankings",
    href: "/tournaments/rankings",
    icon: Calendar,
    feature: "rankings",
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container flex items-center h-16">
        <div className="flex items-center gap-4">
          <Link
            href="/tournaments/overview"
            className={cn(
              "flex items-center gap-2 font-semibold",
              !isFeatureEnabled("tournaments") &&
                "pointer-events-none opacity-50"
            )}
          >
            <Trophy className="w-6 h-6" />
            <span className="hidden md:inline-block">Tournament Manager</span>
          </Link>
          <nav className="flex gap-4 lg:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                  !isFeatureEnabled(item.feature) &&
                    "pointer-events-none opacity-50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
