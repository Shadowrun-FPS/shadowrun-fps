"use client";

import React from "react";
import Link from "next/link";

import AccountDropdown from "@/components/navigation/account-dropdown";
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
import { Navbar } from "./navbar";

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex items-center h-14 max-w-screen-2xl">
          <MainLogo />
          <Navbar />
          <div className="flex items-center justify-between flex-1 space-x-2 md:justify-end">
            <div className="flex-1 w-full md:w-auto md:flex-none">
              {/* Search or other components */}
            </div>
            <nav className="flex items-center">
              <AccountDropdown />
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return;
}
