import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import MainLogo from "./icons/main-logo";
import DiscordSignIn from "./discord/discord-sign-in";

function Header() {
  return (
    <header className="flex items-center justify-between p-6 lg:px-8 bg-background">
      <MainLogo />
      <nav>
        <MainNavMenu />
      </nav>
      <div className="flex gap-4">
        <DiscordSignIn />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
