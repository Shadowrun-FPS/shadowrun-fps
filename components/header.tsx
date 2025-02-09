import { MainNavMenu } from "@/components/main-nav";
import MainLogo from "./icons/main-logo";
import { AccountDropdown } from "./navigation/account-dropdown";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-14">
        <MainLogo />
        <MainNavMenu className="mx-4" />
        <div className="flex items-center justify-end flex-1 gap-2 sm:gap-4">
          <Button
            variant="default"
            size="sm"
            className="flex items-center justify-center  gap-2 px-3 py-2 text-white rounded-md sm:flex-initial sm:px-4 bg-[#6A0DAD] hover:bg-[#7D1BC3] transition-colors duration-300"
            asChild
          >
            <Link
              href="https://www.gog.com/dreamlist/game/shadowrun-2007"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-9 h-9 sm:w-9 sm:h-9">
                <Image
                  src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/7f3de2ba-ac07-415d-bffb-764dde22203f/dc04z09-99e04abe-5c4b-4925-b8e7-4f05e95fb909.png"
                  alt="GOG Dreamlist Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-sm font-semibold tracking-tight sm:text-base">
                <span className="hidden lg:inline">Go Vote on GOG</span>
                <span className="lg:hidden">Go Vote</span>
              </span>
            </Link>
          </Button>
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}
