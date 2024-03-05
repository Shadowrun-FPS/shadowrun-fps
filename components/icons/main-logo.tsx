"use client";
import Image from "next/image";
import Link from "next/link";

type MainLogoProps = {
  className?: string;
};

function MainLogo({ className }: MainLogoProps) {
  return (
    <Link className={`flex items-center gap-4 shrink-0 ${className}`} href="/">
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
        width={240}
        height={170}
      />
    </Link>
  );
}

export default MainLogo;
