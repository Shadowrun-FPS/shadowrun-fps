import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import MainLogo from "./icons/main-logo";
import DiscordSignIn from "./discord/discord-sign-in";

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-6 mx-auto lg:px-8 bg-background">
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
