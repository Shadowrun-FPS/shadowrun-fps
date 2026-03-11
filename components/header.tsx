"use client";

import React from "react";
import AccountDropdown from "@/components/navigation/account-dropdown";
import MainLogo from "./icons/main-logo";
import { Navbar, MobileNavMenu } from "./navbar";

export function Header() {
  return (
    <header className="w-full border-t-0 border-b border-border/30 bg-background/80 dark:bg-background/90 backdrop-blur-md shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="flex items-center h-14 sm:h-16 max-w-screen-2xl mx-auto px-4 sm:px-4 md:px-6 lg:px-8">
        {/* Left: Hamburger (mobile) + Logo — Rumble-style */}
        <div className="flex items-center flex-shrink-0 gap-2 sm:gap-3 mr-4 sm:mr-6">
          <div className="xl:hidden">
            <MobileNavMenu />
          </div>
          <MainLogo />
        </div>

        {/* Desktop Navigation - Takes remaining space */}
        <div className="hidden xl:flex flex-1">
          <Navbar />
        </div>

        {/* Right: Sign in / Account */}
        <div className="flex items-center flex-shrink-0 ml-auto">
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}
