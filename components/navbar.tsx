"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled, FeatureFlag } from "@/lib/features";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback } from "react";
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
  MapPin,
} from "lucide-react";

interface NavLink {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  feature?: FeatureFlag;
}

// Feature flag check
const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

const DocLinks = [
  {
    title: "Events",
    href: "/docs/events",
    description: "Upcoming community events and tournaments",
    icon: <Calendar className="mr-2 w-5 h-5 text-primary" />,
  },
  ...(ENABLE_DOWNLOAD_PAGE
    ? [
        {
          title: "Download Launcher",
          href: "/download",
          description: "Download the Shadowrun FPS Launcher",
          icon: <Download className="mr-2 w-5 h-5 text-primary" />,
        },
      ]
    : []),
  {
    title: "Manual Install",
    href: "/docs/install",
    description: "How to install and set up the game",
    icon: <Book className="mr-2 w-5 h-5 text-primary" />,
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

  // Memoize filtered links to prevent unnecessary re-renders
  const filteredMatchesLinks = useMemo(
    () =>
      MatchesLinks.filter((link) =>
        link.feature ? isFeatureEnabled(link.feature) : true
      ),
    []
  );

  const filteredTournamentsLinks = useMemo(
    () =>
      TournamentsLinks.filter((link) =>
        link.feature ? isFeatureEnabled(link.feature) : true
      ),
    []
  );

  // Only show the dropdown if there are enabled links
  const showMatchesMenu = filteredMatchesLinks.length > 0;
  const showTournamentsMenu = filteredTournamentsLinks.length > 0;

  // Handle escape key to close dropdowns
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <nav className="flex flex-1 items-center">
      {/* Mobile Navigation */}
      <div className="mr-2 xl:hidden sm:mr-4">
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
      <div className="hidden xl:flex xl:items-center xl:gap-1">
        {/* Simple Links */}
        <Link
          href="/docs/events"
          className={cn(
            "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            pathname === "/docs/events" &&
              "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
          )}
          aria-current={pathname === "/docs/events" ? "page" : undefined}
        >
          <Calendar className="mr-2 w-4 h-4" />
          Events
        </Link>

        {ENABLE_DOWNLOAD_PAGE && (
          <Link
            href="/download"
            className={cn(
              "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              pathname === "/download" &&
                "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
            )}
            aria-current={pathname === "/download" ? "page" : undefined}
          >
            <Download className="mr-2 w-4 h-4" />
            Download
          </Link>
        )}

        <Link
          href="/docs/install"
          className={cn(
            "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            pathname === "/docs/install" &&
              "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
          )}
          aria-current={pathname === "/docs/install" ? "page" : undefined}
        >
          <Book className="mr-2 w-4 h-4" />
          Manual Install
        </Link>

        <Link
          href="/docs/troubleshoot"
          className={cn(
            "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            pathname === "/docs/troubleshoot" &&
              "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
          )}
          aria-current={pathname === "/docs/troubleshoot" ? "page" : undefined}
        >
          <HelpCircle className="mr-2 w-4 h-4" />
          Troubleshoot
        </Link>

        {/* Matches Dropdown */}
        {showMatchesMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                (pathname?.startsWith("/matches") ||
                  pathname?.startsWith("/leaderboard")) &&
                  "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
              )}
            >
              <Clock className="mr-2 w-4 h-4" />
              Matches
              <ChevronDown className="ml-1 w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[400px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
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
                        "relative flex items-start gap-3 rounded-md p-3 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isActive &&
                          "bg-accent/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-md"
                      )}
                      aria-current={isActive ? "page" : undefined}
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
                "relative inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                pathname?.startsWith("/tournaments") &&
                  "bg-accent/50 text-accent-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
              )}
            >
              <Trophy className="mr-2 w-4 h-4" />
              Tournaments
              <ChevronDown className="ml-1 w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[400px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
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
                        "relative flex items-start gap-3 rounded-md p-3 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isActive &&
                          "bg-accent/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-md"
                      )}
                      aria-current={isActive ? "page" : undefined}
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
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Memoize filtered links to prevent unnecessary re-renders
  const filteredMatchesLinks = useMemo(
    () =>
      MatchesLinks.filter((link) =>
        link.feature ? isFeatureEnabled(link.feature) : true
      ),
    []
  );

  const filteredTournamentsLinks = useMemo(
    () =>
      TournamentsLinks.filter((link) =>
        link.feature ? isFeatureEnabled(link.feature) : true
      ),
    []
  );

  // Only show the sections if there are enabled links
  const showMatchesSection = filteredMatchesLinks.length > 0;
  const showTournamentsSection = filteredTournamentsLinks.length > 0;

  // Optimize permission fetching - use unified endpoint with deduplication
  useEffect(() => {
    const fetchPermissions = async () => {
      if (session?.user?.id && !userPermissions && !isLoadingPermissions) {
        setIsLoadingPermissions(true);
        try {
          // ✅ NEW: Use unified endpoint with deduplication
          const { deduplicatedFetch } = await import("@/lib/request-deduplication");
          const userData = await deduplicatedFetch<{
            permissions: {
              isAdmin: boolean;
              isModerator: boolean;
              canCreateTournament: boolean;
              isDeveloper: boolean;
            };
          }>("/api/user/data", { ttl: 60000 });
          setUserPermissions(userData.permissions);
        } catch (error) {
          // Silently handle errors
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    fetchPermissions();
  }, [session?.user?.id, userPermissions, isLoadingPermissions]);

  // Check if user has admin/mod access
  const hasModAccess =
    userPermissions?.isModerator || userPermissions?.isAdmin || false;

  const handleLinkClick = useCallback(() => {
    onNavigate();
  }, [onNavigate]);

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
    {
      title: "Queues",
      href: "/admin/queues",
      icon: <MapPin className="mr-2 w-5 h-5 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col gap-1 py-4">
      <Link
        href="/"
        className={cn(
          "relative flex items-center px-4 sm:px-6 py-3 text-base font-medium rounded-lg mx-2 transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          pathname === "/"
            ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
            : "hover:bg-accent/50 text-foreground"
        )}
        onClick={handleLinkClick}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <Home className="flex-shrink-0 mr-3 w-5 h-5" />
        <span>Home</span>
      </Link>

      <div className="px-4 py-3 mt-2 border-t sm:px-6 border-border/40">
        <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Documentation
        </h4>
        <div className="flex flex-col gap-1">
          {DocLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex relative items-center px-4 py-3 mx-2 text-base rounded-lg transition-all duration-200 sm:px-6 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive
                    ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
                    : "hover:bg-accent/50 text-foreground"
                )}
                onClick={handleLinkClick}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <span className="ml-3">{link.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {showMatchesSection && (
        <div className="px-4 py-3 border-t sm:px-6 border-border/40">
          <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Matches
          </h4>
          <div className="flex flex-col gap-1">
            {filteredMatchesLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "flex relative items-center px-4 py-3 mx-2 text-base rounded-lg transition-all duration-200 sm:px-6 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive
                      ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
                      : "hover:bg-accent/50 text-foreground"
                  )}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="ml-3">{link.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {showTournamentsSection && (
        <div className="px-4 py-3 border-t sm:px-6 border-border/40">
          <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Tournaments
          </h4>
          <div className="flex flex-col gap-1">
            {filteredTournamentsLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "flex relative items-center px-4 py-3 mx-2 text-base rounded-lg transition-all duration-200 sm:px-6 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive
                      ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
                      : "hover:bg-accent/50 text-foreground"
                  )}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="ml-3">{link.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {hasModAccess && (
        <div className="px-4 py-3 mt-2 border-t sm:px-6 border-border/40">
          <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Admin
          </h4>
          <div className="flex flex-col gap-1">
            {adminLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "flex relative items-center px-4 py-3 mx-2 text-base rounded-lg transition-all duration-200 sm:px-6 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive
                      ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
                      : "hover:bg-accent/50 text-foreground"
                  )}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="ml-3">{link.title}</span>
                </Link>
              );
            })}
            <Link
              href="/moderation-log"
              className={cn(
                "relative flex items-center px-4 sm:px-6 py-3 text-base rounded-lg mx-2 transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                pathname === "/moderation-log"
                  ? "bg-accent text-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
                  : "hover:bg-accent/50 text-foreground"
              )}
              onClick={handleLinkClick}
              aria-current={pathname === "/moderation-log" ? "page" : undefined}
            >
              <span className="flex-shrink-0">
                <ExternalLink className="mr-2 w-5 h-5 text-primary" />
              </span>
              <span className="ml-3">Public Mod Log</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
