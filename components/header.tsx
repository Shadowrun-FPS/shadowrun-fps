"use client";

import React from "react";
import AccountDropdown from "@/components/navigation/account-dropdown";
import MainLogo from "./icons/main-logo";
import { Navbar, MobileNavMenu } from "./navbar";

export function Header() {
  return (
    <header className="w-full border-t-0 border-b border-border/50 bg-background/75 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_0_hsl(var(--border)_/_0.35)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid h-14 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center gap-x-2 px-4 sm:h-16 sm:px-4 md:px-6 lg:px-8">
        {/* Mobile: col 1 menu · col 2 centered logo · col 3 account. Desktop xl: logo | navbar | account */}
        <div className="col-start-1 justify-self-start xl:hidden">
          <MobileNavMenu />
        </div>

        <div className="col-start-2 justify-self-center xl:col-start-1 xl:justify-self-start">
          <MainLogo />
        </div>

        <div className="hidden xl:col-start-2 xl:flex xl:justify-self-center">
          <Navbar />
        </div>

        <div className="col-start-3 justify-self-end xl:col-start-3">
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}
