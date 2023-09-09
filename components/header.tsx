import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import IconDiscordLogo from "@/components/logos/discord-logo";

function Header() {
  return (
    <header className="flex items-center justify-between p-6 mx-auto max-w-7xl lg:px-8">
      <IconDiscordLogo />
      <nav>
        <MainNavMenu />
      </nav>
      <ThemeToggle />
    </header>
  );
}

export default Header;
