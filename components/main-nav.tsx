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
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  ChevronDown,
  Home,
  Calendar,
  Download,
  HelpCircle,
  Trophy,
  Users,
  Clock,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { isFeatureEnabled } from "@/lib/features";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string;
    icon?: React.ReactNode;
  }
>(({ className, title, children, icon, ...props }, ref) => {
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
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon && <span className="w-4 h-4">{icon}</span>}
            {title}
          </div>
          <p className="mt-1 text-sm leading-snug line-clamp-2 text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Only show tournaments nav if feature is enabled
  const showTournaments = isFeatureEnabled("tournaments");
  const showQueues = isFeatureEnabled("queues");

  return (
    <div className="flex items-center gap-12">
      {/* Desktop Navigation */}
      <nav className="items-center hidden gap-6 lg:flex">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/docs/events" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Events
                  </span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/docs/install" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Installation
                  </span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/docs/troubleshoot" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Troubleshooting
                  </span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {showQueues && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Matches
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[220px] gap-3 p-4">
                    <ListItem
                      href="/matches/queues"
                      title="Queues"
                      icon={<Users className="w-4 h-4" />}
                    >
                      Join and manage match queues
                    </ListItem>
                    <ListItem
                      href="/matches/history"
                      title="Match History"
                      icon={<Clock className="w-4 h-4" />}
                    >
                      View your match history
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {showTournaments && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Tournaments
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                    <ListItem
                      href="/tournaments/overview"
                      title="All Tournaments"
                      icon={<Trophy className="w-4 h-4" />}
                    >
                      Browse all tournaments
                    </ListItem>
                    <ListItem
                      href="/tournaments/teams"
                      title="Teams"
                      icon={<Calendar className="w-4 h-4" />}
                    >
                      View upcoming tournaments
                    </ListItem>
                    <ListItem
                      href="/tournaments/scrimmages"
                      title="Scrimmages"
                      icon={<Clock className="w-4 h-4" />}
                    >
                      View past tournaments
                    </ListItem>
                    <ListItem
                      href="/tournaments/rankings"
                      title="Rankings"
                      icon={<HelpCircle className="w-4 h-4" />}
                    >
                      Tournament rules and guidelines
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Access all sections of the Shadowrun FPS website.
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/docs/events"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </Link>

              <Link
                href="/docs/install"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <Download className="w-5 h-5" />
                <span>Installation</span>
              </Link>

              <Link
                href="/docs/troubleshoot"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-5 h-5" />
                <span>Troubleshooting</span>
              </Link>

              {showQueues && (
                <>
                  <div className="flex items-center gap-2 p-2 font-medium">
                    <Users className="w-5 h-5" />
                    <span>Matches</span>
                  </div>

                  <Link
                    href="/matches/queues"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Queues</span>
                  </Link>

                  <Link
                    href="/matches/history"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Match History</span>
                  </Link>
                </>
              )}

              {showTournaments && (
                <>
                  <div className="flex items-center gap-2 p-2 font-medium">
                    <Trophy className="w-5 h-5" />
                    <span>Tournaments</span>
                  </div>

                  <Link
                    href="/tournaments/overview"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>All Tournaments</span>
                  </Link>

                  <Link
                    href="/tournaments/teams"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    <span>Teams</span>
                  </Link>

                  <Link
                    href="/tournaments/scrimmages"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Scrimmages</span>
                  </Link>

                  <Link
                    href="/tournaments/rankings"
                    className="flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Rankings</span>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
