"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useEffect } from "react";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Play Ranked (Coming Soon)",
    href: "/#",
    description: "Ranked pick up games.",
  },
  {
    title: "Play Casual (Coming Soon)",
    href: "/casual",
    description: "Join a casual pick up game!",
  },
  {
    title: "Leaderboard (Coming Soon)",
    href: "/leaderboard",
    description: "A leaderboard of the highest ranked players.",
  },
  {
    title: "Stats Look-up (Coming Soon)",
    href: "/stats",
    description: "View stats by player name.",
  },
  {
    title: "Ranked Rules",
    href: "/docs/rules",
    description: "Rules to play in the pick up games.",
  },
  {
    title: "Tutorials",
    href: "/docs/tutorials",
    description: "Shadowrun tutorials and content.",
  },
];

export function MainNavMenu() {
  // TODO create mobile friendly nav menu that takes up less width
  // use shadcn/ui dropdown menu https://ui.shadcn.com/docs/components/dropdown-menu
  useEffect(() => {
    const getMatchData = async () => {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/matches?ranked=true"
      );
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      console.log("data: ", data);
    };

    getMatchData();
  }, []);
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex flex-col justify-end w-full h-full p-6 no-underline rounded-md outline-none select-none bg-gradient-to-b from-muted/50 to-muted focus:shadow-md"
                    href="/"
                  >
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Shadowrun FPS
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Welcome to &lsquo;This Is Shadowrun&rsquo;, we&rsquo;re a
                      community dedicated to the FASA Studios&apos; 2007
                      Shadowrun FPS. It works in 2023!
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/docs/introduction" title="Introduction">
                Join up to play on PC for free!
              </ListItem>
              <ListItem href="/docs/install" title="Installation">
                How to install the game for PC.
              </ListItem>
              <ListItem href="/docs/troubleshoot" title="Troubleshooting">
                How to fix common errors with the game.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Play</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/docs/support" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Support
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
