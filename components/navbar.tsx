"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  Download,
  HelpCircle,
  Home,
  Calendar,
  ChevronDown,
} from "lucide-react";


// Feature flag check
const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

const DocLinks = [
  {
    title: "Events",
    href: "/docs/events",
    description: "Upcoming community events and tournaments",
    icon: (
      <Calendar className="mr-3 h-5 w-5 shrink-0 text-foreground" />
    ),
  },
  ...(ENABLE_DOWNLOAD_PAGE
    ? [
        {
          title: "Download Launcher",
          href: "/download",
          description: "Download the Shadowrun FPS Launcher",
          icon: (
            <Download className="mr-3 h-5 w-5 shrink-0 text-foreground" />
          ),
        },
      ]
    : []),
  {
    title: "Troubleshoot",
    href: "/docs/troubleshoot",
    description: "Solutions for common issues and problems",
    icon: (
      <HelpCircle className="mr-3 h-5 w-5 shrink-0 text-foreground" />
    ),
  },
];


/** Desktop-only: nav link row (shared chrome — exported for consistency) */
export const desktopNavRailClass = "flex flex-wrap items-center gap-1";

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

  return (
    <nav className="flex items-center">
      {/* Desktop Navigation only - mobile menu is rendered by Header (MobileNavMenu) */}
      <div className="hidden xl:flex xl:items-center xl:justify-center">
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
        </div>
      </div>
    </nav>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  const handleLinkClick = useCallback(() => {
    onNavigate();
  }, [onNavigate]);

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
        <Home className="mr-3 h-5 w-5 shrink-0 text-foreground" />
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
            <span className="shrink-0">{link.icon}</span>
            <span>{link.title}</span>
          </Link>
        );
      })}
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
