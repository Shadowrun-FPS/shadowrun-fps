"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { BookText } from "lucide-react";

export function MainNavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className="block md:hidden">
          <NavigationMenuTrigger>
            <span className="flex items-center gap-2">
              <BookText className="w-5 h-5" />
              Getting Started
            </span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[250px]">
              <li>
                <NavigationMenuLink
                  href="/docs/events"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Events
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink
                  href="/docs/install"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Installation
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink
                  href="/docs/troubleshoot"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Troubleshooting
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuLink
            href="/docs/events"
            className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Events
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuLink
            href="/docs/install"
            className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Installation
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuLink
            href="/docs/troubleshoot"
            className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Troubleshooting
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
