"use client";

import React from "react";
import AccountDropdown from "@/components/navigation/account-dropdown";
import MainLogo from "./icons/main-logo";
import { Navbar } from "./navbar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex items-center h-14 sm:h-16 max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex-shrink-0 mr-4 sm:mr-6">
          <MainLogo />
        </div>

        {/* Navigation */}
        <Navbar />

        {/* Right side - Account */}
        <div className="flex items-center flex-shrink-0 ml-auto gap-2">
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}
