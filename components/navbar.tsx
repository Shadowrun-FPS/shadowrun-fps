"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled, FeatureFlag } from "@/lib/features";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { UserPermissions } from "@/lib/client-config";
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
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Book,
  Trophy,
  Clock,
  HeartHandshake,
  BarChart3,
  Menu,
  FileText,
  Download,
  HelpCircle,
  Home,
  Users,
  PanelLeft,
  Calendar,
  GamepadIcon,
  LayoutDashboard,
  Shield,
  ExternalLink,
} from "lucide-react";

interface NavLink {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  feature?: FeatureFlag;
}

const DocLinks = [
  {
    title: "Events",
    href: "/docs/events",
    description: "Upcoming community events and tournaments",
    icon: <Calendar className="w-5 h-5 mr-2 text-primary" />,
  },
  {
    title: "Install Guide",
    href: "/docs/install",
    description: "How to install and set up the game",
    icon: <Download className="w-5 h-5 mr-2 text-primary" />,
  },
  {
    title: "Troubleshoot",
    href: "/docs/troubleshoot",
    description: "Solutions for common issues and problems",
    icon: <HelpCircle className="w-5 h-5 mr-2 text-primary" />,
  },
];

const MatchesLinks: NavLink[] = [
  {
    title: "Queues",
    href: "/matches/queues#4v4",
    description: "Join active match queues",
    icon: <Clock className="w-5 h-5 mr-2 text-primary" />,
    feature: "queues",
  },
  {
    title: "Match History",
    href: "/matches/history",
    description: "View your previous matches",
    icon: <PanelLeft className="w-5 h-5 mr-2 text-primary" />,
    feature: "matches",
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    description: "See the top players and rankings",
    icon: <BarChart3 className="w-5 h-5 mr-2 text-primary" />,
    feature: "leaderboard",
  },
];

const TournamentsLinks: NavLink[] = [
  {
    title: "Overview",
    href: "/tournaments/overview",
    description: "View upcoming and ongoing tournaments",
    icon: <Trophy className="w-5 h-5 mr-2 text-primary" />,
    feature: "tournaments",
  },
  {
    title: "Teams",
    href: "/tournaments/teams",
    description: "Manage your teams and recruitment",
    icon: <Users className="w-5 h-5 mr-2 text-primary" />,
    feature: "teams",
  },
  {
    title: "Scrimmages",
    href: "/tournaments/scrimmages",
    description: "View scrimmage matches with other teams",
    icon: <HeartHandshake className="w-5 h-5 mr-2 text-primary" />,
    feature: "scrimmage",
  },
  {
    title: "Rankings",
    href: "/tournaments/rankings",
    description: "Team rankings and tournament standings",
    icon: <BarChart3 className="w-5 h-5 mr-2 text-primary" />,
    feature: "rankings",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Filter the links based on feature flags
  const filteredMatchesLinks = MatchesLinks.filter((link) =>
    link.feature ? isFeatureEnabled(link.feature) : true
  );

  const filteredTournamentsLinks = TournamentsLinks.filter((link) =>
    link.feature ? isFeatureEnabled(link.feature) : true
  );

  // Only show the dropdown if there are enabled links
  const showMatchesMenu = filteredMatchesLinks.length > 0;
  const showTournamentsMenu = filteredTournamentsLinks.length > 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center h-14 sm:h-16 max-w-screen-2xl">
        <div className="flex items-center mr-2 sm:mr-4">
          {/* Mobile Navigation - moved to left side */}
          <div className="md:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation">
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[280px] sm:w-[320px] p-0 flex flex-col"
                onInteractOutside={(e) => {
                  // Allow closing by tapping outside on mobile
                  e.preventDefault();
                }}
              >
                <SheetHeader className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 border-b border-border/40 relative">
                  <div className="flex items-center justify-between pr-12 sm:pr-14">
                    <div className="flex-1">
                      <SheetTitle className="text-lg sm:text-xl font-bold">Navigation</SheetTitle>
                      <SheetDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Browse all sections of Shadowrun FPS
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <MobileNav onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:ml-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/docs/events" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Events
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/docs/install" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/docs/troubleshoot" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Troubleshoot
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {showMatchesMenu && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Clock className="w-4 h-4 mr-2" />
                    Matches
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {filteredMatchesLinks.map((link) => (
                        <ListItem
                          key={link.title}
                          title={link.title}
                          href={link.href}
                          icon={link.icon}
                        >
                          {link.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {showTournamentsMenu && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Trophy className="w-4 h-4 mr-2" />
                    Tournaments
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {filteredTournamentsLinks.map((link) => (
                        <ListItem
                          key={link.title}
                          title={link.title}
                          href={link.href}
                          icon={link.icon}
                        >
                          {link.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ title, href, icon, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              isActive ? "bg-accent/50" : ""
            )}
            {...props}
          >
            <div className="flex items-center text-sm font-medium leading-none">
              {icon}
              {title}
            </div>
            <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/permissions");
          if (response.ok) {
            const permissions = await response.json();
            setUserPermissions(permissions);
          }
        } catch (error) {
          // Silently handle errors
        }
      }
    };

    fetchPermissions();
  }, [session?.user?.id, session?.user]);

  // Check if user has admin/mod access
  const hasModAccess = userPermissions?.isModerator || userPermissions?.isAdmin || false;

  // Filter the links based on feature flags
  const filteredMatchesLinks = MatchesLinks.filter((link) =>
    link.feature ? isFeatureEnabled(link.feature) : true
  );

  const filteredTournamentsLinks = TournamentsLinks.filter((link) =>
    link.feature ? isFeatureEnabled(link.feature) : true
  );

  // Only show the sections if there are enabled links
  const showMatchesSection = filteredMatchesLinks.length > 0;
  const showTournamentsSection = filteredTournamentsLinks.length > 0;

  const handleLinkClick = () => {
    onNavigate();
  };

  // Admin links
  const adminLinks = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="w-5 h-5 mr-2 text-primary" />,
    },
    {
      title: "Moderation",
      href: "/admin/moderation",
      icon: <Shield className="w-5 h-5 mr-2 text-primary" />,
    },
    {
      title: "Players",
      href: "/admin/players",
      icon: <Users className="w-5 h-5 mr-2 text-primary" />,
    },
    {
      title: "Rules",
      href: "/admin/rules",
      icon: <Book className="w-5 h-5 mr-2 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col gap-1 py-4 overflow-y-auto">
      <Link
        href="/"
        className={cn(
          "flex items-center px-4 sm:px-6 py-3 text-base font-medium rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
          pathname === "/" 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-accent/50 text-foreground"
        )}
        onClick={handleLinkClick}
      >
        <Home className="w-5 h-5 mr-3 flex-shrink-0" />
        <span>Home</span>
      </Link>

      <div className="px-4 sm:px-6 py-3 mt-2">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documentation</h4>
        <div className="flex flex-col gap-0.5">
          {DocLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={cn(
                "flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
                pathname === link.href 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent/50 text-foreground"
              )}
              onClick={handleLinkClick}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span className="ml-3">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {showMatchesSection && (
        <div className="px-4 sm:px-6 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matches</h4>
          <div className="flex flex-col gap-0.5">
            {filteredMatchesLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
                  pathname === link.href 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50 text-foreground"
                )}
                onClick={handleLinkClick}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <span className="ml-3">{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showTournamentsSection && (
        <div className="px-4 sm:px-6 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tournaments</h4>
          <div className="flex flex-col gap-0.5">
            {filteredTournamentsLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
                  pathname === link.href 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50 text-foreground"
                )}
                onClick={handleLinkClick}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <span className="ml-3">{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasModAccess && (
        <div className="px-4 sm:px-6 py-3 border-t border-border/40 mt-2">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</h4>
          <div className="flex flex-col gap-0.5">
            {adminLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
                  pathname === link.href 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50 text-foreground"
                )}
                onClick={handleLinkClick}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <span className="ml-3">{link.title}</span>
              </Link>
            ))}
            <Link
              href="/moderation-log"
              className={cn(
                "flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-colors touch-manipulation min-h-[44px]",
                pathname === "/moderation-log" 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent/50 text-foreground"
              )}
              onClick={handleLinkClick}
            >
              <span className="flex-shrink-0">
                <ExternalLink className="w-5 h-5 mr-2 text-primary" />
              </span>
              <span className="ml-3">Public Mod Log</span>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom padding to ensure scrolling works properly */}
      <div className="h-4"></div>
    </div>
  );
}
