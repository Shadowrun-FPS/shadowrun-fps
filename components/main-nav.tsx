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
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainNavMenu({ className }: { className?: string }) {
  return (
    <nav className={cn("flex items-center", className)}>
      <NavigationMenu className="z-50">
        <NavigationMenuList className="gap-2">
          {/* Mobile Menu */}
          <NavigationMenuItem className="block lg:hidden">
            <NavigationMenuTrigger className="h-8 px-3 gap-2">
              <Menu className="w-5 h-5" />
              <span className="text-sm">Explore</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-2 p-4">
                <li>
                  <NavigationMenuLink
                    href="/docs/events"
                    className="block w-full p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    Events
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink
                    href="/docs/install"
                    className="block w-full p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    Installation
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink
                    href="/docs/troubleshoot"
                    className="block w-full p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    Troubleshooting
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/docs/events"
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Events
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/docs/install"
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Installation
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/docs/troubleshoot"
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Troubleshooting
              </NavigationMenuLink>
            </NavigationMenuItem>
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
