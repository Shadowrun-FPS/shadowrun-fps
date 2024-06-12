"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import ResponsitveTitle from "./navigation/responsive-title";
import { BookText, Menu } from "lucide-react";
import Link from "next/link";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Matches",
    href: "/matches",
    description: "Play pick up matches.",
  },
  {
    title: "Match History",
    href: "/matches/history",
    description: "A history of Ranked matches.",
  },
  {
    title: "Leaderboard",
    href: "/matches/leaderboard",
    description: "A leaderboard of the highest ranked players.",
  },
  {
    title: "Stats Look-up",
    href: "/matches/stats",
    description: "View stats by player name.",
  },
  {
    title: "Ranked Rules",
    href: "/docs/rules",
    description: "Rules to play in the pick up matches.",
  },
  {
    title: "Tutorials",
    href: "/docs/tutorials",
    description: "Shadowrun tutorials and content.",
  },
];

export function MainNavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <ResponsitveTitle title={"Getting Started"} icon={<BookText />} />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 w-[250px] md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex flex-col justify-end w-full h-full p-6 no-underline rounded-md outline-none select-none bg-gradient-to-b from-muted/50 to-muted focus:shadow-md"
                    href="/"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Image
                        className="rounded-full shadow-lg dark:shadow-black/20"
                        src="/teleport_2.gif"
                        alt=""
                        width={100}
                        height={100}
                      />
                    </div>
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Shadowrun FPS
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Welcome to &lsquo;This Is Shadowrun&rsquo;, we&rsquo;re a
                      community dedicated to the FASA Studios&apos; 2007
                      Shadowrun FPS. It works in 2023!
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <Link href="/docs/introduction" className="w-full">
                <ListItem title="Introduction">
                  Join up to play on PC for free!
                </ListItem>
              </Link>
              <Link href="/docs/install">
                <ListItem title="Installation">
                  How to install the game for PC.
                </ListItem>
              </Link>
              <Link href="/docs/troubleshoot">
                <ListItem title="Troubleshooting">
                  How to fix common errors with the game.
                </ListItem>
              </Link>
              <Link href="/docs/support">
                <ListItem title="Support">Support</ListItem>
              </Link>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <ResponsitveTitle title={"Play"} icon={<Menu />} />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[250px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <Link key={component.title} href={component.href}>
                  <ListItem title={component.title}>
                    {component.description}
                  </ListItem>
                </Link>
              ))}
            </ul>
          </NavigationMenuContent>
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
