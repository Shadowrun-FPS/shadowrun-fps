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
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Book,
  Trophy,
  Clock,
  HeartHandshake,
  BarChart3,
  Menu,
  Download,
  HelpCircle,
  Home,
  Users,
  PanelLeft,
  Calendar,
  LayoutDashboard,
  Shield,
  ExternalLink,
  ChevronDown,
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
    icon: <Calendar className="mr-2 w-5 h-5 text-primary" />,
  },
  {
    title: "Install Guide",
    href: "/docs/install",
    description: "How to install and set up the game",
    icon: <Download className="mr-2 w-5 h-5 text-primary" />,
  },
  {
    title: "Troubleshoot",
    href: "/docs/troubleshoot",
    description: "Solutions for common issues and problems",
    icon: <HelpCircle className="mr-2 w-5 h-5 text-primary" />,
  },
];

const MatchesLinks: NavLink[] = [
  {
    title: "Queues",
    href: "/matches/queues#4v4",
    description: "Join active match queues",
    icon: <Clock className="mr-2 w-5 h-5 text-primary" />,
    feature: "queues",
  },
  {
    title: "Match History",
    href: "/matches/history",
    description: "View your previous matches",
    icon: <PanelLeft className="mr-2 w-5 h-5 text-primary" />,
    feature: "matches",
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    description: "See the top players and rankings",
    icon: <BarChart3 className="mr-2 w-5 h-5 text-primary" />,
    feature: "leaderboard",
  },
];

const TournamentsLinks: NavLink[] = [
  {
    title: "Overview",
    href: "/tournaments/overview",
    description: "View upcoming and ongoing tournaments",
    icon: <Trophy className="mr-2 w-5 h-5 text-primary" />,
    feature: "tournaments",
  },
  {
    title: "Teams",
    href: "/tournaments/teams",
    description: "Manage your teams and recruitment",
    icon: <Users className="mr-2 w-5 h-5 text-primary" />,
    feature: "teams",
  },
  {
    title: "Scrimmages",
    href: "/tournaments/scrimmages",
    description: "View scrimmage matches with other teams",
    icon: <HeartHandshake className="mr-2 w-5 h-5 text-primary" />,
    feature: "scrimmage",
  },
  {
    title: "Rankings",
    href: "/tournaments/rankings",
    description: "Team rankings and tournament standings",
    icon: <BarChart3 className="mr-2 w-5 h-5 text-primary" />,
    feature: "rankings",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    <nav className="flex flex-1 items-center">
      {/* Mobile Navigation */}
      <div className="mr-2 md:hidden sm:mr-4">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 sm:h-10 sm:w-10 touch-manipulation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] sm:w-[320px] p-0 flex flex-col"
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <SheetHeader className="relative px-4 pt-6 pb-4 border-b sm:px-6 sm:pt-8 border-border/40">
              <div className="flex justify-between items-center pr-12 sm:pr-14">
                <div className="flex-1">
                  <SheetTitle className="text-lg font-bold sm:text-xl">
                    Navigation
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Browse all sections of Shadowrun FPS
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="overflow-y-auto flex-1">
              <MobileNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex md:items-center md:gap-1">
        {/* Simple Links */}
        <Link
          href="/docs/events"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
            pathname === "/docs/events" && "bg-accent/50"
          )}
        >
          <Calendar className="mr-2 w-4 h-4" />
          Events
        </Link>

        <Link
          href="/docs/install"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
            pathname === "/docs/install" && "bg-accent/50"
          )}
        >
          <Download className="mr-2 w-4 h-4" />
          Install
        </Link>

        <Link
          href="/docs/troubleshoot"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
            pathname === "/docs/troubleshoot" && "bg-accent/50"
          )}
        >
          <HelpCircle className="mr-2 w-4 h-4" />
          Troubleshoot
        </Link>

        {/* Matches Dropdown */}
        {showMatchesMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                (pathname?.startsWith("/matches") ||
                  pathname?.startsWith("/leaderboard")) &&
                  "bg-accent/50"
              )}
            >
              <Clock className="mr-2 w-4 h-4" />
              Matches
              <ChevronDown className="ml-1 w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[400px]">
              <div className="flex flex-col gap-1 p-2">
                {filteredMatchesLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    pathname?.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.title}
                      href={link.href}
                      className={cn(
                        "flex items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent/50"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{link.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{link.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Tournaments Dropdown */}
        {showTournamentsMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                pathname?.startsWith("/tournaments") && "bg-accent/50"
              )}
            >
              <Trophy className="mr-2 w-4 h-4" />
              Tournaments
              <ChevronDown className="ml-1 w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[400px]">
              <div className="flex flex-col gap-1 p-2">
                {filteredTournamentsLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    pathname?.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.title}
                      href={link.href}
                      className={cn(
                        "flex items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent/50"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{link.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{link.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);

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
  const hasModAccess =
    userPermissions?.isModerator || userPermissions?.isAdmin || false;

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
      icon: <LayoutDashboard className="mr-2 w-5 h-5 text-primary" />,
    },
    {
      title: "Moderation",
      href: "/admin/moderation",
      icon: <Shield className="mr-2 w-5 h-5 text-primary" />,
    },
    {
      title: "Players",
      href: "/admin/players",
      icon: <Users className="mr-2 w-5 h-5 text-primary" />,
    },
    {
      title: "Rules",
      href: "/admin/rules",
      icon: <Book className="mr-2 w-5 h-5 text-primary" />,
    },
  ];

  return (
    <div className="flex overflow-y-auto flex-col gap-1 py-4">
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
        <Home className="flex-shrink-0 mr-3 w-5 h-5" />
        <span>Home</span>
      </Link>

      <div className="px-4 py-3 mt-2 sm:px-6">
        <h4 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Documentation
        </h4>
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
        <div className="px-4 py-3 sm:px-6">
          <h4 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Matches
          </h4>
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
        <div className="px-4 py-3 sm:px-6">
          <h4 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Tournaments
          </h4>
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
        <div className="px-4 py-3 mt-2 border-t sm:px-6 border-border/40">
          <h4 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Admin
          </h4>
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
                <ExternalLink className="mr-2 w-5 h-5 text-primary" />
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
