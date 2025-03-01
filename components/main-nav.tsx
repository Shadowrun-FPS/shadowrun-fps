"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ChevronDown } from "lucide-react";
import { isFeatureEnabled } from "@/lib/features";

const navItems = [
  {
    href: "/docs/events",
    label: "Events",
  },
  {
    href: "/docs/install",
    label: "Installation",
  },
  {
    href: "/docs/troubleshoot",
    label: "Troubleshooting",
  },
];

const matchItems = [
  {
    href: "/matches/queues",
    label: "Queue",
  },
  {
    href: "/matches/history",
    label: "Match History",
  },
];

const tournamentItems = [
  {
    href: "/tournaments/overview",
    label: "Overview",
  },
  {
    href: "/tournaments/teams",
    label: "Teams",
  },
  {
    href: "/tournaments/scrimmages",
    label: "Scrimmages",
  },
  {
    href: "/tournaments/rankings",
    label: "Rankings",
  },
];

export function MainNav() {
  const pathname = usePathname();

  // Filter nav items based on feature flags
  const visibleNavItems = navItems.filter((item) => {
    return true;
  });

  // Only show tournaments nav if feature is enabled
  const showTournaments = isFeatureEnabled("tournaments");

  return (
    <div className="flex items-center gap-12">
      <nav className="items-center hidden gap-6 md:flex">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}

        {/* Matches Menu */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm font-medium">
                Matches
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-48 p-2">
                  {matchItems.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            pathname === item.href
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Tournaments Menu */}
        {showTournaments && (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">
                  Tournaments
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-48 p-2">
                    {tournamentItems.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </nav>
    </div>
  );
}
