"use client";

import * as React from "react";
import Image from "next/image";
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
  SheetHeader,
  SheetDescription,
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
  X,
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

/** Desktop-only: inset pill rail + shared control chrome (exported for admin sub-navs) */
export const desktopNavRailClass =
  "flex flex-wrap items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 px-1 py-1 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)] dark:bg-muted/20";

export const desktopNavControlClass =
  "relative inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out motion-reduce:transition-none hover:bg-background/85 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const desktopNavRouteActiveClass =
  "bg-background/95 text-foreground shadow-sm ring-1 ring-primary/20 dark:bg-background/45 dark:ring-primary/30";

const desktopNavTriggerOpenClass =
  "data-[state=open]:bg-background/95 data-[state=open]:text-foreground data-[state=open]:shadow-sm data-[state=open]:ring-1 data-[state=open]:ring-primary/20 dark:data-[state=open]:bg-background/45 dark:data-[state=open]:ring-primary/30";

const desktopMegaLinkClass =
  "relative flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ease-out motion-reduce:transition-none hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover";

const desktopMegaLinkActiveClass =
  "bg-primary/[0.08] text-foreground ring-1 ring-primary/15 dark:bg-primary/[0.12] dark:ring-primary/25";

const mobileSheetNavIdleClass =
  "text-foreground hover:bg-muted/55 motion-reduce:transition-none";

const mobileSheetNavActiveClass =
  "bg-primary/[0.08] text-foreground ring-1 ring-inset ring-primary/15 dark:bg-primary/[0.12] dark:ring-primary/25";

export function Navbar() {
  const pathname = usePathname();

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

  return (
    <nav className="flex flex-1 items-center">
      {/* Desktop Navigation only - mobile menu is rendered by Header (MobileNavMenu) */}
      <div className="hidden xl:flex xl:items-center xl:justify-start">
        <div className={desktopNavRailClass}>
          <Link
            href="/docs/events"
            className={cn(
              desktopNavControlClass,
              pathname === "/docs/events" && desktopNavRouteActiveClass
            )}
            aria-current={pathname === "/docs/events" ? "page" : undefined}
          >
            <Calendar className="mr-2 h-4 w-4 shrink-0 opacity-90" />
            Events
          </Link>

          {ENABLE_DOWNLOAD_PAGE && (
            <Link
              href="/download"
              className={cn(
                desktopNavControlClass,
                pathname === "/download" && desktopNavRouteActiveClass
              )}
              aria-current={pathname === "/download" ? "page" : undefined}
            >
              <Download className="mr-2 h-4 w-4 shrink-0 opacity-90" />
              Download
            </Link>
          )}

          <Link
            href="/docs/install"
            className={cn(
              desktopNavControlClass,
              pathname === "/docs/install" && desktopNavRouteActiveClass
            )}
            aria-current={pathname === "/docs/install" ? "page" : undefined}
          >
            <Book className="mr-2 h-4 w-4 shrink-0 opacity-90" />
            Manual Install
          </Link>

          <Link
            href="/docs/troubleshoot"
            className={cn(
              desktopNavControlClass,
              pathname === "/docs/troubleshoot" && desktopNavRouteActiveClass
            )}
            aria-current={pathname === "/docs/troubleshoot" ? "page" : undefined}
          >
            <HelpCircle className="mr-2 h-4 w-4 shrink-0 opacity-90" />
            Troubleshoot
          </Link>

          {isFeatureEnabled("leaderboard") && (
            <Link
              href="/leaderboard"
              className={cn(
                desktopNavControlClass,
                pathname === "/leaderboard" && desktopNavRouteActiveClass
              )}
              aria-current={pathname === "/leaderboard" ? "page" : undefined}
            >
              <BarChart3 className="mr-2 h-4 w-4 shrink-0 opacity-90" />
              Leaderboard
            </Link>
          )}

          {showMatchesMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "group",
                  desktopNavControlClass,
                  desktopNavTriggerOpenClass,
                  pathname?.startsWith("/matches") && desktopNavRouteActiveClass
                )}
              >
                <Clock className="mr-2 h-4 w-4 shrink-0 opacity-90" />
                Matches
                <ChevronDown
                  className="ml-0.5 h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-0"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="border-b border-border/50 bg-muted/35 px-4 py-2.5 dark:bg-muted/25">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    Matches
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 p-2">
                  {filteredMatchesLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname?.startsWith(link.href.split("#")[0] + "/") ||
                      pathname === link.href.split("#")[0];
                    return (
                      <Link
                        key={link.title}
                        href={link.href}
                        className={cn(
                          desktopMegaLinkClass,
                          isActive && desktopMegaLinkActiveClass
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div className="mt-0.5 shrink-0">{link.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{link.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
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

          {showTournamentsMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "group",
                  desktopNavControlClass,
                  desktopNavTriggerOpenClass,
                  pathname?.startsWith("/tournaments") &&
                    desktopNavRouteActiveClass
                )}
              >
                <Trophy className="mr-2 h-4 w-4 shrink-0 opacity-90" />
                Tournaments
                <ChevronDown
                  className="ml-0.5 h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-0"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="border-b border-border/50 bg-muted/35 px-4 py-2.5 dark:bg-muted/25">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tournaments
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 p-2">
                  {filteredTournamentsLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname?.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.title}
                        href={link.href}
                        className={cn(
                          desktopMegaLinkClass,
                          isActive && desktopMegaLinkActiveClass
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div className="mt-0.5 shrink-0">{link.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{link.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
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
    <div className="flex flex-col gap-1 pt-2 pb-4">
      <Link
        href="/"
        className={cn(
          "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
          pathname === "/" ? mobileSheetNavActiveClass : mobileSheetNavIdleClass
        )}
        onClick={handleLinkClick}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <Home className="flex-shrink-0 mr-3 w-5 h-5" />
        <span>Home</span>
      </Link>

      {DocLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.title}
            href={link.href}
            className={cn(
              "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
              isActive ? mobileSheetNavActiveClass : mobileSheetNavIdleClass
            )}
            onClick={handleLinkClick}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="flex-shrink-0">{link.icon}</span>
            <span className="ml-3">{link.title}</span>
          </Link>
        );
      })}
      {isFeatureEnabled("leaderboard") && (
        <Link
          href="/leaderboard"
          className={cn(
            "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
            pathname === "/leaderboard"
              ? mobileSheetNavActiveClass
              : mobileSheetNavIdleClass
          )}
          onClick={handleLinkClick}
          aria-current={pathname === "/leaderboard" ? "page" : undefined}
        >
          <BarChart3 className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
          <span className="ml-3">Leaderboard</span>
        </Link>
      )}

      {showMatchesSection && (
        <div className="border-t border-border/50 pt-3">
          <h4 className="mx-2 mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
            Matches
          </h4>
          <div className="flex flex-col gap-1">
            {filteredMatchesLinks.map((link) => {
              const hrefPath = link.href.split("#")[0];
              const isActive =
                pathname === hrefPath ||
                pathname?.startsWith(`${hrefPath}/`);
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
                    isActive ? mobileSheetNavActiveClass : mobileSheetNavIdleClass
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
        <div className="border-t border-border/50 pt-3">
          <h4 className="mx-2 mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
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
                    "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
                    isActive ? mobileSheetNavActiveClass : mobileSheetNavIdleClass
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
        <div className="mt-2 border-t border-border/50 pt-3">
          <h4 className="mx-2 mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
            Admin
          </h4>
          <div className="flex flex-col gap-1">
            {adminLinks.map((link) => {
              // Dashboard is /admin only — do not treat /admin/players etc. as dashboard
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
                    isActive ? mobileSheetNavActiveClass : mobileSheetNavIdleClass
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
                "relative mx-2 flex min-h-[44px] items-center rounded-xl px-4 py-3 text-base transition-colors duration-200 ease-out motion-reduce:transition-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6",
                pathname === "/moderation-log"
                  ? mobileSheetNavActiveClass
                  : mobileSheetNavIdleClass
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

/** Mobile-only hamburger + sheet menu. Rendered on the left in Header (Rumble-style layout). */
export function MobileNavMenu() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          {mobileNavOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[280px] flex-col border-r border-border/50 bg-background/95 p-0 backdrop-blur-md sm:w-[320px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <SheetHeader className="relative border-b border-border/50 px-4 pb-3 pt-6 sm:px-6 sm:pt-8">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation links for the site.
          </SheetDescription>
          <div className="flex min-h-[2.5rem] items-center pr-12 sm:pr-14">
            <Image
              src="/title.png"
              alt="Shadowrun"
              width={240}
              height={170}
              className="max-w-[200px] sm:max-w-[240px] h-8 w-auto object-contain object-left"
            />
          </div>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">
          <MobileNav onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
