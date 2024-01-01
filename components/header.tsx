import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import MainLogo from "./icons/main-logo";
import DiscordSignIn from "./discord/discord-sign-in";

function Header() {
  return (
    <header className="flex gap-4 p-6 lg:px-8 bg-background">
      <MainLogo />
      <nav className="flex flex-1">
        <MainNavMenu />
      </nav>
      <div className="flex justify-end gap-4">
        <DiscordSignIn />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
