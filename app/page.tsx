import Image from "next/image";
import { MainNavMenu } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div>
      <MainNavMenu />
      <ThemeToggle />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div>content</div>
      </main>
    </div>
  );
}
