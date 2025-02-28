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
  {
    href: "/matches/queues",
    label: "Queues",
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
    href: "/tournaments/scrimmage",
    label: "Scrimmage",
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
    if (item.href.includes("queues")) return isFeatureEnabled("queues");
    return true;
  });

  const visibleTournamentItems = tournamentItems.filter((item) => {
    if (item.href.includes("rankings")) return isFeatureEnabled("rankings");
    if (item.href.includes("teams")) return isFeatureEnabled("teams");
    if (item.href.includes("scrimmage")) return isFeatureEnabled("scrimmage");
    return true;
  });

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

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm font-medium">
                Tournaments
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-48 p-2">
                  {visibleTournamentItems.map((item) => (
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
      </nav>
    </div>
  );
}
