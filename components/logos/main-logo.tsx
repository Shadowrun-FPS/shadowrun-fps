"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

function MainLogo() {
  const { theme } = useTheme();

  // Define the fill color based on the theme
  const fillColor = theme === "light" ? "black" : "white";
  // TODO style title with theme so it's readable in light mode

  return (
    <Link className="flex items-center gap-4 shrink-0" href="/">
      <Image
        src={`/serverIcon.png`}
        alt={`Shadowrun Icon`}
        width={40}
        height={40}
      />
      <Image
        className="hidden md:block"
        src={`/title.png`}
        alt={`Shadowrun Title`}
        width={120}
        height={120}
      />
    </Link>
  );
}

export default MainLogo;
