"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Calendar, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Tournaments",
    href: "/tournaments/overview",
    icon: Trophy,
  },
  {
    name: "Teams",
    href: "/tournaments/teams",
    icon: Users,
  },
  {
    name: "Scrimmages",
    href: "/tournaments/scrimmages",
    icon: Swords,
  },
  {
    name: "Rankings",
    href: "/tournaments/rankings",
    icon: Calendar,
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
            className="flex items-center gap-2 font-semibold"
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
                    : "text-muted-foreground"
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
