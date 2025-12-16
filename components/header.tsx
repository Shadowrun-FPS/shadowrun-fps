"use client";

import React from "react";
import AccountDropdown from "@/components/navigation/account-dropdown";
import MainLogo from "./icons/main-logo";
import { Navbar } from "./navbar";

export function Header() {
  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex items-center h-14 sm:h-16 max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Logo - Left side */}
        <div className="flex-shrink-0 mr-4 sm:mr-6">
          <MainLogo />
        </div>

        {/* Desktop Navigation - Takes remaining space */}
        <div className="hidden lg:flex flex-1">
          <Navbar />
        </div>

        {/* Right side - Mobile: Sign In + Menu | Desktop: Sign In only */}
        <div className="flex items-center flex-shrink-0 ml-auto gap-2">
          {/* Account Dropdown */}
          <AccountDropdown />
          {/* Mobile Menu - Only on mobile, positioned after sign in */}
          <div className="lg:hidden">
            <Navbar />
          </div>
        </div>
      </div>
    </header>
  );
}
