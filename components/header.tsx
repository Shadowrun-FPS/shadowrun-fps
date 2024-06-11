import { MainNavMenu } from "@/components/main-nav";
import MainLogo from "./icons/main-logo";
import AccountDropdown from "./navigation/account-dropdown";

function Header() {
  return (
    <header className="flex gap-4 p-6 lg:px-8 dark:bg-background">
      <MainLogo />
      <nav className="flex flex-1">
        <MainNavMenu />
      </nav>
      <div className="flex justify-end gap-4">
        <AccountDropdown />
      </div>
    </header>
  );
}

export default Header;
