"use client";

import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { AccountDropdown } from "@/components/navigation/account-dropdown";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import MainLogo from "./icons/main-logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-14">
        <MainLogo className="mr-2" />

        <MainNav />

        {/* Right Side */}
        <div className="flex items-center justify-end flex-1 space-x-4">
          <Button
            variant="secondary"
            size="sm"
            className="hidden text-white transition-colors duration-300 bg-[#6A0DAD] hover:bg-[#7D1BC3] md:flex"
            asChild
          >
            <Link
              href="https://www.gog.com/dreamlist/game/shadowrun-2007"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-sm font-semibold tracking-tight">
                Go Vote on GOG
              </span>
            </Link>
          </Button>
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <SheetHeader>
        <SheetTitle>Navigation Menu</SheetTitle>
        <SheetDescription>
          Browse all available sections and pages
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col px-6 pt-6 space-y-3">
        {/* Documentation Links */}
        <div className="pb-4 border-b">
          <Link
            href="/docs/events"
            className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
          >
            Events
          </Link>
          <Link
            href="/docs/install"
            className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
          >
            Installation
          </Link>
          <Link
            href="/docs/troubleshoot"
            className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
          >
            Troubleshooting
          </Link>
          <Link
            href="/matches/queues"
            className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
          >
            Queues
          </Link>
        </div>

        {/* Main Navigation Links */}

        <Link
          href="/tournaments/overview"
          className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
        >
          Tournament Overview
        </Link>
        <Link
          href="/tournaments/teams"
          className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
        >
          Teams
        </Link>
        <Link
          href="/tournaments/scrimmage"
          className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
        >
          Scrimmage
        </Link>
        <Link
          href="/tournaments/rankings"
          className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
        >
          Rankings
        </Link>
        {/* Tournament Section */}
      </div>
    </>
  );
}
