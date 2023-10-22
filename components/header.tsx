import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import MainLogo from "./logos/main-logo";
import DiscordSignIn from "./discord/discord-sign-in";

function Header() {
  return (
    <header className="flex items-center justify-between p-6 mx-auto lg:px-8">
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
