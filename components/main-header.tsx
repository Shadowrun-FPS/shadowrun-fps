import Link from "next/link";
import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import MainAppTitle from "./main-app-title";

function MainHeader() {
  return (
    <header className="p-4">
      <div className="container mx-auto flex items-center justify-between">
        <MainAppTitle />
        <MainNavMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default MainHeader;
