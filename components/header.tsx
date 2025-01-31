import { MainNavMenu } from "@/components/main-nav";
import MainLogo from "./icons/main-logo";
import AccountDropdown from "./navigation/account-dropdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function Header() {
  return (
    <header className="flex gap-4 p-6 lg:px-8 dark:bg-background">
      <MainLogo />
      <nav className="flex flex-1">
        <MainNavMenu />
      </nav>

      {/* Go Vote Button */}
      <div className="flex items-center gap-4 ml-auto">
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 px-6 sm:px-5 py-3 text-white rounded-md bg-[#6A0DAD] hover:bg-[#7D1BC3] transition-colors duration-300"
          asChild
        >
          <Link
            href="https://www.gog.com/dreamlist/game/shadowrun-2007"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/7f3de2ba-ac07-415d-bffb-764dde22203f/dc04z09-99e04abe-5c4b-4925-b8e7-4f05e95fb909.png"
              alt="GOG Dreamlist Logo"
              width={32}
              height={32}
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              Go Vote on GOG Dreamlist
            </span>
            <span className="text-sm font-semibold leading-tight tracking-tight sm:hidden">
              Go Vote
            </span>
          </Link>
        </Button>
        <AccountDropdown />
      </div>
    </header>
  );
}

export default Header;
