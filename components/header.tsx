import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import IconDiscordLogo from "@/components/logos/discord-logo";

function Header() {
  return (
    <header className="p-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        <IconDiscordLogo />
        <MainNavMenu />
        <ThemeToggle />
      </nav>
    </header>
  );
}

export default Header;
